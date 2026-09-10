#!/usr/bin/env python3
"""현재 UI 요구사항과 화면 설계 문서의 연결을 범위별로 검증한다."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("pyyaml이 필요합니다: python3 -m pip install pyyaml")

REQ_RE = re.compile(r"^REQ-[A-Z]+-\d{3}$")
SCR_RE = re.compile(r"^SCR-[A-Z]+-\d{3}$")
DESIGN_STATUSES = {"pending", "approved", "deferred"}
SCREEN_METADATA_FIELDS = {
    "화면 ID": "id",
    "화면 이름": "title",
    "연결 REQ": "requirements",
}


def load_requirements(req_dir: Path, errors: list[str]) -> dict[str, dict]:
    requirements: dict[str, dict] = {}
    for path in sorted(req_dir.glob("*.yaml")):
        try:
            data = yaml.safe_load(path.read_text(encoding="utf-8"))
        except (OSError, yaml.YAMLError) as exc:
            errors.append(f"{path}: YAML 읽기 실패 — {exc}")
            continue
        if not isinstance(data, list):
            errors.append(f"{path}: 최상위가 리스트가 아님")
            continue
        for item in data:
            if not isinstance(item, dict):
                errors.append(f"{path}: 요구사항 항목은 object여야 함")
                continue
            req_id = item.get("id")
            if not isinstance(req_id, str) or not REQ_RE.fullmatch(req_id):
                errors.append(f"{path}: 요구사항 ID 형식 위반 — {req_id}")
                continue
            if req_id in requirements:
                errors.append(f"{path}: 요구사항 ID 중복 — {req_id}")
                continue
            requirements[req_id] = item
    return requirements


def valid_screen_ref(value) -> bool:
    if not isinstance(value, str) or "\\" in value:
        return False
    parts = value.split("/")
    return (
        len(parts) >= 2
        and parts[0] == "screens"
        and all(part not in {"", ".", ".."} for part in parts)
        and value.endswith(".md")
    )


def effective_design_status(item: dict) -> str:
    explicit = item.get("design_status")
    if explicit is None:
        return "approved" if item.get("design_ref") is not None else "pending"
    return str(explicit)


def validate_requirement_state(req_id: str, item: dict, errors: list[str]) -> str:
    status = effective_design_status(item)
    refs = item.get("design_ref")
    defer_ref = item.get("design_defer_ref")
    if status not in DESIGN_STATUSES:
        errors.append(f"{req_id}: design_status 값 오류 — {status}")
    elif status == "approved":
        if not isinstance(refs, list) or not refs:
            errors.append(f"{req_id}: design_ref는 화면 경로의 비어 있지 않은 목록이어야 함")
        elif any(not valid_screen_ref(ref) for ref in refs):
            errors.append(f"{req_id}: design_ref는 screens/ 아래 Markdown 상대경로여야 함")
        elif len(refs) != len(set(refs)):
            errors.append(f"{req_id}: design_ref 중복")
        if defer_ref is not None:
            errors.append(f"{req_id}: approved에는 design_defer_ref 금지")
    elif status == "pending":
        if refs is not None:
            errors.append(f"{req_id}: pending에는 design_ref 금지")
        if defer_ref is not None:
            errors.append(f"{req_id}: pending에는 design_defer_ref 금지")
    else:
        if refs is not None:
            errors.append(f"{req_id}: deferred에는 design_ref 금지")
        if not isinstance(defer_ref, str) or not defer_ref.strip():
            errors.append(f"{req_id}: deferred에는 design_defer_ref 필수")
    return status


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


def screen_refs(item: dict) -> set[str]:
    refs = item.get("design_ref")
    return {ref for ref in refs if valid_screen_ref(ref)} if isinstance(refs, list) else set()


def local_file(path: Path, root: Path, errors: list[str]) -> bool:
    # symlink로 검사 범위 밖 파일을 읽거나 경로를 우회하지 않는다.
    current = path
    while current != root:
        if current.is_symlink():
            errors.append(f"{path}: symlink 금지")
            return False
        current = current.parent
    if root.is_symlink():
        errors.append(f"{root}: symlink 금지")
        return False
    if not path.is_file():
        errors.append(f"{path}: 파일 누락")
        return False
    return True


def validate_screens(
    design_dir: Path,
    requirements: dict[str, dict],
    selected: set[str],
    partial: bool,
    errors: list[str],
) -> int:
    if not design_dir.is_dir():
        errors.append(f"디자인 디렉터리 없음: {design_dir}")
        return 0
    local_file(design_dir / "ia.md", design_dir, errors)
    expected = {
        ref
        for req_id in selected
        for ref in screen_refs(requirements[req_id])
    }
    candidates = set((design_dir / "screens").rglob("*.md"))
    candidates.update(design_dir / ref for ref in expected)
    seen: dict[str, Path] = {}
    checked = 0
    for path in sorted(candidates):
        ref = path.relative_to(design_dir).as_posix()
        file_errors: list[str] = []
        if not local_file(path, design_dir, file_errors):
            if not partial or ref in expected:
                errors.extend(file_errors)
            continue
        metadata = markdown_metadata(path, file_errors)
        linked = metadata.get("requirements")
        linked_ids = (
            {value for value in linked if isinstance(value, str)}
            if isinstance(linked, list)
            else set()
        )
        # 선택한 REQ를 역으로 참조하는 화면도 검사해 누락된 design_ref를 찾는다.
        if partial and ref not in expected and not (selected & linked_ids):
            continue
        checked += 1
        errors.extend(file_errors)
        screen_id = metadata.get("id")
        if not isinstance(screen_id, str) or not SCR_RE.fullmatch(screen_id):
            errors.append(f"{path}: 화면 ID 형식 위반 — {screen_id}")
        else:
            if screen_id != path.stem:
                errors.append(f"{path}: 문서 정보의 화면 ID와 파일명 불일치")
            if screen_id in seen:
                errors.append(f"{path}: 화면 ID 중복 — {screen_id} ({seen[screen_id]})")
            seen[screen_id] = path
        title = metadata.get("title")
        if not isinstance(title, str) or not title.strip():
            errors.append(f"{path}: 화면 이름 누락")
        if not isinstance(linked, list) or not linked:
            errors.append(f"{path}: 연결 REQ는 비어 있지 않은 목록이어야 함")
            linked = []
        if any(not isinstance(value, str) or not REQ_RE.fullmatch(value) for value in linked):
            errors.append(f"{path}: 연결 REQ ID 형식 위반")
        if len(linked) != len(linked_ids):
            errors.append(f"{path}: 연결 REQ 중복 또는 잘못된 값")
        for req_id in sorted(linked_ids):
            item = requirements.get(req_id)
            if item is None:
                errors.append(f"{path}: 알 수 없는 요구사항 — {req_id}")
            elif item.get("ui") is not True:
                errors.append(f"{path}: UI가 아닌 요구사항 — {req_id}")
            elif req_id in selected and effective_design_status(item) == "approved":
                if ref not in screen_refs(item):
                    errors.append(f"{path}: {req_id}의 design_ref에 화면 연결 누락")
        for req_id in sorted(selected):
            if ref in screen_refs(requirements[req_id]) and req_id not in linked_ids:
                errors.append(f"{path}: 연결 REQ에 {req_id} 누락")
    return checked


def print_errors(errors: list[str]) -> int:
    print(f"UI 디자인 검증 실패 ({len(errors)}건)")
    for error in errors:
        print(f"  x {error}")
    return 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("requirements_dir", type=Path)
    parser.add_argument("design_dir", type=Path)
    scope = parser.add_mutually_exclusive_group()
    scope.add_argument("--mode", choices=("inventory",))
    scope.add_argument("--requirement", action="append")
    scope.add_argument("--all", action="store_true")
    args = parser.parse_args(argv)
    mode = "requirement" if args.requirement else (args.mode or "all")
    errors: list[str] = []
    if not args.requirements_dir.is_dir():
        return print_errors([f"요구사항 디렉터리 없음: {args.requirements_dir}"])
    requirements = load_requirements(args.requirements_dir, errors)
    if errors:
        return print_errors(errors)
    if args.requirement:
        selected = set(args.requirement)
        for req_id in sorted(selected):
            if req_id not in requirements:
                errors.append(f"알 수 없는 요구사항: {req_id}")
            elif requirements[req_id].get("ui") is not True:
                errors.append(f"{req_id}: UI 요구사항이 아님")
        if errors:
            return print_errors(errors)
    else:
        selected = {
            req_id for req_id, item in requirements.items() if item.get("ui") is True
        }
    for req_id in sorted(selected):
        status = validate_requirement_state(req_id, requirements[req_id], errors)
        if mode != "inventory" and status != "approved":
            errors.append(f"{req_id}: 승인되지 않은 UI 요구사항 — {status}")
    if not selected:
        print("UI 요구사항 없음 — 디자인 검증 생략")
        return 0
    screen_requirements = selected
    if mode == "inventory":
        # 미승인 항목은 위에서 상태만 검사한다. 설계 작성 전에도 목록을 확인할 수 있다.
        screen_requirements = {
            req_id
            for req_id in selected
            if effective_design_status(requirements[req_id]) == "approved"
        }
    checked = 0
    if screen_requirements:
        checked = validate_screens(
            args.design_dir, requirements, screen_requirements, mode != "all", errors
        )
    if errors:
        return print_errors(errors)
    print(f"UI 디자인 검증 통과: mode={mode}, UI REQ {len(selected)}개, 화면 {checked}개")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
