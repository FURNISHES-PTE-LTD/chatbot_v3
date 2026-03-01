import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { zodSchema } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getFieldIds } from "@/lib/domain-fields"
import { expandVocabulary } from "@/lib/extraction/vocabulary"
import { detectNegations, mapNegatedTermsToFields } from "@/lib/extraction/negation"
import { extractIndirectPreferences } from "@/lib/extraction/semantic-inference"
import { checkContradiction } from "@/lib/extraction/contradiction"
import { normalizeValue } from "@/lib/extraction/normalize"
import {
  detectUncertainty,
  adjustConfidenceForUncertainty,
  UncertaintyLevel,
} from "@/lib/extraction/uncertainty"
import {
  classifyMessageIntent,
  shouldSkipExtraction,
} from "@/lib/extraction/classifier"
import {
  detectStateChangeIntent,
  createStateChangeUpdate,
} from "@/lib/extraction/state-change"
import { applyVerifierToEntities } from "@/lib/extraction/verifier"
import {
  getOpenAIKey,
  OPENAI_KEY_MISSING_MESSAGE,
  withFallback,
  OPENAI_PRIMARY_MODEL,
  OPENAI_FALLBACK_MODEL,
} from "@/lib/openai"

function getExtractionFieldEnum() {
  const fieldIds = getFieldIds()
  const tuple = (fieldIds.length > 0 ? fieldIds : ["roomType"]) as [string, ...string[]]
  return z.enum(tuple)
}

const ExtractRequestSchema = z.object({
  messageId: z.string().optional().nullable(),
  content: z.string(),
  conversationId: z.string(),
})

const EvidenceSpanSchema = z.object({
  start: z.number(),
  end: z.number(),
  text: z.string(),
})

const ExtractionSchema = z.object({
  entities: z.array(
    z.object({
      text: z.string(),
      field: getExtractionFieldEnum(),
      confidence: z.number().min(0).max(1),
      evidenceSpans: z.array(EvidenceSpanSchema).optional(),
    }),
  ),
})

type ExtractionEntity = z.infer<typeof ExtractionSchema>["entities"][number]

function expandMessageVocabulary(content: string): string {
  return content
    .split(/\s+/)
    .map((word) => expandVocabulary(word))
    .join(" ")
}

export async function POST(req: Request) {
  if (!getOpenAIKey()) {
    return Response.json({ error: OPENAI_KEY_MISSING_MESSAGE }, { status: 503 })
  }
  const body = await req.json()
  const parsed = ExtractRequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { messageId, content, conversationId } = parsed.data

  // 0. Classify intent: skip LLM for purely exploratory messages (saves cost)
  const { intent } = classifyMessageIntent(content)
  if (shouldSkipExtraction(intent)) {
    if (messageId) {
      await prisma.message.update({
        where: { id: messageId },
        data: { extractions: [] },
      })
    }
    return Response.json({ entities: [] })
  }

  // 1. Pre-process: vocabulary expansion, negations, semantic inference
  const expandedContent = expandMessageVocabulary(content)
  const negationResult = detectNegations(content)
  const inferredOutcomes = extractIndirectPreferences(content)
  const inferredContext =
    Object.keys(inferredOutcomes).length > 0
      ? ` Inferred from outcome language: ${JSON.stringify(inferredOutcomes)}`
      : ""
  const negationContext =
    negationResult.hasNegation && negationResult.negatedTerms.length > 0
      ? ` Detected negations (things user does NOT want): ${negationResult.negatedTerms.join(", ")}. Include relevant ones in the exclusion field.`
      : ""

  // 2. Enriched prompt for LLM (optionally include evidence spans for verification)
  const enrichedPrompt = `Extract interior design preferences from this message. Only extract what is explicitly stated. Set confidence below 0.7 for ambiguous mentions.
Known vocabulary expansions applied to message where relevant: prefer standard terms (e.g. mid-century modern not mcm, scandinavian not scandi).${negationContext}${inferredContext}

For each entity you extract, include evidenceSpans: array of { start, end, text } where start/end are 0-based character indices in the Message below for the exact substring that supports this value. Only extract values that are literally stated; if the value is inferred rather than stated, omit that entity or set low confidence and omit evidenceSpans for it.

Message: "${expandedContent}"`

  const result = await withFallback(
    () =>
      generateObject({
        model: openai(OPENAI_PRIMARY_MODEL),
        schema: zodSchema(ExtractionSchema),
        prompt: enrichedPrompt,
        maxRetries: 3,
      }),
    () =>
      generateObject({
        model: openai(OPENAI_FALLBACK_MODEL),
        schema: zodSchema(ExtractionSchema),
        prompt: enrichedPrompt,
        maxRetries: 2,
      })
  )
  const { object } = result

  let entities: Array<ExtractionEntity & { needsConfirmation?: boolean; confirmMessage?: string }> =
    [...object.entities]

  // 2b. Verifier: reduce confidence by 0.2 when no valid evidence (Gap 4)
  entities = applyVerifierToEntities(entities, content) as typeof entities

  // 3. Add exclusion entities from negation result if not already covered
  if (negationResult.hasNegation && negationResult.negatedTerms.length > 0) {
    const existingExclusions = entities
      .filter((e) => e.field === "exclusion")
      .map((e) => e.text.toLowerCase())
    const toAdd = negationResult.negatedTerms.filter(
      (t) => !existingExclusions.some((e) => e.includes(t.toLowerCase()))
    )
    if (toAdd.length > 0) {
      entities.push({
        text: toAdd.join(", "),
        field: "exclusion",
        confidence: negationResult.confidence,
      })
    }
  }

  // 4. Post-process: normalize each entity text
  for (const entity of entities) {
    const [normalized, _conf] = normalizeValue(entity.text)
    entity.text = Array.isArray(normalized) ? normalized.join(", ") : normalized
  }

  // 4b. Uncertainty: adjust confidence or skip extraction for exploratory messages
  const uncertainty = detectUncertainty(content)
  if (uncertainty.hasUncertainty && uncertainty.level !== null) {
    for (const entity of entities) {
      entity.confidence = adjustConfidenceForUncertainty(
        entity.confidence,
        uncertainty.level,
        uncertainty.confidenceAdjustment
      )
    }
  }

  // 5. Load current preferences and apply state change (retraction/update) if detected
  const currentPrefsList = await prisma.preference.findMany({
    where: { conversationId },
  })
  const currentPrefs: Record<string, string> = {}
  for (const p of currentPrefsList) currentPrefs[p.field] = p.value

  const recentMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 10,
  })
  const recentContents = recentMessages
    .filter((m) => m.role === "user")
    .map((m) => m.content ?? "")

  const stateChange = detectStateChangeIntent(content)
  if (stateChange.hasChange && stateChange.changeType) {
    const { updates } = createStateChangeUpdate(
      stateChange,
      currentPrefs,
      recentContents
    )
    for (const { field, value } of updates) {
      const existing = currentPrefs[field]
      await prisma.preferenceChange.create({
        data: {
          conversationId,
          field,
          oldValue: existing ?? null,
          newValue: value,
          confidence: 1,
          changeType: existing ? "update" : "set",
          sourceMessageId: messageId ?? null,
        },
      })
      await prisma.preference.upsert({
        where: { conversationId_field: { conversationId, field } },
        create: { conversationId, field, value, confidence: 1, status: "confirmed" },
        update: { value, confidence: 1, status: "confirmed" },
      })
      currentPrefs[field] = value
    }
  }

  for (const entity of entities) {
    const result = checkContradiction(
      currentPrefs,
      entity.field,
      entity.text,
      content
    )
    if (result.hasConflict && !result.allowUpdate) {
      ;(entity as { needsConfirmation?: boolean; confirmMessage?: string }).needsConfirmation = true
      ;(entity as { confirmMessage?: string }).confirmMessage = result.confirmMessage
    }
  }

  if (messageId) {
    await prisma.message.update({
      where: { id: messageId },
      data: { extractions: entities },
    })
  }

  for (const entity of entities) {
    if (entity.needsConfirmation) continue
    // Skip persisting when uncertainty is exploratory (confidence forced to 0)
    if (uncertainty.level === UncertaintyLevel.EXPLORATORY || entity.confidence <= 0) continue
    const existing = currentPrefs[entity.field]
    const changeType = existing ? "update" : "set"
    await prisma.preferenceChange.create({
      data: {
        conversationId,
        field: entity.field,
        oldValue: existing ?? null,
        newValue: entity.text,
        confidence: entity.confidence,
        changeType,
        sourceMessageId: messageId ?? null,
      },
    })
    await prisma.preference.upsert({
      where: {
        conversationId_field: { conversationId, field: entity.field },
      },
      create: {
        conversationId,
        field: entity.field,
        value: entity.text,
        confidence: entity.confidence,
        status:
          entity.confidence > 0.85
            ? "confirmed"
            : entity.confidence > 0.6
              ? "potential"
              : "inferred",
        source: messageId ?? undefined,
      },
      update: {
        value: entity.text,
        confidence: entity.confidence,
        status:
          entity.confidence > 0.85
            ? "confirmed"
            : entity.confidence > 0.6
              ? "potential"
              : "inferred",
        source: messageId ?? undefined,
      },
    })
  }

  return Response.json({ entities })
}
