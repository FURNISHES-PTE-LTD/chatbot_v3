"use client"

interface NavbarProps {
  onFurnishesClick?: () => void
}

export function Navbar({ onFurnishesClick }: NavbarProps) {
  return (
    <header role="banner" className="flex items-center justify-between h-12 bg-card border-b border-border px-8 shrink-0">
      {/* Brand */}
      <button
        type="button"
        onClick={onFurnishesClick}
        className="text-xs font-medium tracking-widest text-muted-foreground uppercase hover:text-foreground transition-colors cursor-pointer whitespace-nowrap"
      >
        FURNISHES<span className="mx-1 text-muted-foreground">|</span>INTERIOR SOLUTION
      </button>

      {/* Center nav links */}
      <div className="flex items-center gap-8">
        <span className="text-xs tracking-widest uppercase text-muted-foreground/50 cursor-default select-none" title="Coming soon">
          COLLECTIONS
        </span>
        <span className="text-xs tracking-widest uppercase text-muted-foreground/50 cursor-default select-none relative" title="Coming soon">
          INSPIRATION
          <sup className="ml-0.5 text-[9px] font-normal text-muted-foreground">03</sup>
        </span>
        <span className="text-xs tracking-widest uppercase text-muted-foreground/50 cursor-default select-none" title="Coming soon">
          PLAYGROUND
          <sup className="ml-0.5 text-[9px] font-normal text-muted-foreground">01</sup>
        </span>
        <span className="text-xs tracking-widest uppercase text-muted-foreground/50 cursor-default select-none" title="Coming soon">
          ABOUT
        </span>
      </div>

      {/* CTA */}
      <button
        type="button"
        className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer whitespace-nowrap"
      >
        [ start journey ]
      </button>
    </header>
  )
}
