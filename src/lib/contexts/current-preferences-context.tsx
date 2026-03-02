"use client"

import React, { createContext, useContext, useState } from "react"

interface CurrentPreferencesContextValue {
  preferences: Record<string, string>
  setPreferences: (p: Record<string, string>) => void
}

const CurrentPreferencesContext = createContext<CurrentPreferencesContextValue | null>(null)

export function CurrentPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Record<string, string>>({})
  return (
    <CurrentPreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </CurrentPreferencesContext.Provider>
  )
}

export function useCurrentPreferences() {
  const ctx = useContext(CurrentPreferencesContext)
  return ctx ?? { preferences: {}, setPreferences: () => {} }
}
