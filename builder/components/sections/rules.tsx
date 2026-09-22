"use client"

import { useState } from "react"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { motion, AnimatePresence } from "framer-motion"
import { GripVertical, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { useBuilderStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import type { Rule } from "@/lib/types"

export function RulesSection() {
  const rules = useBuilderStore((s) => s.spec.rules) || []
  const { addRule, reorderRules } = useBuilderStore()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorderRules(active.id as string, over.id as string)
    }
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={rules.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {rules.map((rule) => (
              <RuleItem key={rule.id} rule={rule} />
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>

      <Button variant="outline" size="sm" onClick={addRule} className="w-full border-dashed">
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Add Rule
      </Button>
    </div>
  )
}

function RuleItem({ rule }: { rule: Rule }) {
  const [expanded, setExpanded] = useState(!rule.name)
  const { updateRule, removeRule } = useBuilderStore()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rule.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`border border-border rounded-md ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground touch-none">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left flex items-center gap-2"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span className="text-xs font-medium">{rule.name || "Untitled rule"}</span>
        </button>
        <span className="text-[10px] text-muted-foreground">priority:{rule.priority}</span>
        <button onClick={() => removeRule(rule.id)} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
              <div className="grid grid-cols-[1fr_80px] gap-2">
                <Input
                  placeholder="Rule name"
                  value={rule.name}
                  onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                  className="text-xs h-7"
                />
                <Input
                  type="number"
                  placeholder="Priority"
                  value={rule.priority}
                  onChange={(e) => updateRule(rule.id, { priority: parseInt(e.target.value) || 0 })}
                  className="text-xs h-7"
                />
              </div>
              <Textarea
                placeholder="When... (condition)"
                value={rule.when}
                onChange={(e) => updateRule(rule.id, { when: e.target.value })}
                rows={2}
                className="text-xs"
              />
              <Textarea
                placeholder="Then... (action)"
                value={rule.then}
                onChange={(e) => updateRule(rule.id, { then: e.target.value })}
                rows={2}
                className="text-xs"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
