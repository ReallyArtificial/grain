"use client"

import { useBuilderStore } from "@/lib/store"
import { SECTION_META } from "@/lib/types"
import { cn } from "@/lib/utils"

export function SectionNav() {
  const sections = useBuilderStore((s) => s.sections)

  if (sections.length === 0) return null

  return (
    <nav className="w-48 border-r border-border py-4 px-3 hidden lg:block">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">
        Sections
      </p>
      <ul className="space-y-1">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              onClick={() => {
                document.getElementById(`section-${section.id}`)?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded text-sm transition-colors",
                "hover:bg-accent text-foreground"
              )}
            >
              {SECTION_META[section.type].label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
