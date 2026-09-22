export type SectionType =
  | "identity"
  | "personality"
  | "language"
  | "rules"
  | "boundaries"
  | "tools"
  | "skills"
  | "cognition"
  | "channels"

export interface Section {
  id: string
  type: SectionType
  collapsed: boolean
}

export interface PersonalityDimension {
  key: string
  label: string
  lowLabel: string
  highLabel: string
  value: number
}

export interface Rule {
  id: string
  name: string
  priority: number
  when: string
  then: string
}

export interface Boundary {
  id: string
  type: "hard" | "soft"
  description: string
  enforcement?: string
}

export interface Tool {
  id: string
  name: string
  description: string
  parameters?: string
}

export interface Skill {
  id: string
  name: string
  description: string
  steps: string[]
}

export interface ChannelOverride {
  id: string
  channel: string
  overrides: Record<string, any>
}

export interface AgentSpec {
  specVersion: string
  id: string
  name: string
  role: string
  purpose: string
  expertise: string[]
  personality: Record<string, number>
  language: {
    sentenceStyle: string
    jargonLevel: string
    emojiUse: string
    structure: string
  }
  rules: Rule[]
  boundaries: Boundary[]
  tools: Tool[]
  skills: Skill[]
  cognition: {
    reasoningStyle: string
    autonomy: number
    uncertainty: string
  }
  channels: ChannelOverride[]
}

export const SECTION_META: Record<SectionType, { label: string; description: string }> = {
  identity: { label: "Identity", description: "Name, role, purpose, expertise" },
  personality: { label: "Personality", description: "8-dimension sliders with presets" },
  language: { label: "Language", description: "Sentence style, jargon, emoji, structure" },
  rules: { label: "Rules", description: "Behavioral conditions and actions" },
  boundaries: { label: "Boundaries", description: "Hard/soft limits, enforcement" },
  tools: { label: "Tools", description: "Capabilities the agent can use" },
  skills: { label: "Skills", description: "Multi-step workflows" },
  cognition: { label: "Cognition", description: "Reasoning style, autonomy, uncertainty" },
  channels: { label: "Channel Overrides", description: "Per-channel personality tweaks" },
}

export const ALL_SECTION_TYPES: SectionType[] = [
  "identity",
  "personality",
  "language",
  "rules",
  "boundaries",
  "tools",
  "skills",
  "cognition",
  "channels",
]
