"use client"

import { useBuilderStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Undo2, Redo2, Download, Command, Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"
import { stringify } from "yaml"

export function Header({ onOpenCommand }: { onOpenCommand: () => void }) {
  const spec = useBuilderStore((s) => s.spec)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches
    setDark(isDark)
    if (isDark) document.documentElement.classList.add("dark")
  }, [])

  const toggleDark = () => {
    setDark(!dark)
    document.documentElement.classList.toggle("dark")
  }

  const handleUndo = () => {
    useBuilderStore.temporal.getState().undo()
  }

  const handleRedo = () => {
    useBuilderStore.temporal.getState().redo()
  }

  const handleExport = () => {
    const cleanSpec = buildCleanSpec(spec)
    const yamlStr = stringify(cleanSpec)
    const blob = new Blob([yamlStr], { type: "text/yaml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${spec.id || "agent"}.agent.yaml`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight">
          <span className="text-primary">grain</span> builder
        </h1>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onOpenCommand} title="Command palette (Cmd+K)">
          <Command className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleUndo} title="Undo (Cmd+Z)">
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleRedo} title="Redo (Cmd+Shift+Z)">
          <Redo2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleDark} title="Toggle dark mode">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Export
        </Button>
      </div>
    </header>
  )
}

function buildCleanSpec(spec: Partial<any>) {
  const clean: any = {}
  if (spec.specVersion) clean.specVersion = spec.specVersion
  if (spec.id) clean.id = spec.id
  if (spec.name) clean.name = spec.name
  if (spec.role) clean.role = spec.role
  if (spec.purpose) clean.purpose = spec.purpose
  if (spec.expertise?.length) clean.expertise = spec.expertise
  if (spec.personality && Object.keys(spec.personality).length) {
    clean.personality = { dimensions: spec.personality }
  }
  if (spec.language) clean.language = spec.language
  if (spec.rules?.length) {
    clean.rules = spec.rules.map((r: any) => ({
      name: r.name,
      priority: r.priority,
      when: r.when,
      then: r.then,
    }))
  }
  if (spec.boundaries?.length) {
    clean.boundaries = spec.boundaries.map((b: any) => ({
      type: b.type,
      description: b.description,
      enforcement: b.enforcement,
    }))
  }
  if (spec.tools?.length) {
    clean.tools = spec.tools.map((t: any) => ({
      name: t.name,
      description: t.description,
    }))
  }
  if (spec.skills?.length) {
    clean.skills = spec.skills.map((s: any) => ({
      name: s.name,
      description: s.description,
      steps: s.steps,
    }))
  }
  if (spec.cognition) clean.cognition = spec.cognition
  if (spec.channels?.length) {
    clean.channels = spec.channels.map((c: any) => ({
      channel: c.channel,
      overrides: c.overrides,
    }))
  }
  return clean
}
