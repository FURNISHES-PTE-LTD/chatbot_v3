"use client"

interface NavbarProps {
  onFurnishesClick?: () => void
}

export function Navbar({ onFurnishesClick }: NavbarProps) {
  return (
    <nav className="flex items-center justify-between h-12 bg-card border-b border-border px-8 shrink-0">
      {/* Brand */}
      <button
        onClick={onFurnishesClick}
        className="text-xs font-medium tracking-widest text-muted-foreground uppercase hover:text-foreground transition-colors cursor-pointer whitespace-nowrap"
      >
        FURNISHES<span className="mx-1 text-muted-foreground">|</span>INTERIOR SOLUTION
      </button>

      {/* Center nav links */}
      <div className="flex items-center gap-8">
        <a
          href="#"
          className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          COLLECTIONS
        </a>
        <a
          href="#"
          className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer relative"
        >
          INSPIRATION
          <sup className="ml-0.5 text-[9px] font-normal text-muted-foreground">03</sup>
        </a>
        <a
          href="#"
          className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          PLAYGROUND
          <sup className="ml-0.5 text-[9px] font-normal text-muted-foreground">01</sup>
        </a>
        <a
          href="#"
          className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          ABOUT
        </a>
      </div>

      {/* CTA */}
      <a
        href="#"
        className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer whitespace-nowrap"
      >
        [ start journey ]
      </a>
    </nav>
  )
}
