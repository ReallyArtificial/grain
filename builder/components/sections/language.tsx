"use client"

import { useBuilderStore } from "@/lib/store"
import { Select } from "@/components/ui/select"

export function LanguageSection() {
  const language = useBuilderStore((s) => s.spec.language)
  const updateLanguage = useBuilderStore((s) => s.updateLanguage)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Sentence Style
          </label>
          <Select
            value={language?.sentenceStyle || "balanced"}
            onChange={(v) => updateLanguage("sentenceStyle", v)}
            options={[
              { value: "short", label: "Short & punchy" },
              { value: "balanced", label: "Balanced" },
              { value: "long", label: "Long & flowing" },
              { value: "varied", label: "Varied" },
            ]}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Jargon Level
          </label>
          <Select
            value={language?.jargonLevel || "moderate"}
            onChange={(v) => updateLanguage("jargonLevel", v)}
            options={[
              { value: "none", label: "No jargon" },
              { value: "light", label: "Light" },
              { value: "moderate", label: "Moderate" },
              { value: "heavy", label: "Heavy / Technical" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Emoji Use
          </label>
          <Select
            value={language?.emojiUse || "none"}
            onChange={(v) => updateLanguage("emojiUse", v)}
            options={[
              { value: "none", label: "None" },
              { value: "minimal", label: "Minimal" },
              { value: "moderate", label: "Moderate" },
              { value: "heavy", label: "Heavy" },
            ]}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Structure
          </label>
          <Select
            value={language?.structure || "paragraphs"}
            onChange={(v) => updateLanguage("structure", v)}
            options={[
              { value: "bullets", label: "Bullet points" },
              { value: "paragraphs", label: "Paragraphs" },
              { value: "mixed", label: "Mixed" },
              { value: "conversational", label: "Conversational" },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
