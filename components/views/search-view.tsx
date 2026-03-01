"use client"

import { Search, Clock, TrendingUp } from "lucide-react"

export function SearchView() {
  return (
    <div>
      <h1 className="text-base font-semibold text-foreground mb-4">Search</h1>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for furniture, rooms, styles..."
            className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Recent Searches
          </h3>
          <div className="space-y-2">
            {["Modern living room sofa", "Scandinavian dining table", "Minimalist bedroom set", "Industrial office desk"].map((search, index) => (
              <button key={index} type="button" className="w-full text-left px-4 py-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 text-sm text-foreground transition-all duration-200 cursor-pointer">
                {search}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Trending Searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {["Mid-century modern", "Velvet sofa", "Accent chairs", "Console table", "Area rugs"].map((tag) => (
              <button key={tag} type="button" className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all duration-200 cursor-pointer">
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
