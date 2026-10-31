"""Minimal smoke-test: one chat completion via Sarvam AI."""

import os
import sys

# ── Load .env (no extra deps) ────────────────────────────────────────────────
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.isfile(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

api_key = os.environ.get("SARVAM_API_KEY")
if not api_key:
    sys.exit("ERROR: SARVAM_API_KEY is not set. Paste your key into .env first.")

# ── Call Sarvam ──────────────────────────────────────────────────────────────
from sarvamai import SarvamAI

client = SarvamAI(api_subscription_key=api_key)

response = client.chat.completions(
    model="sarvam-105b-conversations",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Say hello in Hindi, Marathi, and Tamil — one line each."},
    ],
)

import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
print(response.choices[0].message.content)
