#!/usr/bin/env python3
"""Validador local de concepción, sin dependencias externas."""
from pathlib import Path
import re
import sys
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
ERRORS = []
all_md = sorted(ROOT.rglob("*.md"))

def error(msg):
    ERRORS.append(msg)

for file in all_md:
    text = file.read_text(encoding="utf-8")
    if not text.strip():
        error(f"{file.relative_to(ROOT)}: markdown vacío")
    # Reconocer enlaces Markdown sencillos; excluir imágenes y direcciones remotas.
    for target in re.findall(r"(?<!!)\[[^\]]+\]\(([^)]+)\)", text):
        target = target.strip().split(" ", 1)[0].split("#", 1)[0]
        if not target or target.startswith(("https://", "http://", "mailto:", "app://")):
            continue
        found = (file.parent / unquote(target)).resolve()
        if not found.is_relative_to(ROOT):
            error(f"{file.relative_to(ROOT)}: enlace fuera del repositorio: {target}")
        elif not found.exists():
            error(f"{file.relative_to(ROOT)}: enlace roto: {target}")

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

print(f"OK: {len(all_md)} markdown; catálogo 80 REQ, 20 NFR y 35 WBS presente.")
print("NOTA: validación estructural, NO equivale a aceptación ni ejecución de TC.")
