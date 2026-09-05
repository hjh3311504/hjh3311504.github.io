# 의사결정 기록 2026-09-05: Team Maker 공개 URL은 마지막 슬래시 없이 사용

상태: 결정
일자: 2026-09-05

## 결정

- Team Maker의 공개 URL은 `/team-maker`를 사용한다.
- SvelteKit 정적 build는 Team Maker 화면을 `build/team-maker.html`로 생성한다.
- Team Maker 정적 자산은 route와 분리된 `/images/team-maker/` 경로를 사용한다.
- 이 ADR은 [2026-08-31 ADR](./2026-08-31-Team-Maker를-SvelteKit-route로-통합.md)의 route 끝 `/`와 `build/team-maker/index.html` 결정만 대체한다.
- 기존 ADR의 SvelteKit route 통합, 화면 module 재사용과 core module 분리 결정은 유지한다.

## 핵심 근거

- 현재 route는 `trailingSlash = 'never'`로 설정되어 공개 URL에 마지막 슬래시를 붙이지 않는다.
- 현재 정적 build와 검증은 `build/team-maker.html`을 결과 파일로 사용한다.
- 정적 자산을 `/images/team-maker/`에 두면 페이지 URL과 자산 경로를 독립적으로 관리할 수 있다.

## 검토한 대안

- `/team-maker/` 유지: 현재 route 설정과 배포된 공개 URL에 맞지 않아 기각한다.
- `build/team-maker/index.html` 유지: 현재 SvelteKit 정적 build 결과에 맞지 않아 기각한다.
- 자산을 `/team-maker/` 아래로 이동: 현재 자산 구조를 바꿀 이유가 없고 페이지 URL과 자산 경로가 결합되므로 기각한다.

## 영향 REQ

REQ-PAGES-001, REQ-PAGES-002

## 되돌리기 비용

공개 URL과 build 형태를 바꾸려면 route 설정, canonical, 내부 링크, 배포 확인과 build 검증을 함께 바꿔야 하므로 중간이다.
