"""Looks for prompt-injection attempts hidden in a document's text."""

import re

# Phrases that typically mark an attempt to redirect the model. Matched case-insensitively.
SUSPICIOUS_PATTERNS = [
    r"ignore (all |any )?(the )?(previous|prior|above) instructions",
    r"disregard (all |any )?(the )?(previous|prior|above) instructions",
    r"forget (all |any )?(your |the )?(previous|prior) instructions",
    r"reveal your (instructions|prompt)",
    r"system prompt",
]


def find_injection(text: str) -> list[str]:
    """Return the suspicious phrases found in the text, or an empty list."""
    text = " ".join(text.split())  # tidy up line breaks and extra spaces
    found = []
    for pattern in SUSPICIOUS_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            found.append(match.group(0))
    return found