# Current Task

## Goal
Typography Primitive Token 도입 — 기존 font-size/font-weight/line-height/letter-spacing 값을 CSS 변수로 토큰화 (시각적 변경 없음)

## Background
Pretendard 폰트 적용 작업 당시 "Typography Scale 개선은 다음 작업으로 분리"라고 범위를 나눠뒀던 후속 작업. 진행 순서:
1. `style.css` 전체를 조사해 실제 쓰이는 font-size(11/12/13/14/16/18/20px)와 font-weight(400/500/600/700)
   조합을 전부 추출, 셀렉터별 매핑 표로 정리
2. 표를 기준으로 Typography Token(안)을 제안 — Primitive Token 방식(크기/굵기/줄간격을 개별 변수로 분리)과
   Semantic Token 방식(역할별로 크기+굵기+줄간격을 한 번에 묶는 방식) 중 사용자가 Primitive 방식을 선택
3. 구현 전 변경 대상 파일과 영향 범위를 Plan으로 먼저 보고 후 승인받고 진행

## Scope
- `style.css`의 `:root`에 `--font-size-*`(7종), `--font-weight-*`(4종), `--line-height-*`(3종),
  `--tracking-tight` 추가
- 기존 21개 셀렉터의 리터럴 font-size/font-weight/line-height/letter-spacing 값을 위 토큰 참조로 치환
- **범위 아님**:
  - 실제 크기/굵기/줄간격 값 변경 (계산값 100% 유지)
  - `@font-face` 4개의 `font-weight` 토큰화 — CSS 스펙상 `@font-face` 디스크립터는 `var()`를
    지원하지 않아 리터럴(400/500/600/700)로 유지
  - `app.js`의 인라인 `style="font-size:..."` 2곳 (초대 코드 안내, 예측 정보 빈 상태) — 별도 작업
  - `app.js`가 참조하는 `var(--pink-light)`/`var(--pink)`/`var(--text-muted)` (미정의 변수, 기존 버그로 추정,
    이번 작업과 무관)
  - 레이아웃/기능 변경, 새 라이브러리 도입

## Definition of Done
- 모든 규칙의 font-size/font-weight/line-height/letter-spacing 계산값이 변경 전과 100% 동일
- `@font-face` 4곳을 제외한 리터럴 값이 CSS에 남아있지 않음
- CSS 구조(중괄호 짝) 깨짐 없음
- 레이아웃/기능에 영향 없음

---

# Result

## Status
✅ Completed, 로컬 커밋 및 push/배포 완료 (commit 39ecbf9, main으로 push)

## 문제 분석
`style.css`에 font-size 25곳, font-weight 16곳이 리터럴 숫자로 흩어져 있어 값 하나를 바꾸려면 여러 셀렉터를
찾아 다녀야 하고, 같은 의도(예: 13px 캡션)가 여러 곳에 중복 하드코딩돼 있어 일관성을 보장하기 어려운
상태였음. 값 자체는 문제가 없었으므로(디자인 재설계 아님), 기존 값을 그대로 변수화하는 것이 목표.

## 수정 내용
- `style.css`
  - `:root`에 Typography Primitive Token 추가 (기존 `--space-*`, `--radius-*` 바로 아래)
    - `--font-size-title`(20px) / `-subtitle-lg`(18px) / `-subtitle`(16px) / `-body`(14px) /
      `-caption`(13px) / `-caption-sm`(12px) / `-caption-xs`(11px)
    - `--font-weight-regular`(400) / `-medium`(500) / `-semibold`(600) / `-bold`(700)
    - `--line-height-tight`(1.2) / `-snug`(1.25) / `-relaxed`(1.5)
    - `--tracking-tight`(-0.18px)
  - `.login-screen h1`, `.login-screen p`, `.invite-note`, `.error-note`, `.topbar .name`,
    `.role-badge`, `.card h2`, `.card p.hint`, `.summary-item .label/.value`, `.invite-url input`,
    `.btn`, `.detail-header .detail-date`, `.calendar-header .month-label`, `.weekday-row div`,
    `.day-cell`, `.legend`, `.form-row label`, `.form-row input/textarea`, `.log-item`,
    `.log-item .dates/.note`, `.log-actions button`, `.empty-state`, `.toast` — 총 21개 셀렉터,
    45개 선언의 리터럴 값을 토큰 참조로 치환
  - `@font-face` 4개는 계획 단계에서 토큰화를 시도했으나, `var()`가 `@font-face` 디스크립터에서
    동작하지 않는다는 CSS 스펙 제약을 확인하고 리터럴로 되돌림 (실수로 남긴 것이 아니라 의도적 결정)

## 테스트 방법과 결과
1. `grep`으로 font-size/font-weight/line-height/letter-spacing 리터럴 검색 — `@font-face` 4곳을 제외한
   모든 곳이 토큰 참조로 바뀐 것을 확인
2. CSS 중괄호 개수 검증 (74/74, 구조 깨짐 없음)
3. `git diff` 전체를 한 줄씩 대조해 "리터럴 → 동일 값의 var() 참조"로만 이루어졌는지 확인
4. 브라우저 실사용 화면 확인은 미실시 — 계산값이 100% 동일한 순수 변수 치환이라 시각적 리스크가
   낮다고 판단했으나, 다음 로컬 실행 시 육안 확인 권장

## 수정 파일
- `style.css`

## 기존 기능에 미치는 영향
- font-size/font-weight/line-height/letter-spacing 계산값, 레이아웃, 기능은 전혀 변경하지 않음 —
  같은 값을 참조하는 방식만 리터럴에서 변수로 전환
- 이후 크기/굵기 스케일을 조정할 때 `:root`의 토큰 값만 바꾸면 전체에 반영되는 구조가 됨

## 로컬 커밋 / 배포 여부
✅ 로컬 커밋 완료 (39ecbf9), `origin/main`으로 push 완료.
Cloudflare Pages Git 연동을 통해 자동 배포됨. (새 DB 마이그레이션 없어 원격 D1 작업 불필요)
