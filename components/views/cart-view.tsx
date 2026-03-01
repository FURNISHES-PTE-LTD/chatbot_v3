"use client"

export function CartView() {
  return (
    <div className="rounded border border-border bg-card p-4">
      <h1 className="text-base font-semibold text-foreground">Shopping Cart</h1>
      <p className="mb-4 text-xs text-muted-foreground">Review your selected items</p>
      <div className="space-y-3">
        <div className="rounded border border-border bg-background p-4">
          <p className="text-sm text-muted-foreground">Your cart is empty</p>
        </div>
      </div>
    </div>
  )
}
