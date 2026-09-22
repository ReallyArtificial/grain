import { createServer } from "node:http"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { exec } from "node:child_process"
import { validateSpec } from "./validate.js"
import { resolveDefaults } from "./defaults.js"
import { generateSystemPrompt } from "./prompt-generator.js"
import { stringify } from "yaml"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let _html: string | null = null
function getHtml(): string {
  if (!_html) {
    const distPath = join(__dirname, "builder.html")
    const srcPath = join(__dirname, "..", "src", "builder.html")
    try {
      _html = readFileSync(distPath, "utf-8")
    } catch {
      _html = readFileSync(srcPath, "utf-8")
    }
  }
  return _html
}

let _schema: string | null = null
function getSchemaJson(): string {
  if (!_schema) {
    const packageLocal = join(__dirname, "..", "agentspec.schema.json")
    const monorepo = join(__dirname, "..", "..", "..", "spec", "agentspec.schema.json")
    try {
      _schema = readFileSync(packageLocal, "utf-8")
    } catch {
      _schema = readFileSync(monorepo, "utf-8")
    }
  }
  return _schema
}

function openBrowser(url: string) {
  const cmd = process.platform === "darwin"
    ? `open "${url}"`
    : process.platform === "win32"
    ? `start "${url}"`
    : `xdg-open "${url}"`
  exec(cmd)
}

function generateCodeTs(spec: Record<string, unknown>): string {
  const id = (spec.id as string) || "my-agent"
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

function generateCodePy(spec: Record<string, unknown>): string {
  const id = (spec.id as string) || "my-agent"
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

export function startBuilder(port?: number) {
  const startPort = port || 4460
  const maxPort = port || 4470

  function tryListen(p: number) {
    const server = createServer((req, res) => {
      const url = new URL(req.url || "/", `http://localhost:${p}`)

      if (req.method === "GET" && url.pathname === "/") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
        res.end(getHtml())
        return
      }

      if (req.method === "GET" && url.pathname === "/schema.json") {
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(getSchemaJson())
        return
      }

      if (req.method === "POST" && url.pathname === "/api/build") {
        let body = ""
        req.on("data", chunk => { body += chunk })
        req.on("end", () => {
          try {
            const { spec, channel } = JSON.parse(body)
            const resolved = resolveDefaults(spec)
            const errors = validateSpec(spec)
            const yaml = stringify(spec, { lineWidth: 0 })
            const prompt = generateSystemPrompt(resolved, channel || undefined)
            const codeTs = generateCodeTs(spec)
            const codePy = generateCodePy(spec)
            res.writeHead(200, { "Content-Type": "application/json" })
            res.end(JSON.stringify({
              valid: errors.length === 0,
              errors,
              yaml,
              prompt,
              codeTs,
              codePy
            }))
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" })
            res.end(JSON.stringify({
              valid: false,
              errors: [{ path: "/", message: e instanceof Error ? e.message : String(e), severity: "error" }],
              yaml: "",
              prompt: "",
              codeTs: "",
              codePy: ""
            }))
          }
        })
        return
      }

      res.writeHead(404)
      res.end("Not found")
    })

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" && p < maxPort) {
        tryListen(p + 1)
      } else {
        console.error(`Failed to start builder server: ${err.message}`)
        process.exit(1)
      }
    })

    server.listen(p, () => {
      const url = `http://localhost:${p}`
      console.log(`Grain Builder running at ${url}`)
      openBrowser(url)
    })
  }

  tryListen(startPort)
}
