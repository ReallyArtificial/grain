"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { useBuilderStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import type { Tool } from "@/lib/types"

export function ToolsSection() {
  const tools = useBuilderStore((s) => s.spec.tools) || []
  const { addTool } = useBuilderStore()

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {tools.map((tool) => (
          <ToolItem key={tool.id} tool={tool} />
        ))}
      </AnimatePresence>

      <Button variant="outline" size="sm" onClick={addTool} className="w-full border-dashed">
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Add Tool
      </Button>
    </div>
  )
}

function ToolItem({ tool }: { tool: Tool }) {
  const [expanded, setExpanded] = useState(!tool.name)
  const { updateTool, removeTool } = useBuilderStore()

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
          <span className="text-xs font-medium">{tool.name || "New tool"}</span>
        </button>
        <button onClick={() => removeTool(tool.id)} className="text-muted-foreground hover:text-destructive">
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
              <Input
                placeholder="Tool name (e.g., web_search)"
                value={tool.name}
                onChange={(e) => updateTool(tool.id, { name: e.target.value })}
                className="text-xs h-7"
              />
              <Textarea
                placeholder="What does this tool do?"
                value={tool.description}
                onChange={(e) => updateTool(tool.id, { description: e.target.value })}
                rows={2}
                className="text-xs"
              />
              <Textarea
                placeholder="Parameters (optional, JSON schema or description)"
                value={tool.parameters || ""}
                onChange={(e) => updateTool(tool.id, { parameters: e.target.value })}
                rows={2}
                className="text-xs font-mono"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
