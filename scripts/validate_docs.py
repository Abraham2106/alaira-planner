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
SKIP_DIR_NAMES = {"node_modules", "dist", ".git", "coverage"}


def is_skipped(path: Path) -> bool:
    return any(part in SKIP_DIR_NAMES for part in path.parts)


all_md = sorted(p for p in ROOT.rglob("*.md") if not is_skipped(p))

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
        if is_skipped(file):
            continue
        if file != index_file and file.resolve() not in indexed:
            error(f"docs/INDEX.md no enlaza {file.relative_to(ROOT).as_posix()}")
else:
    error("Falta docs/INDEX.md")

def contiguous_catalog(prefix, text):
    """Filas de tabla `| PREFIX-NNN |` del SRS; exige numeración 1..máximo sin huecos ni duplicados."""
    rows = [int(n) for n in re.findall(rf"^\| {prefix}-(\d{{3}}) \|", text, re.MULTILINE)]
    if not rows:
        error(f"SRS sin filas {prefix}")
        return 0
    for n in sorted({n for n in rows if rows.count(n) > 1}):
        error(f"SRS define {prefix}-{n:03d} más de una vez")
    for i in range(1, max(rows) + 1):
        if i not in rows:
            error(f"SRS falta {prefix}-{i:03d}")
    return max(rows)

req_count = nfr_count = 0
srs_file = ROOT / "docs/requirements/SRS.md"
if srs_file.exists():
    srs = srs_file.read_text(encoding="utf-8")
    req_count = contiguous_catalog("REQ", srs)
    nfr_count = contiguous_catalog("NFR", srs)
else:
    error("Falta docs/requirements/SRS.md")

wbs_count = 0
wbs_file = ROOT / "docs/planning/WBS.md"
dictionary = ROOT / "docs/planning/WBS_DICTIONARY.md"
if wbs_file.exists() and dictionary.exists():
    tree = re.search(r"```text\n(.*?)```", wbs_file.read_text(encoding="utf-8"), re.DOTALL)
    leaves = set(re.findall(r"^ {4}(\d\.\d+) ", tree.group(1), re.MULTILINE)) if tree else set()
    defined = set(re.findall(r"^\| WBS-(\d\.\d+) \|", dictionary.read_text(encoding="utf-8"), re.MULTILINE))
    if not leaves:
        error("WBS.md sin árbol de paquetes terminales")
    for wbs in sorted(leaves - defined):
        error(f"WBS-{wbs} está en el árbol pero no en el diccionario")
    for wbs in sorted(defined - leaves):
        error(f"WBS-{wbs} está en el diccionario pero no en el árbol")
    wbs_count = len(leaves)
else:
    error("Falta WBS.md o WBS_DICTIONARY.md")

if ERRORS:
    print("VALIDACIÓN FALLIDA")
    for issue in ERRORS:
        print(f"- {issue}")
    sys.exit(1)

print(f"OK: {len(all_md)} markdown; índice completo; catálogo {req_count} REQ, {nfr_count} NFR y {wbs_count} WBS coherente.")
print("NOTA: validación estructural, NO equivale a aceptación ni ejecución de TC.")
