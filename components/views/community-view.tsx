"use client"

export function CommunityView() {
  return (
    <div>
      <h1 className="text-base font-semibold text-foreground">Community</h1>
      <p className="mb-4 text-xs text-muted-foreground">Explore shared designs and templates</p>
      <div className="grid gap-3 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded border border-border bg-card p-3">
            <div className="mb-2 h-32 rounded bg-secondary/30" />
            <h4 className="text-xs font-medium">Shared Design {i}</h4>
            <p className="text-[10px] text-muted-foreground">by Designer {i}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
