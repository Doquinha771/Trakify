#!/usr/bin/env python3
from pathlib import Path
import json, sys, subprocess

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
    local_files=set()
    for a_i,album in enumerate(albums,1):
        for key in ("id","title","artist","discs"):
            if not album.get(key): errors.append(f"Álbum {a_i}: falta {key}")
        if album.get("id") in album_ids: errors.append(f"Álbum duplicado: {album.get('id')}")
        album_ids.add(album.get("id"))
        if not isinstance(album.get("discs"),list): continue
        for d_i,disc in enumerate(album["discs"],1):
            tracks=disc.get("tracks",[])
            if not tracks: errors.append(f"{album.get('title')}, disco {d_i}: sem faixas")
            for t_i,t in enumerate(tracks,1):
                for key in ("title","artist","localFile"):
                    if not t.get(key): errors.append(f"{album.get('title')} D{d_i} T{t_i}: falta {key}")
                local=t.get("localFile")
                if not local: continue
                if local in local_files: errors.append(f"Arquivo local duplicado na biblioteca: {local}")
                local_files.add(local)
                f=ROOT/local
                if not f.is_file():
                    errors.append(f"{album.get('title')} D{d_i} T{t_i}: arquivo local inexistente: {local}")
                    continue
                try:
                    r=subprocess.run(["ffprobe","-v","error","-show_entries","stream=codec_name","-of","default=nw=1:nk=1",str(f)], capture_output=True, text=True, timeout=15)
                    if r.returncode != 0 or "mp3" not in r.stdout.lower():
                        errors.append(f"{local}: MP3 inválido ou não decodificável")
                except Exception as e:
                    errors.append(f"{local}: falha ao validar áudio ({e})")

if errors:
    print("\n".join("[ERRO] "+e for e in errors)); sys.exit(1)
count=sum(len(d.get("tracks",[])) for a in albums for d in a.get("discs",[]))
size=sum((ROOT/t["localFile"]).stat().st_size for a in albums for d in a.get("discs",[]) for t in d.get("tracks",[]) if (ROOT/t.get("localFile","")).is_file())
print(f"[OK] {len(albums)} álbum(ns), {count} faixa(s), áudio local validado ({size/1024/1024:.2f} MiB).")
