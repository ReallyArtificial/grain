"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { useBuilderStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { Boundary } from "@/lib/types"

export function BoundariesSection() {
  const boundaries = useBuilderStore((s) => s.spec.boundaries) || []
  const { addBoundary } = useBuilderStore()

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {boundaries.map((boundary) => (
          <BoundaryItem key={boundary.id} boundary={boundary} />
        ))}
      </AnimatePresence>

      <Button variant="outline" size="sm" onClick={addBoundary} className="w-full border-dashed">
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Add Boundary
      </Button>
    </div>
  )
}

function BoundaryItem({ boundary }: { boundary: Boundary }) {
  const [expanded, setExpanded] = useState(!boundary.description)
  const { updateBoundary, removeBoundary } = useBuilderStore()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="border border-border rounded-md"
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left flex items-center gap-2"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
            boundary.type === "hard" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          }`}>
            {boundary.type}
          </span>
          <span className="text-xs truncate">{boundary.description || "New boundary"}</span>
        </button>
        <button onClick={() => removeBoundary(boundary.id)} className="text-muted-foreground hover:text-destructive">
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
              <Select
                value={boundary.type}
                onChange={(v) => updateBoundary(boundary.id, { type: v as "hard" | "soft" })}
                options={[
                  { value: "hard", label: "Hard (never violate)" },
                  { value: "soft", label: "Soft (prefer to follow)" },
                ]}
              />
              <Textarea
                placeholder="Describe the boundary..."
                value={boundary.description}
                onChange={(e) => updateBoundary(boundary.id, { description: e.target.value })}
                rows={2}
                className="text-xs"
              />
              <Input
                placeholder="Enforcement (e.g., refuse, warn, redirect)"
                value={boundary.enforcement || ""}
                onChange={(e) => updateBoundary(boundary.id, { enforcement: e.target.value })}
                className="text-xs h-7"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
