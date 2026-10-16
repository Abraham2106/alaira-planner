#!/usr/bin/env python3
"""Validador local de concepción, sin dependencias externas."""
from pathlib import Path
import re
import sys
from urllib.parse import unquote

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
ERRORS = []
all_md = sorted(ROOT.rglob("*.md"))

def error(msg):
    ERRORS.append(msg)

def local_links(file, text):
    """Enlaces Markdown locales resueltos; excluye imágenes y direcciones remotas."""
    for target in re.findall(r"(?<!!)\[[^\]]+\]\(([^)]+)\)", text):
        target = target.strip().split(" ", 1)[0].split("#", 1)[0]
        if not target or target.startswith(("https://", "http://", "mailto:", "app://")):
            continue
        yield target, (file.parent / unquote(target)).resolve()

for file in all_md:
    text = file.read_text(encoding="utf-8")
    if not text.strip():
        error(f"{file.relative_to(ROOT)}: markdown vacío")
    for target, found in local_links(file, text):
        if not found.is_relative_to(ROOT):
            error(f"{file.relative_to(ROOT)}: enlace fuera del repositorio: {target}")
        elif not found.exists():
            error(f"{file.relative_to(ROOT)}: enlace roto: {target}")

index_file = ROOT / "docs/INDEX.md"
if index_file.exists():
    indexed = {found for _, found in local_links(index_file, index_file.read_text(encoding="utf-8"))}
    for file in sorted((ROOT / "docs").rglob("*.md")):
        if file != index_file and file.resolve() not in indexed:
            error(f"docs/INDEX.md no enlaza {file.relative_to(ROOT).as_posix()}")
else:
    error("Falta docs/INDEX.md")

srs_file = ROOT / "docs/requirements/SRS.md"
if srs_file.exists():
    srs = srs_file.read_text(encoding="utf-8")
    reqs = set(re.findall(r"REQ-\d{3}", srs))
    nfrs = set(re.findall(r"NFR-\d{3}", srs))
    for i in range(1, 81):
        if f"REQ-{i:03d}" not in reqs:
            error(f"SRS falta REQ-{i:03d}")
    for i in range(1, 21):
        if f"NFR-{i:03d}" not in nfrs:
            error(f"SRS falta NFR-{i:03d}")
else:
    error("Falta docs/requirements/SRS.md")

dictionary = ROOT / "docs/planning/WBS_DICTIONARY.md"
if dictionary.exists():
    content = dictionary.read_text(encoding="utf-8")
    ids = set(re.findall(r"WBS-[1-8]\.\d+", content))
    if len(ids) != 35:
        error(f"Esperados 35 paquetes WBS terminales, detectados {len(ids)}")
else:
    error("Falta WBS_DICTIONARY.md")

if ERRORS:
    print("VALIDACIÓN FALLIDA")
    for issue in ERRORS:
        print(f"- {issue}")
    sys.exit(1)

print(f"OK: {len(all_md)} markdown; índice completo; catálogo 80 REQ, 20 NFR y 35 WBS presente.")
print("NOTA: validación estructural, NO equivale a aceptación ni ejecución de TC.")
