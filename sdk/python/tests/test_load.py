from pathlib import Path

import pytest

from grain import load_agent_spec, parse_agent_spec

EXAMPLES_DIR = Path(__file__).parent.parent.parent.parent / "examples"


def test_load_yaml_file():
    spec = load_agent_spec(EXAMPLES_DIR / "customer-support.agent.yaml")
    assert spec["id"] == "acme-support-agent"
    assert spec["specVersion"] == "1.0"
    assert spec["meta"]["name"] == "Acme Support Agent"
    assert spec["identity"]["name"] == "Alex"
    assert spec["voice"]["personality"]["warmth"] == 0.8


def test_load_minimal_spec_resolves_defaults():
    spec = load_agent_spec(EXAMPLES_DIR / "minimal-faq.agent.yaml")
    assert spec["id"] == "faq-bot"
    assert spec["meta"]["name"] == "FAQ Bot"
    # Defaults resolved
    assert spec["identity"]["name"] == "FAQ Bot"
    assert spec["identity"]["role"] == "AI Assistant"
    assert spec["voice"]["personality"]["formality"] == 0.5
    assert spec["behavior"]["rules"] == []
    assert spec["cognition"]["uncertainty"]["communicateUncertainty"] is True


def test_load_nonexistent_file():
    with pytest.raises(FileNotFoundError):
        load_agent_spec("/does/not/exist.yaml")


def test_parse_yaml_string():
    content = (EXAMPLES_DIR / "customer-support.agent.yaml").read_text()
    spec = parse_agent_spec(content, "yaml")
    assert spec["id"] == "acme-support-agent"


def test_parse_json_string():
    import json
    content = (EXAMPLES_DIR / "customer-support.agent.yaml").read_text()
    spec = parse_agent_spec(content, "yaml")
    json_str = json.dumps(spec)
    parsed = parse_agent_spec(json_str, "json")
    assert parsed["id"] == "acme-support-agent"


def test_parse_invalid_yaml_raises():
    bad_yaml = 'specVersion: "1.0"\nid: bad\n'
    with pytest.raises(ValueError, match="AgentSpec validation failed"):
        parse_agent_spec(bad_yaml, "yaml")
