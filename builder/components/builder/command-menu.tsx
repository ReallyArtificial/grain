"use client"

import { useEffect } from "react"
import { Command } from "cmdk"
import { useBuilderStore } from "@/lib/store"
import { SECTION_META, ALL_SECTION_TYPES } from "@/lib/types"
import { PERSONALITY_PRESETS } from "@/lib/presets"
import { stringify } from "yaml"

interface CommandMenuProps {
  open: boolean
  onClose: () => void
}

export function CommandMenu({ open, onClose }: CommandMenuProps) {
  const { addSection, sections, applyPreset, reset, spec } = useBuilderStore()

  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [open, onClose])

  if (!open) return null

  const addedTypes = new Set(sections.map((s) => s.type))

  const handleExportYaml = () => {
    const yamlStr = stringify(spec)
    navigator.clipboard.writeText(yamlStr)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[101]">
        <Command
          className="bg-popover border border-border rounded-xl shadow-2xl overflow-hidden"
          loop
        >
          <Command.Input
            autoFocus
            placeholder="Type a command..."
            className="w-full h-12 px-4 text-sm bg-transparent border-b border-border outline-none placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Add Section" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              {ALL_SECTION_TYPES.filter((t) => !addedTypes.has(t)).map((type) => (
                <Command.Item
                  key={`add-${type}`}
                  value={`add ${SECTION_META[type].label}`}
                  onSelect={() => {
                    addSection(type)
                    onClose()
                  }}
                  className="px-2 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent flex items-center gap-2"
                >
                  <span className="text-muted-foreground">+</span>
                  Add {SECTION_META[type].label}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Presets" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              {Object.keys(PERSONALITY_PRESETS).map((name) => (
                <Command.Item
                  key={`preset-${name}`}
                  value={`preset ${name}`}
                  onSelect={() => {
                    applyPreset(name)
                    onClose()
                  }}
                  className="px-2 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent"
                >
                  Apply {name} preset
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              <Command.Item
                value="export yaml copy"
                onSelect={handleExportYaml}
                className="px-2 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent"
              >
                Copy YAML to clipboard
              </Command.Item>
              <Command.Item
                value="reset clear"
                onSelect={() => {
                  reset()
                  onClose()
                }}
                className="px-2 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent text-destructive"
              >
                Reset all
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Navigate" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              {sections.map((section) => (
                <Command.Item
                  key={`nav-${section.id}`}
                  value={`go to ${SECTION_META[section.type].label}`}
                  onSelect={() => {
                    document.getElementById(`section-${section.id}`)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                    onClose()
                  }}
                  className="px-2 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent"
                >
                  Go to {SECTION_META[section.type].label}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
