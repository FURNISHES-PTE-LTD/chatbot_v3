"use client"

import { Switch } from "@/components/ui/switch"

export function SettingsView() {
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
              <select className="px-3 py-2 rounded-lg border border-border bg-background text-sm cursor-pointer">
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Compact mode</p>
                <p className="text-xs text-muted-foreground">Reduce spacing for denser layouts</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Notifications</h3>
          <div className="grid gap-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Email notifications</p>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Push notifications</p>
                <p className="text-xs text-muted-foreground">Browser push notifications</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Project updates</p>
                <p className="text-xs text-muted-foreground">Get notified about project changes</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Assistant</h3>
          <div className="grid gap-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Auto-suggestions</p>
                <p className="text-xs text-muted-foreground">Get AI-powered recommendations</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Voice responses</p>
                <p className="text-xs text-muted-foreground">Enable voice assistant</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Assistant character</p>
                <p className="text-xs text-muted-foreground">Choose your AI assistant</p>
              </div>
              <select className="px-3 py-2 rounded-lg border border-border bg-background text-sm cursor-pointer">
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
                <p className="text-xs text-muted-foreground">Help improve our service</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Auto-save projects</p>
                <p className="text-xs text-muted-foreground">Automatically save your work</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
