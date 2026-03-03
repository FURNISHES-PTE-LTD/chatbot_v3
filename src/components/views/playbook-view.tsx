"use client"

import { useState, useEffect, useMemo } from "react"
import {
  RotateCcw,
  RotateCw,
  Sparkles,
  Plus,
  Check,
  X,
  ZoomIn,
  ZoomOut,
  Loader2,
  Home,
  Search,
  ClipboardList,
  HelpCircle,
  FileText,
  CheckCircle,
  BookOpen,
  PenLine,
  Copy,
} from "lucide-react"
import { SectionLabel } from "@/components/shared/section-label"
import { INIT_WF_NODES, INIT_WF_EDGES } from "@/lib/mock-data"
import type { WfNode, WfEdge } from "@/lib/mock-data"
import type { TraceEntry } from "@/lib/mock-data"
import { NODE_COLORS, STATUS_COLORS, SVG_COLORS } from "@/lib/theme-colors"
import { useCurrentConversation } from "@/lib/contexts/current-conversation-context"
import { cn } from "@/lib/core/utils"
import { apiGet, apiPut, API_ROUTES } from "@/lib/api"

type NodeType = "start" | "process" | "warning" | "end" | "knowledge"

const NODE_ICONS: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  home: Home,
  search: Search,
  "clipboard-list": ClipboardList,
  "help-circle": HelpCircle,
  "file-text": FileText,
  "check-circle": CheckCircle,
  "book-open": BookOpen,
  "pen-line": PenLine,
}

function ConfBar({ value }: { value: number }) {
  const color = value >= 85 ? "bg-orange-500" : value >= 60 ? "bg-primary" : "bg-red-400"
  const textColor = value >= 85 ? "text-orange-600" : value >= 60 ? "text-primary" : "text-red-500"
  return (
    <div className="flex items-center gap-2 min-w-[60px]">
      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
      <span className={cn("text-[10px] font-semibold min-w-[28px] text-right", textColor)}>{value}%</span>
    </div>
  )
}

function TraceBadge({ children, variant = "muted" }: { children: React.ReactNode; variant?: "muted" }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide border bg-muted text-muted-foreground border-border">
      {children}
    </span>
  )
}

export function PlaybookView() {
  const { conversationId } = useCurrentConversation()
  const [nodes, setNodes] = useState<WfNode[]>(INIT_WF_NODES)
  const [edges, setEdges] = useState<WfEdge[]>(INIT_WF_EDGES)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [editingBody, setEditingBody] = useState<string | null>(null)
  const [editingEdge, setEditingEdge] = useState<string | null>(null)
  const [zoom, setZoom] = useState(88)
  const [eventsEntries, setEventsEntries] = useState<TraceEntry[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [playbookSaving, setPlaybookSaving] = useState(false)

  useEffect(() => {
    apiGet<{ nodes: WfNode[]; edges: WfEdge[] }>(API_ROUTES.playbook)
      .then((data) => {
        if (Array.isArray(data.nodes) && data.nodes.length > 0) setNodes(data.nodes)
        if (Array.isArray(data.edges)) setEdges(data.edges)
      })
      .catch(() => {
        // No playbook or error: keep INIT_WF_NODES / INIT_WF_EDGES
      })
  }, [])

  useEffect(() => {
    if (!conversationId) {
      setEventsLoading(false)
      setEventsEntries([])
      return
    }
    setEventsLoading(true)
    apiGet<Array<{ time: string; field: string; newValue: string; confidence: number; action: string }>>(API_ROUTES.conversationEvents(conversationId))
      .then((events) => {
        const entries: TraceEntry[] = events.map((e) => ({
          time: new Date(e.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          userQuote: "",
          changes: [{ field: e.field, after: e.newValue, confidence: Math.round((e.confidence ?? 0) * 100), action: e.action ?? "set" }],
        }))
        setEventsEntries(entries)
      })
      .catch(() => setEventsEntries([]))
      .finally(() => setEventsLoading(false))
  }, [conversationId])

  const traceFromEvents = useMemo(
    () => (eventsEntries.length > 0 ? { entries: eventsEntries } : null),
    [eventsEntries],
  )

  const nodeColors = NODE_COLORS
  const actionColors = STATUS_COLORS

  const updateNodeBody = (id: string, body: string) =>
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, body } : n)))
  const deleteNode = (id: string) => {
    setNodes((ns) => ns.filter((n) => n.id !== id))
    setEdges((es) => es.filter((e) => e.from !== id && e.to !== id))
    setSelectedNode(null)
  }
  const duplicateNode = (id: string) => {
    const src = nodes.find((n) => n.id === id)
    if (src)
      setNodes((ns) => [
        ...ns,
        { ...src, id: `n_${Date.now()}`, x: src.x + 30, y: src.y + 30, title: src.title + " (COPY)" },
      ])
  }
  const updateEdgeLabel = (id: string, label: string) =>
    setEdges((es) => es.map((e) => (e.id === id ? { ...e, label } : e)))

  const trace = selectedNode ? traceFromEvents : null
  const selNodeData = nodes.find((n) => n.id === selectedNode)

  if (conversationId && eventsLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-card">
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Toolbar */}
        <div className="h-12 border-b border-border bg-card flex items-center px-4 gap-2 shrink-0">
          <button type="button" className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors cursor-pointer">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button type="button" className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors cursor-pointer">
            <RotateCw className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <button type="button" className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold hover:bg-muted transition-colors cursor-pointer">
            <Sparkles className="w-3.5 h-3.5" /> Agent Prompts
          </button>
          <button
            type="button"
            onClick={() =>
              setNodes((ns) => [
                ...ns,
                {
                  id: `n_${Date.now()}`,
                  x: 400,
                  y: 500,
                  w: 280,
                  title: "NEW NODE",
                  body: "Describe what Eva should do...",
                  type: "process",
                  icon: "pen-line",
                },
              ])
            }
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Node
          </button>
          <div className="flex-1" />
          <span className="text-xs text-orange-600 flex items-center gap-1">
            <Check className="w-3 h-3" /> Saved
          </span>
          <div className="w-px h-5 bg-border mx-2" />
          <button type="button" className="px-3 py-1.5 rounded-lg border border-border bg-background text-muted-foreground text-xs hover:bg-muted transition-colors cursor-pointer">
            Preview
          </button>
          <button
            type="button"
            disabled={playbookSaving}
            onClick={async () => {
              setPlaybookSaving(true)
              try {
                await apiPut(API_ROUTES.playbook, { nodes, edges })
              } finally {
                setPlaybookSaving(false)
              }
            }}
            className="px-4 py-1.5 rounded-lg border-none bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {playbookSaving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving…
              </span>
            ) : (
              "Publish"
            )}
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-auto min-h-0">
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, ${SVG_COLORS.grid} 0.8px, transparent 0.8px)`,
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-card rounded-lg px-3 py-1.5 border border-border text-xs text-muted-foreground z-10 shadow-sm">
            <button type="button" onClick={() => setZoom((z) => Math.max(50, z - 10))} className="hover:text-foreground transition-colors cursor-pointer p-0.5">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="min-w-[36px] text-center">{zoom}%</span>
            <button type="button" onClick={() => setZoom((z) => Math.min(120, z + 10))} className="hover:text-foreground transition-colors cursor-pointer p-0.5">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="p-8">
            <svg width={(1100 * zoom) / 100} height={(920 * zoom) / 100} viewBox="0 0 1100 920">
              {edges.map((edge) => {
                const from = nodes.find((n) => n.id === edge.from)
                const to = nodes.find((n) => n.id === edge.to)
                if (!from || !to) return null
                const fx = from.x + from.w / 2
                const fy = from.y + 90
                const tx = to.x + to.w / 2
                const ty = to.y
                const my = (fy + ty) / 2
                const mx = (fx + tx) / 2
                return (
                  <g key={edge.id}>
                    <path
                      d={`M ${fx} ${fy} C ${fx} ${my}, ${tx} ${my}, ${tx} ${ty}`}
                      fill="none"
                      stroke={SVG_COLORS.edge}
                      strokeWidth={1.5}
                      strokeDasharray="6 4"
                    />
                    <circle cx={fx} cy={fy} r={4.5} fill={SVG_COLORS.dotFill} stroke={SVG_COLORS.dotStroke} strokeWidth={1.5} />
                    <circle cx={fx} cy={fy} r={2} fill={SVG_COLORS.dotCenter} />
                    <circle cx={tx} cy={ty} r={4.5} fill={SVG_COLORS.dotFill} stroke={SVG_COLORS.dotStroke} strokeWidth={1.5} />
                    <circle cx={tx} cy={ty} r={2} fill={SVG_COLORS.dotStroke} />
                    {edge.label && (
                      <g
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingEdge(editingEdge === edge.id ? null : edge.id)
                        }}
                      >
                        <rect
                          x={mx - (edge.label.length * 4 + 16)}
                          y={my - 12}
                          width={edge.label.length * 8 + 32}
                          height={24}
                          rx={12}
                          fill={SVG_COLORS.dotFill}
                          stroke={SVG_COLORS.edge}
                          strokeWidth={1}
                        />
                        {editingEdge === edge.id ? (
                          <foreignObject
                            x={mx - edge.label.length * 4 - 10}
                            y={my - 10}
                            width={edge.label.length * 8 + 20}
                            height={20}
                          >
                            <input
                              autoFocus
                              value={edge.label}
                              onChange={(e) => updateEdgeLabel(edge.id, e.target.value)}
                              onBlur={() => setEditingEdge(null)}
                              onKeyDown={(e) => e.key === "Enter" && setEditingEdge(null)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full border-none outline-none text-[10px] font-semibold text-foreground bg-transparent text-center uppercase"
                            />
                          </foreignObject>
                        ) : (
                          <text
                            x={mx}
                            y={my + 3}
                            textAnchor="middle"
                            fontSize={10}
                            fontWeight={600}
                            fill="#7A756E"
                            letterSpacing="0.04em"
                          >
                            {edge.label}
                          </text>
                        )}
                      </g>
                    )}
                  </g>
                )
              })}
              {nodes.map((node) => {
                const c = nodeColors[node.type as keyof typeof nodeColors] || nodeColors.process
                const isSel = selectedNode === node.id
                const isKb = node.type === "knowledge"
                return (
                  <g
                    key={node.id}
                    role="button"
                    tabIndex={0}
                    aria-label={node.title}
                    className="cursor-pointer focus:outline-none"
                    onClick={() => setSelectedNode(isSel ? null : node.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setSelectedNode(isSel ? null : node.id)
                      }
                    }}
                  >
                    {isSel && (
                      <rect
                        x={node.x - 4}
                        y={node.y - 4}
                        width={node.w + 8}
                        height={98}
                        rx={14}
                        fill="none"
                        stroke="#C86F4A"
                        strokeWidth={2}
                        strokeDasharray="4 3"
                      />
                    )}
                    <rect x={node.x + 1} y={node.y + 2} width={node.w} height={90} rx={10} fill="rgba(0,0,0,0.04)" />
                    <rect
                      x={node.x}
                      y={node.y}
                      width={node.w}
                      height={90}
                      rx={10}
                      fill={c.bg}
                      stroke={isSel ? "#C86F4A" : c.border}
                      strokeWidth={isSel ? 2 : 1.2}
                    />
                    <rect x={node.x} y={node.y} width={node.w} height={30} rx={10} fill={c.titleBg} />
                    <rect x={node.x} y={node.y + 18} width={node.w} height={12} fill={c.titleBg} />
                    <foreignObject x={node.x + 10} y={node.y + 6} width={20} height={20}>
                      <div className="flex items-center justify-center w-5 h-5 text-current" style={{ color: c.titleC }}>
                        {(() => {
                          const IconComponent = NODE_ICONS[node.icon] ?? FileText
                          return IconComponent ? <IconComponent size={14} className="shrink-0" /> : null
                        })()}
                      </div>
                    </foreignObject>
                    <text
                      x={node.x + 32}
                      y={node.y + 20}
                      fontSize={11}
                      fontWeight={700}
                      fill={c.titleC}
                      letterSpacing="0.06em"
                    >
                      {node.title}
                    </text>
                    {isKb && (
                      <>
                        <rect x={node.x + node.w - 58} y={node.y + 6} width={48} height={18} rx={4} fill={SVG_COLORS.dotFill} />
                        <text
                          x={node.x + node.w - 34}
                          y={node.y + 18}
                          textAnchor="middle"
                          fontSize={9}
                          fontWeight={700}
                          fill="#9575CD"
                        >
                          Global
                        </text>
                      </>
                    )}
                    <foreignObject x={node.x + 12} y={node.y + 36} width={node.w - 24} height={48}>
                      {editingBody === node.id ? (
                        <textarea
                          autoFocus
                          value={node.body}
                          onChange={(e) => updateNodeBody(node.id, e.target.value)}
                          onBlur={() => setEditingBody(null)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full h-full border border-primary rounded p-1 text-[11px] text-foreground leading-relaxed resize-none outline-none bg-primary/5"
                        />
                      ) : (
                        <div
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            setEditingBody(node.id)
                          }}
                          className="text-[11px] text-muted-foreground leading-relaxed cursor-text h-full overflow-hidden"
                        >
                          {node.body}
                        </div>
                      )}
                    </foreignObject>
                    {isSel && !isKb && (
                      <g>
                        <g
                          role="button"
                          tabIndex={0}
                          aria-label="Duplicate node"
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            duplicateNode(node.id)
                          }}
                        >
                          <rect
                            x={node.x + node.w + 6}
                            y={node.y + 10}
                            width={26}
                            height={26}
                            rx={6}
                            fill={SVG_COLORS.dotFill}
                            stroke={SVG_COLORS.edge}
                            strokeWidth={1}
                          />
                          <foreignObject x={node.x + node.w + 10} y={node.y + 14} width={18} height={18}>
                            <div className="flex items-center justify-center w-full h-full text-[#7A756E]">
                              <Copy size={14} />
                            </div>
                          </foreignObject>
                        </g>
                        <g
                          role="button"
                          tabIndex={0}
                          aria-label="Delete node"
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNode(node.id)
                          }}
                        >
                          <rect
                            x={node.x + node.w + 6}
                            y={node.y + 42}
                            width={26}
                            height={26}
                            rx={6}
                            fill="#FEF2F2"
                            stroke="#FECACA"
                            strokeWidth={1}
                          />
                          <foreignObject x={node.x + node.w + 10} y={node.y + 46} width={18} height={18}>
                            <div className="flex items-center justify-center w-full h-full text-[#EF4444]">
                              <X size={14} />
                            </div>
                          </foreignObject>
                        </g>
                      </g>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Side panel */}
      {selectedNode && (
        <div className="w-72 min-w-72 bg-card border-l border-border flex flex-col overflow-hidden shrink-0 animate-in slide-in-from-right-4 duration-200">
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{selNodeData?.title}</div>
              <div className="text-[10px] text-muted-foreground capitalize">{selNodeData?.type} node</div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 border-b border-border">
              <SectionLabel>Node Prompt</SectionLabel>
              <textarea
                value={selNodeData?.body ?? ""}
                onChange={(e) => updateNodeBody(selectedNode, e.target.value)}
                className="w-full min-h-[80px] p-3 rounded-lg border border-border text-xs text-foreground leading-relaxed resize-y outline-none bg-background focus:border-primary transition-colors"
              />
            </div>
            <div className="p-4">
              <SectionLabel>Decision Trace</SectionLabel>
              {!trace || trace.entries.length === 0 ? (
                <div className="text-xs text-muted-foreground py-6 text-center">No activity yet.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {trace.entries.map((entry, i) => (
                    <div key={i} className="border-l-2 border-border pl-3 relative">
                      <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary border-2 border-card" />
                      <div className="text-[10px] text-muted-foreground">{entry.time}</div>
                      {"userQuote" in entry ? (
                        <>
                          <div className="text-xs text-foreground leading-relaxed mt-1 mb-2">
                            <span className="text-muted-foreground">User: </span>&ldquo;{entry.userQuote}&rdquo;
                          </div>
                          {entry.changes?.map((ch, j) => {
                            const ac = actionColors[ch.action as keyof typeof actionColors] || { c: "#7A756E", bg: "#F5F0EA" }
                            return (
                              <div key={j} className="flex items-center gap-1.5 flex-wrap mb-1">
                                <span className="text-[10px] font-semibold text-foreground">{ch.field}</span>
                                <span className="text-[10px] text-primary font-semibold">→ {ch.after}</span>
                                <ConfBar value={ch.confidence} />
                                <span
                                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase"
                                  style={{ color: ac.c, background: ac.bg }}
                                >
                                  {ch.action}
                                </span>
                              </div>
                            )
                          })}
                          {"reasoning" in entry && entry.reasoning && (
                            <div className="mt-2 p-2 rounded bg-muted/50 text-[10px] text-muted-foreground leading-relaxed">
                              {entry.reasoning}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          {entry.text}
                          {"action" in entry && entry.action && <TraceBadge variant="muted">{entry.action}</TraceBadge>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
