import type { AgentSpec, PersonalityVector, LanguageStyle, RuleCondition, RuleAction } from "./types.js"

/**
 * Generates a system prompt from structured AgentSpec data.
 * Implements the canonical algorithm from SPECIFICATION.md.
 *
 * Uses 5-level graduated semantic anchoring for personality dimensions,
 * inspired by SAC (Specific Attribute Control) research.
 */
export function generateSystemPrompt(spec: AgentSpec, channel?: string): string {
  const sections: string[] = []

  sections.push(generateIdentitySection(spec))
  sections.push(generateVoiceSection(spec, channel))
  sections.push(generateCognitionSection(spec))
  sections.push(generateBehaviorSection(spec))
  sections.push(generateBoundariesSection(spec))

  return sections.filter(Boolean).join("\n\n")
}

function generateIdentitySection(spec: AgentSpec): string {
  const { identity } = spec
  const lines: string[] = []

  lines.push(`You are ${identity.name}, a ${identity.role}.`)
  lines.push(`Your primary purpose: ${identity.purpose.primary}`)

  if (identity.purpose.secondary?.length) {
    lines.push(`Secondary objectives: ${identity.purpose.secondary.join("; ")}`)
  }

  if (identity.expertise.length) {
    const expertAreas = identity.expertise
      .filter(e => e.proficiency > 0.7)
      .map(e => e.domain)
    if (expertAreas.length) {
      lines.push(`You have deep expertise in: ${expertAreas.join(", ")}.`)
    }
  }

  return lines.join("\n")
}

function generateVoiceSection(spec: AgentSpec, channel?: string): string {
  let personality = { ...spec.voice.personality }
  let language = { ...spec.voice.language }

  if (channel && spec.voice.channelOverrides?.[channel]) {
    const override = spec.voice.channelOverrides[channel]
    personality = { ...personality, ...override }
    language = { ...language, ...override }
  }

  const lines: string[] = ["## Communication Style"]
  lines.push(...personalityToDirectives(personality as PersonalityVector))
  lines.push(...languageToDirectives(language as LanguageStyle))

  return lines.join("\n")
}

// ============================================================================
// 5-LEVEL GRADUATED SEMANTIC ANCHORING
//
// Each personality dimension maps to 5 intensity bands with specific
// behavioral anchors. Inspired by SAC framework (arxiv:2506.20993) which
// decomposes traits into Frequency, Depth, Threshold, Effort, Willingness.
//
// Bands: [0, 0.2) → level 1 | [0.2, 0.4) → level 2 | [0.4, 0.6) → level 3
//        [0.6, 0.8) → level 4 | [0.8, 1.0] → level 5
// ============================================================================

interface DirectiveLevel {
  max: number // upper bound (exclusive, except last which is inclusive)
  directive: string
}

const PERSONALITY_DIRECTIVES: Record<keyof PersonalityVector, DirectiveLevel[]> = {
  formality: [
    { max: 0.2, directive: "- Be very casual. Use slang, contractions, and an informal register freely." },
    { max: 0.4, directive: "- Be conversational and approachable. Minimal formalities, relaxed tone." },
    { max: 0.6, directive: "- Use a balanced tone — professional but approachable." },
    { max: 0.8, directive: "- Be professional and polished. Use measured, clear language." },
    { max: 1.01, directive: "- Maintain a highly formal, precise tone. Use institutional register and proper structure." },
  ],
  warmth: [
    { max: 0.2, directive: "- Be direct and clinical. Focus purely on facts and outcomes, not feelings." },
    { max: 0.4, directive: "- Be polite but task-focused. Acknowledge emotions only when they directly affect the task." },
    { max: 0.6, directive: "- Be friendly. Show basic courtesy and acknowledge the human behind the request." },
    { max: 0.8, directive: "- Be warm and empathetic. Acknowledge feelings and show genuine care before addressing problems." },
    { max: 1.01, directive: "- Lead with empathy. Mirror the user's emotional state, use inclusive language ('let's', 'we can'), and validate feelings before solutions." },
  ],
  humor: [
    { max: 0.2, directive: "- Stay serious and focused. No jokes, wordplay, or playful language." },
    { max: 0.4, directive: "- Keep things mostly serious. Light tone is acceptable but avoid overt humor." },
    { max: 0.6, directive: "- A touch of wit is fine when it serves clarity, but don't force it." },
    { max: 0.8, directive: "- Use humor and wit naturally. Lighten the mood when appropriate." },
    { max: 1.01, directive: "- Be playful and witty throughout. Use wordplay, gentle teasing, and humor as a core communication tool." },
  ],
  assertiveness: [
    { max: 0.2, directive: "- Be passive and deferential. Always wait for explicit direction. Never presume." },
    { max: 0.4, directive: "- Be reactive. Offer options but let the user drive decisions." },
    { max: 0.6, directive: "- Balance initiative with deference. Suggest directions but ask before acting." },
    { max: 0.8, directive: "- Be proactive. Make clear recommendations and push conversations forward." },
    { max: 1.01, directive: "- Be highly assertive. Take initiative, make strong recommendations, and challenge weak reasoning when you see it." },
  ],
  verbosity: [
    { max: 0.2, directive: "- Be extremely terse. Single sentences when possible. No preamble, no filler." },
    { max: 0.4, directive: "- Keep responses brief and focused. Get to the point quickly." },
    { max: 0.6, directive: "- Use a moderate level of detail. Explain enough for clarity without over-elaborating." },
    { max: 0.8, directive: "- Provide detailed, thorough explanations. Include context and reasoning." },
    { max: 1.01, directive: "- Be comprehensive. Explore nuances, provide rich context, examples, and multiple angles on every point." },
  ],
  confidence: [
    { max: 0.2, directive: "- Hedge heavily. Use qualifiers ('perhaps', 'it might be', 'one possible'). Communicate uncertainty as the default." },
    { max: 0.4, directive: "- Show appropriate uncertainty. Qualify statements where evidence is incomplete." },
    { max: 0.6, directive: "- Be moderately confident. State things clearly but acknowledge limitations when relevant." },
    { max: 0.8, directive: "- Be decisive. State things clearly without excessive hedging." },
    { max: 1.01, directive: "- Be maximally decisive. Commit to positions. Eliminate hedging language entirely. Project authority." },
  ],
  concreteness: [
    { max: 0.2, directive: "- Stay abstract and conceptual. Focus on frameworks, principles, and high-level thinking." },
    { max: 0.4, directive: "- Lean toward concepts and theory. Use examples sparingly." },
    { max: 0.6, directive: "- Mix abstract concepts with concrete examples as appropriate." },
    { max: 0.8, directive: "- Use concrete examples, specific numbers, and actionable steps." },
    { max: 1.01, directive: "- Be hyper-concrete. Every point gets a specific example, exact number, or step-by-step action. No hand-waving." },
  ],
  urgency: [
    { max: 0.2, directive: "- Take time to be thorough. Prioritize completeness and quality over speed. Never rush." },
    { max: 0.4, directive: "- Be measured and deliberate. Thoroughness over haste." },
    { max: 0.6, directive: "- Balance thoroughness with efficiency. Cover what matters, skip what doesn't." },
    { max: 0.8, directive: "- Move quickly. Bias toward action and shipping over perfection." },
    { max: 1.01, directive: "- Maximum urgency. Get to the answer immediately. Skip context unless asked. Action over analysis." },
  ],
}

function personalityToDirectives(p: PersonalityVector): string[] {
  const directives: string[] = []
  for (const dim of Object.keys(PERSONALITY_DIRECTIVES) as (keyof PersonalityVector)[]) {
    const value = p[dim]
    const levels = PERSONALITY_DIRECTIVES[dim]
    for (const level of levels) {
      if (value < level.max || (level.max > 1 && value <= 1)) {
        directives.push(level.directive)
        break
      }
    }
  }
  return directives
}

function languageToDirectives(l: LanguageStyle): string[] {
  const directives: string[] = []

  if (l.sentenceLength === "short") directives.push("- Use short, punchy sentences.")
  else if (l.sentenceLength === "long") directives.push("- Use longer, more flowing sentences when explaining.")

  if (l.jargonLevel === "none") directives.push("- Avoid technical jargon. Explain in plain language.")
  else if (l.jargonLevel === "heavy") directives.push("- Use domain-specific terminology freely — your audience is technical.")

  if (l.emojiUsage === "frequently") directives.push("- Use emoji to add personality and visual breaks.")
  else if (l.emojiUsage === "never") directives.push("- Never use emoji.")

  if (l.structure === "bullets") directives.push("- Prefer bullet points and lists over dense paragraphs.")
  else if (l.structure === "prose") directives.push("- Write in flowing prose rather than bullet points.")

  if (l.usesAnalogies) directives.push("- Use analogies and metaphors to explain complex ideas.")

  return directives
}

function generateCognitionSection(spec: AgentSpec): string {
  const { cognition } = spec
  const lines: string[] = ["## Thinking Approach"]

  const { reasoningStyle, decisionMaking, uncertainty } = cognition

  if (reasoningStyle.showReasoning) {
    lines.push("- Show your reasoning process step by step.")
  }
  if (reasoningStyle.multiPerspective) {
    lines.push("- Consider multiple perspectives before concluding.")
  }
  if (reasoningStyle.analysisDepth === "deep" || reasoningStyle.analysisDepth === "exhaustive") {
    lines.push("- Analyze problems deeply before responding. Don't settle for surface-level answers.")
  }

  if (decisionMaking.autonomy === "fully-autonomous") {
    lines.push("- Make decisions autonomously. Only ask when truly blocked.")
  } else if (decisionMaking.autonomy === "always-ask") {
    lines.push("- Always confirm with the user before taking significant actions.")
  }

  if (uncertainty.communicateUncertainty) {
    lines.push("- Explicitly state your confidence level when uncertain.")
  }
  if (uncertainty.lowConfidenceAction === "ask") {
    lines.push(`- If your confidence drops below ${Math.round(uncertainty.confidenceFloor * 100)}%, ask for clarification rather than guessing.`)
  }

  return lines.join("\n")
}

function generateBehaviorSection(spec: AgentSpec): string {
  const { rules } = spec.behavior
  if (!rules.length) return ""

  const lines: string[] = ["## Behavioral Rules"]

  const sorted = [...rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

  for (const rule of sorted) {
    const condition = conditionToText(rule.condition)
    const action = actionToText(rule.action)
    lines.push(`- ${condition}: ${action}`)
  }

  return lines.join("\n")
}

function conditionToText(condition: RuleCondition): string {
  switch (condition.type) {
    case "always": return "Always"
    case "when-topic": return `When discussing ${condition.topics.join(" or ")}`
    case "when-sentiment": return `When the user seems ${condition.sentiment}`
    case "when-context": return `In the context of ${condition.context}`
    case "when-user-role": return `When the user is a ${condition.roles.join(" or ")}`
    case "when-capability-missing": return `When unable to ${condition.capability}`
    case "when-confidence-below": return `When confidence is below ${Math.round(condition.threshold * 100)}%`
    case "compound": {
      const parts = condition.conditions.map(conditionToText)
      return parts.join(condition.operator === "and" ? " AND " : " OR ")
    }
  }
}

function actionToText(action: RuleAction): string {
  switch (action.type) {
    case "respond-with-style": return "adjust communication style accordingly"
    case "use-tool": return `use the ${action.tool} tool`
    case "escalate": return `escalate to ${action.target} (${action.reason})`
    case "refuse": return `decline with: "${action.message}"`
    case "redirect": return `redirect to ${action.target}`
    case "adjust-depth": return `provide ${action.depth}-level analysis`
    case "require-confirmation": return "ask for confirmation before proceeding"
    case "log-event": return `log ${action.event}`
    case "custom": return `execute ${action.handler}`
  }
}

function generateBoundariesSection(spec: AgentSpec): string {
  const hard = spec.behavior.boundaries.filter(b => b.enforcement === "hard")
  if (!hard.length) return ""

  const lines: string[] = ["## Hard Boundaries (Never Violate)"]
  for (const boundary of hard) {
    lines.push(`- NEVER: ${boundary.description}`)
  }

  return lines.join("\n")
}
