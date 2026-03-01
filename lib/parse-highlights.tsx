"use client"

/**
 * Splits text on <hl>...</hl> tags and returns React nodes with highlighted spans.
 */
export function parseHighlightedContent(text: string) {
  const parts = text.split(/(<hl>.*?<\/hl>)/g)
  return parts.map((p, i) =>
    p.startsWith("<hl>") ? (
      <span key={i} className="bg-primary/15 text-primary px-1 py-0.5 rounded font-semibold text-sm">
        {p.replace(/<\/?hl>/g, "")}
      </span>
    ) : (
      <span key={i}>{p}</span>
    )
  )
}
