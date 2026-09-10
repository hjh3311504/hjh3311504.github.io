"""현재 설계 연결 validator의 성공·실패와 범위를 검증한다."""

import contextlib
import copy
import importlib.util
import io
import shutil
import tempfile
import unittest
from pathlib import Path

import yaml

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "verify_ui_design.py"
SPEC = importlib.util.spec_from_file_location("verify_ui_design", SCRIPT)
validator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(validator)

REQ = "REQ-WEB-001"
OTHER = "REQ-WEB-002"
SCREEN = "screens/SCR-WEB-001.md"
SECOND = "screens/SCR-WEB-002.md"


class DesignValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.req_dir = self.root / "requirements"
        self.design = self.root / "design"
        self.req_dir.mkdir()
        (self.design / "screens").mkdir(parents=True)
        (self.design / "ia.md").write_text("# 정보 구조\n", encoding="utf-8")
        self.items = [{"id": REQ, "ui": True, "design_status": "approved", "design_ref": [SCREEN]}]
        self.write_screen(SCREEN, [REQ])

    def write_screen(self, ref, requirements, screen_id=None, frontmatter=False):
        path = self.design / ref
        path.parent.mkdir(parents=True, exist_ok=True)
        screen_id = screen_id or path.stem
        if frontmatter:
            content = "---\n" + yaml.safe_dump({"id": screen_id, "title": "화면", "requirements": requirements}, allow_unicode=True) + "---\n# 화면\n"
        else:
            content = (
                "# 화면\n\n| 항목 | 내용 |\n|---|---|\n"
                f"| 화면 ID | `{screen_id}` |\n| 화면 이름 | 화면 |\n"
                f"| 연결 REQ | {', '.join(f'`{value}`' for value in requirements)} |\n"
            )
        path.write_text(content, encoding="utf-8")

    def run_check(self, *args):
        (self.req_dir / "items.yaml").write_text(yaml.safe_dump(self.items, allow_unicode=True), encoding="utf-8")
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            status = validator.main([str(self.req_dir), str(self.design), *args])
        return status, output.getvalue()

    def assert_passes(self, *args):
        status, output = self.run_check(*args)
        self.assertEqual(status, 0, output)

    def assert_fails(self, message, *args):
        status, output = self.run_check(*args)
        self.assertEqual(status, 1, output)
        self.assertIn(message, output)

    def test_current_design_without_handoff_or_manifest(self):
        for args in [(), ("--all",), ("--mode", "inventory"), ("--requirement", REQ)]:
            with self.subTest(args=args):
                self.assert_passes(*args)

    def test_shared_requirement_links_both_screens(self):
        self.items[0]["design_ref"].append(SECOND)
        self.write_screen(SECOND, [REQ])
        self.assert_passes()
        self.assert_passes("--requirement", REQ)

    def test_yaml_screen_metadata(self):
        self.write_screen(SCREEN, [REQ], frontmatter=True)
        self.assert_passes()

    def test_mixed_metadata_is_rejected(self):
        path = self.design / SCREEN
        path.write_text("---\nid: SCR-WEB-001\n---\n" + path.read_text())
        self.assert_fails("함께 쓸 수 없음")

    def test_missing_screen(self):
        (self.design / SCREEN).unlink()
        self.assert_fails("파일 누락")

    def test_missing_ia(self):
        (self.design / "ia.md").unlink()
        self.assert_fails("ia.md: 파일 누락")

    def test_invalid_refs(self):
        for refs in ["DSN-011", [], ["/screens/SCR-WEB-001.md"], ["screens/../ia.md"], ["screens/./SCR-WEB-001.md"], ["screens//SCR-WEB-001.md"], ["screens\\SCR-WEB-001.md"], ["handoff/index.html"], ["screens/a.html"], [None], [{"file": SCREEN}], [SCREEN, SCREEN]]:
            with self.subTest(refs=refs):
                self.items[0]["design_ref"] = refs
                self.assert_fails("design_ref")

    def test_symlink_screen_is_rejected(self):
        path = self.design / SCREEN
        target = self.root / "outside.md"
        path.rename(target)
        path.symlink_to(target)
        self.assert_fails("symlink 금지")

    def test_symlink_directory_is_rejected(self):
        target = self.root / "outside"
        (self.design / "screens").rename(target)
        (self.design / "screens").symlink_to(target, target_is_directory=True)
        self.assert_fails("symlink 금지")

    def test_wrong_screen_id(self):
        for screen_id in ["잘못된 ID", "SCR-WEB-002"]:
            with self.subTest(screen_id=screen_id):
                self.write_screen(SCREEN, [REQ], screen_id)
                self.assert_fails("화면 ID")

    def test_duplicate_screen_id(self):
        self.write_screen("screens/extra/SCR-WEB-001.md", [REQ])
        self.assert_fails("화면 ID 중복")

    def test_invalid_and_duplicate_requirement_ids(self):
        original = copy.deepcopy(self.items)
        self.items.append(copy.deepcopy(self.items[0]))
        self.assert_fails("요구사항 ID 중복")
        self.items = original
        self.items[0]["id"] = "잘못된 ID"
        self.assert_fails("요구사항 ID 형식 위반")

    def test_invalid_screen_links(self):
        for linked, message in [([REQ, REQ], "연결 REQ 중복"), (["bad"], "연결 REQ ID 형식 위반"), ([OTHER], "알 수 없는 요구사항")]:
            with self.subTest(linked=linked):
                self.write_screen(SCREEN, linked)
                self.assert_fails(message)

    def test_non_ui_screen_link(self):
        self.items.append({"id": OTHER, "ui": False})
        self.write_screen(SCREEN, [REQ, OTHER])
        self.assert_fails("UI가 아닌 요구사항")

    def test_missing_reverse_link(self):
        self.items.append({"id": OTHER, "ui": True, "design_status": "pending"})
        self.write_screen(SCREEN, [OTHER])
        self.assert_fails(f"연결 REQ에 {REQ} 누락", "--requirement", REQ)

    def test_missing_forward_link_is_found_in_partial_mode(self):
        self.write_screen(SECOND, [REQ])
        self.assert_fails("design_ref에 화면 연결 누락", "--requirement", REQ)

    def test_inventory_allows_pending_and_deferred(self):
        for state in ["pending", "deferred"]:
            with self.subTest(state=state):
                item = {"id": OTHER, "ui": True, "design_status": state}
                if state == "deferred":
                    item["design_defer_ref"] = "다음 기능 추가 때 검토"
                self.items = self.items[:1] + [item]
                self.write_screen(SECOND, [OTHER])
                self.assert_passes("--mode", "inventory")
                self.assert_fails("승인되지 않은 UI 요구사항", "--all")
                self.assert_passes("--requirement", REQ)
                self.assert_fails("승인되지 않은 UI 요구사항", "--requirement", OTHER)

    def test_inventory_before_first_screen(self):
        self.items = [{"id": REQ, "ui": True, "design_status": "pending"}]
        (self.design / SCREEN).unlink()
        self.assert_passes("--mode", "inventory")
        self.assert_fails("승인되지 않은 UI 요구사항", "--all")

    def test_inventory_ignores_unrelated_draft_screen(self):
        (self.design / SECOND).write_text("# 작성 중\n", encoding="utf-8")
        self.assert_passes("--mode", "inventory")
        self.assert_fails("문서 정보 표 없음", "--all")

    def test_inventory_ignores_screen_linked_only_to_pending_requirement(self):
        self.items.append({"id": OTHER, "ui": True, "design_status": "pending"})
        self.write_screen(SECOND, [OTHER], screen_id="작성 중")
        self.assert_passes("--mode", "inventory")

    def test_inventory_without_approved_requirements_needs_no_design_directory(self):
        shutil.rmtree(self.design)
        for state in ["pending", "deferred"]:
            with self.subTest(state=state):
                item = {"id": REQ, "ui": True, "design_status": state}
                if state == "deferred":
                    item["design_defer_ref"] = "다음 기능 추가 때 검토"
                self.items = [item]
                self.assert_passes("--mode", "inventory")
                self.assert_fails("승인되지 않은 UI 요구사항", "--all")

    def test_inventory_still_validates_states_without_design_directory(self):
        shutil.rmtree(self.design)
        self.items = [{"id": REQ, "ui": True, "design_status": "deferred"}]
        self.assert_fails("design_defer_ref 필수", "--mode", "inventory")

    def test_inventory_still_requires_approved_screen(self):
        (self.design / SCREEN).unlink()
        self.assert_fails("파일 누락", "--mode", "inventory")

    def test_inventory_still_checks_both_link_directions(self):
        self.write_screen(SECOND, [REQ])
        self.assert_fails("design_ref에 화면 연결 누락", "--mode", "inventory")
        (self.design / SECOND).unlink()
        self.items.append({"id": OTHER, "ui": True, "design_status": "pending"})
        self.write_screen(SCREEN, [OTHER])
        self.assert_fails(f"연결 REQ에 {REQ} 누락", "--mode", "inventory")

    def test_partial_ignores_pending_in_same_screen(self):
        self.items.append({"id": OTHER, "ui": True, "design_status": "pending"})
        self.write_screen(SCREEN, [REQ, OTHER])
        self.assert_passes("--requirement", REQ)

    def test_partial_ignores_unrelated_invalid_screen(self):
        (self.design / SECOND).write_text("# 작성 중\n")
        self.assert_passes("--requirement", REQ)
        self.assert_fails("문서 정보 표 없음")

    def test_invalid_states(self):
        cases = [
            {"design_status": "unknown"},
            {"design_status": "pending"},
            {"design_status": "deferred"},
            {"design_status": "approved", "design_defer_ref": "보류"},
        ]
        original = copy.deepcopy(self.items[0])
        for updates in cases:
            with self.subTest(updates=updates):
                self.items[0] = {**original, **updates}
                self.assert_fails(REQ, "--mode", "inventory")
        self.items[0] = {"id": REQ, "ui": True, "design_status": "deferred"}
        self.assert_fails("design_defer_ref 필수", "--mode", "inventory")

    def test_unknown_or_non_ui_target(self):
        self.assert_fails("알 수 없는 요구사항", "--requirement", OTHER)
        self.items[0]["ui"] = False
        self.assert_fails("UI 요구사항이 아님", "--requirement", REQ)

    def test_legacy_package_option_is_removed(self):
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as raised:
            self.run_check("--package", "DSN-011")
        self.assertEqual(raised.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
