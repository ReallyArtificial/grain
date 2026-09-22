import { describe, it, expect } from "vitest"
import { validateSpec, assertValid } from "./validate.js"
import { loadAgentSpec } from "./load.js"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const examplesDir = join(__dirname, "..", "..", "..", "examples")

describe("validateSpec", () => {
  it("valid customer-support.agent.yaml passes validation", () => {
    const spec = loadAgentSpec(join(examplesDir, "customer-support.agent.yaml"))
    const errors = validateSpec(spec)
    expect(errors).toEqual([])
  })

  it("missing required field returns error with correct path", () => {
    const spec = loadAgentSpec(join(examplesDir, "customer-support.agent.yaml"))
    const { meta, ...noMeta } = spec as Record<string, unknown>
    const errors = validateSpec(noMeta)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some(e => e.message.includes("meta"))).toBe(true)
  })

  it("invalid personality value (>1) returns error", () => {
    const spec = loadAgentSpec(join(examplesDir, "customer-support.agent.yaml"))
    const broken = JSON.parse(JSON.stringify(spec))
    broken.voice.personality.warmth = 1.5
    const errors = validateSpec(broken)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some(e => e.path.includes("warmth"))).toBe(true)
  })

  it("invalid id format (uppercase) returns error", () => {
    const spec = loadAgentSpec(join(examplesDir, "customer-support.agent.yaml"))
    const broken = JSON.parse(JSON.stringify(spec))
    broken.id = "InvalidUpperCase"
    const errors = validateSpec(broken)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some(e => e.path.includes("id"))).toBe(true)
  })

  it("invalid specVersion returns error", () => {
    const spec = loadAgentSpec(join(examplesDir, "customer-support.agent.yaml"))
    const broken = JSON.parse(JSON.stringify(spec))
    broken.specVersion = "2.0"
    const errors = validateSpec(broken)
    expect(errors.length).toBeGreaterThan(0)
  })

  it("empty object returns errors for required fields", () => {
    const errors = validateSpec({})
    expect(errors.length).toBeGreaterThan(0)
    // 4 required fields: specVersion, id, version, meta
    expect(errors.length).toBeGreaterThanOrEqual(4)
  })
})

describe("assertValid", () => {
  it("does not throw for valid spec", () => {
    const spec = loadAgentSpec(join(examplesDir, "customer-support.agent.yaml"))
    expect(() => assertValid(spec)).not.toThrow()
  })

  it("throws with formatted message for invalid spec", () => {
    expect(() => assertValid({})).toThrow("AgentSpec validation failed")
  })
})
