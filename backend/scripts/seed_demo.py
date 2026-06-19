#!/usr/bin/env python3
"""Run demo seed manually: python -m scripts.seed_demo [--force]"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal
from app.core.seed_demo import seed_demo_data
from app.core.startup import seed_default_admin, seed_roles


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Lumina Health demo patient data")
    parser.add_argument("--force", action="store_true", help="Re-seed even if demo data exists")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        seed_roles(db)
        seed_default_admin(db)
        seed_demo_data(db, force=args.force)
        print("Demo seed complete.")
        print("  Patient: patient@example.com / Password123")
        print("  Doctors: doctor@example.com + 4 specialists / Password123")
    finally:
        db.close()


if __name__ == "__main__":
    main()
