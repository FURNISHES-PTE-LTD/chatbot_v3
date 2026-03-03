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
        className="text-xs font-medium tracking-widest text-amber-800 uppercase hover:text-amber-900 transition-colors cursor-pointer whitespace-nowrap"
      >
        FURNISHES<span className="mx-1 text-amber-800">|</span>INTERIOR SOLUTION
      </button>

      {/* Center nav links */}
      <div className="flex items-center gap-8">
        <span className="text-xs tracking-widest uppercase text-amber-800 cursor-default select-none" title="Coming soon">
          COLLECTIONS
        </span>
        <span className="text-xs tracking-widest uppercase text-amber-800 cursor-default select-none relative" title="Coming soon">
          INSPIRATION
          <sup className="ml-0.5 text-[9px] font-normal text-amber-800">03</sup>
        </span>
        <span className="text-xs tracking-widest uppercase text-amber-800 cursor-default select-none" title="Coming soon">
          PLAYGROUND
          <sup className="ml-0.5 text-[9px] font-normal text-amber-800">01</sup>
        </span>
        <span className="text-xs tracking-widest uppercase text-amber-800 cursor-default select-none" title="Coming soon">
          ABOUT
        </span>
      </div>

      {/* CTA */}
      <button
        type="button"
        className="text-xs tracking-widest uppercase text-amber-800 hover:text-amber-900 transition-colors cursor-pointer whitespace-nowrap"
      >
        [ start journey ]
      </button>
    </header>
  )
}
