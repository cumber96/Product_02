# Current Task

## Goal
전체 아이콘을 Lucide 아이콘 체계로 교체 (이모지/문자 아이콘 → SVG 아이콘)

## Background
1차 리뷰 항목 1~4 완료 후, 실사용 피드백을 기다리는 중 별도로 진행한 디자인 작업.
DESIGN.md에 Icon System(Lucide, Outline Only, Stroke 2px, Size 16/20/24) 규칙이 이미 정의되어 있었고,
이번 작업 전 아래 순서로 사전 설계를 진행함.
1. 현재 프로젝트의 전체 아이콘 인벤토리 조사 (이모지 11종 + CSS 도형 5종 + PWA 아이콘)
2. Lucide 매핑표 초안 작성 → 사용자 피드백 반영해 2차 수정
   - "예측 정보": `bar-chart-3` → `sparkles` (통계보다 예측의 의미가 강함)
   - "캘린더 기록": `clipboard-list` → `notebook-text` (체크리스트보다 기록의 성격)
   - 캘린더 셀 안의 작은 마킹(생리/예상생리/가임기/배란)은 Lucide로 바꾸지 않고 CSS 도형 유지,
     **범례(legend)에서만** Lucide 아이콘 사용
3. 구현 방식 설계: 이 프로젝트는 React/TypeScript/번들러가 전혀 없는 순수 vanilla JS + 정적 배포 구조라
   사용자가 처음 제시한 `icons.ts` + `lucide-react` 예시가 그대로 동작하지 않음을 확인.
   → React/TS/npm 패키지/번들러/CDN 없이, `icons.js` + 인라인 SVG 문자열 방식으로 확정 (Lucide 공식
   GitHub 소스에서 정확한 path 데이터를 미리 가져와 검증함)
4. 최종 매핑표 승인 후, 범례 색상 유지 여부까지 확인받고 이번 작업 착수

## Scope
- `icons.js` 신규 생성 (repo 루트, `app.js`와 같은 위치) — Lucide 아이콘 15개를 인라인 SVG 문자열로 export
- `app.js`의 이모지/문자 아이콘 13개 위치 → `icons.js`에서 import한 아이콘으로 교체
- 캘린더 범례(legend) 4곳: `<i class="dot X">` → Lucide 아이콘으로 교체 (색상은 기존 상태 의미 유지)
- 로그아웃 버튼: 아이콘 없음 → `LogOut` 아이콘 추가 (DESIGN.md 규칙 반영)
- `style.css`: 더 이상 쓰이지 않는 `.dot`, `.dot.period`, `.dot.predicted`, `.dot.fertile`, `.dot.ovulation` 삭제,
  아이콘 공통 정렬 스타일 추가, 범례 아이콘 색상을 기존 dot 색상과 동일하게 유지하는 규칙 추가
- **범위 아님**: 기능/레이아웃/문구 변경, 캘린더 셀 안의 CSS 마킹 변경, React/TS/번들러/CDN 도입

## Definition of Done
- 화면에 보이는 모든 이모지(⚙️🔔💌📊✍️📋💜)와 문자 아이콘(‹›)이 Lucide SVG 아이콘으로 교체됨
- 캘린더 셀 안의 마킹(생리/예상생리/가임기/배란/오늘)은 기존 CSS 그대로 유지
- 범례 아이콘 색상이 기존 dot 색상(생리·예상생리=빨강, 가임기=연보라, 배란=진보라)과 동일하게 유지됨
- 장식용 아이콘은 모두 `aria-hidden="true"`
- 기존 기능(로그인, 캘린더, 예측 카드, 날짜 상세 페이지, 사랑기록, 설정, 알림, 기록 CRUD)에 회귀 없음
- 모바일 뷰포트에서 아이콘 크기/정렬 깨짐 없음
- 브라우저 콘솔 오류 없음
- 사용하지 않게 된 CSS(`.dot` 계열) 삭제
- React/TypeScript/npm 패키지/번들러/CDN 도입 없음 (순수 vanilla JS 유지)

---

# Result

## Status
✅ Completed, push/배포 완료 (commit d2defa3, main으로 push)

## 문제 분석
전체 이모지/문자 아이콘(⚙️🔔💌📊✍️📋💜, ‹›)이 화면마다 하드코딩되어 있었고, 같은 의미(뒤로가기 vs 이전 달)에
같은 글자(‹)가 재사용되는 등 일관성이 없었음. DESIGN.md의 Icon System(Lucide, Outline Only)을 적용하기로
했으나, 사용자가 제시한 예시(`icons.ts` + `lucide-react`)는 React/TypeScript 전제였고 실제 프로젝트는
번들러 없는 순수 vanilla JS 구조라 그대로 적용 불가능함을 먼저 확인함. 이후 icons.js + 인라인 SVG 문자열
방식으로 합의하고 진행함.

## 수정 내용
- `icons.js` (신규): Lucide 공식 GitHub 소스(MIT 라이선스)에서 정확한 path 데이터를 가져와, 공통 `icon()`
  팩토리 함수로 감싼 15개 아이콘을 named export (`Settings`, `ArrowLeft`, `ChevronLeft`, `ChevronRight`,
  `Bell`, `LogOut`, `UserPlus`, `Sparkles`, `SquarePen`, `NotebookText`, `Heart`, `Droplet`, `CircleDashed`,
  `Circle`, `Egg`). 모든 아이콘은 `stroke-width: 2`, `fill: none`, `aria-hidden="true"`로 고정.
- `app.js`
  - 최상단에 `icons.js`에서 15개 아이콘을 한 번에 import (프로젝트 전체에서 이 한 줄만 아이콘을 가져옴)
  - 이모지/문자 아이콘 13개 위치(총 18회 출현) → 대응하는 Lucide 아이콘으로 교체
  - 로그아웃 버튼에 `LogOut` 아이콘 추가 (기존엔 텍스트만 있었음)
  - 캘린더 범례 4곳: `<i class="dot X">` → `Droplet`/`CircleDashed`/`Circle`/`Egg` 아이콘 + 색상 구분 클래스
    (`legend-period` 등)로 교체. **캘린더 셀 안의 실제 마킹(CSS 도형)은 전혀 손대지 않음.**
- `style.css`
  - 사용하지 않게 된 `.dot`, `.dot.period`, `.dot.predicted`, `.dot.fertile`, `.dot.ovulation` 삭제
  - 공통 `.icon` 정렬 규칙 추가 (`vertical-align`, `flex-shrink`)
  - `.icon-btn`, `.calendar-header button`, `.detail-header button`을 flex 중앙 정렬로 조정 (기존엔 텍스트
    글자 하나를 넣는 전제였어서, SVG를 넣으려면 정렬 방식 보정이 필요했음) + `.icon-btn`에 명시적
    `color: var(--ink)` 추가
  - 범례 아이콘 색상 규칙 추가 — 기존 dot 색상과 동일하게 유지: 생리·예상생리 = `var(--primary)`(빨강),
    배란 = `var(--luxe)`(진보라), 가임기 = 아이콘 `var(--luxe)` + 배경 `var(--luxe-soft)`(연보라) 칩 형태
    (연보라를 아이콘 선 색으로 직접 쓰면 흰 배경에서 거의 안 보여 명도 대비가 깨지므로, 배경 칩으로 표현해
    "연보라색을 유지"와 "명도 대비 유지"를 동시에 만족시킴 — DESIGN.md 11. Accessibility 규칙 반영)

## 테스트 방법과 결과
1. `node --check app.js`, `node --check icons.js` 구문 검증 통과, CSS 중괄호 짝 검증 통과
2. import된 아이콘 15개가 `app.js`에서 각각 최소 1회 이상 실제로 사용됨을 확인 (미사용 import 없음)
3. 로컬 D1 + wrangler dev + Playwright(Chromium)로 실제 화면 검증
   - 홈 화면(390px, 360px 두 뷰포트): 설정 아이콘, 예측 정보(Sparkles), 캘린더 이전/다음 달(Chevron),
     범례 4종, 새 기록 추가(SquarePen) 모두 정상 렌더링·정렬, 360px에서도 깨짐 없음
   - 설정 화면: 뒤로가기(ArrowLeft), 알림 설정(Bell), 로그아웃(LogOut) 정상
   - 날짜 상세 화면: 뒤로가기, 캘린더 기록(NotebookText), 사랑기록(Heart) 정상
   - 범례: 생리(빨강 Droplet), 예상 생리(빨강 CircleDashed), 가임기(연보라 배경 칩 + 보라 Circle),
     배란(보라 Egg) — 기존 색상 의미 그대로 유지됨을 스크린샷으로 확인
4. 기능 회귀 테스트: 새 기록 추가 → 날짜 상세 진입 → 수정 → 사랑기록 추가 → 사랑기록 삭제 → 기록 삭제 →
   로그아웃까지 전체 흐름을 Playwright로 실행, 모두 정상 동작
5. 브라우저 콘솔 오류 확인: 로그인 이후 모든 화면에서 콘솔 오류 0건. (로그아웃 후 로그인 화면에서 Google
   Identity Services가 `localhost` origin을 승인되지 않은 것으로 보고하는 메시지가 뜨는데, 이는 로컬 테스트
   환경의 기존 한계이며 이번 아이콘 작업과 무관 — 실제 배포 도메인에서는 발생하지 않음)
6. 테스트 데이터 모두 정리, dev 서버 종료 완료

## 수정 파일
- `icons.js` (신규)
- `app.js`
- `style.css`

## 기존 기능에 미치는 영향
- 기능/레이아웃/문구는 변경하지 않음 — 아이콘 렌더링 방식만 이모지/문자 → SVG로 교체
- 캘린더 셀 안의 마킹(생리/예상생리/가임기/배란/오늘)은 CSS 그대로 유지, 범례만 아이콘 교체
- React/TypeScript/새 npm 패키지/번들러/CDN 도입 없음 — 기존 vanilla JS 정적 배포 구조 그대로 유지

## 로컬 커밋 / 배포 여부
✅ 로컬 커밋 완료 (d2defa3), 사용자 확인 후 `origin/main`으로 push 완료.
Cloudflare Pages Git 연동을 통해 자동 배포됨. (새 DB 마이그레이션 없어 원격 D1 작업 불필요)
