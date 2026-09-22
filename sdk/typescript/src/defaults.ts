import type { AgentSpec } from "./types.js"

/**
 * Fills in missing sections with sensible defaults.
 * Allows minimal specs (just specVersion, id, version, meta) to work
 * by providing neutral defaults for all other sections.
 */
export function resolveDefaults(partial: Record<string, unknown>): AgentSpec {
  const spec = { ...partial } as Record<string, unknown>

  if (!spec.identity) {
    const meta = spec.meta as { name: string; description?: string }
    spec.identity = {
      name: meta.name,
      role: "AI Assistant",
      purpose: { primary: meta.description || "Assist the user" },
      expertise: [],
    }
  }

  if (!spec.voice) {
    spec.voice = {
      personality: {
        formality: 0.5,
        warmth: 0.5,
        humor: 0.3,
        assertiveness: 0.5,
        verbosity: 0.5,
        confidence: 0.6,
        concreteness: 0.6,
        urgency: 0.4,
      },
      language: {
        locale: "en",
        sentenceLength: "medium",
        jargonLevel: "moderate",
        emojiUsage: "never",
        structure: "mixed",
        usesAnalogies: false,
        addressing: "first-person",
      },
    }
  }

  if (!spec.cognition) {
    spec.cognition = {
      reasoningStyle: {
        primary: "analytical",
        showReasoning: false,
        analysisDepth: "moderate",
        multiPerspective: false,
      },
      decisionMaking: {
        speed: 0.5,
        evidenceThreshold: 0.5,
        reversibilityPreference: "neutral",
        autonomy: "ask-for-major",
      },
      uncertainty: {
        lowConfidenceAction: "ask",
        confidenceFloor: 0.3,
        communicateUncertainty: true,
        conflictResolution: "ask-user",
      },
      taskStrategy: {
        decomposition: "top-down",
        maxParallelism: 1,
        checkpointing: false,
        blockingStrategy: "escalate",
      },
    }
  }

  if (!spec.capabilities) {
    spec.capabilities = {}
  }

  if (!spec.behavior) {
    spec.behavior = { rules: [], boundaries: [] }
  }

  if (!spec.memory) {
    spec.memory = {
      retention: [{ category: "conversation-history", duration: "session" }],
      contextStrategy: {
        overflow: "summarize",
        prioritize: ["recent"],
        autoSummarize: false,
      },
    }
  }

  if (!spec.communication) {
    spec.communication = {
      channels: [{ channel: "api", enabled: true }],
      input: {
        languages: ["en"],
        typoTolerance: true,
        ambiguityResolution: "ask",
        modalities: ["text"],
      },
      output: {
        defaultFormat: "text",
        citations: "never",
        structuredOutput: false,
      },
    }
  }

  if (!spec.adaptation) {
    spec.adaptation = { enabled: false }
  }

  if (!spec.observability) {
    spec.observability = {
      logging: {
        level: "info",
        alwaysLog: ["error"],
        conversationLogging: "none",
        piiHandling: "redact",
      },
      metrics: [],
      successCriteria: [],
    }
  }

  return spec as unknown as AgentSpec
}
