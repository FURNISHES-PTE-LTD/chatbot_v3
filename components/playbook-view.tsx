"use client"

import { useState } from "react"
import { RotateCcw, RotateCw, Sparkles, Plus, Check, X, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Mock workflow data ─────────────────────────────────────────────────────
type NodeType = "start" | "process" | "warning" | "end" | "knowledge"
type WfNode = { id: string; x: number; y: number; w: number; title: string; body: string; type: NodeType; icon: string }
type WfEdge = { id: string; from: string; to: string; label?: string }

const INIT_WF_NODES: WfNode[] = [
  { id: "start", x: 340, y: 40, w: 300, title: "START", body: "Say hello to the user. Introduce yourself as Eva, part of the Furnishes design team.", type: "start", icon: "🏠" },
  { id: "detect", x: 340, y: 210, w: 300, title: "DETECT INTENT", body: "Extract room type, style keywords, and furniture mentions from user input.", type: "process", icon: "🔍" },
  { id: "collect", x: 160, y: 400, w: 280, title: "COLLECT PREFERENCES", body: "Ask about style, budget, color theme, must-have furniture, and layout preferences.", type: "process", icon: "📋" },
  { id: "clarify", x: 560, y: 400, w: 280, title: "CLARIFY INTENT", body: "Ask user to confirm or correct the detected room type and preferences.", type: "warning", icon: "❓" },
  { id: "brief", x: 160, y: 590, w: 280, title: "GENERATE BRIEF", body: "Compile all extracted data into a structured design brief. Show task card.", type: "process", icon: "📄" },
  { id: "review", x: 340, y: 760, w: 300, title: "REVIEW & CONFIRM", body: "Present the complete brief. Ask for confirmation or adjustments.", type: "end", icon: "✅" },
  { id: "kb", x: 720, y: 40, w: 260, title: "KNOWLEDGE BASE", body: "Reference product catalog and style guides when user asks questions.", type: "knowledge", icon: "📚" },
]

const INIT_WF_EDGES: WfEdge[] = [
  { id: "e1", from: "start", to: "detect" },
  { id: "e2", from: "detect", to: "collect", label: "USER IS CLEAR" },
  { id: "e3", from: "detect", to: "clarify", label: "USER IS UNCLEAR" },
  { id: "e4", from: "clarify", to: "collect", label: "CORRECTED" },
  { id: "e5", from: "collect", to: "brief", label: "ALL CAPTURED" },
  { id: "e6", from: "brief", to: "review", label: "BRIEF READY" },
]

type TraceEntry =
  | { time: string; text: string; action?: string }
  | { time: string; userQuote: string; changes?: { field: string; after: string; confidence: number; action: string }[]; reasoning?: string }

const NODE_TRACES: Record<string, { entries: TraceEntry[] }> = {
  start: { entries: [{ time: "10:12 AM", text: "Eva greeted user and asked about room type.", action: "Sent welcome" }] },
  detect: { entries: [{ time: "10:13 AM", userQuote: "redoing my living room", changes: [{ field: "Room Type", after: "Living Room", confidence: 95, action: "applied" }], reasoning: "'Living room' matched room dictionary at 95%." }] },
  collect: {
    entries: [
      { time: "10:14 AM", userQuote: "minimalist, warm tones, big comfy sofa", changes: [{ field: "Style", after: "Minimalist", confidence: 92, action: "applied" }, { field: "Color", after: "Warm tones", confidence: 72, action: "potential" }, { field: "Furniture", after: "Sofa", confidence: 96, action: "applied" }], reasoning: "'Minimalist' exact match (92%). 'Warm tones' ambiguous — flagged (72%). 'Sofa' exact match (96%)." },
      { time: "10:15 AM", userQuote: "Around 4k, nothing farmhouse", changes: [{ field: "Budget", after: "$4,000", confidence: 88, action: "applied" }, { field: "Exclusion", after: "Farmhouse", confidence: 94, action: "applied" }], reasoning: "'4k' → $4,000 via regex (88%). 'Nothing farmhouse' = negation → exclusion (94%)." },
    ],
  },
  clarify: { entries: [] },
  brief: { entries: [{ time: "10:16 AM", text: "Brief compiled. Task card generated.", action: "Brief ready" }] },
  review: { entries: [{ time: "10:17 AM", text: "Awaiting user confirmation.", action: "Feedback sent" }] },
  kb: { entries: [] },
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">
      {children}
    </div>
  )
}

function ConfBar({ value }: { value: number }) {
  const color = value >= 85 ? "bg-emerald-500" : value >= 60 ? "bg-primary" : "bg-red-400"
  const textColor = value >= 85 ? "text-emerald-600" : value >= 60 ? "text-primary" : "text-red-500"
  return (
    <div className="flex items-center gap-2 min-w-[60px]">
      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
      <span className={cn("text-[10px] font-semibold min-w-[28px] text-right", textColor)}>{value}%</span>
    </div>
  )
}

function Badge({ children, variant = "muted" }: { children: React.ReactNode; variant?: "muted" }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide border bg-muted text-muted-foreground border-border">
      {children}
    </span>
  )
}

export function PlaybookView() {
  const [nodes, setNodes] = useState<WfNode[]>(INIT_WF_NODES)
  const [edges, setEdges] = useState<WfEdge[]>(INIT_WF_EDGES)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [editingBody, setEditingBody] = useState<string | null>(null)
  const [editingEdge, setEditingEdge] = useState<string | null>(null)
  const [zoom, setZoom] = useState(88)

  const nodeColors: Record<string, { bg: string; border: string; titleBg: string; titleC: string }> = {
    start: { bg: "#FFFFFF", border: "#E8E4DE", titleBg: "#F5F0EA", titleC: "#1A1A1A" },
    process: { bg: "#FFFFFF", border: "#E8E4DE", titleBg: "#F5F0EA", titleC: "#1A1A1A" },
    warning: { bg: "#FFFFFF", border: "#C86F4A", titleBg: "#FEF3EE", titleC: "#C86F4A" },
    end: { bg: "#FFFFFF", border: "#4A9D6E", titleBg: "#ECFDF5", titleC: "#047857" },
    knowledge: { bg: "#FFFFFF", border: "#9575CD", titleBg: "#9575CD", titleC: "#FFFFFF" },
  }

  const actionColors: Record<string, { c: string; bg: string }> = {
    applied: { c: "#4A9D6E", bg: "#ECFDF5" },
    potential: { c: "#C86F4A", bg: "#FEF3EE" },
    inferred: { c: "#9575CD", bg: "#F3E8FF" },
  }

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

  const trace = selectedNode ? NODE_TRACES[selectedNode] : null
  const selNodeData = nodes.find((n) => n.id === selectedNode)

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
                  icon: "📝",
                },
              ])
            }
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Node
          </button>
          <div className="flex-1" />
          <span className="text-xs text-emerald-600 flex items-center gap-1">
            <Check className="w-3 h-3" /> Saved
          </span>
          <div className="w-px h-5 bg-border mx-2" />
          <button type="button" className="px-3 py-1.5 rounded-lg border border-border bg-background text-muted-foreground text-xs hover:bg-muted transition-colors cursor-pointer">
            Preview
          </button>
          <button type="button" className="px-4 py-1.5 rounded-lg border-none bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer">
            Publish
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-auto min-h-0">
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, #D9D5D0 0.8px, transparent 0.8px)",
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
                      stroke="#E8E4DE"
                      strokeWidth={1.5}
                      strokeDasharray="6 4"
                    />
                    <circle cx={fx} cy={fy} r={4.5} fill="#FFFFFF" stroke="#B5B0AA" strokeWidth={1.5} />
                    <circle cx={fx} cy={fy} r={2} fill="#1A1A1A" />
                    <circle cx={tx} cy={ty} r={4.5} fill="#FFFFFF" stroke="#B5B0AA" strokeWidth={1.5} />
                    <circle cx={tx} cy={ty} r={2} fill="#B5B0AA" />
                    {edge.label && (
                      <g
                        style={{ cursor: "pointer" }}
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
                          fill="#FFFFFF"
                          stroke="#E8E4DE"
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
                const c = nodeColors[node.type] || nodeColors.process
                const isSel = selectedNode === node.id
                const isKb = node.type === "knowledge"
                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(isSel ? null : node.id)}
                    style={{ cursor: "pointer" }}
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
                    <text x={node.x + 14} y={node.y + 19} fontSize={12}>
                      {node.icon}
                    </text>
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
                        <rect x={node.x + node.w - 58} y={node.y + 6} width={48} height={18} rx={4} fill="#FFFFFF" />
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
                          onClick={(e) => {
                            e.stopPropagation()
                            duplicateNode(node.id)
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <rect
                            x={node.x + node.w + 6}
                            y={node.y + 10}
                            width={26}
                            height={26}
                            rx={6}
                            fill="#FFFFFF"
                            stroke="#E8E4DE"
                            strokeWidth={1}
                          />
                          <text x={node.x + node.w + 19} y={node.y + 27} textAnchor="middle" fontSize={12} fill="#7A756E">
                            ⧉
                          </text>
                        </g>
                        <g
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNode(node.id)
                          }}
                          style={{ cursor: "pointer" }}
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
                          <text x={node.x + node.w + 19} y={node.y + 59} textAnchor="middle" fontSize={11} fill="#EF4444">
                            ✕
                          </text>
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
                            const ac = actionColors[ch.action] || { c: "#7A756E", bg: "#F5F0EA" }
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
                          {"action" in entry && entry.action && <Badge variant="muted">{entry.action}</Badge>}
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
