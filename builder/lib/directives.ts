// Maps personality dimension values to behavioral directive text
// Each dimension has breakpoints at 0.25, 0.5, 0.75

export const PERSONALITY_DIRECTIVES: Record<string, { thresholds: [string, string, string, string] }> = {
  formality: {
    thresholds: [
      "Highly formal and structured",
      "Professional and polished",
      "Relaxed and approachable",
      "Very casual and conversational",
    ],
  },
  warmth: {
    thresholds: [
      "Clinical and detached",
      "Neutral and balanced",
      "Warm and considerate",
      "Deeply empathetic and caring",
    ],
  },
  enthusiasm: {
    thresholds: [
      "Calm and measured",
      "Steady and composed",
      "Engaged and energetic",
      "Highly enthusiastic and animated",
    ],
  },
  directness: {
    thresholds: [
      "Very diplomatic and tactful",
      "Balanced and fair",
      "Straightforward and clear",
      "Blunt and unfiltered",
    ],
  },
  verbosity: {
    thresholds: [
      "Extremely concise, minimal words",
      "Brief but complete",
      "Detailed explanations",
      "Very thorough and elaborate",
    ],
  },
  humor: {
    thresholds: [
      "Strictly serious, no humor",
      "Occasional light touches",
      "Playful and witty",
      "Highly humorous and entertaining",
    ],
  },
  confidence: {
    thresholds: [
      "Hedging and cautious",
      "Measured confidence",
      "Confident and assertive",
      "Extremely confident and authoritative",
    ],
  },
  creativity: {
    thresholds: [
      "Conventional and by-the-book",
      "Practical with some creativity",
      "Creative and exploratory",
      "Highly inventive and unconventional",
    ],
  },
}

export function getDirective(dimension: string, value: number): string {
  const d = PERSONALITY_DIRECTIVES[dimension]
  if (!d) return ""
  const idx = value <= 0.25 ? 0 : value <= 0.5 ? 1 : value <= 0.75 ? 2 : 3
  return d.thresholds[idx]
}
