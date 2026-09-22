import { create } from "zustand"
import { temporal } from "zundo"
import { generateId } from "./utils"
import { PERSONALITY_PRESETS, PERSONALITY_DIMENSIONS } from "./presets"
import type { AgentSpec, Section, SectionType, Rule, Boundary, Tool, Skill, ChannelOverride } from "./types"

interface BuilderState {
  sections: Section[]
  spec: Partial<AgentSpec>

  addSection: (type: SectionType) => void
  removeSection: (id: string) => void
  reorderSections: (activeId: string, overId: string) => void
  toggleCollapse: (id: string) => void

  updateIdentity: (field: string, value: any) => void
  updatePersonality: (key: string, value: number) => void
  applyPreset: (name: string) => void
  updateLanguage: (field: string, value: string) => void
  updateCognition: (field: string, value: any) => void

  addRule: () => void
  updateRule: (id: string, updates: Partial<Rule>) => void
  removeRule: (id: string) => void
  reorderRules: (activeId: string, overId: string) => void

  addBoundary: () => void
  updateBoundary: (id: string, updates: Partial<Boundary>) => void
  removeBoundary: (id: string) => void

  addTool: () => void
  updateTool: (id: string, updates: Partial<Tool>) => void
  removeTool: (id: string) => void

  addSkill: () => void
  updateSkill: (id: string, updates: Partial<Skill>) => void
  removeSkill: (id: string) => void

  addChannel: () => void
  updateChannel: (id: string, updates: Partial<ChannelOverride>) => void
  removeChannel: (id: string) => void

  reset: () => void
}

const defaultPersonality = Object.fromEntries(
  PERSONALITY_DIMENSIONS.map((d) => [d.key, 0.5])
)

const initialSpec: Partial<AgentSpec> = {
  specVersion: "1.0",
  id: "",
  name: "",
  role: "",
  purpose: "",
  expertise: [],
  personality: defaultPersonality,
  language: {
    sentenceStyle: "balanced",
    jargonLevel: "moderate",
    emojiUse: "none",
    structure: "paragraphs",
  },
  rules: [],
  boundaries: [],
  tools: [],
  skills: [],
  cognition: {
    reasoningStyle: "analytical",
    autonomy: 0.5,
    uncertainty: "acknowledge",
  },
  channels: [],
}

export const useBuilderStore = create<BuilderState>()(
  temporal(
    (set) => ({
      sections: [],
      spec: { ...initialSpec },

      addSection: (type) =>
        set((state) => {
          if (state.sections.find((s) => s.type === type)) return state
          return {
            sections: [...state.sections, { id: generateId(), type, collapsed: false }],
          }
        }),

      removeSection: (id) =>
        set((state) => ({
          sections: state.sections.filter((s) => s.id !== id),
        })),

      reorderSections: (activeId, overId) =>
        set((state) => {
          const oldIndex = state.sections.findIndex((s) => s.id === activeId)
          const newIndex = state.sections.findIndex((s) => s.id === overId)
          if (oldIndex === -1 || newIndex === -1) return state
          const items = [...state.sections]
          const [moved] = items.splice(oldIndex, 1)
          items.splice(newIndex, 0, moved)
          return { sections: items }
        }),

      toggleCollapse: (id) =>
        set((state) => ({
          sections: state.sections.map((s) =>
            s.id === id ? { ...s, collapsed: !s.collapsed } : s
          ),
        })),

      updateIdentity: (field, value) =>
        set((state) => ({
          spec: { ...state.spec, [field]: value },
        })),

      updatePersonality: (key, value) =>
        set((state) => ({
          spec: {
            ...state.spec,
            personality: { ...state.spec.personality, [key]: value },
          },
        })),

      applyPreset: (name) =>
        set((state) => {
          const preset = PERSONALITY_PRESETS[name]
          if (!preset) return state
          return {
            spec: { ...state.spec, personality: { ...preset } },
          }
        }),

      updateLanguage: (field, value) =>
        set((state) => ({
          spec: {
            ...state.spec,
            language: { ...state.spec.language!, [field]: value },
          },
        })),

      updateCognition: (field, value) =>
        set((state) => ({
          spec: {
            ...state.spec,
            cognition: { ...state.spec.cognition!, [field]: value },
          },
        })),

      addRule: () =>
        set((state) => ({
          spec: {
            ...state.spec,
            rules: [
              ...(state.spec.rules || []),
              { id: generateId(), name: "", priority: 10, when: "", then: "" },
            ],
          },
        })),

      updateRule: (id, updates) =>
        set((state) => ({
          spec: {
            ...state.spec,
            rules: (state.spec.rules || []).map((r) =>
              r.id === id ? { ...r, ...updates } : r
            ),
          },
        })),

      removeRule: (id) =>
        set((state) => ({
          spec: {
            ...state.spec,
            rules: (state.spec.rules || []).filter((r) => r.id !== id),
          },
        })),

      reorderRules: (activeId, overId) =>
        set((state) => {
          const rules = [...(state.spec.rules || [])]
          const oldIndex = rules.findIndex((r) => r.id === activeId)
          const newIndex = rules.findIndex((r) => r.id === overId)
          if (oldIndex === -1 || newIndex === -1) return state
          const [moved] = rules.splice(oldIndex, 1)
          rules.splice(newIndex, 0, moved)
          return { spec: { ...state.spec, rules } }
        }),

      addBoundary: () =>
        set((state) => ({
          spec: {
            ...state.spec,
            boundaries: [
              ...(state.spec.boundaries || []),
              { id: generateId(), type: "hard", description: "", enforcement: "" },
            ],
          },
        })),

      updateBoundary: (id, updates) =>
        set((state) => ({
          spec: {
            ...state.spec,
            boundaries: (state.spec.boundaries || []).map((b) =>
              b.id === id ? { ...b, ...updates } : b
            ),
          },
        })),

      removeBoundary: (id) =>
        set((state) => ({
          spec: {
            ...state.spec,
            boundaries: (state.spec.boundaries || []).filter((b) => b.id !== id),
          },
        })),

      addTool: () =>
        set((state) => ({
          spec: {
            ...state.spec,
            tools: [
              ...(state.spec.tools || []),
              { id: generateId(), name: "", description: "", parameters: "" },
            ],
          },
        })),

      updateTool: (id, updates) =>
        set((state) => ({
          spec: {
            ...state.spec,
            tools: (state.spec.tools || []).map((t) =>
              t.id === id ? { ...t, ...updates } : t
            ),
          },
        })),

      removeTool: (id) =>
        set((state) => ({
          spec: {
            ...state.spec,
            tools: (state.spec.tools || []).filter((t) => t.id !== id),
          },
        })),

      addSkill: () =>
        set((state) => ({
          spec: {
            ...state.spec,
            skills: [
              ...(state.spec.skills || []),
              { id: generateId(), name: "", description: "", steps: [""] },
            ],
          },
        })),

      updateSkill: (id, updates) =>
        set((state) => ({
          spec: {
            ...state.spec,
            skills: (state.spec.skills || []).map((s) =>
              s.id === id ? { ...s, ...updates } : s
            ),
          },
        })),

      removeSkill: (id) =>
        set((state) => ({
          spec: {
            ...state.spec,
            skills: (state.spec.skills || []).filter((s) => s.id !== id),
          },
        })),

      addChannel: () =>
        set((state) => ({
          spec: {
            ...state.spec,
            channels: [
              ...(state.spec.channels || []),
              { id: generateId(), channel: "", overrides: {} },
            ],
          },
        })),

      updateChannel: (id, updates) =>
        set((state) => ({
          spec: {
            ...state.spec,
            channels: (state.spec.channels || []).map((c) =>
              c.id === id ? { ...c, ...updates } : c
            ),
          },
        })),

      removeChannel: (id) =>
        set((state) => ({
          spec: {
            ...state.spec,
            channels: (state.spec.channels || []).filter((c) => c.id !== id),
          },
        })),

      reset: () =>
        set({
          sections: [],
          spec: { ...initialSpec },
        }),
    }),
    { limit: 50 }
  )
)
