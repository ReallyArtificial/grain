"use client"

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { AnimatePresence } from "framer-motion"
import { useBuilderStore } from "@/lib/store"
import { SectionCard } from "./section-card"
import { AddSection } from "./add-section"
import { IdentitySection } from "@/components/sections/identity"
import { PersonalitySection } from "@/components/sections/personality"
import { LanguageSection } from "@/components/sections/language"
import { RulesSection } from "@/components/sections/rules"
import { BoundariesSection } from "@/components/sections/boundaries"
import { ToolsSection } from "@/components/sections/tools"
import { SkillsSection } from "@/components/sections/skills"
import { CognitionSection } from "@/components/sections/cognition"
import { ChannelsSection } from "@/components/sections/channels"
import type { Section } from "@/lib/types"

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  identity: IdentitySection,
  personality: PersonalitySection,
  language: LanguageSection,
  rules: RulesSection,
  boundaries: BoundariesSection,
  tools: ToolsSection,
  skills: SkillsSection,
  cognition: CognitionSection,
  channels: ChannelsSection,
}

export function Canvas() {
  const { sections, reorderSections } = useBuilderStore()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorderSections(active.id as string, over.id as string)
    }
  }

  if (sections.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="max-w-2xl mx-auto space-y-4">
            <AnimatePresence mode="popLayout">
              {sections.map((section) => {
                const Component = SECTION_COMPONENTS[section.type]
                return (
                  <SectionCard key={section.id} section={section}>
                    <Component />
                  </SectionCard>
                )
              })}
            </AnimatePresence>

            <div className="pt-2">
              <AddSection inline />
            </div>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">🌾</div>
        <h2 className="text-xl font-semibold mb-2">Start building your agent</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Add sections to define personality, rules, boundaries, and capabilities.
        </p>
        <AddSection />
        <p className="text-xs text-muted-foreground mt-4">
          or press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">/</kbd> to quick-add
        </p>
      </div>
    </div>
  )
}
