#!/usr/bin/env python3
"""
Preenche links do Google Drive em data/drive-links.json.

Exemplos:
  python scripts/set-drive-link.py cover "https://drive.google.com/file/d/ID/view"
  python scripts/set-drive-link.py grad-d1-01 "https://drive.google.com/file/d/ID/view"
  python scripts/set-drive-link.py "Good Morning" "https://drive.google.com/file/d/ID/view"
"""
from pathlib import Path
import json, sys

ROOT = Path(__file__).resolve().parents[1]
DRIVE = ROOT / "data" / "drive-links.json"
TRACKS = ROOT / "data" / "tracks.json"
ALBUM_ID = "graduation-ultimate-edition"

if len(sys.argv) < 3:
    raise SystemExit("Uso: python scripts/set-drive-link.py <id|titulo|cover> <link-do-drive>")

key = sys.argv[1]
url = sys.argv[2].strip()

drive = json.loads(DRIVE.read_text(encoding="utf-8"))
tracks = json.loads(TRACKS.read_text(encoding="utf-8"))["tracks"]

if key.lower() == "cover":
    drive.setdefault("albumCovers", {})[ALBUM_ID] = url
    label = "capa"
else:
    found = next((t for t in tracks if t["id"] == key), None)
    if not found:
        found = next((t for t in tracks if t["title"].casefold() == key.casefold()), None)
    if not found:
        raise SystemExit(f"Faixa não encontrada: {key}")
    drive.setdefault("tracks", {})[found["id"]] = url
    label = f'{found["title"]} ({found["id"]})'

DRIVE.write_text(json.dumps(drive, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"[OK] Link salvo para {label}.")
