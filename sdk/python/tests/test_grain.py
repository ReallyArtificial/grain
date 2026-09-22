import copy
import json
from pathlib import Path

import pytest

from grain import Grain

EXAMPLES_DIR = Path(__file__).parent.parent.parent.parent / "examples"
CUSTOMER_FILE = EXAMPLES_DIR / "customer-support.agent.yaml"


# =========================================================================
# CONSTRUCTION
# =========================================================================

class TestConstruction:
    def test_create_with_just_id(self):
        g = Grain.create("test-bot")
        assert g.id == "test-bot"
        assert g.name == "test-bot"
        assert g.version == "1.0.0"
        assert g.is_valid

    def test_create_with_name_and_description(self):
        g = Grain.create("my-bot", name="My Bot", description="Does things")
        assert g.name == "My Bot"
        assert g.data["meta"]["description"] == "Does things"

    def test_from_string_yaml(self):
        content = CUSTOMER_FILE.read_text()
        g = Grain.from_string(content)
        assert g.id == "acme-support-agent"
        assert g.name == "Acme Support Agent"

    def test_from_string_json(self):
        content = CUSTOMER_FILE.read_text()
        g1 = Grain.from_string(content)
        json_str = g1.to_json()
        g2 = Grain.from_string(json_str)
        assert g2.id == "acme-support-agent"

    def test_load_from_file(self):
        g = Grain.load(CUSTOMER_FILE)
        assert g.id == "acme-support-agent"
        assert g.data["identity"]["name"] == "Alex"
        assert g.data["voice"]["personality"]["warmth"] == 0.8

    def test_of_from_plain_dict(self):
        g1 = Grain.load(CUSTOMER_FILE)
        g2 = Grain.of(copy.deepcopy(g1.data))
        assert g2.id == g1.id
        assert g2.name == g1.name

    def test_invalid_data_raises(self):
        with pytest.raises(ValueError, match="AgentSpec validation failed"):
            Grain.from_string('specVersion: "1.0"\nid: bad\n')


# =========================================================================
# IMMUTABILITY
# =========================================================================

class TestImmutability:
    def test_add_rule_returns_new_grain(self):
        g1 = Grain.create("test-bot")
        g2 = g1.add_rule({
            "id": "test-rule",
            "condition": {"type": "always"},
            "action": {"type": "require-confirmation"},
        })
        assert len(g1.rules) == 0
        assert len(g2.rules) == 1
        assert g1 is not g2


# =========================================================================
# COLLECTIONS
# =========================================================================

class TestCollections:
    def test_add_remove_rules(self):
        rule1 = {"id": "r1", "condition": {"type": "always"}, "action": {"type": "require-confirmation"}}
        rule2 = {"id": "r2", "condition": {"type": "always"}, "action": {"type": "require-confirmation"}}

        g = Grain.create("test-bot")
        g = g.add_rule(rule1)
        assert len(g.rules) == 1
        assert g.has_rule("r1")

        g = g.add_rules([rule2])
        assert len(g.rules) == 2

        g = g.remove_rule("r1")
        assert len(g.rules) == 1
        assert not g.has_rule("r1")
        assert g.has_rule("r2")

    def test_add_remove_boundaries(self):
        b1 = {"description": "No PII", "category": "data", "enforcement": "hard", "onViolation": "refuse"}
        b2 = {"description": "No violence", "category": "content", "enforcement": "hard", "onViolation": "refuse"}

        g = Grain.create("test-bot")
        g = g.add_boundary(b1)
        assert len(g.boundaries) == 1

        g = g.add_boundaries([b2])
        assert len(g.boundaries) == 2

        g = g.remove_boundary("No PII")
        assert len(g.boundaries) == 1
        assert g.boundaries[0]["description"] == "No violence"

    def test_add_remove_tools(self):
        t1 = {"id": "search", "usage": "Search the web"}
        t2 = {"id": "calc", "usage": "Do math"}

        g = Grain.create("test-bot")
        g = g.add_tool(t1)
        assert len(g.tools) == 1
        assert g.has_tool("search")

        g = g.add_tools([t2])
        assert len(g.tools) == 2

        g = g.remove_tool("search")
        assert len(g.tools) == 1
        assert not g.has_tool("search")
        assert g.has_tool("calc")

    def test_add_remove_skills(self):
        s1 = {"name": "summarize", "description": "Summarize text"}
        s2 = {"name": "translate", "description": "Translate text"}

        g = Grain.create("test-bot")
        g = g.add_skill(s1)
        assert len(g.skills) == 1
        assert g.has_skill("summarize")

        g = g.add_skills([s2])
        assert len(g.skills) == 2

        g = g.remove_skill("summarize")
        assert len(g.skills) == 1
        assert not g.has_skill("summarize")
        assert g.has_skill("translate")

    def test_add_remove_expertise(self):
        g = Grain.create("test-bot")
        g = g.add_expertise("TypeScript", 0.9)
        assert len(g.expertise) == 1
        assert g.expertise[0]["domain"] == "TypeScript"

        g = g.add_expertise("Python", 0.8)
        assert len(g.expertise) == 2

        g = g.remove_expertise("TypeScript")
        assert len(g.expertise) == 1
        assert g.expertise[0]["domain"] == "Python"


# =========================================================================
# PERSONALITY
# =========================================================================

class TestPersonality:
    def test_set_personality_changes_dim(self):
        g1 = Grain.create("test-bot")
        g2 = g1.set_personality("warmth", 0.9)
        assert g2.personality["warmth"] == 0.9
        assert g1.personality["warmth"] != 0.9

    def test_validates_range(self):
        g = Grain.create("test-bot")
        with pytest.raises(ValueError):
            g.set_personality("warmth", 1.5)
        with pytest.raises(ValueError):
            g.set_personality("warmth", -0.1)

    def test_boundary_values_valid(self):
        g = Grain.create("test-bot")
        g.set_personality("warmth", 0)
        g.set_personality("warmth", 1)


# =========================================================================
# SET / GET
# =========================================================================

class TestSetGet:
    def test_deep_path(self):
        g1 = Grain.create("test-bot")
        g2 = g1.set("identity.role", "Expert Bot")
        assert g2.get("identity.role") == "Expert Bot"
        assert g1.get("identity.role") == "AI Assistant"

    def test_get_nested_values(self):
        g = Grain.load(CUSTOMER_FILE)
        assert g.get("voice.personality.warmth") == 0.8
        assert g.get("meta.name") == "Acme Support Agent"


# =========================================================================
# MERGE
# =========================================================================

class TestMerge:
    def test_second_wins_on_conflicts(self):
        g1 = Grain.create("bot-a", name="Bot A", description="First")
        g2 = Grain.create("bot-b", name="Bot B", description="Second")
        merged = g1.merge(g2)
        assert merged.id == "bot-b"
        assert merged.name == "Bot B"

    def test_preserves_non_conflicting(self):
        g1 = Grain.create("bot-a").set_personality("warmth", 0.9)
        g2 = Grain.create("bot-b").set_personality("humor", 0.8)
        merged = g1.merge(g2)
        assert merged.personality["humor"] == 0.8


# =========================================================================
# QUERY
# =========================================================================

class TestQuery:
    def test_missing_items(self):
        g = Grain.create("test-bot")
        assert not g.has_rule("nonexistent")
        assert not g.has_tool("nonexistent")
        assert not g.has_skill("nonexistent")

    def test_existing_items(self):
        g = Grain.load(CUSTOMER_FILE)
        assert g.has_rule("greet-warmly")
        assert g.has_tool("knowledge-base-search")


# =========================================================================
# OUTPUT
# =========================================================================

class TestOutput:
    def test_to_string_strips_metadata(self):
        g = Grain.load(CUSTOMER_FILE)
        output = g.to_string()
        assert "specVersion:" not in output
        assert "identity:" in output
        assert "voice:" in output
        assert "behavior:" in output

    def test_to_string_no_observability_or_adaptation(self):
        g = Grain.load(CUSTOMER_FILE)
        output = g.to_string()
        assert "observability:" not in output
        assert "adaptation:" not in output

    def test_to_string_applies_channel_overrides(self):
        g = Grain.load(CUSTOMER_FILE)
        slack_output = g.to_string("slack")
        assert "0.3" in slack_output

    def test_to_prompt(self):
        g = Grain.load(CUSTOMER_FILE)
        prompt = g.to_prompt()
        assert "You are Alex" in prompt

    def test_to_prompt_channel(self):
        g = Grain.load(CUSTOMER_FILE)
        slack_prompt = g.to_prompt("slack")
        assert "Use emoji to add personality" in slack_prompt

    def test_to_yaml_full(self):
        g = Grain.load(CUSTOMER_FILE)
        y = g.to_yaml()
        assert "specVersion:" in y
        assert "acme-support-agent" in y

    def test_to_json_valid(self):
        g = Grain.load(CUSTOMER_FILE)
        j = g.to_json()
        parsed = json.loads(j)
        assert parsed["specVersion"] == "1.0"
        assert parsed["id"] == "acme-support-agent"
        assert "observability" in parsed


# =========================================================================
# DIFF
# =========================================================================

class TestDiff:
    def test_identical_empty_diff(self):
        g1 = Grain.load(CUSTOMER_FILE)
        g2 = Grain.load(CUSTOMER_FILE)
        d = g1.diff(g2)
        assert len(d) == 0

    def test_modified_correct_paths(self):
        g1 = Grain.create("test-bot")
        g2 = g1.set_personality("warmth", 0.9)
        d = g1.diff(g2)
        assert "voice.personality.warmth" in d
        assert d["voice.personality.warmth"]["after"] == 0.9


# =========================================================================
# VALIDATE
# =========================================================================

class TestValidate:
    def test_valid_grain_empty_errors(self):
        g = Grain.load(CUSTOMER_FILE)
        assert len(g.validate()) == 0
