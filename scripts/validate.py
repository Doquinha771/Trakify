#!/usr/bin/env python3
from pathlib import Path
import json, re, sys

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / "data" / "library.json"
errors=[]
try:
    data=json.loads(FILE.read_text(encoding="utf-8"))
except Exception as e:
    raise SystemExit(f"[ERRO] library.json inválido: {e}")

albums=data.get("albums")
if not isinstance(albums,list) or not albums:
    errors.append("albums precisa ser uma lista não vazia")
else:
    album_ids=set()
    for a_i,album in enumerate(albums,1):
        for key in ("id","title","cover","banner","discs"):
            if not album.get(key): errors.append(f"Álbum {a_i}: falta {key}")
        if album.get("id") in album_ids: errors.append(f"Álbum duplicado: {album.get('id')}")
        album_ids.add(album.get("id"))
        if not isinstance(album.get("discs"),list): continue
        for d_i,disc in enumerate(album["discs"],1):
            tracks=disc.get("tracks",[])
            if not tracks: errors.append(f"{album.get('title')}, disco {d_i}: sem faixas")
            for t_i,t in enumerate(tracks,1):
                for key in ("title","artist","file"):
                    if not t.get(key): errors.append(f"{album.get('title')} D{d_i} T{t_i}: falta {key}")
                if t.get("file") and not re.fullmatch(r"[A-Za-z0-9_-]{10,}", str(t["file"])):
                    errors.append(f"{album.get('title')} D{d_i} T{t_i}: file deve ser só o ID do Drive")

if errors:
    print("\n".join("[ERRO] "+e for e in errors)); sys.exit(1)
count=sum(len(d.get("tracks",[])) for a in albums for d in a.get("discs",[]))
print(f"[OK] {len(albums)} álbum(ns), {count} faixa(s).")
