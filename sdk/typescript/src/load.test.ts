import { describe, it, expect } from "vitest"
import { Grain } from "./grain.js"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const examplesDir = join(__dirname, "..", "..", "..", "examples")

describe("Grain.load", () => {
  it("loads YAML file and returns typed Grain", () => {
    const g = Grain.load(join(examplesDir, "customer-support.agent.yaml"))
    expect(g.id).toBe("acme-support-agent")
    expect(g.data.specVersion).toBe("1.0")
    expect(g.name).toBe("Acme Support Agent")
    expect(g.data.identity.name).toBe("Alex")
    expect(g.data.voice.personality.warmth).toBe(0.8)
  })

  it("loads minimal spec and resolves defaults", () => {
    const g = Grain.load(join(examplesDir, "minimal-faq.agent.yaml"))
    expect(g.id).toBe("faq-bot")
    expect(g.name).toBe("FAQ Bot")
    expect(g.data.identity.name).toBe("FAQ Bot")
    expect(g.data.identity.role).toBe("AI Assistant")
    expect(g.personality.formality).toBe(0.5)
    expect(g.rules).toEqual([])
    expect(g.data.cognition.uncertainty.communicateUncertainty).toBe(true)
  })

  it("throws for non-existent file", () => {
    expect(() => Grain.load("/does/not/exist.yaml")).toThrow()
  })
})

describe("Grain.from", () => {
  it("parses YAML string and returns Grain", () => {
    const content = readFileSync(join(examplesDir, "customer-support.agent.yaml"), "utf-8")
    const g = Grain.from(content)
    expect(g.id).toBe("acme-support-agent")
    expect(g.data.identity.name).toBe("Alex")
  })

  it("parses JSON string and returns Grain", () => {
    const yamlContent = readFileSync(join(examplesDir, "customer-support.agent.yaml"), "utf-8")
    const g1 = Grain.from(yamlContent)
    const jsonString = g1.toJSON()
    const g2 = Grain.from(jsonString)
    expect(g2.id).toBe("acme-support-agent")
  })

  it("throws with validation message for invalid YAML", () => {
    const badYaml = `
specVersion: "1.0"
id: bad
`
    expect(() => Grain.from(badYaml)).toThrow("AgentSpec validation failed")
  })
})
