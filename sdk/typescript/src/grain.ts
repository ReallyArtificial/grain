import { readFileSync } from "node:fs"
import { parse as parseYaml, stringify as stringifyYaml } from "yaml"
import type {
  AgentSpec,
  PersonalityVector,
  BehaviorRule,
  Boundary,
  ToolCapability,
  SkillDefinition,
  DomainExpertise,
} from "./types.js"
import { validateSpec, assertValid, type ValidationError } from "./validate.js"
import { resolveDefaults } from "./defaults.js"
import { generateSystemPrompt } from "./prompt-generator.js"

/**
 * Grain — immutable wrapper around an AgentSpec.
 * Every mutation returns a new Grain; the original is never modified.
 */
export class Grain {
  private readonly _data: AgentSpec

  private constructor(data: AgentSpec) {
    this._data = Object.freeze(data)
  }

  // ===========================================================================
  // CONSTRUCTORS
  // ===========================================================================

  /** Create a Grain programmatically with an id and optional overrides. */
  static create(id: string, overrides: { name?: string; description?: string } = {}): Grain {
    const raw: Record<string, unknown> = {
      specVersion: "1.0",
      id,
      version: "1.0.0",
      meta: {
        name: overrides.name ?? id,
        description: overrides.description ?? "",
      },
    }
    const spec = resolveDefaults(raw)
    assertValid(spec)
    return new Grain(spec)
  }

  /** Create a Grain from a YAML or JSON string. */
  static from(content: string): Grain {
    let data: unknown
    try {
      data = JSON.parse(content)
    } catch {
      data = parseYaml(content)
    }
    assertValid(data)
    return new Grain(resolveDefaults(data as Record<string, unknown>))
  }

  /** Load a Grain from a .agent.yaml or .agent.json file. */
  static load(filePath: string): Grain {
    const content = readFileSync(filePath, "utf-8")
    let data: unknown
    if (filePath.endsWith(".json")) {
      data = JSON.parse(content)
    } else {
      data = parseYaml(content)
    }
    assertValid(data)
    return new Grain(resolveDefaults(data as Record<string, unknown>))
  }

  /** Create a Grain from a plain AgentSpec object. */
  static of(spec: AgentSpec): Grain {
    assertValid(spec)
    return new Grain(resolveDefaults(spec as unknown as Record<string, unknown>))
  }

  // ===========================================================================
  // INTERNAL HELPER
  // ===========================================================================

  private with(updater: (data: AgentSpec) => void): Grain {
    const clone = structuredClone(this._data) as AgentSpec
    updater(clone)
    return new Grain(clone)
  }

  // ===========================================================================
  // READ ACCESSORS
  // ===========================================================================

  get id(): string { return this._data.id }
  get name(): string { return this._data.meta.name }
  get version(): string { return this._data.version }

  get personality(): PersonalityVector {
    return { ...this._data.voice.personality }
  }

  get rules(): BehaviorRule[] {
    return structuredClone(this._data.behavior.rules)
  }

  get boundaries(): Boundary[] {
    return structuredClone(this._data.behavior.boundaries)
  }

  get tools(): ToolCapability[] {
    return structuredClone(this._data.capabilities.tools ?? [])
  }

  get skills(): SkillDefinition[] {
    return structuredClone(this._data.capabilities.skills ?? [])
  }

  get expertise(): DomainExpertise[] {
    return structuredClone(this._data.identity.expertise)
  }

  get data(): AgentSpec {
    return this._data
  }

  get isValid(): boolean {
    return validateSpec(this._data).length === 0
  }

  // ===========================================================================
  // QUERY
  // ===========================================================================

  hasRule(id: string): boolean {
    return this._data.behavior.rules.some(r => r.id === id)
  }

  hasTool(name: string): boolean {
    return (this._data.capabilities.tools ?? []).some(t => t.id === name)
  }

  hasSkill(name: string): boolean {
    return (this._data.capabilities.skills ?? []).some(s => s.name === name)
  }

  // ===========================================================================
  // MUTATIONS (all return new Grain)
  // ===========================================================================

  addRule(rule: BehaviorRule): Grain {
    return this.with(d => { d.behavior.rules.push(rule) })
  }

  removeRule(id: string): Grain {
    return this.with(d => { d.behavior.rules = d.behavior.rules.filter(r => r.id !== id) })
  }

  addRules(rules: BehaviorRule[]): Grain {
    return this.with(d => { d.behavior.rules.push(...rules) })
  }

  addBoundary(boundary: Boundary): Grain {
    return this.with(d => { d.behavior.boundaries.push(boundary) })
  }

  removeBoundary(description: string): Grain {
    return this.with(d => {
      d.behavior.boundaries = d.behavior.boundaries.filter(b => b.description !== description)
    })
  }

  addBoundaries(boundaries: Boundary[]): Grain {
    return this.with(d => { d.behavior.boundaries.push(...boundaries) })
  }

  addTool(tool: ToolCapability): Grain {
    return this.with(d => {
      if (!d.capabilities.tools) d.capabilities.tools = []
      d.capabilities.tools.push(tool)
    })
  }

  removeTool(name: string): Grain {
    return this.with(d => {
      d.capabilities.tools = (d.capabilities.tools ?? []).filter(t => t.id !== name)
    })
  }

  addTools(tools: ToolCapability[]): Grain {
    return this.with(d => {
      if (!d.capabilities.tools) d.capabilities.tools = []
      d.capabilities.tools.push(...tools)
    })
  }

  addSkill(skill: SkillDefinition): Grain {
    return this.with(d => {
      if (!d.capabilities.skills) d.capabilities.skills = []
      d.capabilities.skills.push(skill)
    })
  }

  removeSkill(name: string): Grain {
    return this.with(d => {
      d.capabilities.skills = (d.capabilities.skills ?? []).filter(s => s.name !== name)
    })
  }

  addSkills(skills: SkillDefinition[]): Grain {
    return this.with(d => {
      if (!d.capabilities.skills) d.capabilities.skills = []
      d.capabilities.skills.push(...skills)
    })
  }

  addExpertise(domain: string, proficiency: number): Grain {
    if (proficiency < 0 || proficiency > 1) {
      throw new RangeError(`Proficiency must be between 0 and 1, got ${proficiency}`)
    }
    return this.with(d => {
      d.identity.expertise.push({ domain, proficiency })
    })
  }

  removeExpertise(domain: string): Grain {
    return this.with(d => {
      d.identity.expertise = d.identity.expertise.filter(e => e.domain !== domain)
    })
  }

  setPersonality(dim: keyof PersonalityVector, value: number): Grain {
    if (value < 0 || value > 1) {
      throw new RangeError(`Personality value must be between 0 and 1, got ${value} for ${dim}`)
    }
    return this.with(d => {
      d.voice.personality[dim] = value
    })
  }

  set(path: string, value: unknown): Grain {
    return this.with(d => {
      const parts = path.split(".")
      let obj: Record<string, unknown> = d as unknown as Record<string, unknown>
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]] as Record<string, unknown>
      }
      obj[parts[parts.length - 1]] = value
    })
  }

  get<T = unknown>(path: string): T {
    const parts = path.split(".")
    let obj: unknown = this._data
    for (const part of parts) {
      obj = (obj as Record<string, unknown>)[part]
    }
    return obj as T
  }

  merge(other: Grain): Grain {
    return this.with(d => {
      deepMerge(d as unknown as Record<string, unknown>, other._data as unknown as Record<string, unknown>)
    })
  }

  // ===========================================================================
  // OUTPUT
  // ===========================================================================

  /**
   * Clean YAML for LLM consumption.
   * Strips SDK metadata (specVersion, id, version, meta.model, meta.tags,
   * observability, adaptation). Keeps agent-facing content.
   * Applies channel overrides if specified.
   */
  toString(channel?: string): string {
    const clone = structuredClone(this._data) as unknown as Record<string, unknown>

    // Apply channel overrides to voice
    if (channel) {
      const voice = clone.voice as Record<string, unknown>
      const overrides = (voice.channelOverrides as Record<string, unknown>)?.[channel] as Record<string, unknown> | undefined
      if (overrides) {
        const personality = voice.personality as Record<string, unknown>
        const language = voice.language as Record<string, unknown>
        Object.assign(personality, overrides)
        Object.assign(language, overrides)
      }
    }

    // Strip SDK metadata
    delete clone.specVersion
    delete clone.id
    delete clone.version
    delete clone.observability
    delete clone.adaptation

    const meta = clone.meta as Record<string, unknown>
    delete meta.model
    delete meta.tags

    // Remove channelOverrides from voice (already applied or not needed)
    const voice = clone.voice as Record<string, unknown>
    delete voice.channelOverrides

    return stringifyYaml(clone, { lineWidth: 0 })
  }

  /**
   * Expanded natural language prompt with behavioral directives.
   * Delegates to the existing prompt generator.
   */
  toPrompt(channel?: string): string {
    return generateSystemPrompt(this._data, channel)
  }

  /** Full YAML including all metadata (for saving to file). */
  toYAML(): string {
    return stringifyYaml(structuredClone(this._data), { lineWidth: 0 })
  }

  /** Full JSON including all metadata. */
  toJSON(): string {
    return JSON.stringify(this._data, null, 2)
  }

  /** Validate and return errors. */
  validate(): ValidationError[] {
    return validateSpec(this._data)
  }

  /** Diff this Grain against another. Returns paths with before/after values. */
  diff(other: Grain): Record<string, { before: unknown; after: unknown }> {
    const result: Record<string, { before: unknown; after: unknown }> = {}
    diffObjects(
      this._data as unknown as Record<string, unknown>,
      other._data as unknown as Record<string, unknown>,
      "",
      result,
    )
    return result
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const key of Object.keys(source)) {
    const sv = source[key]
    const tv = target[key]
    if (isPlainObject(sv) && isPlainObject(tv)) {
      deepMerge(tv as Record<string, unknown>, sv as Record<string, unknown>)
    } else {
      target[key] = structuredClone(sv)
    }
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function diffObjects(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  prefix: string,
  result: Record<string, { before: unknown; after: unknown }>,
): void {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of allKeys) {
    const path = prefix ? `${prefix}.${key}` : key
    const av = a[key]
    const bv = b[key]

    if (isPlainObject(av) && isPlainObject(bv)) {
      diffObjects(av as Record<string, unknown>, bv as Record<string, unknown>, path, result)
    } else if (Array.isArray(av) && Array.isArray(bv)) {
      if (JSON.stringify(av) !== JSON.stringify(bv)) {
        result[path] = { before: av, after: bv }
      }
    } else if (av !== bv) {
      result[path] = { before: av, after: bv }
    }
  }
}
