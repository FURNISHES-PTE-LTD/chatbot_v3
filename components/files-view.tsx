"use client"

import { useState } from "react"
import { Download, Edit3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { FILES_DATA } from "@/lib/mock-data"
import { FILE_PALETTES } from "@/lib/theme-colors"

export type FileItem = (typeof FILES_DATA)[number]

interface FilesViewProps {
  onEditInChat?: (title: string) => void
}

function FileThumbnail({ file }: { file: FileItem }) {
  const c = FILE_PALETTES[file.thumb as keyof typeof FILE_PALETTES] ?? FILE_PALETTES.mood
  return (
    <div
      className="w-full aspect-[16/10] rounded-xl flex items-center justify-center relative overflow-hidden"
      style={{ background: c.bg }}
    >
      {file.type === "floorplan" ? (
        <svg width="80%" height="80%" viewBox="0 0 200 120" aria-hidden="true">
          <rect x="10" y="10" width="180" height="100" rx="2" fill="none" stroke={c.accent} strokeWidth="2" />
          <rect x="30" y="60" width="50" height="30" rx="4" fill={c.accent + "33"} stroke={c.accent} strokeWidth="1" />
          <text x="55" y="80" textAnchor="middle" fontSize="8" fill={c.accent} fontFamily="system-ui">
            Sofa
          </text>
          <rect x="90" y="45" width="25" height="25" rx="3" fill={c.accent + "22"} stroke={c.accent} strokeWidth="1" />
        </svg>
      ) : (
        <svg width="60%" height="60%" viewBox="0 0 100 60" aria-hidden="true">
          <rect x="5" y="5" width="90" height="50" rx="6" fill={c.accent + "22"} />
          <circle cx="30" cy="25" r="8" fill={c.accent + "44"} />
          <circle cx="65" cy="20" r="5" fill={c.accent + "33"} />
          <path d="M5 40 Q25 20 50 35 Q75 50 95 30" fill="none" stroke={c.accent} strokeWidth="1.5" opacity="0.5" />
        </svg>
      )}
      <div className="absolute top-2 right-2">
        <Badge variant={file.type === "floorplan" ? "secondary" : "default"} className="text-[10px] font-semibold uppercase">
          {file.type === "floorplan" ? "Floorplan" : "Image"}
        </Badge>
      </div>
    </div>
  )
}

function FilePreviewLarge({ file }: { file: FileItem }) {
  const c = file.type === "floorplan" ? { bg: "#D6E8E0", accent: "#4DB6AC" } : { bg: "#E8D5C4", accent: "#C86F4A" }
  return (
    <div className="w-full h-[360px] rounded-2xl flex items-center justify-center" style={{ background: c.bg }}>
      {file.type === "floorplan" ? (
        <svg width="80%" height="80%" viewBox="0 0 400 240" aria-hidden="true">
          <rect x="20" y="20" width="360" height="200" rx="3" fill="none" stroke={c.accent} strokeWidth="2.5" />
          <rect x="60" y="120" width="100" height="60" rx="6" fill={c.accent + "33"} stroke={c.accent} strokeWidth="1.5" />
          <text x="110" y="158" textAnchor="middle" fontSize="14" fill={c.accent} fontWeight="600" fontFamily="system-ui">
            Sofa
          </text>
          <rect x="180" y="90" width="50" height="50" rx="5" fill={c.accent + "22"} stroke={c.accent} strokeWidth="1.5" />
          <text x="205" y="120" textAnchor="middle" fontSize="12" fill={c.accent} fontFamily="system-ui">
            Table
          </text>
        </svg>
      ) : (
        <svg width="60%" height="60%" viewBox="0 0 200 120" aria-hidden="true">
          <rect x="10" y="10" width="180" height="100" rx="10" fill={c.accent + "22"} />
          <circle cx="60" cy="50" r="16" fill={c.accent + "44"} />
          <circle cx="130" cy="40" r="10" fill={c.accent + "33"} />
          <path d="M10 80 Q50 40 100 70 Q150 100 190 55" fill="none" stroke={c.accent} strokeWidth="2" opacity="0.5" />
        </svg>
      )}
    </div>
  )
}

export function FilesView({ onEditInChat }: FilesViewProps) {
  const [selected, setSelected] = useState<FileItem | null>(null)
  const [filter, setFilter] = useState<"all" | "image" | "floorplan">("all")
  const filtered =
    filter === "all" ? FILES_DATA : FILES_DATA.filter((f) => f.type === filter)

  return (
    <div className="flex-1 overflow-y-auto">
      {!selected ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-base font-semibold text-foreground mb-1">Generated Files</h1>
              <p className="text-xs text-muted-foreground">
                Images, floorplans, and documents from your conversations.
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-medium">{FILES_DATA.length} files</span>
          </div>

          <div className="flex gap-2 mb-4">
            {[
              { id: "all" as const, label: "All" },
              { id: "image" as const, label: "Images" },
              { id: "floorplan" as const, label: "Floorplans" },
            ].map((f) => (
              <button
                type="button"
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
                  filter === f.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {filtered.map((file) => (
              <button
                type="button"
                key={file.id}
                onClick={() => setSelected(file)}
                className="rounded-xl border border-border bg-card overflow-hidden text-left cursor-pointer transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/5 group"
              >
                <FileThumbnail file={file} />
                <div className="p-4">
                  <div className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {file.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground mb-3">{file.desc}</div>
                  <div className="flex gap-1.5 flex-wrap items-center">
                    {file.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-auto">{file.time}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground text-xs mb-5 hover:bg-muted transition-colors cursor-pointer"
          >
            ← Back to files
          </button>
          <FilePreviewLarge file={selected} />
          <div className="mt-5 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xl font-semibold text-foreground">{selected.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{selected.desc}</div>
              <div className="flex gap-2 mt-3">
                {selected.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-muted-foreground text-xs hover:bg-muted transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              <button
                type="button"
                onClick={() => onEditInChat?.(selected.title)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-none bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit in chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
