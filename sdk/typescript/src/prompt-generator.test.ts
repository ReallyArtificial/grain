import { describe, it, expect } from "vitest"
import { generateSystemPrompt } from "./prompt-generator.js"
import { loadAgentSpec } from "./load.js"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const examplesDir = join(__dirname, "..", "..", "..", "examples")

const customerSpec = loadAgentSpec(join(examplesDir, "customer-support.agent.yaml"))

describe("generateSystemPrompt", () => {
  it("default prompt contains identity section with agent name", () => {
    const prompt = generateSystemPrompt(customerSpec)
    expect(prompt).toContain("You are Alex")
    expect(prompt).toContain("Senior Support Specialist")
  })

  it("contains purpose statement", () => {
    const prompt = generateSystemPrompt(customerSpec)
    expect(prompt).toContain("Resolve customer issues quickly")
  })

  it("lists deep expertise areas (proficiency > 0.7)", () => {
    const prompt = generateSystemPrompt(customerSpec)
    expect(prompt).toContain("Acme Platform")
    expect(prompt).toContain("Technical Troubleshooting")
  })

  it("slack channel override applies emoji and bullet overrides", () => {
    const defaultPrompt = generateSystemPrompt(customerSpec)
    const slackPrompt = generateSystemPrompt(customerSpec, "slack")
    // Default doesn't have "frequently" emoji
    expect(defaultPrompt).not.toContain("Use emoji to add personality")
    // Slack overrides emojiUsage to "frequently"
    expect(slackPrompt).toContain("Use emoji to add personality")
    // Slack overrides structure to "bullets"
    expect(slackPrompt).toContain("bullet points and lists")
  })

  it("email channel override changes to formal tone", () => {
    const emailPrompt = generateSystemPrompt(customerSpec, "email")
    // Email overrides formality to 0.8 → level 5 band [0.8, 1.0]
    expect(emailPrompt).toContain("highly formal")
    // Email has emojiUsage: never
    expect(emailPrompt).toContain("Never use emoji")
  })

  it("high warmth (0.8) produces empathetic directive", () => {
    const prompt = generateSystemPrompt(customerSpec)
    // warmth: 0.8 falls in [0.8, 1.0] → level 5 "Lead with empathy"
    expect(prompt).toContain("empathy")
  })

  it("uses graduated 5-level directives for personality", () => {
    const prompt = generateSystemPrompt(customerSpec)
    // formality: 0.5 → [0.4, 0.6) band → "balanced tone"
    expect(prompt).toContain("balanced tone")
    // concreteness: 0.9 → [0.8, 1.0] band → "hyper-concrete"
    expect(prompt).toContain("hyper-concrete")
    // confidence: 0.7 → [0.6, 0.8) band → "decisive"
    expect(prompt).toContain("decisive")
  })

  it("different personality values land in different bands", () => {
    const codingSpec = loadAgentSpec(join(examplesDir, "coding-assistant.agent.yaml"))
    const prompt = generateSystemPrompt(codingSpec)
    // coding-assistant has humor: 0.3 → [0.2, 0.4) band → "mostly serious"
    expect(prompt).toContain("mostly serious")
  })

  it("behavior rules sorted by priority (highest first)", () => {
    const prompt = generateSystemPrompt(customerSpec)
    // low-confidence-escalate (priority 20) should appear before frustrated-user (10)
    const escalateIdx = prompt.indexOf("confidence is below")
    const frustratedIdx = prompt.indexOf("user seems frustrated")
    expect(escalateIdx).toBeLessThan(frustratedIdx)
  })

  it("hard boundaries appear as NEVER: lines", () => {
    const prompt = generateSystemPrompt(customerSpec)
    expect(prompt).toContain("NEVER:")
    expect(prompt).toContain("Never share internal system details")
  })

  it("contains cognition section", () => {
    const prompt = generateSystemPrompt(customerSpec)
    expect(prompt).toContain("Thinking Approach")
    expect(prompt).toContain("confidence level")
  })

  it("creative writer gets appropriate directives", () => {
    const creativeSpec = loadAgentSpec(join(examplesDir, "creative-writer.agent.yaml"))
    const prompt = generateSystemPrompt(creativeSpec)
    // formality 0.2 → [0.2, 0.4) band → "conversational and approachable"
    expect(prompt).toContain("conversational and approachable")
    // warmth 0.8 → [0.8, 1.0] band → "Lead with empathy"
    expect(prompt).toContain("empathy")
    // usesAnalogies: true
    expect(prompt).toContain("analogies")
  })

  it("verbosity levels are granular", () => {
    // customer-support verbosity: 0.4 → [0.4, 0.6) → "moderate level of detail"
    const prompt = generateSystemPrompt(customerSpec)
    expect(prompt).toContain("moderate level of detail")
  })
})
