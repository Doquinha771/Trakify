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
            video=str(disc.get("youtube", ""))
            if video and not re.fullmatch(r"[A-Za-z0-9_-]{11}", video):
                errors.append(f"{album.get('title')}, disco {d_i}: youtube inválido")
            tracks=disc.get("tracks",[])
            if not tracks: errors.append(f"{album.get('title')}, disco {d_i}: sem faixas")
            last=-1
            for t_i,t in enumerate(tracks,1):
                for key in ("title","artist"):
                    if not t.get(key): errors.append(f"{album.get('title')} D{d_i} T{t_i}: falta {key}")
                local=t.get("localFile")
                if not local:
                    errors.append(f"{album.get('title')} D{d_i} T{t_i}: falta localFile")
                elif not (ROOT/local).is_file():
                    errors.append(f"{album.get('title')} D{d_i} T{t_i}: arquivo local inexistente: {local}")
                start=t.get("start")
                if not isinstance(start,(int,float)) or start < 0:
                    errors.append(f"{album.get('title')} D{d_i} T{t_i}: start inválido")
                elif start <= last:
                    errors.append(f"{album.get('title')} D{d_i} T{t_i}: start deve crescer dentro do disco")
                if isinstance(start,(int,float)): last=start

if errors:
    print("\n".join("[ERRO] "+e for e in errors)); sys.exit(1)
count=sum(len(d.get("tracks",[])) for a in albums for d in a.get("discs",[]))
size=sum((ROOT/t["localFile"]).stat().st_size for a in albums for d in a.get("discs",[]) for t in d.get("tracks",[]))
print(f"[OK] {len(albums)} álbum(ns), {count} faixa(s), áudio local validado ({size/1024/1024:.2f} MiB).")
