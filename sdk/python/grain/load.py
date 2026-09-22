"""Load and parse AgentSpec from YAML or JSON."""
from __future__ import annotations
from pathlib import Path

import yaml

from .validate import assert_valid
from .defaults import resolve_defaults


def load_agent_spec(file_path: str | Path) -> dict:
    """Load an AgentSpec from a .agent.yaml or .agent.json file.
    Parses, validates against the JSON Schema, and returns a dict with defaults resolved.
    """
    path = Path(file_path)
    content = path.read_text()

    if path.suffix == ".json":
        import json
        data = json.loads(content)
    else:
        data = yaml.safe_load(content)

    assert_valid(data)
    return resolve_defaults(data)


def parse_agent_spec(content: str, fmt: str = "yaml") -> dict:
    """Parse an AgentSpec from a YAML or JSON string."""
    if fmt == "json":
        import json
        data = json.loads(content)
    else:
        data = yaml.safe_load(content)

    assert_valid(data)
    return resolve_defaults(data)
