# 의사결정 기록 2026-08-31: Team Maker를 SvelteKit route로 통합

상태: 결정
일자: 2026-08-31

## 결정

- `/team-maker/` 화면은 `src/routes/team-maker/+page.svelte`에서 관리한다.
- 기존 화면 동작은 전용 JavaScript module로 유지하고 SvelteKit route에서 불러온다.
- 팀 배정 core module은 화면 module과 분리된 상태를 유지한다.
- SvelteKit 정적 build가 `build/team-maker/index.html`과 필요한 bundle을 생성한다.

## 핵심 근거

- Team Maker도 SvelteKit route와 build 과정에서 함께 검사할 수 있다.
- 검증된 화면 로직을 유지해 전체 Svelte 재작성에 따른 회귀 위험을 줄인다.
- `/team-maker/` 공개 주소와 브라우저 저장 데이터 형식을 그대로 유지할 수 있다.

## 검토한 대안

- 전체 Svelte component 재작성: 변경량과 회귀 위험이 현재 목적보다 커서 기각한다.
- Svelte route에서 기존 정적 파일만 불러오기: 소스와 실행 주기가 계속 분리돼 기각한다.
- `static/team-maker/` 유지: Team Maker가 SvelteKit route에 포함되지 않아 기각한다.

## 영향 REQ

REQ-PAGES-001, REQ-PAGES-002

## 되돌리기 비용

소스 위치와 build 검증을 함께 되돌려야 하므로 중간이다. 브라우저 저장 형식과 공개 URL은 바뀌지 않는다.
