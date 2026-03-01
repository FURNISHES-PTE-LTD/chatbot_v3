"use client"

export function CustomizeView() {
  return (
    <div>
      <h1 className="text-base font-semibold text-foreground">Customize</h1>
      <p className="mb-4 text-xs text-muted-foreground">Adjust your preferences and settings</p>
      <div className="space-y-3">
        <div className="rounded border border-border bg-card p-4">
          <h4 className="mb-2 text-xs font-medium">Measurement Units</h4>
          <div className="flex gap-2">
            {["Metric", "Imperial"].map((unit) => (
              <button
                key={unit}
                type="button"
                className="rounded bg-secondary/50 px-3 py-1.5 text-xs transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
              >
                {unit}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded border border-border bg-card p-4">
          <h4 className="mb-2 text-xs font-medium">Default Budget</h4>
          <input
            type="number"
            placeholder="Set default"
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  )
}
