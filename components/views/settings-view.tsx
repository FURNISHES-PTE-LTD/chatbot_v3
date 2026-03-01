"use client"

import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"

export function SettingsView() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="h-full overflow-y-auto p-6">
      <h1 className="text-xl font-semibold text-foreground mb-6">Settings</h1>

      <div className="max-w-3xl space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Appearance</h3>
          <div className="grid gap-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Theme</p>
                <p className="text-xs text-muted-foreground">Choose your interface theme</p>
              </div>
              <select
                value={theme ?? "system"}
                onChange={(e) => setTheme(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm cursor-pointer"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Compact mode</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
              <Switch disabled />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Notifications</h3>
          <div className="grid gap-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Email notifications</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
              <Switch disabled />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Push notifications</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
              <Switch disabled />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Project updates</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
              <Switch disabled />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Assistant</h3>
          <div className="grid gap-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Auto-suggestions</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
              <Switch disabled />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Voice responses</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
              <Switch disabled />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Assistant character</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
              <select disabled className="px-3 py-2 rounded-lg border border-border bg-muted text-sm cursor-not-allowed opacity-60">
                <option>Eva</option>
                <option>Alex</option>
                <option>Sam</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Privacy & Security</h3>
          <div className="grid gap-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Analytics tracking</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
              <Switch disabled />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Auto-save projects</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
              <Switch disabled />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
