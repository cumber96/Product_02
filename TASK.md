# Current Task

## Goal
확정된 Color Token 구조(Primitive → Semantic 2단계)를 실제 코드(`style.css`, `app.js`)에 구현.
UI 레이아웃/타이포그래피/간격/Radius/기능 동작은 변경하지 않고, 색상 참조 방식만 개편한다.

## Background
직전 두 차례 검토(디자인 감사 → DESIGN.md Color Principles 확정)를 거쳐, 아래가 확정 결정 사항으로 주어짐:

- Primitive: Brand(200/500/600), Neutral(0/50/100/200/600/900), Red(50/600), Purple(100/600). Green/Success는
  현재 앱에 대응 UI가 없어 이번 작업에서 추가하지 않음(Toast Success Variant 구현 시 별도 작업으로 추가)
- Semantic: Text(primary/secondary/inverse), Surface(canvas/surface/surface-soft/surface-strong),
  Border(default/soft/strong), Accent(accent/accent-strong/accent-soft/on-accent), Danger(danger/danger-soft),
  Calendar(period/period-predicted/fertile/ovulation)
- Component Token은 만들지 않음 (Semantic Token을 CSS 선택자가 직접 참조)
- Viewer 배지는 기존 `--luxe`/`--luxe-soft`(보라) 대신 `--color-surface-strong`/`--color-text-primary`(뉴트럴)로 전환 —
  Owner 배지와 시각적으로 동일해짐 (Calendar 색상과 역할 분리)
- Primary Button 대비 미달(흰 텍스트 on brand-500 = 3.52:1, WCAG AA 4.5:1 미달) 수정: 기본 배경을
  `--color-accent-strong`(brand-600, 흰 텍스트 대비 4.89:1)으로 변경. Active 상태는 새 하드코딩 색 없이
  filter/opacity 등 기존 값 조합으로 처리. Disabled는 `--color-accent-soft`
- `--color-period-predicted`가 이번 결정에서 `brand-200`(연한 핑크)으로 확정됨 — 기존엔 `--primary`(brand-500, 진한 핑크)
  실선과 동일 색의 점선이었음. 실제 색상이 옅어지는 변경

## Scope
- `style.css`: `:root`를 Primitive → Semantic 순서로 재구성, 기존 색상 토큰(`--primary`, `--primary-active`,
  `--primary-disabled`, `--primary-error`, `--canvas`, `--surface-soft`, `--surface-strong`, `--hairline`,
  `--hairline-soft`, `--muted`, `--ink`, `--on-primary`, `--luxe`, `--luxe-soft`) 전체 제거, 모든 `var()` 참조를
  신규 Semantic Token으로 교체, 하드코딩 `#fdeceb` → `--color-danger-soft`
- `app.js`: 인라인 스타일 3곳(아바타 폴백, 초대 코드 안내, 예측 정보 빈 상태)의 색상 `var()` 참조만 신규
  Semantic Token으로 교체 (마크업/로직 변경 없음)
- `index.html` / `manifest.json`: 하드코딩된 `#ff385c`(theme-color) / `#ffffff`(background_color) 위치만
  조사·기록, 값은 유지 (CSS 변수 연결 불가한 정적 메타데이터)
- `DESIGN.md`: 수정하지 않음. 구현 중 문서와 충돌 발견 시 임의 수정 없이 별도 보고
- **범위 아님**: Component Token 생성, Green/Success 토큰 추가, 새 기능/Toast Variant 구현, UI 레이아웃 변경,
  Typography/Spacing/Radius 변경, 기존 기능 로직 변경, 미사용 미래용 토큰 추가

## Definition of Done
- 이전 토큰(`--primary*`, `--canvas`, `--surface-*`, `--hairline*`, `--muted`, `--ink`, `--on-primary`, `--luxe*`)
  참조가 style.css/app.js에서 0개
- 정의되지 않은 CSS 변수 참조 없음
- 신규 Primitive Token 전부 최소 1회 이상 Semantic Token에서 참조됨
- CSS 중괄호 짝 깨짐 없음
- Primary Button 흰 텍스트 대비 4.5:1 이상
- 배포는 하지 않음(로컬 커밋/검증까지만). CHANGELOG.md는 배포 후 갱신

---

# Result

## Status
✅ 로컬 구현·검증 완료. 배포는 하지 않음(사용자 확인 후 진행 예정).

## 변경 파일
- `style.css` — `:root` 전면 재구성(Primitive → Semantic), 모든 색상 `var()` 참조 교체, 하드코딩
  `#fdeceb` 토큰화, `.legend-period`/`.legend-predicted` 규칙 분리, `.btn:active`를 색상 var 대신
  `filter: brightness(0.9)`로 변경
- `app.js` — 인라인 스타일 3곳(아바타 폴백, 초대 코드 안내, 예측 정보 빈 상태)의 색상 `var()` 참조 교체
- `index.html`, `manifest.json` — 조사만 하고 수정하지 않음(아래 8번 참고)
- `DESIGN.md` — 수정 없음. 구현 중 발견된 충돌 1건은 아래 "DESIGN.md와의 충돌"에 별도 보고

## Primitive Token (13개)
```
--brand-200: #ffd1da   --brand-500: #ff385c   --brand-600: #e00b41
--neutral-0: #ffffff   --neutral-50: #f7f7f7  --neutral-100: #ebebeb
--neutral-200: #dddddd --neutral-600: #6a6a6a --neutral-900: #222222
--red-50: #fdeceb      --red-600: #c13515
--purple-100: #f3ebfa  --purple-600: #460479
```
전부 최소 1회 이상 Semantic Token에서 참조됨(확인 완료). Green/Success Primitive는 계획대로 추가하지 않음.

## Semantic Token (20개)
```
--color-text-primary / --color-text-secondary / --color-text-inverse
--color-canvas / --color-surface / --color-surface-soft / --color-surface-strong
--color-border-default / --color-border-soft / --color-border-strong
--color-accent / --color-accent-strong / --color-accent-soft / --color-on-accent
--color-danger / --color-danger-soft
--color-period / --color-period-predicted / --color-fertile / --color-ovulation
```
전부 최소 1회 이상 `style.css`/`app.js`에서 참조됨(확인 완료).

## 기존 → 신규 토큰 매핑표
| 기존 | 신규 | 값 변화 |
|---|---|---|
| `--ink` | `--color-text-primary` | 없음 |
| `--muted` | `--color-text-secondary` | 없음 |
| `--on-primary` (button/avatar 등) | `--color-on-accent` | 없음 |
| `--on-primary` (toast) | `--color-text-inverse` | 없음(같은 값, 역할만 분리 — toast는 브랜드색이 아닌 뉴트럴 배경이라 on-accent 대신 text-inverse로 매핑) |
| `--canvas` (body 배경) | `--color-canvas` | 없음 |
| `--canvas` (card/input/secondary btn 배경) | `--color-surface` | 없음(같은 값, "페이지 배경"과 "컴포넌트 표면" 역할 분리) |
| `--surface-soft` | `--color-surface-soft` | 없음 |
| `--surface-strong` | `--color-surface-strong` | 있음 (`#f2f2f2` → `#ebebeb`, neutral 스케일에 없던 값이라 neutral-100으로 흡수) |
| `--hairline` | `--color-border-default` | 없음 |
| `--hairline-soft` | `--color-border-soft` | 없음 |
| `--ink` (secondary btn border, focus border, today ring) | `--color-border-strong` | 없음 |
| `--primary` (버튼 기본 배경) | `--color-accent-strong` | **있음** (brand-500 → brand-600, 대비 개선 목적) |
| `--primary` (avatar 텍스트, period 마킹) | `--color-accent` / `--color-period` | 없음 |
| `--primary-active` | (삭제, `filter: brightness(0.9)`로 대체) | 시각 효과 유지, 토큰 없이 구현 |
| `--primary-disabled` (버튼) | `--color-accent-soft` | 없음 |
| `--primary` (predicted 점선 테두리, legend-predicted) | `--color-period-predicted` | **있음** (brand-500 → brand-200) |
| `--primary-error` | `--color-danger` | 없음 |
| 하드코딩 `#fdeceb` | `--color-danger-soft` | 없음(토큰화만) |
| `--luxe` (ovulation, legend-ovulation/fertile 아이콘) | `--color-ovulation` | 없음 |
| `--luxe-soft` (fertile 배경) | `--color-fertile` | 없음 |
| `--luxe`/`--luxe-soft` (Viewer 배지) | `--color-surface-strong`/`--color-text-primary` | **있음** (보라 → 뉴트럴, 아래 참고) |

## 실제 색상이 달라진 UI
1. **Primary Button 기본 배경**: `#ff385c` → `#e00b41`(더 진한 핑크/레드). 흰 텍스트 대비 3.52:1 → 4.89:1로 개선.
2. **Calendar 예상 생리(predicted) 점선 테두리 + 범례 아이콘**: `#ff385c`(진한 핑크) → `#ffd1da`(연한 핑크). 확정된 `--color-period-predicted: var(--brand-200)` 매핑을 그대로 반영한 결과이며, 매우 옅어져 화면에서 잘 안 보일 수 있음 — 아래 9번 참고.
3. **Viewer 배지**: 보라색 텍스트/배경(`#460479` / `#f3ebfa`) → Owner 배지와 동일한 뉴트럴 회색(`#222222` on `#ebebeb`). Owner/Viewer 배지가 색으로 더 이상 구분되지 않음.
4. **`--surface-strong` 사용처 3곳**(role-badge, detail-header 버튼, calendar-header 버튼): `#f2f2f2` → `#ebebeb`로 미세하게 어두워짐(육안상 거의 무차이 수준).
5. **Primary Button `:active`(눌림) 상태**: 기존 고정 색상(`#e00b41`) 전환에서 `filter: brightness(0.9)` 방식으로 변경 — 이제 기본 배경(`#e00b41`)이 눌림 시 추가로 살짝 더 어두워짐. 시각적으로 유사하나 정확히 같은 색은 아님.

## 이름만 변경된 UI
그 외 텍스트 색(본문/보조), 배경(canvas/surface-soft), 테두리(default/soft/strong), 오류 텍스트/배경, Fertile 배경, Ovulation 마커, Toast는 전부 기존과 동일한 값으로 토큰명만 교체됨.

## 제거한 기존 토큰
`--primary`, `--primary-active`, `--primary-disabled`, `--primary-error`, `--luxe`, `--luxe-soft`, `--ink`,
`--muted`, `--hairline`, `--hairline-soft`, `--canvas`, `--surface-soft`, `--surface-strong`, `--on-primary`
(14개, `:root`에서 전량 삭제 확인)

## 남아 있는 하드코딩 컬러와 유지 이유
- `index.html:7` `<meta name="theme-color" content="#ff385c">` — 브라우저 UI 크롬 색상은 CSS 변수를 연결할 수 없는 정적 메타 태그라 유지 (지시사항대로 값 변경 없음)
- `manifest.json` `theme_color: "#ff385c"`, `background_color: "#ffffff"` — PWA 매니페스트도 마찬가지로 정적 JSON, CSS 토큰과 연결 불가. 유지
- 두 값 모두 현재 `--color-accent`(brand-500, `#ff385c`)와 `--color-canvas`(`#ffffff`)에 대응하는 값과 일치 — 향후 브랜드 색이 바뀌면 수동 동기화 필요

## WCAG 검증 결과
- **Primary Button**: 흰 텍스트(`--color-on-accent`) on `--color-accent-strong`(`#e00b41`) = **4.89:1** → AA(4.5:1) 통과 ✅
- Danger 텍스트(`#c13515` on 흰색) = 5.54:1 ✅ / Text secondary(`#6a6a6a` on 흰색) = 5.41:1 ✅ (기존과 동일, 재확인만)
- Toast(흰 텍스트 on `#222222`) = 15.91:1 ✅
- ⚠️ **미해결로 남는 항목** (이번 작업 범위 밖, 확정 결정을 그대로 구현한 결과):
  - Calendar Period 마킹 숫자: 흰 텍스트 on `--color-period`(`#ff385c`) = 3.52:1, AA 미달. Primary Button만 수정 대상으로 명시됐고 Period는 `brand-500` 유지가 확정 사항이라 손대지 않음.
  - Predicted 점선 테두리/아이콘: `#ffd1da` on 흰 배경 = 1.37:1. 텍스트가 아니라 도형(비문자) 요소라 WCAG 1.4.11 Non-text Contrast(3:1) 기준 적용 대상인데 이마저 미달. 확정된 `brand-200` 매핑을 그대로 구현했으나, 시각적으로 거의 안 보일 수 있어 배포 전 육안 확인 필요.

## DESIGN.md와의 충돌 (수정하지 않고 보고)
DESIGN.md §6.5는 Calendar 색상을 "Fertile 배경/강조"로 설명하지만, 이번에 확정된 Semantic Token 목록에는
`--color-fertile`(연보라 배경)만 있고 `--color-fertile-strong`(진보라 강조) 토큰이 없음. 그 결과
`.legend-fertile` 아이콘(진보라)이 부득이 `--color-ovulation` 값을 재사용함 — 기존에도 `--luxe` 하나로
겸용되던 것과 동일한 패턴이라 시각적 회귀는 없지만, "Ovulation" 토큰명이 Fertile 범례 아이콘에 쓰이는
이름-용도 불일치가 발생함. 임의로 새 토큰을 추가하지 않고 그대로 두었음 — 필요시 별도 결정 요청.

## 테스트 결과
1. `grep`으로 이전 토큰(`--primary*`, `--luxe*`, `--canvas`, `--surface-soft/strong`, `--hairline*`,
   `--muted`, `--ink`, `--on-primary`) 참조 0개 확인 (style.css, app.js)
2. `style.css`/`app.js`에서 사용된 모든 `var(--...)` 이름이 `:root`에 실제 선언돼 있는지 대조 → 미정의 참조 0개
3. Primitive 13개, Semantic 20개 전부 최소 1회 이상 참조 확인 (표 형태로 카운트 확인)
4. 하드코딩 hex 재검사 → `:root` 내부(선언부)와 `index.html`/`manifest.json`(지시사항상 유지 대상) 외 잔존 없음
5. CSS 중괄호 75/75로 구조 깨짐 없음
6. Primary Button 대비 계산 → 4.89:1로 AA 통과 확인
7. 브라우저 실사용 확인은 **미실시** — 아래 "배포 전 확인 필요사항" 참고

## 배포 전 확인이 필요한 사항
- [ ] 로컬/모바일 화면에서 육안 확인 (특히 Calendar predicted 점선이 연한 핑크로 바뀌어 잘 안 보이는지, Viewer 배지가 Owner 배지와 구분 안 되는 게 의도대로인지)
- [ ] 저장/삭제/설정/캘린더 상세 등 핵심 플로우 회귀 확인 (색상 외 로직 변경 없어 낮은 위험으로 판단하나 미실시)
- [ ] Predicted 마커·범례 대비(1.37:1) 낮음 — 그대로 배포할지, 별도 후속 작업으로 값을 조정할지 결정
- [ ] `--color-fertile-strong` 부재로 인한 Ovulation/Fertile 토큰 이름-용도 불일치, 필요시 후속 결정
- [ ] 확인 완료 후 CHANGELOG.md 갱신 및 배포 진행
