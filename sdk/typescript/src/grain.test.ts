import { describe, it, expect } from "vitest"
import { Grain } from "./grain.js"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { readFileSync } from "node:fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const examplesDir = join(__dirname, "..", "..", "..", "examples")
const customerFile = join(examplesDir, "customer-support.agent.yaml")

describe("Grain construction", () => {
  it("Grain.create with just id", () => {
    const g = Grain.create("test-bot")
    expect(g.id).toBe("test-bot")
    expect(g.name).toBe("test-bot")
    expect(g.version).toBe("1.0.0")
    expect(g.isValid).toBe(true)
  })

  it("Grain.create with name and description", () => {
    const g = Grain.create("my-bot", { name: "My Bot", description: "Does things" })
    expect(g.name).toBe("My Bot")
    expect(g.data.meta.description).toBe("Does things")
  })

  it("Grain.from YAML string", () => {
    const yaml = readFileSync(customerFile, "utf-8")
    const g = Grain.from(yaml)
    expect(g.id).toBe("acme-support-agent")
    expect(g.name).toBe("Acme Support Agent")
  })

  it("Grain.from JSON string", () => {
    const yaml = readFileSync(customerFile, "utf-8")
    const g1 = Grain.from(yaml)
    const json = g1.toJSON()
    const g2 = Grain.from(json)
    expect(g2.id).toBe("acme-support-agent")
  })

  it("Grain.load from file", () => {
    const g = Grain.load(customerFile)
    expect(g.id).toBe("acme-support-agent")
    expect(g.data.identity.name).toBe("Alex")
    expect(g.data.voice.personality.warmth).toBe(0.8)
  })

  it("Grain.of from plain object", () => {
    const g1 = Grain.load(customerFile)
    const g2 = Grain.of(structuredClone(g1.data))
    expect(g2.id).toBe(g1.id)
    expect(g2.name).toBe(g1.name)
  })

  it("invalid data throws", () => {
    expect(() => Grain.from('specVersion: "1.0"\nid: bad\n')).toThrow("AgentSpec validation failed")
  })
})

describe("Grain immutability", () => {
  it("addRule returns new Grain, original unchanged", () => {
    const g1 = Grain.create("test-bot")
    const g2 = g1.addRule({
      id: "test-rule",
      condition: { type: "always" },
      action: { type: "require-confirmation" },
    })
    expect(g1.rules).toHaveLength(0)
    expect(g2.rules).toHaveLength(1)
    expect(g1).not.toBe(g2)
  })

  it("data is frozen", () => {
    const g = Grain.create("test-bot")
    expect(Object.isFrozen(g.data)).toBe(true)
  })
})

describe("Grain collections", () => {
  it("addRule / removeRule / addRules", () => {
    const rule1 = { id: "r1", condition: { type: "always" as const }, action: { type: "require-confirmation" as const } }
    const rule2 = { id: "r2", condition: { type: "always" as const }, action: { type: "require-confirmation" as const } }

    let g = Grain.create("test-bot")
    g = g.addRule(rule1)
    expect(g.rules).toHaveLength(1)
    expect(g.hasRule("r1")).toBe(true)

    g = g.addRules([rule2])
    expect(g.rules).toHaveLength(2)

    g = g.removeRule("r1")
    expect(g.rules).toHaveLength(1)
    expect(g.hasRule("r1")).toBe(false)
    expect(g.hasRule("r2")).toBe(true)
  })

  it("addBoundary / removeBoundary / addBoundaries", () => {
    const b1: Parameters<Grain["addBoundary"]>[0] = {
      description: "No PII",
      category: "data",
      enforcement: "hard",
      onViolation: "refuse",
    }
    const b2: Parameters<Grain["addBoundary"]>[0] = {
      description: "No violence",
      category: "content",
      enforcement: "hard",
      onViolation: "refuse",
    }

    let g = Grain.create("test-bot")
    g = g.addBoundary(b1)
    expect(g.boundaries).toHaveLength(1)

    g = g.addBoundaries([b2])
    expect(g.boundaries).toHaveLength(2)

    g = g.removeBoundary("No PII")
    expect(g.boundaries).toHaveLength(1)
    expect(g.boundaries[0].description).toBe("No violence")
  })

  it("addTool / removeTool / addTools", () => {
    const t1 = { id: "search", usage: "Search the web" }
    const t2 = { id: "calc", usage: "Do math" }

    let g = Grain.create("test-bot")
    g = g.addTool(t1)
    expect(g.tools).toHaveLength(1)
    expect(g.hasTool("search")).toBe(true)

    g = g.addTools([t2])
    expect(g.tools).toHaveLength(2)

    g = g.removeTool("search")
    expect(g.tools).toHaveLength(1)
    expect(g.hasTool("search")).toBe(false)
    expect(g.hasTool("calc")).toBe(true)
  })

  it("addSkill / removeSkill / addSkills", () => {
    const s1 = { name: "summarize", description: "Summarize text" }
    const s2 = { name: "translate", description: "Translate text" }

    let g = Grain.create("test-bot")
    g = g.addSkill(s1)
    expect(g.skills).toHaveLength(1)
    expect(g.hasSkill("summarize")).toBe(true)

    g = g.addSkills([s2])
    expect(g.skills).toHaveLength(2)

    g = g.removeSkill("summarize")
    expect(g.skills).toHaveLength(1)
    expect(g.hasSkill("summarize")).toBe(false)
    expect(g.hasSkill("translate")).toBe(true)
  })

  it("addExpertise / removeExpertise", () => {
    let g = Grain.create("test-bot")
    g = g.addExpertise("TypeScript", 0.9)
    expect(g.expertise).toHaveLength(1)
    expect(g.expertise[0].domain).toBe("TypeScript")

    g = g.addExpertise("Python", 0.8)
    expect(g.expertise).toHaveLength(2)

    g = g.removeExpertise("TypeScript")
    expect(g.expertise).toHaveLength(1)
    expect(g.expertise[0].domain).toBe("Python")
  })
})

describe("Grain.setPersonality", () => {
  it("changes a personality dimension", () => {
    const g1 = Grain.create("test-bot")
    const g2 = g1.setPersonality("warmth", 0.9)
    expect(g2.personality.warmth).toBe(0.9)
    // Original unchanged
    expect(g1.personality.warmth).not.toBe(0.9)
  })

  it("validates 0-1 range", () => {
    const g = Grain.create("test-bot")
    expect(() => g.setPersonality("warmth", 1.5)).toThrow(RangeError)
    expect(() => g.setPersonality("warmth", -0.1)).toThrow(RangeError)
  })

  it("boundary values 0 and 1 are valid", () => {
    const g = Grain.create("test-bot")
    expect(() => g.setPersonality("warmth", 0)).not.toThrow()
    expect(() => g.setPersonality("warmth", 1)).not.toThrow()
  })
})

describe("Grain.set / Grain.get", () => {
  it("deep path set and get", () => {
    const g1 = Grain.create("test-bot")
    const g2 = g1.set("identity.role", "Expert Bot")
    expect(g2.get("identity.role")).toBe("Expert Bot")
    expect(g1.get("identity.role")).toBe("AI Assistant")
  })

  it("get returns correct nested values", () => {
    const g = Grain.load(customerFile)
    expect(g.get("voice.personality.warmth")).toBe(0.8)
    expect(g.get("meta.name")).toBe("Acme Support Agent")
  })
})

describe("Grain.merge", () => {
  it("second wins on conflicts", () => {
    const g1 = Grain.create("bot-a", { name: "Bot A", description: "First" })
    const g2 = Grain.create("bot-b", { name: "Bot B", description: "Second" })
    const merged = g1.merge(g2)
    expect(merged.id).toBe("bot-b")
    expect(merged.name).toBe("Bot B")
  })

  it("preserves non-conflicting values from base", () => {
    const g1 = Grain.create("bot-a").setPersonality("warmth", 0.9)
    const g2 = Grain.create("bot-b").setPersonality("humor", 0.8)
    const merged = g1.merge(g2)
    // humor from g2
    expect(merged.personality.humor).toBe(0.8)
  })
})

describe("Grain.hasRule / hasTool / hasSkill", () => {
  it("returns false for missing items", () => {
    const g = Grain.create("test-bot")
    expect(g.hasRule("nonexistent")).toBe(false)
    expect(g.hasTool("nonexistent")).toBe(false)
    expect(g.hasSkill("nonexistent")).toBe(false)
  })

  it("returns true for existing items from loaded spec", () => {
    const g = Grain.load(customerFile)
    expect(g.hasRule("greet-warmly")).toBe(true)
    expect(g.hasTool("knowledge-base-search")).toBe(true)
  })
})

describe("Grain.toString", () => {
  it("does not include specVersion, id, observability at top level", () => {
    const g = Grain.load(customerFile)
    const output = g.toString()
    expect(output).not.toMatch(/^specVersion:/m)
    // Top-level id: should be removed (but id: can exist nested in rules/tools)
    expect(output).not.toMatch(/^id:/m)
    // identity/voice/behavior should be present
    expect(output).toContain("identity:")
    expect(output).toContain("voice:")
    expect(output).toContain("behavior:")
  })

  it("does not include observability or adaptation", () => {
    const g = Grain.load(customerFile)
    const output = g.toString()
    expect(output).not.toMatch(/^observability:/m)
    expect(output).not.toMatch(/^adaptation:/m)
  })

  it("applies channel overrides", () => {
    const g = Grain.load(customerFile)
    const slackOutput = g.toString("slack")
    // Slack overrides formality to 0.3
    expect(slackOutput).toContain("0.3")
  })
})

describe("Grain.toPrompt", () => {
  it("contains 'You are Alex'", () => {
    const g = Grain.load(customerFile)
    const prompt = g.toPrompt()
    expect(prompt).toContain("You are Alex")
  })

  it("channel overrides work", () => {
    const g = Grain.load(customerFile)
    const slackPrompt = g.toPrompt("slack")
    expect(slackPrompt).toContain("Use emoji to add personality")
  })
})

describe("Grain.toYAML / toJSON", () => {
  it("toYAML includes full serialization with specVersion", () => {
    const g = Grain.load(customerFile)
    const yaml = g.toYAML()
    expect(yaml).toContain("specVersion:")
    expect(yaml).toContain("acme-support-agent")
  })

  it("toJSON produces valid JSON with all fields", () => {
    const g = Grain.load(customerFile)
    const json = g.toJSON()
    const parsed = JSON.parse(json)
    expect(parsed.specVersion).toBe("1.0")
    expect(parsed.id).toBe("acme-support-agent")
    expect(parsed.observability).toBeDefined()
  })
})

describe("Grain.diff", () => {
  it("identical grains produce empty diff", () => {
    const g1 = Grain.load(customerFile)
    const g2 = Grain.load(customerFile)
    const d = g1.diff(g2)
    expect(Object.keys(d)).toHaveLength(0)
  })

  it("modified grains produce correct diff paths", () => {
    const g1 = Grain.create("test-bot")
    const g2 = g1.setPersonality("warmth", 0.9)
    const d = g1.diff(g2)
    expect(d["voice.personality.warmth"]).toBeDefined()
    expect(d["voice.personality.warmth"].after).toBe(0.9)
  })
})

describe("Grain.validate", () => {
  it("valid grain returns empty errors", () => {
    const g = Grain.load(customerFile)
    expect(g.validate()).toHaveLength(0)
  })
})
