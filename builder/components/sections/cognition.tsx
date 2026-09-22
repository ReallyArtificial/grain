"use client"

import { useBuilderStore } from "@/lib/store"
import { Select } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

export function CognitionSection() {
  const cognition = useBuilderStore((s) => s.spec.cognition)
  const updateCognition = useBuilderStore((s) => s.updateCognition)

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Reasoning Style
        </label>
        <Select
          value={cognition?.reasoningStyle || "analytical"}
          onChange={(v) => updateCognition("reasoningStyle", v)}
          options={[
            { value: "analytical", label: "Analytical" },
            { value: "intuitive", label: "Intuitive" },
            { value: "systematic", label: "Systematic" },
            { value: "creative", label: "Creative" },
            { value: "pragmatic", label: "Pragmatic" },
          ]}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-muted-foreground">Autonomy</label>
          <span className="text-xs text-muted-foreground font-mono">
            {(cognition?.autonomy ?? 0.5).toFixed(2)}
          </span>
        </div>
        <Slider
          value={cognition?.autonomy ?? 0.5}
          onChange={(v) => updateCognition("autonomy", v)}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">Always ask</span>
          <span className="text-[10px] text-muted-foreground">Fully autonomous</span>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Uncertainty Handling
        </label>
        <Select
          value={cognition?.uncertainty || "acknowledge"}
          onChange={(v) => updateCognition("uncertainty", v)}
          options={[
            { value: "acknowledge", label: "Acknowledge openly" },
            { value: "hedge", label: "Hedge carefully" },
            { value: "ask", label: "Ask for clarification" },
            { value: "best-guess", label: "Best guess + disclaimer" },
            { value: "escalate", label: "Escalate to human" },
          ]}
        />
      </div>
    </div>
  )
}
