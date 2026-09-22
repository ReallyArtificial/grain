import { readFileSync } from "node:fs"
import { parse as parseYaml } from "yaml"
import type { AgentSpec } from "./types.js"
import { validateSpec, assertValid } from "./validate.js"
import { resolveDefaults } from "./defaults.js"
import { generateSystemPrompt } from "./prompt-generator.js"

/**
 * Load an AgentSpec from a .agent.yaml or .agent.json file.
 * Parses, validates against the JSON Schema, and returns a typed object.
 */
export function loadAgentSpec(filePath: string): AgentSpec {
  const content = readFileSync(filePath, "utf-8")

  let data: unknown
  if (filePath.endsWith(".json")) {
    data = JSON.parse(content)
  } else {
    data = parseYaml(content)
  }

  assertValid(data)
  return resolveDefaults(data as Record<string, unknown>)
}

/**
 * Parse an AgentSpec from a YAML or JSON string.
 */
export function parseAgentSpec(content: string, format: "yaml" | "json" = "yaml"): AgentSpec {
  const data = format === "json" ? JSON.parse(content) : parseYaml(content)
  assertValid(data)
  return resolveDefaults(data as Record<string, unknown>)
}

// CLI: load and display an agent spec file
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/.*\//, ""))) {
  const file = process.argv[2]
  if (!file) {
    console.error("Usage: tsx load.ts <path-to-agent-file>")
    process.exit(1)
  }

  try {
    const spec = loadAgentSpec(file)
    console.log(`Loaded: ${spec.meta.name} (${spec.id}@${spec.version})\n`)

    const errors = validateSpec(spec)
    if (errors.length > 0) {
      console.log("Warnings:")
      for (const err of errors) {
        console.log(`  ${err.path}: ${err.message}`)
      }
      console.log()
    }

    console.log("=== DEFAULT PROMPT ===\n")
    console.log(generateSystemPrompt(spec))

    // Show channel-specific if channels exist
    if (spec.voice.channelOverrides) {
      for (const channel of Object.keys(spec.voice.channelOverrides)) {
        console.log(`\n\n=== ${channel.toUpperCase()} PROMPT ===\n`)
        console.log(generateSystemPrompt(spec, channel))
      }
    }
  } catch (e) {
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  }
}
