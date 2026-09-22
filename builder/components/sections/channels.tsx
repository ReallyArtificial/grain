"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { useBuilderStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import type { ChannelOverride } from "@/lib/types"

export function ChannelsSection() {
  const channels = useBuilderStore((s) => s.spec.channels) || []
  const { addChannel } = useBuilderStore()

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Define per-channel overrides for personality, language, or behavior.
      </p>

      <AnimatePresence mode="popLayout">
        {channels.map((channel) => (
          <ChannelItem key={channel.id} channel={channel} />
        ))}
      </AnimatePresence>

      <Button variant="outline" size="sm" onClick={addChannel} className="w-full border-dashed">
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Add Channel
      </Button>
    </div>
  )
}

function ChannelItem({ channel }: { channel: ChannelOverride }) {
  const [expanded, setExpanded] = useState(!channel.channel)
  const { updateChannel, removeChannel } = useBuilderStore()

  const overridesStr = JSON.stringify(channel.overrides || {}, null, 2)

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
          <span className="text-xs font-medium">{channel.channel || "New channel"}</span>
        </button>
        <button onClick={() => removeChannel(channel.id)} className="text-muted-foreground hover:text-destructive">
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
                placeholder="Channel name (e.g., slack, email, sms)"
                value={channel.channel}
                onChange={(e) => updateChannel(channel.id, { channel: e.target.value })}
                className="text-xs h-7"
              />
              <Textarea
                placeholder='Overrides (JSON, e.g., {"personality": {"formality": 0.2}})'
                value={overridesStr === "{}" ? "" : overridesStr}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value || "{}")
                    updateChannel(channel.id, { overrides: parsed })
                  } catch {
                    // ignore invalid JSON while typing
                  }
                }}
                rows={4}
                className="text-xs font-mono"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
