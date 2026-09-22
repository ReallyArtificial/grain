import copy
from pathlib import Path

import pytest

from grain import load_agent_spec, validate_spec, assert_valid

EXAMPLES_DIR = Path(__file__).parent.parent.parent.parent / "examples"


def test_valid_spec_passes():
    spec = load_agent_spec(EXAMPLES_DIR / "customer-support.agent.yaml")
    errors = validate_spec(spec)
    assert errors == []


def test_missing_required_field():
    spec = load_agent_spec(EXAMPLES_DIR / "customer-support.agent.yaml")
    del spec["meta"]
    errors = validate_spec(spec)
    assert len(errors) > 0
    assert any("meta" in e.message for e in errors)


def test_invalid_personality_value():
    spec = load_agent_spec(EXAMPLES_DIR / "customer-support.agent.yaml")
    spec = copy.deepcopy(spec)
    spec["voice"]["personality"]["warmth"] = 1.5
    errors = validate_spec(spec)
    assert len(errors) > 0


def test_invalid_id_format():
    spec = load_agent_spec(EXAMPLES_DIR / "customer-support.agent.yaml")
    spec = copy.deepcopy(spec)
    spec["id"] = "InvalidUpperCase"
    errors = validate_spec(spec)
    assert len(errors) > 0


def test_invalid_spec_version():
    spec = load_agent_spec(EXAMPLES_DIR / "customer-support.agent.yaml")
    spec = copy.deepcopy(spec)
    spec["specVersion"] = "2.0"
    errors = validate_spec(spec)
    assert len(errors) > 0


def test_empty_object_returns_errors_for_required_fields():
    errors = validate_spec({})
    # 4 required fields: specVersion, id, version, meta
    assert len(errors) >= 4


def test_assert_valid_does_not_throw_for_valid():
    spec = load_agent_spec(EXAMPLES_DIR / "customer-support.agent.yaml")
    assert_valid(spec)  # should not raise


def test_assert_valid_throws_for_invalid():
    with pytest.raises(ValueError, match="AgentSpec validation failed"):
        assert_valid({})
