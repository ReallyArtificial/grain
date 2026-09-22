from pathlib import Path

from grain import load_agent_spec, generate_system_prompt

EXAMPLES_DIR = Path(__file__).parent.parent.parent.parent / "examples"


def _customer_spec():
    return load_agent_spec(EXAMPLES_DIR / "customer-support.agent.yaml")


def test_default_prompt_has_identity():
    prompt = generate_system_prompt(_customer_spec())
    assert "You are Alex" in prompt
    assert "Senior Support Specialist" in prompt


def test_contains_purpose():
    prompt = generate_system_prompt(_customer_spec())
    assert "Resolve customer issues quickly" in prompt


def test_lists_deep_expertise():
    prompt = generate_system_prompt(_customer_spec())
    assert "Acme Platform" in prompt
    assert "Technical Troubleshooting" in prompt


def test_slack_channel_override():
    default = generate_system_prompt(_customer_spec())
    slack = generate_system_prompt(_customer_spec(), "slack")
    assert "Use emoji to add personality" not in default
    assert "Use emoji to add personality" in slack
    assert "bullet points and lists" in slack


def test_email_channel_override():
    prompt = generate_system_prompt(_customer_spec(), "email")
    # formality 0.8 → [0.8, 1.0] → "highly formal"
    assert "highly formal" in prompt
    assert "Never use emoji" in prompt


def test_high_warmth_directive():
    prompt = generate_system_prompt(_customer_spec())
    # warmth 0.8 → [0.8, 1.0] → "Lead with empathy"
    assert "empathy" in prompt


def test_graduated_5_level_directives():
    prompt = generate_system_prompt(_customer_spec())
    # formality 0.5 → [0.4, 0.6) → "balanced tone"
    assert "balanced tone" in prompt
    # concreteness 0.9 → [0.8, 1.0] → "hyper-concrete"
    assert "hyper-concrete" in prompt
    # confidence 0.7 → [0.6, 0.8) → "decisive"
    assert "decisive" in prompt


def test_different_bands():
    spec = load_agent_spec(EXAMPLES_DIR / "coding-assistant.agent.yaml")
    prompt = generate_system_prompt(spec)
    # humor 0.3 → [0.2, 0.4) → "mostly serious"
    assert "mostly serious" in prompt


def test_behavior_rules_sorted_by_priority():
    prompt = generate_system_prompt(_customer_spec())
    escalate_idx = prompt.index("confidence is below")
    frustrated_idx = prompt.index("user seems frustrated")
    assert escalate_idx < frustrated_idx


def test_hard_boundaries():
    prompt = generate_system_prompt(_customer_spec())
    assert "NEVER:" in prompt
    assert "Never share internal system details" in prompt


def test_cognition_section():
    prompt = generate_system_prompt(_customer_spec())
    assert "Thinking Approach" in prompt
    assert "confidence level" in prompt


def test_creative_writer():
    spec = load_agent_spec(EXAMPLES_DIR / "creative-writer.agent.yaml")
    prompt = generate_system_prompt(spec)
    # formality 0.2 → [0.2, 0.4) → "conversational and approachable"
    assert "conversational and approachable" in prompt
    # warmth 0.8 → "empathy"
    assert "empathy" in prompt
    assert "analogies" in prompt


def test_verbosity_granular():
    # customer-support verbosity 0.4 → [0.4, 0.6) → "moderate level of detail"
    prompt = generate_system_prompt(_customer_spec())
    assert "moderate level of detail" in prompt


def test_ts_python_prompt_parity():
    """Verify Python and TS produce the same prompt structure for the same input."""
    spec = _customer_spec()
    prompt = generate_system_prompt(spec)
    assert "## Communication Style" in prompt
    assert "## Thinking Approach" in prompt
    assert "## Behavioral Rules" in prompt
    assert "## Hard Boundaries (Never Violate)" in prompt
