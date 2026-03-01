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
        <button
          type="button"
          className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          COLLECTIONS
        </button>
        <button
          type="button"
          className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer relative"
        >
          INSPIRATION
          <sup className="ml-0.5 text-[9px] font-normal text-muted-foreground">03</sup>
        </button>
        <button
          type="button"
          className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          PLAYGROUND
          <sup className="ml-0.5 text-[9px] font-normal text-muted-foreground">01</sup>
        </button>
        <button
          type="button"
          className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          ABOUT
        </button>
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
