"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, User, Sliders, MessageSquare, Shield, Wrench, Zap, Brain, Radio, BookOpen } from "lucide-react"
import { useBuilderStore } from "@/lib/store"
import { SECTION_META, ALL_SECTION_TYPES } from "@/lib/types"
import type { SectionType } from "@/lib/types"
import { Button } from "@/components/ui/button"

const SECTION_ICONS: Record<SectionType, any> = {
  identity: User,
  personality: Sliders,
  language: MessageSquare,
  rules: BookOpen,
  boundaries: Shield,
  tools: Wrench,
  skills: Zap,
  cognition: Brain,
  channels: Radio,
}

export function AddSection({ inline }: { inline?: boolean }) {
  const [open, setOpen] = useState(false)
  const { addSection, sections } = useBuilderStore()

  const addedTypes = new Set(sections.map((s) => s.type))

  return (
    <div className="relative">
      <Button
        variant={inline ? "outline" : "secondary"}
        onClick={() => setOpen(!open)}
        className={inline ? "w-full border-dashed" : ""}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Section
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 bottom-full mb-2 z-50 bg-popover border border-border rounded-lg shadow-xl p-2 min-w-[280px] max-h-[min(400px,60vh)] overflow-y-auto"
            >
              <p className="text-xs font-medium text-muted-foreground px-2 py-1 uppercase tracking-wider">
                Add a section
              </p>
              <div className="mt-1 space-y-0.5">
                {ALL_SECTION_TYPES.map((type) => {
                  const Icon = SECTION_ICONS[type]
                  const meta = SECTION_META[type]
                  const added = addedTypes.has(type)
                  return (
                    <button
                      key={type}
                      disabled={added}
                      onClick={() => {
                        addSection(type)
                        setOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-left hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{meta.label}</p>
                        <p className="text-xs text-muted-foreground">{meta.description}</p>
                      </div>
                      {added && (
                        <span className="ml-auto text-[10px] text-muted-foreground">Added</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
