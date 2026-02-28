"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto bg-card border border-border">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-lg font-semibold text-foreground">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Appearance Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Appearance</h3>
            <div className="space-y-3 bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme" className="text-sm text-foreground cursor-pointer">
                  Theme
                </Label>
                <Select defaultValue="light">
                  <SelectTrigger id="theme" className="w-[130px] cursor-pointer h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light" className="cursor-pointer text-sm">
                      Light
                    </SelectItem>
                    <SelectItem value="dark" className="cursor-pointer text-sm">
                      Dark
                    </SelectItem>
                    <SelectItem value="system" className="cursor-pointer text-sm">
                      System
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="compact" className="text-sm text-foreground cursor-pointer">
                  Compact mode
                </Label>
                <Switch id="compact" />
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notifications</h3>
            <div className="space-y-3 bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notif" className="text-sm text-foreground cursor-pointer">
                  Email notifications
                </Label>
                <Switch id="email-notif" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="push-notif" className="text-sm text-foreground cursor-pointer">
                  Push notifications
                </Label>
                <Switch id="push-notif" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="project-updates" className="text-sm text-foreground cursor-pointer">
                  Project updates
                </Label>
                <Switch id="project-updates" defaultChecked />
              </div>
            </div>
          </div>

          {/* Assistant Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assistant</h3>
            <div className="space-y-3 bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-suggest" className="text-sm text-foreground cursor-pointer">
                  Auto-suggestions
                </Label>
                <Switch id="auto-suggest" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="voice" className="text-sm text-foreground cursor-pointer">
                  Voice responses
                </Label>
                <Switch id="voice" />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="assistant-char" className="text-sm text-foreground cursor-pointer">
                  Assistant character
                </Label>
                <Select defaultValue="eva">
                  <SelectTrigger id="assistant-char" className="w-[130px] cursor-pointer h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eva" className="cursor-pointer text-sm">
                      Eva
                    </SelectItem>
                    <SelectItem value="alex" className="cursor-pointer text-sm">
                      Alex
                    </SelectItem>
                    <SelectItem value="sam" className="cursor-pointer text-sm">
                      Sam
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Privacy & Security Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Privacy & Security</h3>
            <div className="space-y-3 bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="analytics" className="text-sm text-foreground cursor-pointer">
                  Analytics tracking
                </Label>
                <Switch id="analytics" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-save" className="text-sm text-foreground cursor-pointer">
                  Auto-save projects
                </Label>
                <Switch id="auto-save" defaultChecked />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
