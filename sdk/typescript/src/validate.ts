import Ajv2020 from "ajv/dist/2020.js"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface ValidationError {
  path: string
  message: string
  severity: "error" | "warning"
}

// Load schema — try package-local first (npm install), then monorepo path (development)
const schemaPath = (() => {
  const packageLocal = join(__dirname, "..", "agentspec.schema.json")
  const monorepo = join(__dirname, "..", "..", "..", "spec", "agentspec.schema.json")
  try {
    readFileSync(packageLocal, "utf-8")
    return packageLocal
  } catch {
    return monorepo
  }
})()
let _schema: object | null = null

function getSchema(): object {
  if (!_schema) {
    _schema = JSON.parse(readFileSync(schemaPath, "utf-8"))
  }
  return _schema!
}

let _validateFn: ReturnType<Ajv2020["compile"]> | null = null

function getValidator(): ReturnType<Ajv2020["compile"]> {
  if (!_validateFn) {
    const ajv = new Ajv2020({ allErrors: true, strict: false })
    _validateFn = ajv.compile(getSchema())
  }
  return _validateFn
}

/**
 * Validate an AgentSpec object against the JSON Schema.
 * Returns an array of validation errors (empty = valid).
 */
export function validateSpec(data: unknown): ValidationError[] {
  const validate = getValidator()
  const valid = validate(data)

  if (valid) return []

  return (validate.errors ?? []).map(err => ({
    path: err.instancePath || "/",
    message: err.message ?? "Unknown validation error",
    severity: "error" as const,
  }))
}

/**
 * Validate and throw if invalid.
 */
export function assertValid(data: unknown): void {
  const errors = validateSpec(data)
  if (errors.length > 0) {
    const messages = errors.map(e => `  ${e.path}: ${e.message}`).join("\n")
    throw new Error(`AgentSpec validation failed:\n${messages}`)
  }
}
