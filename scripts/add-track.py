#!/usr/bin/env python3
"""
Adiciona uma música local ao data/tracks.json.

Exemplo:
  python scripts/add-track.py "assets/music/minha-musica.mp3" \
    --title "Minha Música" --artist "Meu Artista" --album "Meu Álbum" \
    --playlist "Favoritas" --cover "assets/covers/capa.jpg"
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "tracks.json"

def slug(text: str) -> str:
    text = re.sub(r"[^a-zA-Z0-9_-]+", "-", text.strip().lower()).strip("-")
    return text or "track"

def main():
    p = argparse.ArgumentParser()
    p.add_argument("src")
    p.add_argument("--title", required=True)
    p.add_argument("--artist", required=True)
    p.add_argument("--album", default="Sem álbum")
    p.add_argument("--playlist", default="Biblioteca")
    p.add_argument("--cover", default="")
    p.add_argument("--duration", default="")
    args = p.parse_args()

    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    ids = {str(t.get("id")) for t in data.get("tracks", [])}
    base = slug(f"{args.artist}-{args.title}")
    track_id = base
    n = 2
    while track_id in ids:
        track_id = f"{base}-{n}"
        n += 1

    data.setdefault("tracks", []).append({
        "id": track_id,
        "title": args.title,
        "artist": args.artist,
        "album": args.album,
        "src": args.src.replace("\\", "/"),
        "cover": args.cover.replace("\\", "/"),
        "duration": args.duration,
        "playlist": args.playlist
    })

    CATALOG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Adicionada: {args.title} [{track_id}]")

if __name__ == "__main__":
    main()
