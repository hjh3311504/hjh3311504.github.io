#!/usr/bin/env python3
"""UI 요구사항 인벤토리와 동결 디자인 패키지를 범위별로 검증한다."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("pyyaml이 필요합니다: pip install pyyaml")

REQ_RE = re.compile(r"^REQ-[A-Z]+-\d{3}$")
DSN_RE = re.compile(r"^DSN-\d{3}$")
SCR_RE = re.compile(r"^SCR-[A-Z]+-\d{3}$")
SHA_RE = re.compile(r"^[0-9a-f]{64}$")
DESIGN_STATUSES = {"pending", "approved", "deferred"}
SCREEN_METADATA_FIELDS = {
    "화면 ID": "id",
    "화면 이름": "title",
    "연결 REQ": "requirements",
}


def sha256_hex(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def tree_sha256(root: Path) -> str:
    digest = hashlib.sha256()
    files = sorted(path for path in root.rglob("*") if path.is_file())
    for path in files:
        relative = path.relative_to(root).as_posix().encode("utf-8")
        digest.update(relative)
        digest.update(b"\0")
        digest.update(str(path.stat().st_size).encode("ascii"))
        digest.update(b"\0")
        digest.update(bytes.fromhex(sha256_hex(path)))
        digest.update(b"\n")
    return digest.hexdigest()


def reject_symlinks(root: Path, label: str, errors: list[str]) -> bool:
    if not root.exists():
        return False
    if root.is_symlink():
        errors.append(f"{label}: symlink 금지 — {root}")
        return True
    found = False
    for path in root.rglob("*"):
        if path.is_symlink():
            errors.append(f"{label}: symlink 금지 — {path}")
            found = True
    return found


def load_yaml(path: Path, errors: list[str]):
    try:
        return yaml.safe_load(path.read_text(encoding="utf-8"))
    except (OSError, yaml.YAMLError) as exc:
        errors.append(f"{path}: YAML 읽기 실패 — {exc}")
        return None


def load_requirements(req_dir: Path, errors: list[str]) -> dict[str, dict]:
    requirements: dict[str, dict] = {}
    for path in sorted(req_dir.glob("*.yaml")):
        data = load_yaml(path, errors)
        if not isinstance(data, list):
            errors.append(f"{path}: 최상위가 리스트가 아님")
            continue
        for item in data:
            if not isinstance(item, dict):
                continue
            req_id = item.get("id")
            if not isinstance(req_id, str) or not REQ_RE.fullmatch(req_id):
                continue
            if req_id in requirements:
                errors.append(f"{path}: 요구사항 ID 중복 — {req_id}")
                continue
            requirements[req_id] = item
    return requirements


def effective_design_status(item: dict) -> str:
    explicit = item.get("design_status")
    if explicit is None:
        return "approved" if item.get("design_ref") is not None else "pending"
    return str(explicit)


def validate_requirement_state(req_id: str, item: dict, errors: list[str]) -> str:
    status = effective_design_status(item)
    design_ref = item.get("design_ref")
    defer_ref = item.get("design_defer_ref")
    if status not in DESIGN_STATUSES:
        errors.append(f"{req_id}: design_status 값 오류 — {status}")
        return status
    if status == "pending":
        if design_ref is not None:
            errors.append(f"{req_id}: pending에는 design_ref 금지")
        if defer_ref is not None:
            errors.append(f"{req_id}: pending에는 design_defer_ref 금지")
    elif status == "approved":
        if not isinstance(design_ref, str) or not DSN_RE.fullmatch(design_ref):
            errors.append(f"{req_id}: design_ref 누락 또는 형식 위반 (DSN-000)")
        if defer_ref is not None:
            errors.append(f"{req_id}: approved에는 design_defer_ref 금지")
    else:
        if design_ref is not None:
            errors.append(f"{req_id}: deferred에는 design_ref 금지")
        if not isinstance(defer_ref, str) or not defer_ref.strip():
            errors.append(f"{req_id}: deferred에는 design_defer_ref 필수")
    return status


def valid_timestamp(value) -> bool:
    if not isinstance(value, str) or not value:
        return False
    try:
        parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return False
    return parsed.tzinfo is not None


def markdown_table_cells(line: str) -> list[str] | None:
    stripped = line.strip()
    if not stripped.startswith("|") or not stripped.endswith("|"):
        return None
    return [
        cell.replace(r"\|", "|").strip()
        for cell in re.split(r"(?<!\\)\|", stripped[1:-1])
    ]


def metadata_table_start(text: str) -> tuple[list[str], int] | None:
    lines = text.splitlines()
    index = 0
    while index < len(lines) and not lines[index].strip():
        index += 1
    if index >= len(lines) or not lines[index].startswith("# "):
        return None
    index += 1
    while index < len(lines) and not lines[index].strip():
        index += 1
    if index >= len(lines) or markdown_table_cells(lines[index]) != ["항목", "내용"]:
        return None
    return lines, index


def strip_inline_code(value: str) -> str:
    stripped = value.strip()
    if len(stripped) >= 2 and stripped.startswith("`") and stripped.endswith("`"):
        return stripped[1:-1].strip()
    return stripped


def markdown_metadata_table(path: Path, text: str, errors: list[str]) -> dict:
    located = metadata_table_start(text)
    if located is None:
        errors.append(f"{path}: H1 아래 문서 정보 표 없음")
        return {}
    lines, header_index = located
    separator_index = header_index + 1
    if separator_index >= len(lines):
        errors.append(f"{path}: 문서 정보 표 구분선 누락")
        return {}
    separator = markdown_table_cells(lines[separator_index])
    if separator is None or len(separator) != 2 or not all(
        re.fullmatch(r":?-{3,}:?", cell) for cell in separator
    ):
        errors.append(f"{path}: 문서 정보 표 구분선 오류")
        return {}

    rows: dict[str, str] = {}
    index = separator_index + 1
    while index < len(lines) and lines[index].strip():
        cells = markdown_table_cells(lines[index])
        if cells is None:
            break
        if len(cells) != 2:
            errors.append(f"{path}: 문서 정보 표는 두 열이어야 함")
            return {}
        label, value = cells
        if label not in SCREEN_METADATA_FIELDS:
            errors.append(f"{path}: 알 수 없는 문서 정보 항목 — {label or '빈 항목'}")
            return {}
        if label in rows:
            errors.append(f"{path}: 문서 정보 항목 중복 — {label}")
            return {}
        rows[label] = value
        index += 1

    missing = [label for label in SCREEN_METADATA_FIELDS if label not in rows]
    if missing:
        errors.append(f"{path}: 문서 정보 항목 누락 — {', '.join(missing)}")
        return {}
    empty = [label for label, value in rows.items() if not value.strip()]
    if empty:
        errors.append(f"{path}: 문서 정보 값이 비어 있음 — {', '.join(empty)}")
        return {}

    requirements = [
        strip_inline_code(value)
        for value in rows["연결 REQ"].split(",")
        if value.strip()
    ]
    return {
        "id": strip_inline_code(rows["화면 ID"]),
        "title": strip_inline_code(rows["화면 이름"]),
        "requirements": requirements,
    }


def markdown_metadata(path: Path, errors: list[str]) -> dict:
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        errors.append(f"{path}: 읽기 실패 — {exc}")
        return {}
    if text.startswith("---\n"):
        try:
            _, raw, body = text.split("---", 2)
            data = yaml.safe_load(raw)
        except (ValueError, yaml.YAMLError) as exc:
            errors.append(f"{path}: YAML front matter 오류 — {exc}")
            return {}
        if metadata_table_start(body) is not None:
            errors.append(f"{path}: YAML front matter와 문서 정보 표를 함께 쓸 수 없음")
            return {}
        if not isinstance(data, dict):
            errors.append(f"{path}: YAML front matter가 object가 아님")
            return {}
        return data
    return markdown_metadata_table(path, text, errors)


def validate_package(
    package_dir: Path,
    expected_id: str,
    requirements: dict[str, dict],
    errors: list[str],
) -> None:
    if reject_symlinks(package_dir, "동결 패키지", errors):
        return
    manifest_path = package_dir / "manifest.yaml"
    manifest = load_yaml(manifest_path, errors)
    if not isinstance(manifest, dict):
        errors.append(f"{manifest_path}: manifest가 object가 아님")
        return
    if manifest.get("schema_version") not in {1, 2}:
        errors.append(f"{manifest_path}: 지원 schema_version은 1 또는 2")
    if manifest.get("id") != expected_id or package_dir.name != expected_id:
        errors.append(f"{manifest_path}: id와 디렉터리명이 {expected_id}와 일치하지 않음")

    package_reqs = manifest.get("requirements")
    if not isinstance(package_reqs, list) or not package_reqs:
        errors.append(f"{manifest_path}: requirements는 비어있지 않은 리스트여야 함")
        package_reqs = []
    invalid_reqs = [
        req_id
        for req_id in package_reqs
        if not isinstance(req_id, str) or not REQ_RE.fullmatch(req_id)
    ]
    if invalid_reqs:
        errors.append(f"{manifest_path}: requirements ID 형식 위반 {invalid_reqs}")
    package_reqs = [
        req_id
        for req_id in package_reqs
        if isinstance(req_id, str) and REQ_RE.fullmatch(req_id)
    ]
    if len(package_reqs) != len(set(package_reqs)):
        errors.append(f"{manifest_path}: requirements 중복")
    for req_id in package_reqs:
        item = requirements.get(req_id)
        if item is None:
            errors.append(f"{manifest_path}: 알 수 없는 요구사항 {req_id}")
        elif item.get("ui") is not True:
            errors.append(f"{manifest_path}: UI가 아닌 요구사항 포함 {req_id}")
        else:
            before = len(errors)
            status = validate_requirement_state(req_id, item, errors)
            if status != "approved" and len(errors) == before:
                errors.append(f"{manifest_path}: {req_id}가 approved 상태가 아님")
            elif status == "approved" and item.get("design_ref") != expected_id:
                errors.append(
                    f"{manifest_path}: {req_id}의 design_ref가 {expected_id}가 아님"
                )

    screens = manifest.get("screens")
    if not isinstance(screens, list) or not screens:
        errors.append(f"{manifest_path}: screens는 비어있지 않은 리스트여야 함")
        screens = []
    invalid_screens = [
        screen_id
        for screen_id in screens
        if not isinstance(screen_id, str) or not SCR_RE.fullmatch(screen_id)
    ]
    if invalid_screens:
        errors.append(f"{manifest_path}: 화면 ID 형식 위반 {invalid_screens}")
    screens = [
        screen_id
        for screen_id in screens
        if isinstance(screen_id, str) and SCR_RE.fullmatch(screen_id)
    ]
    if len(screens) != len(set(screens)):
        errors.append(f"{manifest_path}: screens 중복")

    spec = manifest.get("spec")
    if not isinstance(spec, dict):
        errors.append(f"{manifest_path}: spec object 누락")
        return
    if spec.get("status") != "approved":
        errors.append(f"{manifest_path}: 1차 문서 승인이 완료되지 않음")
    if not valid_timestamp(spec.get("approved_at")):
        errors.append(f"{manifest_path}: spec.approved_at은 timezone 포함 ISO 8601이어야 함")

    ia_path = package_dir / "spec" / "ia.md"
    reject_symlinks(package_dir / "spec", "승인 snapshot", errors)
    expected_ia = spec.get("ia_sha256")
    if not ia_path.is_file():
        errors.append(f"{manifest_path}: spec/ia.md 누락")
    elif not isinstance(expected_ia, str) or not SHA_RE.fullmatch(expected_ia):
        errors.append(f"{manifest_path}: spec.ia_sha256 형식 위반")
    elif sha256_hex(ia_path) != expected_ia:
        errors.append(f"{manifest_path}: spec/ia.md hash 불일치")

    screen_hashes = spec.get("screen_sha256")
    if not isinstance(screen_hashes, dict):
        errors.append(f"{manifest_path}: spec.screen_sha256 object 누락")
        screen_hashes = {}
    if set(screen_hashes) != set(screens):
        errors.append(f"{manifest_path}: screens와 screen_sha256 키가 일치하지 않음")

    screen_dir = package_dir / "spec" / "screens"
    actual_screen_ids = (
        {path.stem for path in screen_dir.glob("*.md")} if screen_dir.is_dir() else set()
    )
    if actual_screen_ids != set(screens):
        errors.append(f"{manifest_path}: snapshot 화면 파일과 screens가 일치하지 않음")

    covered: set[str] = set()
    for screen_id in screens:
        screen_path = screen_dir / f"{screen_id}.md"
        expected_hash = screen_hashes.get(screen_id)
        if not screen_path.is_file():
            continue
        if not isinstance(expected_hash, str) or not SHA_RE.fullmatch(expected_hash):
            errors.append(f"{manifest_path}: {screen_id} hash 형식 위반")
        elif sha256_hex(screen_path) != expected_hash:
            errors.append(f"{manifest_path}: {screen_id} hash 불일치")
        metadata = markdown_metadata(screen_path, errors)
        if metadata.get("id") != screen_id:
            errors.append(f"{screen_path}: 문서 정보의 화면 ID 불일치")
        linked = metadata.get("requirements")
        if not isinstance(linked, list) or not linked:
            errors.append(f"{screen_path}: requirements가 비어 있음")
            continue
        invalid_linked = [
            req_id
            for req_id in linked
            if not isinstance(req_id, str) or not REQ_RE.fullmatch(req_id)
        ]
        if invalid_linked:
            errors.append(f"{screen_path}: requirements ID 형식 위반 {invalid_linked}")
        covered.update(
            req_id
            for req_id in linked
            if isinstance(req_id, str) and REQ_RE.fullmatch(req_id)
        )
    if covered != set(package_reqs):
        missing = sorted(set(package_reqs) - covered)
        extra = sorted(covered - set(package_reqs))
        errors.append(
            f"{manifest_path}: requirements는 화면 문서의 연결 REQ와 정확히 일치해야 함 "
            f"(누락 {missing}, 초과 {extra})"
        )

    handoff = manifest.get("handoff")
    if not isinstance(handoff, dict):
        errors.append(f"{manifest_path}: handoff object 누락")
        return
    if handoff.get("status") != "approved":
        errors.append(f"{manifest_path}: 2차 handoff 승인이 완료되지 않음")
    if not valid_timestamp(handoff.get("approved_at")):
        errors.append(f"{manifest_path}: handoff.approved_at은 timezone 포함 ISO 8601이어야 함")
    expected_tree = handoff.get("tree_sha256")
    handoff_dir = package_dir / "handoff"
    reject_symlinks(handoff_dir, "handoff", errors)
    if not handoff_dir.is_dir() or not any(path.is_file() for path in handoff_dir.rglob("*")):
        errors.append(f"{manifest_path}: handoff 파일 누락")
    elif not isinstance(expected_tree, str) or not SHA_RE.fullmatch(expected_tree):
        errors.append(f"{manifest_path}: handoff.tree_sha256 형식 위반")
    elif tree_sha256(handoff_dir) != expected_tree:
        errors.append(f"{manifest_path}: handoff tree hash 불일치")


def print_errors(errors: list[str]) -> int:
    print(f"UI 디자인 검증 실패 ({len(errors)}건)")
    for error in errors:
        print(f"  x {error}")
    return 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("requirements_dir", type=Path)
    parser.add_argument("design_dir", type=Path)
    scope = parser.add_mutually_exclusive_group()
    scope.add_argument("--mode", choices=("inventory",))
    scope.add_argument("--package")
    scope.add_argument("--requirement", action="append")
    scope.add_argument("--all", action="store_true")
    args = parser.parse_args()
    mode = "inventory" if args.mode == "inventory" else "all"
    if args.package:
        mode = "package"
    elif args.requirement:
        mode = "requirement"

    errors: list[str] = []
    if not args.requirements_dir.is_dir():
        print(f"ERROR: 요구사항 디렉터리 없음: {args.requirements_dir}")
        return 1
    requirements = load_requirements(args.requirements_dir, errors)
    if errors:
        return print_errors(errors)
    ui_requirements = {
        req_id: item for req_id, item in requirements.items() if item.get("ui") is True
    }
    if not ui_requirements and mode in {"inventory", "all"}:
        print("UI 요구사항 없음 — 디자인 검증 생략")
        return 0

    refs: set[str] = set()
    checked_count = 0
    if mode in {"inventory", "all"}:
        checked_count = len(ui_requirements)
        for req_id, item in ui_requirements.items():
            status = validate_requirement_state(req_id, item, errors)
            if status == "approved" and isinstance(item.get("design_ref"), str):
                refs.add(item["design_ref"])
            if mode == "all" and status != "approved":
                errors.append(f"{req_id}: design_ref 누락 — 현재 상태 {status}")
    elif mode == "package":
        if not DSN_RE.fullmatch(str(args.package)):
            errors.append(f"package ID 형식 위반: {args.package}")
        else:
            refs.add(args.package)
    else:
        requested = list(dict.fromkeys(args.requirement or []))
        checked_count = len(requested)
        for req_id in requested:
            item = requirements.get(req_id)
            if item is None:
                errors.append(f"알 수 없는 요구사항: {req_id}")
                continue
            if item.get("ui") is not True:
                errors.append(f"{req_id}: UI 요구사항이 아님")
                continue
            status = validate_requirement_state(req_id, item, errors)
            if status != "approved":
                errors.append(f"{req_id}: 승인되지 않아 구현할 수 없음 — {status}")
                continue
            if isinstance(item.get("design_ref"), str):
                refs.add(item["design_ref"])

    if refs and not args.design_dir.is_dir():
        errors.append(f"디자인 디렉터리 없음: {args.design_dir}")
    for design_ref in sorted(refs):
        package_dir = args.design_dir / "packages" / design_ref
        if not package_dir.is_dir():
            errors.append(f"{design_ref}: 승인 패키지 없음 — {package_dir}")
            continue
        validate_package(package_dir, design_ref, requirements, errors)

    if errors:
        return print_errors(errors)
    print(
        f"UI 디자인 검증 통과: mode={mode}, UI REQ {checked_count}개, 패키지 {len(refs)}개"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
