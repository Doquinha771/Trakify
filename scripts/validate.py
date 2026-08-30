#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import urlparse
import json, sys

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
    album_ids=set(); urls=set()
    for a_i,album in enumerate(albums,1):
        for key in ("id","title","artist","discs"):
            if not album.get(key): errors.append(f"Álbum {a_i}: falta {key}")
        if album.get("id") in album_ids: errors.append(f"Álbum duplicado: {album.get('id')}")
        album_ids.add(album.get("id"))
        for d_i,disc in enumerate(album.get("discs",[]),1):
            tracks=disc.get("tracks",[])
            if not tracks: errors.append(f"{album.get('title')}, disco {d_i}: sem faixas")
            for t_i,t in enumerate(tracks,1):
                for key in ("title","artist","archiveUrl"):
                    if not t.get(key): errors.append(f"{album.get('title')} D{d_i} T{t_i}: falta {key}")
                url=t.get("archiveUrl","")
                if not url: continue
                p=urlparse(url)
                if p.scheme != "https" or p.netloc != "archive.org" or "/download/graduation-ultimate-edition/" not in p.path:
                    errors.append(f"URL inesperada em {t.get('title')}: {url}")
                if url in urls: errors.append(f"URL duplicada: {url}")
                urls.add(url)


if errors:
    print("\n".join("[ERRO] "+e for e in errors)); sys.exit(1)
count=sum(len(d.get("tracks",[])) for a in albums for d in a.get("discs",[]))
print(f"[OK] {len(albums)} álbum(ns), {count} faixa(s), todas configuradas para o Internet Archive.")
