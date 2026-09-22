"use client"

import { useEffect, useState, useCallback } from "react"
import { Header } from "@/components/builder/header"
import { SectionNav } from "@/components/builder/section-nav"
import { Canvas } from "@/components/builder/canvas"
import { PreviewPanel } from "@/components/builder/preview-panel"
import { CommandMenu } from "@/components/builder/command-menu"
import { AddSection } from "@/components/builder/add-section"
import { useBuilderStore } from "@/lib/store"
import { stringify } from "yaml"

export default function BuilderPage() {
  const [commandOpen, setCommandOpen] = useState(false)
  const [addSectionOpen, setAddSectionOpen] = useState(false)

  const handleOpenCommand = useCallback(() => setCommandOpen(true), [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey

      // Cmd+K - command palette
      if (meta && e.key === "k") {
        e.preventDefault()
        setCommandOpen(true)
        return
      }

      // Cmd+Z - undo
      if (meta && !e.shiftKey && e.key === "z") {
        e.preventDefault()
        useBuilderStore.temporal.getState().undo()
        return
      }

      // Cmd+Shift+Z - redo
      if (meta && e.shiftKey && e.key === "z") {
        e.preventDefault()
        useBuilderStore.temporal.getState().redo()
        return
      }

      // Cmd+S - export
      if (meta && e.key === "s") {
        e.preventDefault()
        const spec = useBuilderStore.getState().spec
        const yamlStr = stringify(spec)
        const blob = new Blob([yamlStr], { type: "text/yaml" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${spec.id || "agent"}.agent.yaml`
        a.click()
        URL.revokeObjectURL(url)
        return
      }

      // / - quick add section (only when not in an input)
      if (e.key === "/" && !meta && !isInputFocused()) {
        e.preventDefault()
        setCommandOpen(true)
        return
      }

      // Escape - close palettes
      if (e.key === "Escape") {
        setCommandOpen(false)
        setAddSectionOpen(false)
        return
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header onOpenCommand={handleOpenCommand} />

      <div className="flex-1 flex overflow-hidden">
        <SectionNav />
        <Canvas />
        <PreviewPanel />
      </div>

      <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  )
}

function isInputFocused() {
  const active = document.activeElement
  if (!active) return false
  const tag = active.tagName.toLowerCase()
  return tag === "input" || tag === "textarea" || tag === "select" || (active as HTMLElement).isContentEditable
}
