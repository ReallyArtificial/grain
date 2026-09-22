"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { motion, AnimatePresence } from "framer-motion"
import { GripVertical, ChevronUp, ChevronDown, MoreHorizontal, Trash2, Copy, ArrowUp, ArrowDown } from "lucide-react"
import { useState } from "react"
import { useBuilderStore } from "@/lib/store"
import { SECTION_META } from "@/lib/types"
import type { Section } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SectionCardProps {
  section: Section
  children: React.ReactNode
}

export function SectionCard({ section, children }: SectionCardProps) {
  const { removeSection, toggleCollapse, addSection, reorderSections, sections } = useBuilderStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const currentIndex = sections.findIndex((s) => s.id === section.id)

  return (
    <motion.div
      id={`section-${section.id}`}
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "bg-card rounded-lg border border-border shadow-sm",
        isDragging && "shadow-lg scale-[1.02] z-50 opacity-90"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <h3 className="text-sm font-medium flex-1">{SECTION_META[section.type].label}</h3>

        <div className="flex items-center gap-1 relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => toggleCollapse(section.id)}
          >
            {section.collapsed ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </Button>

          {/* Dropdown menu */}
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-50 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[140px]">
                <button
                  className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent flex items-center gap-2"
                  onClick={() => {
                    addSection(section.type)
                    setMenuOpen(false)
                  }}
                >
                  <Copy className="w-3 h-3" /> Duplicate
                </button>
                {currentIndex > 0 && (
                  <button
                    className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent flex items-center gap-2"
                    onClick={() => {
                      reorderSections(section.id, sections[currentIndex - 1].id)
                      setMenuOpen(false)
                    }}
                  >
                    <ArrowUp className="w-3 h-3" /> Move up
                  </button>
                )}
                {currentIndex < sections.length - 1 && (
                  <button
                    className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent flex items-center gap-2"
                    onClick={() => {
                      reorderSections(section.id, sections[currentIndex + 1].id)
                      setMenuOpen(false)
                    }}
                  >
                    <ArrowDown className="w-3 h-3" /> Move down
                  </button>
                )}
                <hr className="my-1 border-border" />
                <button
                  className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent flex items-center gap-2 text-destructive"
                  onClick={() => {
                    removeSection(section.id)
                    setMenuOpen(false)
                  }}
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {!section.collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
