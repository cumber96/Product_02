# Changelog

이 프로젝트의 주요 변경 사항을 버전별로 기록합니다.

## [Unreleased]

### Added

- 사랑기록 기능 추가: 날짜별로 사랑기록을 남기고 조회/삭제 가능 (Owner만 추가/삭제, Viewer는 조회만)
- 설정 페이지 추가: 홈 화면 우측 상단 ⚙️ 아이콘으로 진입, 알림 켜기/끄기와 로그아웃 제공

### Changed

- Home 화면 UI/UX 전면 개편. 상단을 프로필/파트너 카드 없이 "오늘 날짜 + 설정" 헤더로 단순화. Prediction을
  Horizontal Card Carousel(생리 예정일/배란 예정일/가임기, 카드 폭 46%로 다음 카드가 자연스럽게 일부 보임,
  "N일 뒤"/"M.D (요일)" 표기)로 구성. 캘린더가 Home의 핵심 콘텐츠로 배치되고, 오늘(점)/선택(Accent Ring)/
  생리기간(연결되는 셀 배경)/예상 생리기간(옅은 Tint+점선)/가임기(하단 Band)/배란일(더 진한 하단 Band)/
  사랑기록(Heart 아이콘)/캘린더 기록(점)이 서로 다른 시각 언어로 구분됨. Legend 심볼도 실제 캘린더 마커
  모양과 동일하게 재구성(단일 원형 색상점 통일 지양). 날짜를 탭하면 별도 화면 이동 없이 캘린더 아래에
  해당 날짜의 조회 전용 요약이 펼쳐지고, 추가·수정은 이 프로젝트 최초의 Bottom Sheet Component(입력 폼이
  항상 먼저 보이는 구조)로 분리(Owner만 "기록 관리" 진입점 노출, 삭제는 폼 아래 작은 링크로만 존재해
  상시 노출하지 않음) — 기존에 상시 노출되던 "새 기록 추가" 폼과 별도 Detail 화면을 대체. "오늘 종료"
  퀵액션은 폼의 종료일 직접 입력으로 대체되어 제거됨. Prediction/Calendar 계산 로직과 기록 저장 API는
  변경 없음. 캘린더 월 이동 버튼은 44px 터치 영역 확보
- (문서 미반영) 사랑기록 캘린더 마커에 실제 Lucide Heart 아이콘을 사용 — DESIGN.md §5 "셀 안 마킹은
  아이콘으로 바꾸지 않는다" 원칙과 배치되는 예외. DESIGN.md는 별도 결정 전까지 갱신하지 않음
- Home에서 뺀 프로필(아바타/이름/Owner·Viewer 배지), 파트너 초대·연결 관리를 Settings 화면으로 이동.
  Settings가 "앱 설정 + 계정 + 파트너 관리" 역할을 담당
- Button Family를 Action Button(`.btn`)/Icon Button(`.icon-btn`, `.icon-btn.header`)/Text Button
  (`.text-btn`) 3개 구조로 정리. `.detail-header button`/`.calendar-header button`의 100% 중복 CSS를
  `.icon-btn.header` 하나로 통합하고, `.log-actions button`을 재사용 가능한 `.text-btn`으로 승격.
  Button 전체에 키보드 접근성을 위한 `:focus-visible` 아웃라인 추가(신규 토큰 없이 기존 색상 재사용).
  시각적 변화 없음
- 반복되던 "아이콘 + 제목" 카드 헤더 패턴을 `renderSectionHeader()` 헬퍼 + `.section-header` 클래스로
  통합 (12곳). 시각적 변화 없음
- 예상 생리(Predicted Period) 표시 가시성 개선: 대비가 낮았던 `brand-200`(연한 핑크, 1.37:1) 대신
  `brand-500`(진한 핑크, 3.52:1)을 재사용하고, 점선 테두리 + 옅은(12%) 배경 채움으로 실제 생리(solid fill)와
  "색상"이 아닌 "강도" 차이로 구분되도록 변경
- Color Token을 Primitive → Semantic 2단계 구조로 개편. 기존 `--primary`/`--luxe`/`--ink`/`--muted` 등 14개
  토큰을 `--color-text-*`/`--color-surface-*`/`--color-border-*`/`--color-accent-*`/`--color-danger-*`/
  `--color-period`/`--color-fertile`/`--color-ovulation` 등 Semantic Token으로 교체 (Component Token은
  도입하지 않음)
- Primary Button 기본 배경을 `#ff385c` → `#e00b41`로 변경. 흰 텍스트 대비가 3.52:1(WCAG AA 미달) →
  4.89:1(AA 충족)로 개선됨
- Calendar 예상 생리(predicted) 마킹 점선/범례 색을 연한 핑크(`#ffd1da`)로 변경
- Viewer 배지 색상을 보라색에서 Owner 배지와 동일한 뉴트럴 회색으로 변경 (역할 구분은 텍스트로만 표시)
- 기본 폰트를 Pretendard로 적용 (셀프 호스팅 woff2 subset, `/fonts`). 기존에도 이름은 있었으나 실제로는 로드되지 않던 상태였음
- font-size/font-weight/line-height/letter-spacing을 `:root`의 Typography Primitive Token(`--font-size-*`, `--font-weight-*`, `--line-height-*`, `--tracking-tight`)으로 토큰화. 기존 값 그대로 재사용해 화면상 변화는 없음
- 전체 아이콘을 이모지/문자(⚙️🔔💌📊✍️📋💜‹›)에서 Lucide 기반 SVG 아이콘으로 교체, `icons.js`에서 중앙 관리
- 캘린더 하단에 항상 표시되던 기록 리스트 제거, 날짜를 탭하면 해당 날짜의 상세 페이지에서 캘린더 기록과 사랑기록을 확인
- 홈 화면에 항상 떠 있던 알림/iOS 설치 안내 배너를 제거하고 설정 페이지로 이전

- 상단 예측 정보 카드 구성 변경: "다음 예상 생리일 / 배란 예상일 / 가임기"(캘린더와 중복 표시) 제거, "평균 생리주기 / 평균 생리기간 / 마지막 생리일"로 교체
- 캘린더의 배란 예상일 마킹을 이모지(💧)에서 기존 범례 dot 스타일과 통일된 채워진 점 표시로 변경

### Fixed

- 사진이 없는 사용자의 아바타 이니셜 폴백에 크기·원형 테두리가 전혀 적용되지 않던 버그 수정
  (`.avatar` 선택자가 `<img>` 태그로만 스코프돼 있어 `<div>` 폴백엔 미적용이었음)
- 새 기록 추가 시 저장은 되지만 캘린더/목록이 즉시 갱신되지 않던 버그 수정 (`showToast` 함수 누락)
- 기록 저장 시 앱 푸시가 중복 발송되던 버그 수정 (사용자당 누적된 구독을 정리하지 않던 문제)
- `app.js`의 아바타 폴백/초대 코드 안내/예측 정보 빈 상태 문구가 존재하지 않는 CSS 변수(`--pink-light`, `--pink`, `--text-muted`)를 참조하던 버그 수정 — 실제 토큰(`--primary-disabled`, `--primary`, `--muted`)으로 연결

### Removed

- `style.css`에서 사용되지 않던 Color Token 3개 제거 (`--body-text`, `--muted-soft`, `--border-strong`)
- Color Token 구조 개편으로 기존 토큰 14개 제거 (`--primary`, `--primary-active`, `--primary-disabled`,
  `--primary-error`, `--luxe`, `--luxe-soft`, `--ink`, `--muted`, `--hairline`, `--hairline-soft`, `--canvas`,
  `--surface-soft`, `--surface-strong`, `--on-primary`)

---

## [0.1.0] - 2026-07-22

### Added

- 생리주기 기록 기능
- 다음 생리 예정일 계산
- 배란일 및 가임기 계산
- 월간 캘린더
- Owner 로그인
- 파트너 조회 기능
- PIN 잠금
- Cloudflare 1차 배포

### Notes

- 여자친구와 함께 실제 사용을 시작한 첫 번째 MVP