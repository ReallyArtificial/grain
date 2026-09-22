"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, ChevronDown, ChevronRight, X } from "lucide-react"
import { useBuilderStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import type { Skill } from "@/lib/types"

export function SkillsSection() {
  const skills = useBuilderStore((s) => s.spec.skills) || []
  const { addSkill } = useBuilderStore()

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {skills.map((skill) => (
          <SkillItem key={skill.id} skill={skill} />
        ))}
      </AnimatePresence>

      <Button variant="outline" size="sm" onClick={addSkill} className="w-full border-dashed">
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Add Skill
      </Button>
    </div>
  )
}

function SkillItem({ skill }: { skill: Skill }) {
  const [expanded, setExpanded] = useState(!skill.name)
  const { updateSkill, removeSkill } = useBuilderStore()

  const addStep = () => {
    updateSkill(skill.id, { steps: [...skill.steps, ""] })
  }

  const updateStep = (index: number, value: string) => {
    const steps = [...skill.steps]
    steps[index] = value
    updateSkill(skill.id, { steps })
  }

  const removeStep = (index: number) => {
    updateSkill(skill.id, { steps: skill.steps.filter((_, i) => i !== index) })
  }

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
          <span className="text-xs font-medium">{skill.name || "New skill"}</span>
        </button>
        <button onClick={() => removeSkill(skill.id)} className="text-muted-foreground hover:text-destructive">
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
                placeholder="Skill name (e.g., process-refund)"
                value={skill.name}
                onChange={(e) => updateSkill(skill.id, { name: e.target.value })}
                className="text-xs h-7"
              />
              <Textarea
                placeholder="What does this skill accomplish?"
                value={skill.description}
                onChange={(e) => updateSkill(skill.id, { description: e.target.value })}
                rows={2}
                className="text-xs"
              />

              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block uppercase tracking-wider">
                  Steps
                </label>
                <div className="space-y-1.5">
                  {skill.steps.map((step, i) => (
                    <div key={i} className="flex gap-1.5 items-center">
                      <span className="text-[10px] text-muted-foreground w-4">{i + 1}.</span>
                      <Input
                        placeholder={`Step ${i + 1}`}
                        value={step}
                        onChange={(e) => updateStep(i, e.target.value)}
                        className="text-xs h-7 flex-1"
                      />
                      {skill.steps.length > 1 && (
                        <button onClick={() => removeStep(i)} className="text-muted-foreground hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addStep}
                  className="mt-1.5 text-xs h-6"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add step
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
