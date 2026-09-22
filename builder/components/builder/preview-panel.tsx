"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useBuilderStore } from "@/lib/store"
import { buildSpec } from "@/lib/api"
import { stringify } from "yaml"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

type PreviewTab = "yaml" | "prompt" | "typescript" | "python"

export function PreviewPanel() {
  const spec = useBuilderStore((s) => s.spec)
  const sections = useBuilderStore((s) => s.sections)
  const [tab, setTab] = useState<PreviewTab>("yaml")
  const [apiResult, setApiResult] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>(null)

  const fetchPreview = useCallback(async () => {
    if (sections.length === 0) return
    try {
      const result = await buildSpec(spec)
      setApiResult(result)
    } catch {
      // Silently fail - preview is non-critical
    }
  }, [spec, sections.length])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchPreview, 500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [fetchPreview])

  const getContent = (): string => {
    switch (tab) {
      case "yaml":
        return stringify(buildCleanSpec(spec))
      case "prompt":
        return apiResult?.systemPrompt || "// System prompt will appear after adding sections"
      case "typescript":
        return apiResult?.typescript || "// TypeScript output will appear after adding sections"
      case "python":
        return apiResult?.python || "# Python output will appear after adding sections"
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(getContent())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs: { id: PreviewTab; label: string }[] = [
    { id: "yaml", label: "YAML" },
    { id: "prompt", label: "Prompt" },
    { id: "typescript", label: "TS" },
    { id: "python", label: "Python" },
  ]

  return (
    <aside className="w-80 border-l border-border flex flex-col hidden xl:flex">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <pre className="text-xs font-mono whitespace-pre-wrap text-foreground leading-relaxed">
          {getContent()}
        </pre>
      </div>
    </aside>
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
  if (spec.personality && Object.values(spec.personality).some((v: any) => v !== 0.5)) {
    clean.personality = { dimensions: spec.personality }
  }
  if (spec.language) clean.language = spec.language
  if (spec.rules?.length) {
    clean.rules = spec.rules.map((r: any) => ({
      name: r.name || undefined,
      priority: r.priority,
      when: r.when || undefined,
      then: r.then || undefined,
    }))
  }
  if (spec.boundaries?.length) {
    clean.boundaries = spec.boundaries.map((b: any) => ({
      type: b.type,
      description: b.description || undefined,
      enforcement: b.enforcement || undefined,
    }))
  }
  if (spec.tools?.length) {
    clean.tools = spec.tools.map((t: any) => ({
      name: t.name || undefined,
      description: t.description || undefined,
    }))
  }
  if (spec.skills?.length) {
    clean.skills = spec.skills.map((s: any) => ({
      name: s.name || undefined,
      description: s.description || undefined,
      steps: s.steps?.filter((st: string) => st) || undefined,
    }))
  }
  if (spec.cognition && spec.cognition.reasoningStyle !== "analytical") {
    clean.cognition = spec.cognition
  }
  if (spec.channels?.length) {
    clean.channels = spec.channels.map((c: any) => ({
      channel: c.channel || undefined,
      overrides: c.overrides,
    }))
  }
  return clean
}
