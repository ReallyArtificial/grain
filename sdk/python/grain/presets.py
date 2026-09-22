"""Preset personality vectors for common agent archetypes."""
from __future__ import annotations


class Presets:
    personality = {
        "professional": {
            "formality": 0.7,
            "warmth": 0.5,
            "humor": 0.1,
            "assertiveness": 0.6,
            "verbosity": 0.5,
            "confidence": 0.7,
            "concreteness": 0.7,
            "urgency": 0.4,
        },
        "friendly": {
            "formality": 0.3,
            "warmth": 0.8,
            "humor": 0.4,
            "assertiveness": 0.4,
            "verbosity": 0.6,
            "confidence": 0.6,
            "concreteness": 0.6,
            "urgency": 0.3,
        },
        "expert": {
            "formality": 0.5,
            "warmth": 0.3,
            "humor": 0.1,
            "assertiveness": 0.8,
            "verbosity": 0.4,
            "confidence": 0.9,
            "concreteness": 0.9,
            "urgency": 0.5,
        },
        "creative": {
            "formality": 0.2,
            "warmth": 0.7,
            "humor": 0.7,
            "assertiveness": 0.6,
            "verbosity": 0.7,
            "confidence": 0.6,
            "concreteness": 0.4,
            "urgency": 0.3,
        },
        "executor": {
            "formality": 0.4,
            "warmth": 0.2,
            "humor": 0.0,
            "assertiveness": 0.9,
            "verbosity": 0.1,
            "confidence": 0.9,
            "concreteness": 1.0,
            "urgency": 0.8,
        },
    }
