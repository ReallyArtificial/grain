"use client"

import { useBuilderStore } from "@/lib/store"
import { PERSONALITY_DIMENSIONS, PERSONALITY_PRESETS } from "@/lib/presets"
import { getDirective } from "@/lib/directives"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

export function PersonalitySection() {
  const personality = useBuilderStore((s) => s.spec.personality) || {}
  const updatePersonality = useBuilderStore((s) => s.updatePersonality)
  const applyPreset = useBuilderStore((s) => s.applyPreset)

  return (
    <div className="space-y-5">
      {/* Presets row */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Presets</label>
        <div className="flex flex-wrap gap-2">
          {Object.keys(PERSONALITY_PRESETS).map((name) => (
            <Button
              key={name}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(name)}
              className="text-xs"
            >
              {name}
            </Button>
          ))}
        </div>
      </div>

      {/* Dimension sliders */}
      <div className="space-y-4">
        {PERSONALITY_DIMENSIONS.map((dim) => {
          const value = personality[dim.key] ?? 0.5
          const directive = getDirective(dim.key, value)
          return (
            <div key={dim.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{dim.label}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {value.toFixed(2)}
                </span>
              </div>
              <Slider
                value={value}
                onChange={(v) => updatePersonality(dim.key, v)}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">{dim.lowLabel}</span>
                <span className="text-[10px] text-muted-foreground">{dim.highLabel}</span>
              </div>
              <p className="text-xs text-muted-foreground italic mt-0.5">
                &ldquo;{directive}&rdquo;
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
