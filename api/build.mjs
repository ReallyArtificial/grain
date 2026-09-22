import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { stringify } from "yaml"
import Ajv2020 from "ajv/dist/2020.js"
import { resolveDefaults } from "@reallyartificial/grain"
import { generateSystemPrompt } from "@reallyartificial/grain"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Schema validation - inline to control file resolution
let _validateFn = null

function getValidator() {
  if (!_validateFn) {
    const paths = [
      join(__dirname, "..", "sdk", "typescript", "agentspec.schema.json"),
      join(__dirname, "..", "spec", "agentspec.schema.json"),
      join(__dirname, "..", "node_modules", "@reallyartificial", "grain", "agentspec.schema.json"),
    ]
    let schema = null
    for (const p of paths) {
      try { schema = JSON.parse(readFileSync(p, "utf-8")); break } catch {}
    }
    if (!schema) throw new Error("Schema not found")
    const ajv = new Ajv2020({ allErrors: true, strict: false })
    _validateFn = ajv.compile(schema)
  }
  return _validateFn
}

function validateSpec(data) {
  try {
    const validate = getValidator()
    const valid = validate(data)
    if (valid) return []
    return (validate.errors ?? []).map(err => ({
      path: err.instancePath || "/",
      message: err.message ?? "Unknown validation error",
      severity: "error",
    }))
  } catch (e) {
    return [{ path: "/", message: e.message || "Validation failed", severity: "error" }]
  }
}

function generateCodeTs(spec) {
  const id = spec.id || "my-agent"
  return `import { Grain } from "@reallyartificial/grain"
import OpenAI from "openai"

const agent = Grain.load("./${id}.agent.yaml")
const openai = new OpenAI()

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: agent.toPrompt() },
    { role: "user", content: "Hello!" }
  ]
})

console.log(response.choices[0].message.content)`
}

function generateCodePy(spec) {
  const id = spec.id || "my-agent"
  return `from grain import Grain
from openai import OpenAI

agent = Grain.load("./${id}.agent.yaml")
client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": agent.to_prompt()},
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)`
}

export default function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { spec, channel } = req.body
    const resolved = resolveDefaults(spec)
    const errors = validateSpec(spec)
    const yaml = stringify(spec, { lineWidth: 0 })
    const prompt = generateSystemPrompt(resolved, channel || undefined)
    const codeTs = generateCodeTs(spec)
    const codePy = generateCodePy(spec)

    res.status(200).json({ valid: errors.length === 0, errors, yaml, prompt, codeTs, codePy })
  } catch (e) {
    res.status(400).json({
      valid: false,
      errors: [{ path: "/", message: e instanceof Error ? e.message : String(e), severity: "error" }],
      yaml: "", prompt: "", codeTs: "", codePy: ""
    })
  }
}
