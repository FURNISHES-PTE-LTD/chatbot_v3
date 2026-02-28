"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface TutorialStep {
  title: string
  description: string
  targetSelector: string
  position: "top" | "bottom" | "left" | "right"
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Step 1: Welcome Section",
    description: "This is your personal welcome area. You can see your name and quick access to help.",
    targetSelector: "[data-tutorial='welcome']",
    position: "right",
  },
  {
    title: "Step 2: Navigation Menu",
    description: "Browse through different sections like Saved Plans, Explore, and Room Planner here.",
    targetSelector: "[data-tutorial='navigation']",
    position: "right",
  },
  {
    title: "Step 3: Main Content",
    description: "This is your workspace where you can design, plan, and manage your projects.",
    targetSelector: "[data-tutorial='main-content']",
    position: "left",
  },
  {
    title: "Step 4: AI Assistant",
    description: "Click the robot icon to open Eva, your AI assistant for help and guidance.",
    targetSelector: "[data-tutorial='robot-icon']",
    position: "bottom",
  },
  {
    title: "Step 5: Shopping Cart",
    description: "Access your cart here to review and purchase selected items.",
    targetSelector: "[data-tutorial='cart']",
    position: "bottom",
  },
]

interface TutorialGuideProps {
  isOpen: boolean
  onClose: () => void
}

export function TutorialGuide({ isOpen, onClose }: TutorialGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const updateTargetRect = () => {
      const step = tutorialSteps[currentStep]
      const element = document.querySelector(step.targetSelector)
      if (element) {
        setTargetRect(element.getBoundingClientRect())
      }
    }

    updateTargetRect()
    window.addEventListener("resize", updateTargetRect)
    window.addEventListener("scroll", updateTargetRect)

    return () => {
      window.removeEventListener("resize", updateTargetRect)
      window.removeEventListener("scroll", updateTargetRect)
    }
  }, [isOpen, currentStep])

  if (!isOpen) return null

  const currentTutorialStep = tutorialSteps[currentStep]
  const isLastStep = currentStep === tutorialSteps.length - 1

  const getTooltipPosition = () => {
    if (!targetRect) return {}

    const gap = 16
    const tooltipWidth = 320
    const tooltipHeight = 200

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let left = 0
    let top = 0

    switch (currentTutorialStep.position) {
      case "right":
        left = targetRect.right + gap
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2

        // Check if tooltip goes off right edge
        if (left + tooltipWidth > viewportWidth) {
          left = targetRect.left - tooltipWidth - gap
        }
        break

      case "left":
        left = targetRect.left - tooltipWidth - gap
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2

        // Check if tooltip goes off left edge
        if (left < 0) {
          left = targetRect.right + gap
        }
        break

      case "bottom":
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
        top = targetRect.bottom + gap

        // Check if tooltip goes off bottom edge
        if (top + tooltipHeight > viewportHeight) {
          top = targetRect.top - tooltipHeight - gap
        }
        break

      case "top":
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
        top = targetRect.top - tooltipHeight - gap

        // Check if tooltip goes off top edge
        if (top < 0) {
          top = targetRect.bottom + gap
        }
        break
    }

    // Final checks to ensure tooltip stays within viewport
    if (left < gap) left = gap
    if (left + tooltipWidth > viewportWidth - gap) left = viewportWidth - tooltipWidth - gap
    if (top < gap) top = gap
    if (top + tooltipHeight > viewportHeight - gap) top = viewportHeight - tooltipHeight - gap

    return {
      left: `${left}px`,
      top: `${top}px`,
    }
  }

  const handleNext = () => {
    if (isLastStep) {
      onClose()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/25 z-50 animate-in fade-in duration-300" onClick={onClose} />

      {/* Highlight the target element */}
      {targetRect && (
        <div
          className="fixed z-50 pointer-events-none animate-in fade-in duration-300"
          style={{
            left: `${targetRect.left - 4}px`,
            top: `${targetRect.top - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
            boxShadow: "0 0 0 4px rgba(255, 255, 255, 0.95), 0 0 0 9999px rgba(0, 0, 0, 0.25)",
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.4)",
          }}
        />
      )}

      {/* Tutorial tooltip */}
      <div
        className="fixed z-50 w-80 bg-card border border-border rounded-lg shadow-2xl p-6 animate-in fade-in zoom-in duration-300"
        style={getTooltipPosition()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-2">{currentTutorialStep.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{currentTutorialStep.description}</p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 w-8 rounded-full transition-all duration-300",
                  index === currentStep ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} / {tutorialSteps.length}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Skip
          </button>
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className="flex-1 px-4 py-2 text-sm font-medium border border-border rounded hover:bg-accent transition-colors cursor-pointer"
            >
              Previous
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors cursor-pointer"
          >
            {isLastStep ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </>
  )
}
