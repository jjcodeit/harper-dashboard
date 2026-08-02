#!/usr/bin/env python3
"""Push Harper's current SQLite state through the canonical Convex sync.

This wrapper deliberately does not duplicate the mutation payload schema. The
virtual-investor engine owns that contract and keeps it aligned with Convex.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parents[1]
SKILL_DIR = Path.home() / ".hermes" / "skills" / "finance" / "virtual-investor"
PORTFOLIO_SCRIPT = SKILL_DIR / "scripts" / "portfolio.py"


def load_env() -> dict[str, str]:
    env = os.environ.copy()
    env["PYTHONPATH"] = ""
    for env_file in (PROJECT_DIR / ".env.local", PROJECT_DIR / ".env"):
        if not env_file.exists():
            continue
        for raw_line in env_file.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            env.setdefault(key.strip(), value.strip().strip('"').strip("'"))
    return env


def main() -> int:
    if not PORTFOLIO_SCRIPT.exists():
        print(f"Harper engine not found at {PORTFOLIO_SCRIPT}", file=sys.stderr)
        return 1
    result = subprocess.run(
        [sys.executable, str(PORTFOLIO_SCRIPT), "convex-sync"],
        cwd=SKILL_DIR,
        env=load_env(),
        text=True,
        check=False,
    )
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
