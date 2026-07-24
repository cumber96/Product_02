# Current Task

## Goal
Home 시각 일관성 개선 + 알림함 구현 + 더블탭 확대 버그 수정 Sprint. Owner/Viewer 동일 적용, 기존 권한
차이만 유지. 기존 API/데이터 모델/예측·캘린더 계산 로직은 변경하지 않는다.

## Background
직전 Home UI 개선 Sprint에서 Today Hero를 텍스트 전용으로, Prediction 카드를 톤별 배경색으로 만들었는데,
Calendar는 Card+Shadow 구조라 화면 안에서 시각 언어가 어긋난다는 피드백. 또한 Header에 추가했던 알림
버튼이 아직 Toast만 띄우는 자리표시자 상태라 실제 알림함 화면이 필요하고, 실사용 중 버튼/캘린더 셀을
빠르게 두 번 탭하면 브라우저가 확대되는 문제가 발견됨.

## Scope
- **Today Hero**: 텍스트 전용 → Calendar와 같은 `.card` 재사용(흰 배경 + 동일 Radius + `--shadow-1`),
  화면 전체를 차지하지 않는 컴팩트한 요약 Card로. 문구/계산 로직(`getTodayHeroStatus`/`classifyDate`)은
  무변경
- **Prediction Carousel**: 카드별 핑크/보라 배경(`color-mix` 톤) 제거 → 흰 배경 + 얇은 Border로 통일,
  종류 구분은 아이콘 색으로만. Calendar처럼 Shadow까지 넣으면 카드 3장이 나란히 있어 누적 무게가 더
  강해지므로 Shadow는 넣지 않고 Border만. 정보 구조(아이콘/라벨/D-Day/날짜, peek, 가로 스크롤, 인디케이터
  없음)는 무변경
- **Notification Center**: Bell 버튼을 Toast 대신 실제 화면 이동으로 변경(Header ← 알림함 + List). 알림을
  저장하는 테이블/API가 전혀 없어 가짜 데이터를 만들지 않고 항상 빈 상태 UI만 제공, 코드에 향후 연동
  지점(데이터 shape/API 자리)을 주석으로 명확히 남김. Owner/Viewer 모두 동일하게 접근 가능
- **더블탭 확대 버그**: 원인 조사 후 `touch-action: manipulation`을 인터랙티브 요소에 적용해 수정. 전역
  핀치 줌은 유지(viewport `user-scalable=no`/`maximum-scale=1` 사용 금지). 빠른 연속 탭으로 인한 폼
  중복 제출 여부도 함께 점검
- **절대 변경 금지 재확인**: API, 데이터 모델, 예측/캘린더 계산 로직, 권한 로직, Bottom Sheet 리디자인
  — `functions/`, `migrations/` diff 0 유지, 새 알림 테이블/엔드포인트 생성 금지

## Definition of Done
- Today Hero/Prediction/Calendar가 동일한 Card 언어(흰 배경/동일 Radius/약한 Shadow 또는 Border)로 보임
- Prediction 카드에서 톤별 배경색 완전히 제거, 아이콘 색으로만 종류 구분
- Bell → 알림함 화면 이동, 뒤로가기 정상, Owner/Viewer 둘 다 접근 가능, 가짜 알림 데이터 없음
- 인터랙티브 요소 더블탭 시 확대되지 않음, 전역 핀치 줌은 정상 동작
- 폼 빠른 연속 제출로 인한 중복 데이터 생성 방지
- Owner/Viewer 모두 Console Error 없이 정상 동작(QA)
- `functions/`, `migrations/` diff 0
- 배포(Cloudflare Pages) 완료, TASK.md/CHANGELOG.md 갱신

## Result

### Status
✅ 구현 완료, QA 통과, 배포 완료. CHANGELOG.md 갱신 포함.

### 변경 파일
`app.js`, `style.css`만 수정. `functions/`, `migrations/`, `wrangler.toml`, `manifest.json`, `icons.js`,
`index.html`(viewport 포함) diff 0 확인 — 새 알림 테이블/API/아이콘 추가 없음.

### Today Hero / Prediction Carousel
- Hero: `<div class="hero">` → `<div class="card hero">`로 마크업만 변경, `.hero` CSS에는
  `box-shadow: var(--shadow-1)`만 추가(배경/Radius/Border/Padding/margin은 전부 기존 `.card`가 이미
  제공). 텍스트/계산 로직(`getTodayHeroStatus`, `classifyDate`) 무변경
- Prediction: `.prediction-slide`의 `color-mix()` 톤별 배경 3줄(period/ovulation/fertile) 전부 제거,
  배경을 `--color-surface`(흰색) + `border: 1px solid var(--color-border-default)`로 통일. 종류 구분은
  아이콘 색만 유지(period=`--color-period`, ovulation/fertile=`--color-ovulation` — fertile 전용 진한
  색 토큰이 없어 Legend와 동일하게 ovulation 색 재사용, 아래 "토큰 관련 제약" 참고). Calendar처럼
  Shadow까지 넣지 않은 이유: 카드 3장이 나란히 있어 Shadow까지 더하면 누적 무게가 Calendar 카드 1장보다
  강해짐 — Border만으로 Card 언어를 통일하고 무게는 가장 가볍게 유지
- 정보 구조(아이콘+라벨 → D-Day+날짜 한 줄), peek, 가로 스크롤, 인디케이터 없음은 전부 무변경

### Notification Center
- 조사 결과: D1 스키마(`migrations/0001_init.sql`, `0002_love_logs.sql`)에 알림/활동이력 테이블이
  전혀 없고(`users`/`sessions`/`invites`/`cycle_logs`/`push_subscriptions`/`love_logs`뿐), 관련 API도
  `functions/api/push/subscribe.js`(Web Push 구독 등록/해지)만 있을 뿐 알림 "목록"을 저장/조회하는
  엔드포인트가 없음. 지시사항이 API/데이터 모델 변경을 금지하고 가짜 데이터도 금지해, 안전한 선택지 2번
  ("저장 구조 없으면 빈 상태 UI 우선 구현")을 택함
- Bell 버튼(`data-action="open-notifications"`)이 기존 Toast 대신 `state.notificationsOpen`을 켜고
  전체 화면(`renderNotificationCenter()`)으로 이동하도록 변경. Header(← 알림함) + `.empty-state`(항상
  "알림이 없어요 / 새로운 기록이나 일정이 생기면 알려드릴게요.")만 렌더링
- **알림 항목 리스트(아이콘/발신주체/본문/시간/읽음상태) UI는 구현하지 않음** — 실제로 렌더될 데이터가
  전혀 없는 상태에서 List Row 컴포넌트를 미리 만들면 영원히 실행되지 않는 코드가 되어 CLAUDE.md "사용하지
  않는 코드 생성 금지"에 위배된다고 판단. 대신 `renderNotificationCenter()` 바로 위에 향후 연동 지점을
  주석으로 명시: 알림 데이터 shape(`{id, type, source, body, createdAt, read, targetDate?}`)과, 알림 탭
  시 날짜 연결이 필요하면 새 상세 화면을 만들지 않고 기존 `open-date` 액션을 재사용하라는 지침까지 남김
- Owner/Viewer 모두 동일한 화면(권한 분기 없음) — 항상 빈 상태라 노출되는 정보 자체가 없어 권한별 정보
  노출 차이도 발생하지 않음
- 접근성: Bell `aria-label="알림"`(기존), 뒤로가기 `aria-label="뒤로"` 추가. 읽음/안읽음 색상 단독 구분
  금지 요구사항은 실제 항목이 생길 때 적용 필요(현재는 항목 자체가 없어 해당 없음)

### 더블탭 확대 버그
- **원인**: 모바일 브라우저는 탭 가능 요소를 빠르게 두 번 탭하면 기본적으로 "더블탭 확대" 제스처로
  해석한다. 이 프로젝트는 `viewport`에 `user-scalable=no`/`maximum-scale=1`을 쓰지 않아(의도적으로,
  접근성 때문에) 핀치 줌은 항상 살아있는 대신, 버튼/캘린더 셀 등 어디를 탭해도 브라우저가 그 탭을
  "확대 제스처의 일부일 수도 있다"고 보고 판정을 지연시키는 게 근본 원인. 표준 해법은 전역 확대를 막는
  게 아니라, 개별 인터랙티브 요소에 `touch-action: manipulation`을 선언해 "이 요소는 더블탭 확대 대상이
  아니다"라고 브라우저에 알려주는 것
- **수정**: `button { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }`를 전역
  버튼 셀렉터에 추가(이 프로젝트의 모든 클릭 가능 컨트롤은 이미 `<button>` 태그로 통일돼 있어
  `.icon-btn`/`.btn`/`.text-btn`/버튼형 `.list-row` 전부 자동 커버). `<button>`이 아닌 나머지 탭 대상
  (`.day-cell`, `.prediction-slide`, `.list-row`(div인 경우), `.sheet-backdrop`)에는 별도 규칙으로
  `touch-action: manipulation` + `-webkit-tap-highlight-color: transparent` + `user-select: none` 추가
  (텍스트가 있는 div를 빠르게 두 번 탭하면 iOS가 텍스트 선택/확대 루페를 띄우는 것도 함께 방지)
  - 적용 후보로 제시된 8곳(Header 아이콘/Calendar 이전다음/Calendar 날짜셀/Prediction Card/Selected
    Date Detail 버튼/Settings Row/Notification Row/Bottom Sheet 버튼) 전부 위 두 규칙의 조합으로 커버됨
    확인(Settings Row·Notification Row는 `.list-row` 하나로, 나머지 버튼류는 전역 `button{}` 하나로)
  - `viewport` meta(`user-scalable=no`/`maximum-scale=1`)는 손대지 않음 — 전역 핀치 줌 유지 확인
- **touch/click 중복 실행 점검**: `appEl`에 `click`/`submit` 리스너만 등록돼 있고 `touchstart`/`touchend`
  등 별도 터치 리스너는 코드 전체에 없음 — 동일 탭에 대해 두 종류 이벤트가 중복 실행될 구조 자체가 없음을
  코드 확인으로 검증(grep, 0건)
- **빠른 연속 탭으로 인한 중복 액션 점검**: `handleDeleteLog`/`handleDeleteLoveLog`는 `confirm()` 네이티브
  모달이 이미 막아주지만, `cycle-log-form`(저장)과 `add-love-log-form`(사랑기록 추가)은 확인 절차 없이
  바로 `POST`/`PATCH`를 보내 빠른 연속 탭 시 중복 레코드가 생길 수 있는 실제 위험을 발견. `onAppSubmit`
  한 곳에 제출 중엔 `submit` 버튼을 `disabled`로 잠갔다가 요청이 끝나면(성공/실패 무관, `finally`) 다시
  풀어주는 가드를 추가 — 두 폼 핸들러(`handleSaveCycleLog`/`handleAddLoveLog`) 내부는 전혀 건드리지
  않음. Playwright로 같은 버튼에 즉시 연속 2회 클릭 시 실제 네트워크 요청이 1회만 발생함을 확인

### 토큰 관련 제약 (기존에 보고된 것과 동일, 새로 발생한 문제 아님)
- `--color-fertile`는 옅은 배경 전용 톤이라 아이콘 색으로 쓰면 대비가 너무 낮음(`--color-fertile-strong`
  부재는 직전 Sprint에도 보고됨). 이번에도 Legend와 동일하게 `--color-ovulation`을 재사용해 배란/가임기
  카드 아이콘이 같은 보라색을 공유함 — 라벨 텍스트로는 항상 구분되므로 기능상 문제는 없으나, 색상만으로는
  둘을 구분할 수 없음. 전용 토큰이 필요하면 DESIGN.md §6.9 절차로 별도 결정 필요
- `--shadow-1`을 Hero/Calendar에 재사용 — 프로젝트에 Shadow 토큰이 이 하나뿐이라는 제약은 직전 Sprint와
  동일

### QA 방법 및 결과
- Google 로그인 없이 `boot()`만 mock 데이터로 임시 교체한 스크래치패드 복사본을 Playwright(Chromium
  headless, `hasTouch: true`)로 렌더링/조작 확인(실제 배포 코드는 미변경, mock 복사본은 검증 후 폐기)
- Owner/Viewer Home(Hero/Prediction Card 언어 통일 확인), Owner/Viewer 알림함(빈 상태), Settings 등 5개
  이상 상태 스크린샷 확인 — 전 케이스 Console Error 0건
- 인터랙션: Bell 클릭 → 알림함 이동 → 뒤로가기 → Home 복귀 정상, `getComputedStyle().touchAction`으로
  8개 후보 요소 전부 `manipulation` 적용 확인, 사랑기록 폼 연속 2회 클릭 시 네트워크 요청 1회만 발생 확인
- `node --check app.js` 문법 통과, CSS 중괄호 짝 확인
- `git diff --stat`으로 `functions/`, `migrations/`, `index.html` 등 diff 0 재확인
- **실기기 실사용 테스트는 미실시** — Playwright는 `touch-action` CSS 속성이 올바르게 적용됐음을
  프로그래매틱으로 확인하지만, 실제 iOS Safari/Android Chrome에서 물리적으로 더블탭했을 때 확대가
  안 일어나는지는 실기기에서 직접 확인 필요(아래 Known Issue 참고)

### 발견했지만 고치지 않은 기존(pre-existing) 이슈
- (계속 보고됨) 오늘 날짜가 두 자리 수일 때 "오늘" 점이 숫자와 겹쳐 보이는 문제 — 계산/마커 로직 변경
  금지 범위라 이번에도 손대지 않음

### 배포
✅ 커밋 후 `origin/main`으로 push, Cloudflare Pages Git 연동으로 자동 배포됨. 새 DB 마이그레이션 없어
원격 D1 작업 불필요.

---

# Current Task (직전 완료분: Home UI 개선 — 알림 버튼/Today Hero/Calendar·Settings 다듬기)

## Goal
Home UI 개선 Sprint. 기능 변경 없이 UI/레이아웃만 수정. Header에 알림 진입 버튼 추가(내용은 추후 구현),
Prediction 위에 Today Hero 추가(기존 Prediction 계산 로직 재사용), Calendar를 border 유지하되 매우 약한
shadow와 더 가벼운 월 이동 버튼으로, Settings 섹션 간 여백 개선. API/상태관리/디자인 토큰 외 신규 값
추가 금지.

## Background
직전 UI Refine Sprint(Prediction/Calendar/Settings 구조 개선) 배포 후 실사용 피드백. 오늘 하루의 상태를
캘린더까지 안 봐도 바로 알 수 있는 대표 영역이 없다는 점, Calendar border를 완전히 없앤 게 오히려
밋밋해 보인다는 점, Settings 섹션 간격이 더 필요하다는 점을 반영.

## Scope
- **Header**: 우측에 알림(Bell) 아이콘 버튼 추가(Notification Center 진입용, 내용은 추후 구현 — 이번엔
  피드백 Toast만 제공), 기존 설정 아이콘은 그 옆에 유지
- **Today Hero**: Prediction Carousel 위에 카드가 아닌 상단 대표 텍스트 영역 추가. `classifyDate()` 등
  기존 계산 로직만 재사용해 오늘 상태 문구를 도출(생리/예상생리/배란/가임기/비가임기 5단계), 새 계산 로직
  추가 금지
- **Prediction Carousel**: 요청된 "제목 → D-Day → 날짜" 3단 구조는 직전 Sprint에서 이미 구현돼 있어 추가
  변경 없음(확인만)
- **Calendar**: `.calendar-card`의 `border: none` 제거(기존 `.card` border 복원), `--shadow-1`(기존
  유일한 Shadow 토큰) 재사용해 매우 약한 elevation 추가, 월 이동 버튼을 opacity 0.6 + 아이콘 16→14px로
  한 단계 더 가볍게. 날짜 상태 계산 로직/Legend(2줄) 무변경
- **Settings**: `.list` 섹션 간 margin-bottom을 `--space-md`→`--space-lg`로, `.detail-header`
  margin-bottom도 동일하게 확대. List 구조 자체는 직전 Sprint에서 이미 구현됨(iOS Settings류), 이번엔
  간격만 조정
- **절대 변경 금지 재확인**: API, 상태관리 방식, 색상 시스템, 신규 Typography/Shadow 토큰 추가 —
  `functions/`, `migrations/` diff 0 유지

## Definition of Done
- Header에 알림 버튼이 설정 버튼과 함께 노출되고 클릭 시 피드백(Toast) 제공
- Today Hero가 Prediction 위에 카드가 아닌 형태로 노출, 5개 상태 텍스트가 실제 계산 결과와 일치
- Calendar가 border 유지 + 약한 shadow + 더 가벼운 월 이동 버튼으로 보임, 8개 날짜 상태 표현 무변경
- Settings 섹션 간 여백이 이전보다 넓어짐, 기능(프로필/파트너/알림/로그아웃) 100% 동일
- 새로운 색상/타이포그래피/Shadow Primitive 추가 없음(기존 토큰만 재사용) — 불가피하게 없는 경우 보고
- Owner/Viewer 모두 Console Error 없이 정상 동작(QA)
- `functions/`, `migrations/` diff 0
- 배포(Cloudflare Pages) 완료, TASK.md/CHANGELOG.md 갱신

## Result

### Status
✅ 구현 완료, QA 통과, 배포 완료. CHANGELOG.md 갱신 포함.

### 변경 파일
`app.js`, `style.css`만 수정(+63/-8줄). `functions/`, `migrations/`, `wrangler.toml`, `manifest.json`,
`icons.js` diff 0 확인(Bell 아이콘은 직전 Sprint에 이미 import돼 있어 재사용, 신규 아이콘 추가 없음).

### Header
- `.home-header` 우측을 버튼 1개 → `.home-header-actions`(신규 flex wrapper, 기존 `.icon-btn` 컴포넌트만
  재사용) 안에 Bell/Settings 버튼 2개로 변경
- `data-action="open-notifications"` 클릭 시 `showToast("알림센터는 준비 중이에요")` — 기존 Toast
  컴포넌트 재사용, 새 state 필드/화면/API 없음(요청대로 "내용은 추후 구현")

### Today Hero
- 신규 `renderTodayHero()` + `getTodayHeroStatus()`. 새 계산 로직을 추가하지 않고 기존
  `classifyDate(오늘)`이 반환하는 `{period, predicted, ovulation, fertile}` 플래그만으로 5단계 문구
  분기(생리 중 → 예상 생리 → 배란일 → 가임기 → 비가임기, 예시로 준 "오늘은 비가임기 / 임신 확률 낮은
  날" 포함)
- 마크업은 `.hero`(카드 아님 — `border`/`background` 없음, `.card`와 무관한 순수 텍스트 블록). 제목은
  기존 최대 Typography 토큰(`--font-size-title`)에 `--font-weight-bold`를 적용해 시각적으로 가장 무겁게
  — DESIGN.md §7의 `Display` 토큰은 "필요해지면 정의"로 남겨져 있으나, 이번 지시가 "디자인 토큰만 사용"을
  명시해 새 Primitive를 추가하지 않고 기존 스케일 안에서 해결함(아래 "토큰 관련 결정" 참고)
- 예측 데이터가 없는 상태(`!p.hasData`)에서는 Hero를 아예 렌더링하지 않음 — 처음엔 Hero도 자체 빈 상태
  문구를 넣었다가, Prediction Carousel의 기존 빈 상태 문구("아직 기록이 없어요…")와 내용이 그대로
  중복되는 걸 QA 스크린샷에서 발견해 제거(Prediction 쪽 문구는 무변경)

### Prediction Carousel
- 요청된 "제목 → D-Day → 날짜" 3단 구조 예시를 다시 확인한 결과 직전 Sprint에서 이미 구현된
  `.prediction-slide`(라벨 → `.prediction-meta` 안에 상대 날짜+실제 날짜 한 줄) 구조와 동일해 **코드
  변경 없음**

### Calendar
- `.calendar-card`에서 `border: none` 제거 → 상위 `.card`의 기본 border(`1px solid
  var(--color-border-default)`)가 그대로 복원됨(border 유지 지시 반영)
- `.calendar-card`에 `box-shadow: var(--shadow-1)` 추가 — 프로젝트에 정의된 유일한 Shadow 토큰을 재사용
  (신규 Shadow Primitive 추가 없음). 기존엔 Toast에만 쓰이던 토큰이라 카드에 쓰기엔 다소 진하게 느껴질
  수 있음 — 아래 "확인 필요 사항" 참고
- `.icon-btn.month-nav`에 `opacity: 0.6` 추가 + 아이콘 크기 16px→14px로 축소(월 이동 버튼을 "현재보다
  약하게"). 새 색 토큰 없이 기존 `--color-text-secondary` + opacity 조합으로 처리 — `.btn:active`가
  이미 `filter: brightness()`로 새 토큰 없이 상태를 표현한 전례와 동일한 방식
- 날짜 상태 8종 표현 방식, `classifyDate()`/`buildCalendarCells()` 등 계산 로직, Legend 2줄 구성 전부
  무변경(diff 없음)

### Settings
- `.list`(섹션 그룹 wrapper) margin-bottom: `--space-md`(12px) → `--space-lg`(24px)
- `.detail-header` margin-bottom도 동일하게 `--space-md` → `--space-lg`(제목과 첫 섹션 사이 여백 확보)
- List 구조·Row 스타일·기능(프로필/파트너/알림/로그아웃)은 직전 Sprint에서 이미 iOS Settings류로
  구현돼 있어 간격 조정 외 추가 변경 없음

### 토큰 관련 결정 (확인 필요)
- **Shadow**: `--shadow-1` 하나만 존재해 그대로 재사용했으나, 원래 Toast(플로팅 요소)용으로 설계된
  값이라 "매우 약한" 카드 shadow로 쓰기엔 다소 진할 수 있음. 더 약한 `--shadow-xs` 같은 별도 토큰이
  필요하면 DESIGN.md §6.9에 준하는 별도 결정 필요
- **Typography**: Hero 제목에 DESIGN.md §7의 `Display`(현재 미정의) 대신 기존 `--font-size-title` +
  `--font-weight-bold` 조합을 사용. "가장 크게"라는 요청과 완전히 일치하진 않을 수 있음 — 더 큰 Display
  크기가 필요하면 별도로 알려주면 §6.9와 동일한 절차로 추가 가능

### QA 방법 및 결과
- 직전 Sprint와 동일한 방식: Google 로그인 없이 `boot()`만 mock 데이터로 임시 교체한 스크래치패드 복사본을
  Playwright(Chromium headless)로 렌더링 확인(실제 배포 코드는 미변경, mock 복사본은 검증 후 폐기)
- Owner/Viewer Home, Settings(파트너 연결/미연결/초대 후), Prediction 빈 상태 등 8개 상태 스크린샷 확인
- 인터랙션 테스트: 알림 버튼 클릭 → Toast "알림센터는 준비 중이에요" 노출, 월 이동(다음 달) → 라벨
  2026.08로 정상 갱신, 설정 화면 진입 정상
- 모든 케이스 Console Error/pageerror 0건
- `node --check app.js` 문법 통과, CSS 중괄호 137/137 짝 확인
- `git diff --stat`으로 `functions/`, `migrations/` 등 백엔드 diff 0 재확인

### 발견했지만 고치지 않은 기존(pre-existing) 이슈
- (직전 Sprint에서도 보고) 오늘 날짜가 두 자리 수일 때 "오늘" 점이 숫자와 겹쳐 보이는 문제 — 이번에도
  재확인됐고, 계산/마커 로직 변경 금지 범위라 이번에도 손대지 않음

### 배포
✅ 커밋 `5e7d5c9`, `origin/main`으로 push 완료. Cloudflare Pages Git 연동으로 자동 배포됨. 새 DB
마이그레이션 없어 원격 D1 작업 불필요.

---

# Current Task (직전 완료분: UI Refine Sprint — Home/Calendar/Settings 구조 개선)

## Goal
UI Refine Sprint. 기능 변경이 아니라 Home / Calendar / Settings의 UI 구조 개선. Owner/Viewer 동일하게
적용하며 권한에 따른 기능 차이만 유지. 기존 기능/API/상태관리/DB는 변경하지 않는다.

## Background
직전 Sprint에서 만든 Prediction Horizontal Card Carousel과 Calendar 마커 디자인, Settings의 Card 기반
구조를 실사용 후 다시 다듬는 요청. Prediction 카드는 D-Day와 실제 날짜가 세로로 분리돼 있어 한눈에 안
들어옴, Calendar는 Border/Grid가 무겁고 월 이동 버튼이 큰 원형이라 여백이 부족, Settings는 Card 구조가
iOS Settings 대비 무겁다는 피드백.

## Scope
- **Home Header**: 오늘 날짜 + 설정 아이콘만 유지 (이미 해당 구조, 변경 없음 확인만)
- **Prediction**: 가로 스크롤 카드 구조·Pagination 없음 유지, 카드 안에서 정보명(label)이 최상단에
  먼저 보이도록 유지, D-Day(상대 날짜)와 실제 날짜를 같은 줄에 배치하도록 변경(현재는 세로로 분리됨)
- **Calendar**: 여백 중심·Border 최소화·Grid 약하게·월 이동 버튼 축소·큰 원형 버튼 제거·"‹ 2026.07 ›"
  구조로 헤더/그리드 시각 언어 재작업. 날짜 상태(오늘/선택/생리/예상생리/가임기/배란/사랑기록/캘린더기록)
  표현 방식과 계산 로직은 변경하지 않음. 참고 이미지가 이번 대화에 첨부되지 않아 텍스트 원칙만으로 구현
- **Legend**: 2줄 구성(1줄: 생리/예상생리/가임기, 2줄: 배란/사랑기록/캘린더기록)으로 재배치, 마커는
  Calendar와 동일한 것 재사용
- **Settings**: Card 구조 제거, iOS Settings류 List 기반 UI로 전환. 구조는 Header→Profile→Partner→
  Notification→Logout 유지, 각 섹션 기능(프로필 표시/초대 생성/파트너 상태/알림 켜기끄기/로그아웃)은
  전부 그대로 유지
- **Scrollbar**: Home/Prediction/Calendar/Settings/Bottom Sheet 전 영역에서 스크롤바 숨김(스크롤 동작은
  유지, `overflow:hidden` 금지 — `scrollbar-width:none` + `::-webkit-scrollbar{display:none}` 사용)
- **절대 변경 금지**: API, 계산 로직, 권한 로직, Bottom Sheet 리디자인, Typography, Color System —
  `functions/`, `migrations/` diff 0 유지

## Definition of Done
- Prediction 카드: label 최상단, D-Day와 실제 날짜 한 줄, 가로 스크롤/peek 유지, pagination 없음
- Calendar: 셀 border 최소화(여백 중심), 월 이동 버튼이 더 이상 큰 원형 배경이 아님, 헤더가 "‹ 2026.07 ›"
  형태, 8개 상태 표현 방식 유지
- Legend가 2줄(3+3) 구성
- Settings가 Card 없이 List 기반(iOS 스타일)으로 재구성, Owner/Viewer 기능 차이 그대로 유지
- 모든 스크롤 영역에서 스크롤바 비노출 + 스크롤 정상 동작(`overflow:hidden` 미사용)
- Owner/Viewer 둘 다 Console Error 없이 정상 동작(QA)
- `functions/`, `migrations/` diff 0
- 배포(Cloudflare Pages) 완료, TASK.md/CHANGELOG.md 갱신

## Result

### Status
✅ 구현 완료, QA 통과, 배포 완료. CHANGELOG.md 갱신 포함.

### 변경 파일
`app.js`, `style.css`, `TASK.md`, `CHANGELOG.md`만 수정. `functions/`, `migrations/`, `wrangler.toml`,
`manifest.json`, `icons.js` diff 0 확인.

### Prediction
- `.prediction-slide` 안 `<div class="relative">`/`<div class="date">` 세로 스택을 `.prediction-meta`
  (flex, `justify-content:space-between`)로 감싸 한 줄로 배치. label(정보명)이 최상단에 오는 순서, 카드
  폭 46%(peek 유지), pagination 없음(원래도 없었음), Semantic Color(`--color-period`/`-ovulation`/
  `-fertile`)는 변경 없음

### Calendar
- 헤더: `.calendar-header`를 `justify-content:space-between` → `justify-content:center`(gap 작게)로
  변경, 월 이동 버튼을 `.icon-btn.header`(32px 원형 배경)에서 새 `.icon-btn.month-nav`(배경 없음, 44×44
  투명 히트 영역, 아이콘 16px로 축소)로 교체
- `.day-cell`의 `border: 1px solid var(--color-border-soft)` 제거, `.calendar-grid`에 `gap: 4px 0` 추가로
  border 없이 여백만으로 약한 grid 표현
- `.calendar-card`(신규, `.card`에 추가로 붙는 클래스) — 테두리 제거 + 세로 패딩 확대(`--space-lg`)로
  여백 중심 레이아웃. 전역 `.card`는 그대로 둬 다른 화면(Selected Date Detail 등) 영향 없음
- 날짜 상태 8종(오늘/선택/생리/예상생리/가임기/배란/사랑기록/캘린더기록) 표현 방식, `classifyDate()`/
  `buildCalendarCells()` 등 계산 로직 전부 무변경(diff 없음, grep으로 확인)

### Legend
- 마크업을 `.legend-row` 2개(1줄: 생리/예상생리/가임기, 2줄: 배란/사랑기록/캘린더기록)로 분리. `.legend`
  는 `flex-wrap` 행 하나 → `flex-direction:column`으로 변경. 마커(`swatch-*`, Heart 아이콘)는 기존 그대로
  재사용, 신규 마커 없음

### Settings
- Card 구조(`renderProfileCard`/`renderInviteCard`/`renderPartnerCard`/`renderNotificationSettingsCard`)를
  List 구조(`renderProfileRow`/`renderInviteList`/`renderPartnerList`/`renderNotificationRow`)로 전면
  교체. 신규 CSS `.list`/`.list-row`/`.list-row.list-row-stack`/`.list-row-content`/`.list-row-title`/
  `.list-row.danger`
- `.list-row` 배경을 `--color-surface`(흰색, canvas와 동일)가 아니라 `--color-surface-soft`(연회색, 기존
  토큰 재사용)로 지정 — canvas와 surface가 같은 흰색이라 border 없이는 카드 그룹이 전혀 안 보이는 문제를
  QA 중 발견해 수정. 새 색 토큰 추가 없이 기존 Semantic Token만 재배치
- Header(뒤로가기+"설정")는 기존 `.detail-header`/`.icon-btn.header` 그대로 유지(변경 지시 없었음)
- Owner: Profile → (미연결 시)Partner 초대 List → Notification → Logout. Viewer: Profile →
  (미연결 시)Partner 상태 List → Notification → Logout. 파트너 연결 완료 시 Partner 섹션 자체가 렌더링
  안 되는 기존 동작(빈 문자열 반환) 그대로 유지 — Owner/Viewer 기능 차이 100% 동일
- 더 이상 쓰이지 않게 된 `renderSectionHeader()` 함수와 `User` 아이콘 import, `.section-header`/
  `.profile-row` CSS 제거(grep으로 미사용 확인 후 삭제)

### Scrollbar
- `html, body`에 `scrollbar-width:none` + `::-webkit-scrollbar{display:none}` 추가(Home/Calendar/
  Settings가 전부 같은 document 스크롤을 공유하므로 이 한 곳으로 커버)
- `.sheet`(Bottom Sheet)에도 동일 규칙 추가. `.prediction-track`은 직전 Sprint에 이미 적용돼 있어 그대로
  둠
- `overflow:hidden`은 어디에도 사용하지 않음. Playwright로 `document.documentElement`/`body`의
  `overflow`가 `visible`이고 `scrollHeight`(942px) > `innerHeight`(844px)임을 확인해 실제 스크롤이 살아
  있음을 검증

### QA 방법 및 결과
- Google 로그인 없이 실제 화면을 확인하기 위해 `app.js`/`style.css`/`icons.js`/`index.html`/`sw.js`를
  스크래치패드에 복사하고, `boot()`만 실제 API 호출 대신 mock 데이터를 주입하도록 임시로 바꾼 복사본을
  만들어 `python3 -m http.server` + Playwright(Chromium headless)로 렌더링 확인(실제 배포 코드는 건드리지
  않음, 이 mock 복사본은 검증 후 폐기)
- Owner Home, Viewer Home, Owner/Viewer Settings(파트너 연결/미연결/초대링크 생성 후), Selected Date
  Detail, Prediction 빈 상태(hasData:false), Bottom Sheet 오픈 등 8개 이상 상태를 스크린샷으로 확인
- 월 이동(다음/이전 2회) → 라벨이 2026.08 / 2026.06으로 정확히 바뀜, 설정 화면 진입/뒤로가기 정상 확인
- 모든 케이스에서 브라우저 Console Error/pageerror 0건
- `node --check app.js` 문법 통과, CSS 중괄호 133/133 짝 확인
- `git diff --stat`으로 `functions/`, `migrations/` 등 백엔드 diff 0 재확인

### 발견했지만 고치지 않은 기존(pre-existing) 이슈
- 오늘 날짜가 두 자리 수(예: 24일)일 때 "오늘" 표시용 점(`.day-cell.today::before`)이 숫자와 살짝
  겹쳐 보임. 리팩터 전 원본 코드로도 동일하게 재현돼(스크린샷 비교로 확인) 이번 Sprint에서 만든 회귀가
  아님. 계산 로직/마커 표현 방식은 이번 범위에서 변경 금지 항목이라 손대지 않고 그대로 둠 — 별도 후속
  작업으로 처리 권장

### 참고 이미지 관련
- Calendar 관련 지시에 "첨부 레퍼런스와 같은 패턴으로 변경"이라는 문구가 있었으나 이번 대화에는 이미지가
  첨부되지 않아, 텍스트로 명시된 원칙(여백 중심/Border 최소화/Grid 약하게/월 이동 버튼 축소/큰 원형 버튼
  제거/"‹ 2026.07 ›" 구조)만으로 구현함. 실제 레퍼런스와 세부 차이가 있을 수 있어 확인 후 추가 조정 필요
  시 알려주면 반영 가능

### 배포
✅ 커밋 `653d592`, `origin/main`으로 push 완료. Cloudflare Pages Git 연동으로 자동 배포됨. 새 DB
마이그레이션 없어 원격 D1 작업 불필요. (push 시 GitHub 저장소가 `product_02` → `Product_02`로 리네임된
안내 메시지가 떴으나 기존 remote URL로도 정상 push됨 — 원격 URL은 그대로 두었음)

---

# Current Task (직전 완료분: Prediction/Calendar 재조정)

## Goal
현재 배포된 Home의 Prediction 영역과 Calendar 영역만 시각 디자인/레이아웃을 재작업한다. 데이터, 계산
로직, 상태 관리 방식, Selected Date Detail, Settings는 전부 그대로 유지 — DOM 구조와 CSS만 필요한
범위에서 변경. 배포는 사용자가 별도 확인 후 요청. **CHANGELOG.md는 이번엔 수정하지 않음.**

## Background
직전 Sprint에서 만든 Prediction Hero Carousel(카드 1개가 화면 전체, 페이지 인디케이터)과 Calendar 마커
디자인을 실사용 검토 후 다시 조정하는 요청. Prediction은 Horizontal Card Carousel(카드 여러 개가 가로로
이어지고 다음 카드가 일부 보임)로, Calendar는 셀 경계가 분명한 Grid + 날짜 상태별로 겹치지 않는 표현
(배경/하단 Band/아이콘/Dot/Outline/점)으로 재설계.

## Scope
- **Prediction**: 100% 폭 Hero Carousel → 카드 여러 개가 가로로 이어지는 Carousel(카드 폭 ~46%, 모바일
  기준 1.8~2.2장 노출). Hero형 큰 D-day, 페이지 인디케이터 제거. 카드 내용: 아이콘 + 예측명 + 상대
  날짜("N일 뒤") + 실제 날짜("M.D (요일)" 또는 가임기는 "M.D부터"). 세로 높이 축소
- **Calendar**: 헤더를 "‹ YYYY.MM ›" 형식으로, 요일 행에 일요일만 위험색이 아닌 Accent로 구분, 날짜
  Grid에 셀 경계(얇은 border)와 상단 정렬 숫자, 날짜 상태 7~8종(오늘/선택/생리기간/예상생리기간/가임기/
  배란일/사랑기록/캘린더기록)을 서로 다른 위치·형태로 표현(배경, 하단 Band, 아이콘, Dot, Outline, 점).
  생리기간/예상생리기간/가임기는 인접 날짜 간 배경·Band가 시각적으로 이어지도록(주 경계에서는 자연스럽게
  끊음). Legend 심볼을 실제 Calendar 마커 모양과 동일하게(단일 원형 dot 통일 금지)
- **DESIGN.md §5와의 충돌 확인 필요**: 사랑기록 마커를 이번엔 실제 Lucide Heart 아이콘으로(직전엔 CSS
  도형으로 우회 구현했었음) — DESIGN.md §5 "셀 안 마킹은 아이콘으로 바꾸지 않는다" 원칙과 정면으로
  배치되지만, 이번 지시가 명시적이라(Emoji 아닌 Lucide Heart 사용을 두 번 강조) 그대로 따르고 완료 후
  DESIGN.md 업데이트가 필요한지 별도 보고
- **절대 변경 금지 재확인**: Prediction API/계산 로직, Calendar 날짜 계산, 월 이동, 날짜 선택, 기록
  데이터, 데이터 모델, Selected Date Detail, Settings, 상태 관리 방식 — `functions/`, `migrations/` 등
  diff 0 유지

## Definition of Done
- Prediction: Hero 카드 제거, 여러 카드가 가로로 이어지는 Carousel로 교체, 인디케이터 제거
- Calendar: 8개 상태 전부 시각적으로 구분되고 동시에 겹쳐도 사라지지 않음, Legend 심볼이 실제 마커와 일치
- 접근성: 월 이동 버튼 44px 터치 영역(Calendar 헤더 한정), aria-label 유지, 캘린더 트랙 키보드 스크롤
- Selected Date Detail/Settings/데이터 로직 무변경, `functions/`·`migrations/` diff 0
- CHANGELOG.md 무수정, 배포 안 함

## Result

### Status
✅ 구현 완료, 사용자 확인 후 배포 요청 받아 커밋 `0453ab5`로 배포 완료. CHANGELOG.md도 이번엔 배포에 맞춰
갱신(DESIGN.md §5 충돌 사항도 함께 기록).

### 배포
✅ 커밋 `0453ab5`, `origin/main`으로 push 완료. Cloudflare Pages Git 연동으로 자동 배포됨. 새 DB
마이그레이션 없어 원격 D1 작업 불필요.

### 변경 파일
`app.js`, `style.css`만 수정. `functions/`, `migrations/`, `wrangler.toml`, `manifest.json` diff 0 확인.
`icons.js` 무변경(직전 Sprint에 추가한 `Heart` 등 기존 아이콘만 재사용).

### Prediction 변경
- Hero Carousel(카드 1개=화면 전체, 페이지 인디케이터) → Horizontal Card Carousel(카드 폭 46%, `gap:
  var(--space-sm)`, `scroll-snap-align: start`) — 첫 카드 온전히 보이고 다음 카드 일부가 자연스럽게 잘려 보임
- 카드 내용: 구분 아이콘(Droplet/Egg/Circle, Legend와 동일 아이콘 재사용) + 예측명 + 상대 날짜("N일 뒤",
  신규 `formatRelativeDays()`) + 실제 날짜("M.D (요일)" 신규 `formatDotWithWeekday()`, 가임기는 "M.D부터")
- 기존 Hero D-day(`--font-size-title` 큰 숫자)와 페이지 인디케이터 완전 제거, `setupPredictionCarousel()`
  스크롤 리스너 함수 자체 삭제(더 이상 추적할 인디케이터가 없어짐)
- 세로 높이: `padding: var(--space-xl) var(--space-lg)` → `var(--space-md) var(--space-base)`로 축소
- 톤별 배경은 기존처럼 `color-mix()`로 Semantic Color만 옅게 섞어 구분(신규 토큰 없음)

### Calendar 변경
- 헤더: "2026년 7월" → "2026.07"(dot 표기), 월 이동 버튼에 Calendar 한정으로 `min-width/height:44px` 추가
  (아이콘 자체 크기는 18px 유지)
- 요일 행: 일요일만 `--color-danger`가 아닌 `--color-accent`로 구분(위험색 사용 금지 지시 반영), 토요일은
  기존 Secondary Text 유지
- Grid: 각 셀에 `border: 1px solid var(--color-border-soft)` 추가로 경계 표현, 빈 셀(month 시작 전 공백)도
  `visibility:hidden` 대신 테두리만 있는 빈 박스로 변경(그리드가 끊겨 보이지 않도록), 날짜 숫자를 셀
  중앙 정렬 → 상단 정렬로 변경(하단에 가임기/배란일 Band가 들어갈 공간 확보)
- **생리기간**: 숫자 원 배경 → **셀 전체 배경**(Period Color)으로 변경. 인접 날짜가 같은 상태면
  `period-connect-prev/next` 클래스로 해당 방향 모서리를 각지게 만들어 이어지는 배경처럼 보이게 함(주가
  바뀌는 지점은 `isRangeConnected()`가 같은 행인지 확인해 자동으로 끊음)
- **예상 생리기간**: 옅은 Tint 배경 + 점선 테두리(기존 대비 배경 추가, 실제 생리기간과 뚜렷이 구분). 개별
  날짜마다 독립된 점선 박스로 유지(연결 처리 안 함 — "예측이라 아직 이어지지 않았다"는 의미로 의도적 선택)
- **가임기 / 배란일**: 숫자 원 배경·작은 점 → **셀 하단 Band**로 통일(가임기 4px 옅은 색, 배란일 5px 진한
  색). 배란일은 가임기 구간에 포함되는 날이라 CSS 우선순위(`.ovulation::after`가 `.fertile::after`보다
  뒤에 선언)로 같은 날짜에서 배란일이 이김
- **오늘**: 숫자 원 Ring → 숫자 아래 작은 점(선택 Ring과 겹치지 않도록 명확히 분리)
- **선택한 날짜**: 기존과 동일하게 숫자 원 둘레 Accent Ring 유지(셀 배경은 채우지 않음)
- **사랑기록**: 순수 CSS 하트 도형 → **실제 Lucide `Heart` 아이콘**(11px, 셀 우측 상단)으로 변경 —
  아래 "DESIGN.md 충돌" 참고
- **캘린더 기록(메모)**: 좌측 상단 점(7px) 유지, 사랑기록과 반대쪽 코너로 분리
- 생리기간 배경 위에서는 숫자·기록점·하트 아이콘이 흰색(`--color-on-accent`)으로 자동 전환되도록
  `.day-cell.period` 하위에 override 규칙 추가(대비 확보)

### 날짜 상태별 표현 방식 (요약표)
| 상태 | 표현 | 비고 |
|---|---|---|
| 오늘 | 작은 점 | 숫자 아래, 선택과 다른 표현 |
| 선택한 날짜 | Accent Ring | 숫자 원 둘레만, 셀 배경 안 채움 |
| 생리기간 | 셀 배경(Period Color) | 인접 날짜와 연결 |
| 예상 생리기간 | 옅은 Tint + 점선 테두리 | 개별 박스, 연결 안 함 |
| 가임기 | 셀 하단 Band(옅음) | 인접 날짜와 연결 |
| 배란일 | 셀 하단 Band(진함) | 가임기보다 우선 표시 |
| 사랑기록 | Lucide Heart 아이콘 | 셀 우측 상단 |
| 캘린더 기록 | 작은 점 | 셀 좌측 상단, 사랑기록과 반대쪽 |

### Legend 구성
Legend를 Calendar와 같은 Card 안에 유지(별도 Card 아님). 심볼을 실제 Calendar 마커와 동일한 모양으로:
생리기간=사각 Tint Box, 예상 생리기간=점선 Box, 가임기=옅은 Rounded Bar, 배란일=진한 Rounded Bar,
사랑기록=Heart 아이콘, 캘린더 기록=작은 Dot. 더 이상 "전부 원형 색상점"이 아님.

### DESIGN.md §5와의 충돌 (수정하지 않고 보고)
DESIGN.md §5 Calendar Marker Rules는 "달력 셀 안의 작은 상태 표시는 아이콘으로 변경하지 않는다",
"Legend에서만 Lucide 아이콘을 사용할 수 있다"고 명시합니다. 이번 지시는 사랑기록 마커에 "Emoji가 아니라
Lucide Heart 또는 기존 Icon System 사용"을 두 차례 명시적으로 요구해 이 원칙과 정면으로 배치됩니다.
지시가 명시적이라 그대로 구현했지만(`Heart({size:11})`을 day-cell 안에 직접 렌더링), **DESIGN.md §5는
갱신되지 않은 상태입니다.** 이번 작업 범위(Prediction/Calendar만, 문서는 언급 없음)라 DESIGN.md는 손대지
않았습니다 — 이 예외를 문서에 반영할지 별도로 알려주시면 반영하겠습니다.

### 기존 로직을 유지한 방법
- `classifyDate()`(생리/예상/가임기/배란/사랑/메모 판정)의 비교식은 한 글자도 바꾸지 않음 — 오직
  `renderDayCell()`의 클래스 조합·마크업과 CSS만 변경
- `buildCalendarCells()`, 월 이동 액션(`prev-month`/`next-month`), 날짜 선택 액션(`open-date`) 무변경
- Selected Date Detail(`renderSelectedDateDetail`/`renderSheet`/`renderCycleManageSection`/
  `renderLoveManageSection`), Settings(`renderSettingsScreen`/`renderProfileCard`/`renderInviteCard`/
  `renderPartnerCard`/`renderNotificationSettingsCard`) 관련 함수는 이번 diff에 전혀 등장하지 않음(grep
  확인)
- `state` 객체 필드 변경 없음(신규/삭제 없음)

### 접근성 확인
- 월 이동 버튼: `aria-label` 유지, 터치 영역 Calendar 헤더 한정으로 44px 확보(시각적 아이콘은 18px로 절제)
- Prediction: `.prediction-track`에 `tabindex="0"` + `aria-label` 유지(키보드 가로 스크롤 가능)
- 색상만으로 상태 구분하지 않음: 오늘=점, 선택=Ring, 생리/예상=배경 형태(실선vs점선), 가임기/배란=Band
  두께·위치, 사랑기록=아이콘, 기록=점 — 전부 형태·위치가 다름
- 날짜 셀에 `role="gridcell"`, `aria-selected`, `aria-label="N일"` 추가(신규) — 전체 `calendar-grid`를
  `role="grid"`로 감싸는 완전한 ARIA Grid 패턴까지는 구현하지 않음(키보드 네비게이션 재구현이 필요해
  범위 초과로 판단)
- 터치 영역 44px는 Calendar 헤더 버튼만 처리 — 다른 화면의 `.icon-btn.header`(Settings 등)는 여전히 32px로
  남아있음(이번 범위 아님, 기존에 이미 알려진 이슈)

### 브라우저에서 직접 확인할 항목
- Prediction: 카드 3장 중 1.8~2.2장이 실제로 보이는지, 스와이프가 부드러운지, 텍스트 잘림 없는지
- Calendar: 생리기간이 여러 날 이어질 때 배경이 실제로 연결돼 보이는지(주 경계에서 자연스럽게 끊기는지),
  가임기 Band와 배란일 Band가 겹칠 때 배란일이 우선 표시되는지, 사랑기록 Heart 아이콘 가독성(11px가
  실기기에서 충분히 크게 보이는지)
- 좁은 화면(360px 이하)에서 캘린더 7열이 안 깨지는지, 가로 스크롤 발생 안 하는지
- Console Error 없는지(특히 `color-mix()` 미지원 구형 브라우저 — 이번에도 폴백 없이 사용, 직전 Sprint와
  동일 리스크)

### 배포 전 남은 위험 요소
- `color-mix()`는 비교적 최신 CSS 기능이라 구형 Safari/일부 WebView에서 미지원일 수 있음(이미 직전
  Sprint부터 있던 리스크, 이번에 범위 확대)
- 셀 테두리(`border-soft`)와 연결된 배경/Band가 만나는 지점에서 아주 얇은 경계선이 완전히 사라지지 않고
  희미하게 보일 수 있음(의도적으로 감수한 트레이드오프 — "셀 경계 분명" 요구와 "배경 연결" 요구가 본질적으로
  약간 상충하기 때문)
- 사랑기록 Heart 아이콘이 DESIGN.md §5와 충돌 — 문서 갱신 여부 결정 필요
- 브라우저 실사용 확인 전 단계

---

# Current Task (직전 완료분: Home Hero 개편 + 3건 후속 수정)

## Goal
Home을 처음부터 새로 디자인한다: Prediction을
Hero Card Carousel로, Calendar 마커를 오늘/선택/생리기간/가임기/배란일/사랑기록/캘린더기록이 서로 다른
시각 언어(점/링/배경/하트/점 등)를 갖도록 재설계, Selected Date Detail을 조회 전용 Summary로 바꾸고
수정·삭제·추가는 이 프로젝트 최초의 Bottom Sheet Component로 분리. Detail 화면(이미 지난 Sprint에서
제거)은 이번에 최종적으로 완전히 정리. Settings 구조(Profile→Partner→Notification→Logout)는 유지.

## Background
직전 Sprint에서 Home을 카드 재배치 수준으로만 개편했는데, 이번엔 "재배치가 아니라 전체를 새로 디자인"
하라는 지시. 특히 Selected Date Detail에 CRUD를 그대로 두지 말고 조회 전용으로 바꾸고 Bottom Sheet로
분리하라는 것과, 캘린더 마커가 의미별로 겹치지 않게 서로 다른 시각 언어를 가져야 한다는 것이 이번 핵심.

## Scope
- Prediction: 슬라이드 1개가 화면의 88%를 차지하는 Hero Card로 확대(톤별 배경 틴트, 큰 D-day, 요일 포함
  날짜, 페이지 인디케이터)
- Calendar: 오늘=작은 dot(기존 ring에서 변경), 선택=Accent Ring(오늘이 쓰던 자리 이어받음), 생리기간=배경
  채움(기존 유지), 가임기=셀 배경(기존 유지), 배란일=점(기존 유지), 사랑기록=순수 CSS로 그린 하트 모양
  (Lucide 아이콘 아님 — DESIGN.md §5 "셀 안 마킹은 아이콘으로 바꾸지 않는다" 준수), 캘린더 기록(메모
  존재)=새 점 마커. Legend에 "캘린더 기록" 항목 추가, "예상 생리"는 기존 기능이라 유지
- Selected Date Detail: 조회 전용 Summary(날짜/상태/캘린더 기록 요약/메모/사랑기록 유무)로 축소, 삭제
  버튼 상시 노출 금지. Owner에게만 "기록 관리" 진입점 제공
- 신규 Bottom Sheet Component(`.sheet`/`.sheet-backdrop`): 기존 CRUD 로직(수정/삭제/오늘종료/사랑기록
  추가삭제)을 그대로 이 안으로 이동. 이 프로젝트 최초의 modal형 Component — DESIGN.md §10 Motion 규정
  (150~250ms ease-out)을 처음으로 실제 적용
- **절대 변경 금지 재확인**: Prediction API, 생리/Calendar 계산 로직, 기록 저장 방식, 데이터 모델, 상태
  관리 패턴(단순 mutate+재렌더) — `functions/`, `migrations/` 등 diff 0 유지

## Definition of Done
- Home 4개 섹션(Header/Prediction/Calendar/Selected Date Detail) 전부 새 디자인 반영
- Selected Date Detail에 삭제 버튼이 상시 노출되지 않음, 모든 CRUD는 Bottom Sheet 안에서만
- 캘린더 7개 상태(오늘/선택/생리기간/가임기/배란일/사랑기록/캘린더기록)가 서로 다른 시각 표현
- 데이터 모델에 없는 필드(양/통증/증상)를 새로 만들지 않음 — 실제 필드(기간/메모)만 표시
- 코드 검증(문법/중괄호/미정의 var) 통과, 백엔드 diff 0
- TASK.md, CHANGELOG.md 갱신

## Result

### Status
✅ 구현 완료. 사용자 피드백 3건(아래 "후속 수정" 참고)까지 반영해 커밋 `7fdf68e`로 배포 완료.
CHANGELOG.md는 직전 Home 개편 항목을 최신 상태로 갱신(중간 단계가 배포된 적이 없어 별도 항목을 추가하지
않고 하나의 Unreleased 항목을 최종형으로 수정).

### 변경 파일
`app.js`(대폭 재작성), `style.css`(+272/-18줄), `icons.js`(변경 없음, 직전 Sprint에 추가한 `User`/`X`
재사용). `functions/`, `migrations/` 등 백엔드·데이터 계층은 이번에도 diff 0.

### 데이터 모델에 없는 요소를 어떻게 처리했는지 (재확인)
와이어프레임의 "생리/보통, 통증/약함, 증상/두통"은 `cycle_logs`에 없는 필드라 만들지 않았고, 실제 필드
(기간, 메모)만 Summary에 표시. "사랑기록"은 wireframe 그대로 "있음/없음"으로 단순 표시(개수까지는 굳이
안 보여줌 — Summary는 조회 중심이라는 원칙에 맞춰 최소 정보만).

### 캘린더 마커 설계 (겹치지 않는 시각 언어)
| 상태 | 표현 | 위치/방식 |
|---|---|---|
| 오늘 | 작은 점(뉴트럴) | 셀 상단 중앙 |
| 선택 | Accent Ring | 숫자 원 둘레 |
| 생리기간 | 배경 채움(브랜드 핑크) | 숫자 원 |
| 예상 생리 | 점선 테두리 + 옅은 채움 | 숫자 원 (기존 기능 유지) |
| 가임기 | 배경 톤 | 셀 전체 |
| 배란일 | 작은 점(보라) | 셀 하단 중앙 |
| 사랑기록 | 순수 CSS 하트(원 2개+45도 정사각형) | 셀 우측 상단 |
| 캘린더 기록(메모) | 작은 점(뉴트럴) | 셀 좌측 하단 |

Lucide 아이콘을 셀 안에 쓰지 않는 DESIGN.md §5 원칙을 지키기 위해 사랑기록은 아이콘이 아니라 CSS 도형으로
구현. `.day-cell`은 이미 `::before`(오늘)/`::after`(배란일)를 쓰고 있어, 사랑기록·기록 마커는 pseudo-element
슬롯 부족으로 실제 `<span class="cell-marker">` 엘리먼트를 추가해 렌더링.

### Bottom Sheet (신규 Component)
`.sheet-backdrop`/`.sheet` — 이 프로젝트 최초의 modal형 Component. `state.sheetOpen`으로 제어, 기존
CRUD 로직(수정/삭제/오늘종료/사랑기록 추가삭제)을 100% 재사용해 이 안으로 이동. `animation: sheet-up
200ms ease-out`으로 DESIGN.md §10 Motion 규정(150~250ms ease-out)을 처음으로 실제 적용.

### 검증
- `node --check app.js` 통과, CSS 중괄호 112/112, 미정의 `var()` 참조 0
- `.day-cell.today`가 더 이상 `.num`에 ring을 쓰지 않음(선택 상태만 ring 사용) 확인
- `git diff --stat`으로 `functions/`·`migrations/` 등 무변경 확인
- 브라우저 실사용 확인은 **미실시** — 특히 Hero Carousel 스와이프 폭 계산, 캘린더의 초소형 마커(4~5px)
  가독성, Bottom Sheet 애니메이션은 실제 화면에서 꼭 확인 필요

### 후속 수정 (사용자 피드백 3건 반영, 이번에 배포)
1. **Prediction Hero Card 100% 폭으로 되돌림** — 88%(다음 카드 peek 구조) → 100%(정보 하나에만 집중).
   `.prediction-slide`의 `margin-right` 제거, `scroll-snap-align: start` → `center`. 인디케이터 계산도
   `track.clientWidth` 기준 원복
2. **Bottom Sheet를 입력 중심으로 재구성** — 조회(읽기 전용 뷰 + 수정/삭제/오늘종료 버튼 행) 방식을 버리고,
   기록이 있으면 값이 채워진 수정 폼을, 없으면 빈 추가 폼을 **항상 먼저** 보여주는 구조로 변경.
   `add-log-form`/`edit-log-form` 2개였던 폼을 `cycle-log-form` 1개로 통합(`data-id` 유무로 추가/수정
   분기), `handleAddLog`/`handleEditLog`도 `handleSaveCycleLog` 하나로 병합. 삭제는 폼 아래 작은
   `.text-btn.delete` 링크로만 존재(Save와 동일한 무게로 상시 노출하지 않음). 사랑기록 섹션도 추가
   폼을 목록보다 먼저 배치. **"오늘 종료" 퀵액션은 제거** — 입력 폼의 종료일 필드에 날짜를 직접
   입력하는 것으로 대체(입력 중심 원칙과 직결되는 의도적 단순화, 기능 자체는 폼으로 그대로 가능)
3. **캘린더 마커 확대** — 오늘 4→6px, 배란일 5→7px, 캘린더기록(메모) 5→7px, 사랑기록 하트 lobe
   4→6px(하트 전체 바운딩 박스 약 6×6px → 9×9px)
4. (부수 정리) 더 이상 쓰이지 않는 `state.editingLogId`/`state.addingLogForDate`와 관련 action
   6개(`edit-log`/`cancel-edit`/`start-add-log`/`cancel-add-log`/`quick-end`) 제거 — 입력 중심 구조에서
   자연히 불필요해진 상태/분기라 함께 정리

이번 요청에 "배포는 하지 않습니다" 문구가 없어 배포까지 진행.

### 배포
✅ 커밋 `7fdf68e`, `origin/main`으로 push 완료. Cloudflare Pages Git 연동으로 자동 배포됨. 새 DB
마이그레이션 없어 원격 D1 작업 불필요. `index.html`에 사용자가 IDE에서 직접 수정한 `<title>` 변경
(무관한 out-of-band 편집)이 있어 함께 커밋에 포함시킴 — 제가 만든 변경 아님.

---

# Current Task (직전 완료분: Home 화면 UI 개편 구현)

## Goal
직전 UI Audit 결과를 바탕으로 Home 화면을 실제로 리디자인 구현한다(Header/Prediction/Calendar/Selected
Date Detail). 기존 기능(Prediction API, Calendar 계산, 예측 로직, 기록 저장, 상태 관리 방식)은 변경하지
않고 UI/레이아웃만 새로 설계. Settings에는 Home에서 뺀 Owner/Viewer·Profile·Partner 관리를 이동.

## Background
직전 UI Audit에서 Home이 P1(초대+통계+캘린더+기록추가 4개 목적이 뒤섞임)으로 지목됐고, 이번이 그 개편
Sprint. 구현 착수 전 가장 큰 구조적 결정(캘린더에서 날짜 탭 시 별도 Detail 화면으로 이동할지, Home에
완전히 흡수할지)이 지시사항만으로는 확정되지 않아 사용자에게 확인 — **"Home에 완전 흡수"**로 확정받고 진행.

## Scope
- `app.js`: Home을 Header(오늘 날짜+설정 아이콘)/Prediction Carousel(스와이프 3슬라이드+인디케이터)/
  Calendar(+사랑기록·선택 마커 추가)/Selected Date Detail(인라인, 기존 Detail 화면 기능 전부 흡수)로 재구성.
  기존 `renderDetailScreen()`(전체화면 라우팅) 제거, `renderSummaryCard()`/`renderAddLogForm()`(상시 노출
  하단 폼) 제거하고 기능을 흡수. Settings에 Profile/Partner 카드 신설(기존 renderInviteCard/
  renderPartnerCard 로직 그대로 이동)
- `style.css`: `.topbar` 계열 제거 후 `.home-header`/`.prediction-*`/`.selected-date-*` 신설, `.avatar`
  선택자를 `.topbar img.avatar`에서 일반화(부수 효과로 폴백 아바타 크기 누락 버그도 함께 수정)
- `icons.js`: `User`, `X` 아이콘 추가(Lucide 표준 경로, 기존 `icon()` 헬퍼 재사용 — 새 Component/Token
  아님, DESIGN.md §5가 이미 허용하는 절차)
- Calendar 계산 로직은 `classifyDate()`로 추출만 하고 비교식은 완전히 동일하게 유지(중복 제거 목적,
  로직 변경 아님)
- **금지 확인**: Prediction API/Calendar 계산/예측 로직/기록 저장 방식/DB 구조/상태 관리 패턴(단순
  mutate+재렌더) 변경 없음. `functions/`, `migrations/`, `wrangler.toml`, `index.html`, `manifest.json`
  전부 무변경

## Definition of Done
- Home이 Header/Prediction/Calendar/Selected Date Detail 4개 섹션으로 구성
- Settings에 Profile/Partner 관리 이동, 기존 알림/로그아웃 기능 무변경
- 기존 CRUD(생리기록 추가·수정·삭제·오늘종료, 사랑기록 추가·삭제) 전부 인라인에서 동일하게 동작
- `functions/`·`migrations/` 등 백엔드·데이터 계층 diff 0
- CSS 중괄호 균형, 미정의 var() 참조 없음, 제거 대상 클래스 잔존 0
- TASK.md, CHANGELOG.md 갱신

## Result

### Status
✅ 구현 완료, 로컬 검증까지(배포는 별도 지시 시 진행). CHANGELOG.md 갱신 포함.

### 변경 파일
`app.js`(+387/-166줄 수준 재구성), `style.css`(+148/-18줄 수준), `icons.js`(+4줄, `User`/`X` 아이콘).
`functions/`, `migrations/`, `index.html`, `manifest.json`, `wrangler.toml`은 전부 무변경(diff 0 확인).

### 판단이 필요했던 지점(결정 내용)
1. **Detail 화면 흡수 여부** — 사용자 확인 결과 "Home에 완전 흡수"로 확정. `renderDetailScreen()`(뒤로가기
   있는 전체화면)을 제거하고, `state.selectedDate`가 이제 "Home 안에서 펼쳐진 날짜"를 의미하도록 재정의.
   같은 날짜를 다시 탭하면 접힘(토글).
2. **"생리 기록 - 양/통증/증상"(와이어프레임 예시)** — `cycle_logs` 테이블엔 `start_date`/`end_date`/
   `note`만 존재(양·통증·증상 필드 없음). "기록 저장 방식 변경 금지" 원칙에 따라 새 필드를 만들지 않고,
   실제 존재하는 값(기간, 메모)만 표시하도록 구성. 신규 필드가 필요하면 별도 스키마 변경 작업으로 분리 필요.
3. **와이어프레임의 별도 "메모" 섹션** — 이 앱엔 "생리 기록과 무관한 날짜별 메모" 개념 자체가 없음(메모는
   캘린더 기록에 속한 필드). 새 테이블 없이 캘린더 기록 섹션의 기존 `note` 표시로 대체, 별도 섹션 만들지 않음.
4. **상시 노출 "새 기록 추가" 카드 제거** — Home 우선순위 감사에서 지적한 "기록 추가 진입점이 캘린더 탭과
   분리돼 있다" 문제를 해결하기 위해, 캘린더에서 날짜를 탭했을 때 그 날짜를 시작일 기본값으로 하는 인라인
   추가 폼(빈 상태의 "추가" 버튼)으로 대체. `POST /api/cycles` 호출 자체는 완전히 동일, 진입 UI만 변경.
5. **사랑기록 캘린더 마커 색상** — 새 Color Token을 못 만들어서, 브랜드/가임기/배란 색과 겹치지 않는
   중립색(`--color-text-primary`)의 작은 점으로 표현(우측 상단). Legend에서 Heart 아이콘으로 의미 설명.
6. **가임기 D-day 색상** — `--color-fertile`은 옅은 배경 전용 톤이라 텍스트로 쓰기엔 대비가 부족해서,
   기존에도 `legend-fertile` 아이콘이 그래왔듯 `--color-ovulation`(진보라)을 재사용. 새 토큰 없음.

### 부수 발견 & 수정
- `.avatar` 선택자가 원래 `.topbar img.avatar`로 스코프돼 있어, 사진 없는 사용자의 이니셜 폴백(`<div
  class="avatar">`)에는 크기·원형 radius가 전혀 적용되지 않던 버그가 있었음(이전 대화에서 Component
  Inventory 조사 때 발견해뒀던 항목). 이번에 아바타를 Settings로 옮기며 선택자를 `.avatar`로 일반화해
  자연스럽게 함께 수정됨.

### 검증
- `node --check app.js` / `node --check icons.js` 통과
- CSS 중괄호 92/92, 미정의 `var()` 참조 0, 제거 대상 클래스(`.topbar`, `.summary-grid`, `.summary-item`)
  잔존 0
- `renderDetailScreen`/`renderSummaryCard`/`renderAddLogForm`/`close-detail` 등 옛 함수·액션 잔존 0
- `git diff --stat`으로 `functions/`·`migrations/` 등 백엔드 파일 변경 없음 확인
- 브라우저 실사용 확인은 **미실시**

---

# Current Task (직전 완료분: UI Audit)

## Goal
개별 Component System 정리를 잠시 중단하고, 서비스 전반의 UI Audit(화면 구조/정보 위계/핵심 행동/사용자
흐름/개편 우선순위)을 수행한다. **구현 아님 — 조사와 제안만.**

## Background
Typography/Spacing/Radius/Color/Button Family/Section Header까지 Foundation·Component 단위 정리가
끝났고, 이제 화면 단위(코드 품질이 아니라 실제 사용자가 보는 구조/경험) UI 개편으로 전환하는 시점.

## Scope
- `app.js`의 실제 라우팅(상태 기반 화면 전환)과 렌더 함수를 기준으로 전체 화면 목록 확정
- 화면별 12개 항목(목적/핵심 정보/핵심·보조 행동/Section/Card 수/반복 UI/시각 강조/실제 강조돼야 할 것/
  불필요 요소/화면 간 불일치/모바일 이슈) 조사
- 핵심 사용자 흐름 7개(오늘 상태 확인, 캘린더 확인, 생리기록 추가, 사랑기록 추가, 날짜 상세 확인, 설정
  변경, 파트너 초대/연결 확인) 단계별 조사
- UI 밀도/정보 위계, 디자인 시스템 활용도, 개편 우선순위(P1~P3), UI 개편 원칙 초안(10항목) 정리
- **금지**: `style.css`/`app.js`/`DESIGN.md`/`CHANGELOG.md` 수정, 새 Component/Token 구현, 화면 구조·
  UI 문구 변경. 이 TASK.md에만 기록

## Definition of Done
- 실제 코드 기준 화면 목록이 사용자가 제시한 예상 후보 목록과 다르면 그 차이를 명시(추측 아님)
- 화면별 12개 항목 전부 코드 근거와 함께 정리
- 우선순위·개편 원칙·구현 순서 제시
- 코드 변경 0건

## Result

### Status
✅ 조사·분석 완료. 코드 변경 없음(`git status` 클린 확인). 전체 상세 내용은 대화 응답 참고, 핵심만 기록.

### 실제 화면 구조(예상 후보와 차이)
사용자가 제시한 "로그인/홈/캘린더/날짜 상세/생리기록 추가·수정/사랑기록 추가·수정/설정/초대·파트너/빈
상태/로딩" 10개 후보와 달리, `app.js`엔 클라이언트 라우터가 없고 `state.selectedDate`/`state.settingsOpen`
플래그로만 분기하는 **실제 최상위 화면은 5개**(Loading/Login/Home/Settings/Detail)뿐. "캘린더"는 Home
안의 Card, "생리기록 추가"는 Home 하단 폼, "수정"은 Detail 내 상태 토글, "사랑기록 추가"는 Detail 내 폼,
"초대/파트너"는 Home 최상단 Card, "빈 상태"는 화면이 아니라 4곳에 흩어진 조건부 렌더 — 전부 독립 화면이
아니라 5개 화면 안의 Card/상태 분기임.

### 화면별 핵심 문제(요약)
- **Home**: Card 최대 4장(초대/파트너 + 요약 + 캘린더 + 기록추가)이 동일한 시각적 무게로 세로 나열,
  Primary Action이 화면 맨 아래(새 기록 추가)에 있어 One Primary Action 원칙과 약하게 어긋남, "오늘
  기준 상태"를 한 문장으로 알려주는 요소가 없음(평균/예측 통계만 있고 실제 오늘 상태 요약 부재)
- **Detail**: 생리기록은 수정 가능한데 사랑기록은 수정 기능 자체가 없음(비대칭), 캘린더 범례에 대응하는
  설명이 이 화면엔 없어 마킹 의미를 재확인할 수 없음
- **Settings**: 문제 거의 없음, Card+Section Header 패턴 가장 일관적
- **Login**: Card를 안 쓰는 유일한 화면(구조적 예외), Google 버튼이 검정 테마라 브랜드 Accent Color가
  전혀 안 보임
- **Loading**: Settings 진입 시 `getPushStatus()` 대기 동안 이 컴포넌트가 재사용되지 않아 화면 전환
  지연이 일관되지 않게 느껴질 수 있음

### 핵심 흐름 문제
- 생리기록 추가(Home 하단 폼)와 사랑기록 추가(Detail 폼)의 **진입 동선이 완전히 다름** — 같은 성격의
  "날짜 기반 기록"인데 하나는 홈에서, 하나는 상세 화면에서만 가능
- 캘린더에서 날짜를 탭해 Detail로 가도 "이 날짜부터 생리 기록을 시작"하는 액션이 없음(항상 오늘 날짜
  기본값의 Home 폼으로 가야 함)
- 파트너 연결 완료 시 초대 카드가 조용히 사라질 뿐, 명시적 "연결 완료" 피드백이 없음

### 개편 우선순위
Home = **P1**(빈도·가치·문제 크기·파급력 전부 최고), Detail = P2, Settings/Login/Loading = P3.
**가장 먼저 개편할 화면: Home** — 매일 진입하는 시작 화면이자 Detail/Settings 진입점이라 파급 효과가
가장 크고, DESIGN.md의 One Primary Action/실제 기록 우선 원칙과 가장 크게 어긋나 있음.

### UI 개편 원칙 초안(10항목, 상세는 대화 응답)
핵심 정보 우선(오늘 상태를 최상단에) / 화면당 Primary Action 1개 / Card 위계 표현(신규 토큰 없이 surface
soft·strong 재배치) / Section 목적 단일화 / Accent는 Action에만, 위계는 구조·여백으로 / 목적이 다른 Card
그룹 사이 여백 확대 / 캘린더 범례를 다른 화면에서도 재노출 / 같은 성격 기록의 추가 진입점 통일 / 상세
화면은 기록 유형 간 CRUD 수준 대칭 / 설정은 파괴적 행동을 과장하지 않음.

### Foundation/Component 활용도
Typography/Spacing/Radius/Color/Icon/Button Family/Section Header — 전부 화면 전반에 이미 일관 적용돼
있어 개편 시 그대로 재사용 가능. 재설계가 필요한 건 Foundation이 아니라 **Card의 시각적 위계 표현
(variant 없음)**과 **Home의 정보 배치 순서** 자체.

--- 하나의 Component(JS Helper + CSS Class)로 통합해
중복 마크업/CSS를 제거한다. 새 디자인 아님 — 현재 UI 그대로, 구조만 정리.

## Background
Component Inventory에서 "8회 사용, 공통 Helper 없음"으로 보고했던 항목. 착수 전 재검증한 결과 실제로는
`<h2>${Icon()} 텍스트</h2>` 형태의 icon+title 조합이 `app.js`에 **12곳**(4개 render 함수, 일부는 상태
분기별로 동일 마크업 반복) 있고, 아이콘 없는 순수 텍스트 `<h2>`가 1곳(파트너 카드, "아직 연결된 사용자가
없어요") 더 있음 — 이전 조사 수치(8)가 부정확했던 것으로 확인, 12를 기준으로 진행.

## Scope
- `app.js`에 `renderSectionHeader(icon, title)` JS Helper 추가 (icon+title 외 파라미터 없음, 옵션 객체 없음)
- `style.css`의 `.card h2` 규칙을 `.section-header`로 리네임(중복 규칙 새로 만들지 않음)
- 아이콘 있는 12곳을 전부 Helper 호출로 교체
- 아이콘 없는 1곳(파트너 카드)은 Helper를 쓰지 않고 `class="section-header"`만 직접 추가해 동일한 CSS를
  계속 타도록 유지(시각 변화 없음, `.card h2`를 남겨두는 대신 이 한 곳만 클래스 추가로 대응)
- Button Family(`.btn`/`.icon-btn`/`.text-btn`)는 건드리지 않음
- **금지**: Description/Action Button/Subtitle/Divider 지원, 새 Variant, Component/Color/Typography
  Token 신규 생성, Motion 추가, 배포, CHANGELOG.md 수정

## Definition of Done
- 12곳 전부 Helper로 교체, 문자열 결과가 기존과 동일(아이콘+공백+텍스트)
- `.card h2` 중복 없이 `.section-header` 단일 규칙만 존재
- 코드 감소량 확인, grep으로 잔존 `<h2>${` 리터럴 패턴 0건 확인
- 시각 변화 없음(리팩터링만)

## Result

### Status
✅ 구현 완료, 로컬 커밋 및 push/배포 완료 (commit `48d4257`, Button Family 리팩터링과 함께 배포,
CHANGELOG.md 갱신 포함). Cloudflare Pages Git 연동으로 자동 배포됨.

### 변경 파일
`app.js`(+5줄, `renderSectionHeader()` 헬퍼 추가 + 12개 호출로 교체 + 1곳 클래스만 추가),
`style.css`(±0줄, `.card h2` → `.section-header` 리네임만)

### Section Header Component 구조
```js
function renderSectionHeader(icon, title) {
  return `<h2 class="section-header">${icon} ${title}</h2>`;
}
```
파라미터 2개(icon, title)만 지원. Description/Action/Subtitle/옵션 객체 없음. 아이콘이 없는 파트너 카드
1곳은 Helper를 쓰지 않고 `class="section-header"`만 직접 붙여 동일 CSS를 공유(마크업 자체가 icon+title
패턴이 아니라 Helper 대상에서 제외, DESIGN.md처럼 스코프를 임의로 넓히지 않음).

### 공통 CSS
`.card h2` 규칙을 `.section-header`로 리네임(선언 4개 그대로: font-size/font-weight/margin/color) —
새 규칙을 추가한 게 아니라 기존 규칙 하나를 그대로 재사용.

### 제거한 중복
- CSS 자체는 원래도 `.card h2` 1개 규칙뿐이라 "중복 CSS"는 없었음(정정: 이전 조사에서 "공유 클래스 없음"
  이라 표현한 것은 정확했으나 "중복 CSS"는 아니었음)
- 실제로 제거된 건 **마크업 조합 중복** — `<h2>${Icon()} 텍스트</h2>` 패턴을 12곳에서 각자 손으로 조합하던
  것을 `renderSectionHeader()` 호출 1줄로 통일. 아이콘+공백+텍스트 순서를 앞으로 한 곳(함수)에서만 관리
- grep 확인: 리터럴 `<h2>${` 패턴 0건, `renderSectionHeader()` 호출 12건, `.card h2` 잔존 0건

### Foundation Token 적용 결과
`.section-header`가 쓰는 토큰은 리네임 전과 동일(신규 없음): `--font-size-subtitle`,
`--font-weight-semibold`, `--space-md`, `--color-text-primary`

### 코드 감소량
- `style.css`: 0줄(리네임만, 선언 수 불변)
- `app.js`: +5줄(헬퍼 함수 정의) — 호출부는 1줄→1줄 교체라 줄 수 자체는 거의 안 줄었음. 이번 리팩터링의
  효과는 "줄 수 감소"가 아니라 "12곳에 흩어져 있던 조합 로직이 1곳으로 통합"된 것 — 향후 Section Header
  스타일/구조 변경 시 12곳이 아니라 함수 1곳만 수정하면 됨

### QA
- 렌더링 결과 문자열이 기존과 동일함을 코드 대조로 확인(아이콘+공백+텍스트, class만 추가) — 브라우저 실사용 확인은 미실시
- 12개 호출 전부 정상 인자(아이콘 함수 호출 결과, 제목 문자열) 확인
- `node --check app.js` 문법 통과, CSS 중괄호 75/75
- Button Family(`.btn`/`.icon-btn`/`.text-btn`) 무변경 확인(diff에 Button 관련 라인 없음)

### 배포 전 확인이 필요한 사항
- 브라우저에서 알림 설정/초대/예측 정보/새 기록 추가/캘린더 기록/사랑기록 카드 제목이 기존과 동일하게
  보이는지 육안 확인
- 확인 후 배포 여부 별도 지시 필요(이번 작업은 배포 안 함)

---

# Current Task (직전 완료분: Button Family 리팩터링)

## Goal
직전 Button Family 조사·설계 초안을 기반으로, 실제 `style.css`/`app.js`의 Button 구현을 리팩터링한다.
새 Button을 만드는 게 아니라 기존 5개 구현(`.btn`, `.icon-btn`, `.detail-header button`,
`.calendar-header button`, `.log-actions button`)의 중복을 제거하고 3개 Family(Action/Icon/Text)
구조로 정리한다. 현재 UI/기능은 최대한 동일하게 유지.

## Background
Button Family 조사에서 확인된 문제를 그대로 해소하는 작업: `.detail-header button`과
`.calendar-header button`이 CSS 10줄 100% 중복, `.icon-btn`은 개념적으로 겹치지만 배경/사이징 방식이
다름, `.log-actions button`은 Text Button 역할인데 `.log-actions`라는 레이아웃 클래스에 종속돼 재사용
불가능한 상태, Focus 스타일 전무, padding 리터럴 다수(border 보정용 -1px 포함).

## Scope
- Icon Button 통합: `.icon-btn`(기본, 배경 없음, Toolbar) + `.icon-btn.header`(배경 있음, 32px 원형,
  Navigation) 2종으로 정리. `.detail-header button`/`.calendar-header button` 규칙 제거
- Text Button 승격: `.log-actions button` → `.text-btn`(+`.delete`)로 독립 클래스화, `.log-actions`는
  순수 레이아웃 wrapper로만 유지
- Action Button(`.btn`/`.secondary`/`.ghost`/`.block`/`:disabled`): 기존 Variant 유지, 구조만 정리
- Spacing Token 적용: 정확히 일치하는 값만 토큰으로 치환(`24px`→`--space-lg`, `32px`→`--space-xl`).
  일치하는 토큰이 없는 리터럴(14px/13px/23px/6px — border 보정 또는 스케일 밖 값)은 시각 변화 방지를
  위해 그대로 유지
- Focus Visible 스타일 추가: Button Family 공통으로 `:focus-visible` 1개 규칙, 기존 Color Token만 사용
- `app.js`의 관련 마크업(아이콘 버튼 4곳, 텍스트 버튼 4곳)에 신규 클래스 반영
- **금지**: 새 Variant 추가, Hover 신규 추가(기존 `.log-actions button:hover` 유지는 가능), Motion/
  transition 추가, Loading/Selected 상태 추가, Component Token 생성, Color/Typography/Radius 토큰
  수정·추가, 배포, CHANGELOG.md 수정

## Definition of Done
- `.detail-header button`/`.calendar-header button` 규칙 제거, 중복 0
- Button 관련 기존 기능(설정 진입, 뒤로가기, 월 이동, 초대/기록/사랑기록 CRUD, 로그아웃, 알림 토글) 전부
  동일하게 동작
- Focus Visible 스타일 최소 1개 이상 확인 가능
- CSS 중괄호 균형, 미정의 var() 참조 없음
- 코드 감소량(줄 수) 및 grep 기준 중복 제거 확인

## Result

### Status
✅ 구현 완료, 로컬 커밋 및 push/배포 완료 (commit `48d4257`, Section Header 리팩터링과 함께 배포,
CHANGELOG.md 갱신 포함). Cloudflare Pages Git 연동으로 자동 배포됨.

### 변경 파일
`style.css`(net -11줄), `app.js`(기존 17개 `<button>`에 class 속성만 추가, 줄 수 변화 없음)

### Button Family 최종 구조
- **Action Button**: `.btn`(+`.secondary`/`.ghost`/`.block`/`:disabled`) — 기존 Variant 그대로 유지, 구조 변경 없음
- **Icon Button**: `.icon-btn`(배경 없음, Toolbar) / `.icon-btn.header`(배경 있음, 32px 원형, Navigation) —
  신규 추가. `.detail-header button`·`.calendar-header button` 대체
- **Text Button**: `.text-btn`(+`.delete`) — `.log-actions button`을 독립 클래스로 승격, `.log-actions`는
  순수 레이아웃 wrapper로 남음

### 제거한 중복
- `.detail-header button` 규칙(10개 선언) 삭제
- `.calendar-header button` 규칙(10개 선언, 위와 100% 동일) 삭제
- 두 규칙을 `.icon-btn.header` 1개(5개 선언)로 통합 → 중복 선언 20개 → 5개로 감소

### Spacing Token 적용
- `.btn` padding: `14px 24px` → `14px var(--space-lg)` (수평만, 정확히 일치)
- `.icon-btn.header` width/height: `32px 32px`(리터럴) → `var(--space-xl)`(정확히 일치)
- `.btn.secondary`/`.btn.ghost`의 `13px 23px`, `.icon-btn`의 `6px`은 정확히 일치하는 토큰이 없고
  border 보정/사이징에 관여하는 값이라 리터럴 유지(시각 변화 방지)

### Focus Visible 추가
```css
.btn:focus-visible,
.icon-btn:focus-visible,
.text-btn:focus-visible {
  outline: 2px solid var(--color-border-strong);
  outline-offset: 2px;
}
```
신규 Color/Radius/Spacing 토큰 추가 없이 기존 `--color-border-strong`만 재사용. Hover는 추가하지 않음
(기존 `.text-btn:hover`의 밑줄만 유지).

### 검증
- grep: `detail-header button`/`calendar-header button`/`log-actions button` 잔존 0
- grep: 미정의 `var()` 참조 0
- CSS 중괄호 75/75
- `node --check app.js` 문법 통과
- 17개 `<button>` 전부 3개 Family 중 하나의 명시적 class 보유(무클래스 button 0개)
- Motion/transition/Loading/Selected/Component Token/새 Variant/Color·Typography·Radius 토큰 변경 — 전부 미추가 확인

### 배포 전 확인이 필요한 사항
- 브라우저 육안 확인 미실시 — 특히 Icon Button(설정/뒤로가기/월 이동)과 Text Button(수정/삭제/오늘종료)
  크기·정렬이 기존과 동일해 보이는지, 키보드 Tab으로 Focus 링이 의도대로 보이는지 확인 필요
- 배포/CHANGELOG.md 갱신은 사용자 지시 전까지 보류

---

# Current Task (직전 완료분: Button Family 조사)

## Goal
직전 Component Inventory 조사 결과를 바탕으로 Button Family(`.btn`, `.icon-btn`, `.detail-header button`,
`.calendar-header button`, `.log-actions button`)를 정밀 분석하고, Button Design Principle 초안을 작성한다.
**구현 아님 — 설계 초안만.** 확정되면 다음 Sprint에서 구현.

## Background
Component Inventory 조사에서 Button 계열이 서로 다른 5가지 구현으로 파편화돼 있고(그중 2개는 CSS 100%
중복) 우선순위 P1으로 나왔던 것의 후속 작업.

## Scope
- `app.js`의 모든 `<button>` 요소(17개) 전수 조사, `style.css`의 대응 규칙 대조
- 각 Button별 사용 위치/역할/Variant/State/Size/Token/중복 여부 정리
- Button Design Principle 초안(12개 항목) 작성 — DESIGN.md에는 아직 반영하지 않음, 이 문서에만 기록
- 추천 구현 순서·주의점 제시
- **구현 금지**: `style.css`, `app.js`, `DESIGN.md`, `CHANGELOG.md` 수정 없음

## Definition of Done
- Button 17개 사용처 전수 확인(추측 아님, grep 대조)
- 중복 CSS를 선언 단위로 정량 비교
- Button Design Principle 초안 완성
- 코드 변경 0건

## Result

### Status
✅ 분석·설계 완료. 코드 변경 없음. 전체 Family Inventory, Variant/State/Size 목록, 중복 정량 분석,
Button Design Principle 초안, 구현 순서는 대화 응답에 상세 기록. 초안 원문은 아래에 보존.

### Button Family Inventory (5개 구현, 17개 사용처)
| 구현 | 역할 | 사용 위치 | 개수 |
|---|---|---|---|
| `.btn`(+secondary/ghost/block) | Primary/Secondary Action | Home, Settings, Detail | 9 |
| `.icon-btn` | Icon Action(Toolbar) | Home(Topbar) | 1 |
| `.detail-header button` | Navigation(뒤로가기) | Settings, Detail | 2 |
| `.calendar-header button` | Navigation(월 이동) | Home(Calendar) | 2 |
| `.log-actions button`(+`.delete`) | Inline/Destructive Action | Detail | 4 |
| (제외) Google 로그인 버튼 | 서드파티 SDK, 우리 CSS 제어 불가 | Login | 1 |

### 중복 정량 분석
- `.detail-header button` vs `.calendar-header button`: 선언 10/10 **100% 동일** (완전 복붙 중복)
- `.icon-btn` vs 위 둘: 8개 선언 중 6개 속성 개념적으로 겹침(border/color/cursor/display/align/justify),
  배경·크기 방식만 다름(투명+패딩 방식 vs 채움+고정 32px)
- Hover 상태는 Button Family 전체 중 `.log-actions button` 1곳에만 존재(`text-decoration:underline`),
  나머지 4개 구현은 Hover 无
- Focus 상태는 Button Family 전체 0곳 — 브라우저 기본값 의존
- `transition` 속성은 Button Family 전체 0곳 — DESIGN.md §10 Motion(150~250ms ease-out) 미적용 상태
- `.btn`/`.btn.secondary`/`.btn.ghost`의 padding(14px 24px, 13px 23px)이 Spacing Token이 아닌 리터럴 px
  (border 1px 보정용 -1px 계산이 숨어있음), `.detail-header/.calendar-header button`의 32px도 리터럴
  (`--space-xl`과 값은 같으나 토큰 미사용)

### Variant / State / Size 목록
- **Variant(실질)**: Primary(`.btn`) / Secondary(`.btn.secondary`) / Ghost(`.btn.ghost`) / Icon(`.icon-btn`,
  `.detail-header/.calendar-header button`) / Text(`.log-actions button`). Danger는 별도 배경 Variant가
  아니라 Text Button 위 색상 서브타입(`.delete`)
- **불필요하게 분리된 것**: `.detail-header button`/`.calendar-header button`(동일 스펙, 통합 대상),
  `.icon-btn`과 header 버튼들(배경 유무 차이만, "Icon Button의 두 하위 타입"으로 재정의 가능)
- **State**: 구현됨 = Default(전체)/Active(`.btn`만, filter brightness)/Disabled(`.btn`만). 미구현 =
  Hover(Text Button 제외 전무)/Focus(전무)/Loading(전무)/Selected(해당 없음 — 토글형 버튼 없음)
- **Size**: Large 48px(`.btn` 계열, 단 `.ghost`만 `height:auto`라 미세 오차 가능) / Icon 32px(header 버튼
  고정값, `.icon-btn`은 20px 아이콘+6px 패딩의 근사치·비고정) / Text 자동높이 ~24px(`.log-actions button`)

### Button Design Principle 초안 (DESIGN.md 미반영, 다음 Sprint 검토용)
1. **Button의 역할**: 행동을 유도하고 결과를 예측 가능하게 만드는 요소. 형태(배경/색/굵기)로 우선 전달.
2. **Button Family 정의**: Action Button(`.btn`+modifier) / Icon Button(`.icon-btn`, header 버튼) /
   Text Button(`.log-actions button`). Google 버튼은 Family 밖(서드파티).
3. **Variant 정의**: Primary/Secondary/Ghost/Icon/Text 5종으로 확정. `.detail-header`/`.calendar-header
   button`은 Icon Button(배경 있음) 하위로 통합.
4. **State 정의**: Default/Active/Disabled만 실제로 필요(현재 로직상 Loading·Selected 쓰임 없음). Hover는
   포인터 환경 대비 최소 1개(밝기/보더 변화) 추가 검토. Focus는 접근성상 최소 1개 필요.
5. **Size 정의**: Large(48px, Action Button) / Icon(32px, 고정) / Text(자동, 내용 기반) 3단계로 공식화.
   새 Size 추가하지 않음.
6. **Icon Button 원칙**: 배경 있음(Header 이동용, 32px 원형) / 배경 없음(개별 유틸리티, `.icon-btn`) 두
   하위 타입만 허용. 세 번째 변형 금지.
7. **Header Button 원칙**: Detail Header와 Calendar Header 이동 버튼은 시각적으로 동일하므로 공통 클래스로
   통합(가칭 `.header-btn`). "뒤로가기"와 "월 이동"은 역할(Navigation)이 같아 구분 불필요.
8. **Danger Action 원칙**: 별도 배경 Variant 없음. Text Button 위 `--color-danger` 텍스트 색만 사용,
   최종 확인은 `confirm()`이 담당(Bottom Sheet/Modal 도입 전까지 이 조합 유지).
9. **Disabled 원칙**: Primary Action Button에만 정의(accent-soft bg + not-allowed 커서). 실제 로직상
   Disabled가 등장하지 않는 Secondary/Ghost/Icon/Text Button은 CSS도 만들지 않음.
10. **Button Naming Rule**: `.btn.{modifier}`(secondary/ghost/block) 조합 방식 유지, BEM 등으로 갈아엎지
    않음. Header/Icon Button은 역할이 이름에 드러나야 함(`.header-btn`, `.icon-btn`).
11. **새 Button 추가 원칙**: 기존 5개 Variant 중 역할이 맞는 것을 먼저 사용. 새 Variant는 기존 5개 전부
    안 맞고, 최소 2곳 이상 반복이 확실할 때만 추가.
12. **Button을 만들지 말아야 하는 경우**: 1회성·단일 화면 전용 액션은 새 Variant 없이 가장 가까운 기존
    Variant 재사용. 서드파티가 렌더링을 통제하는 버튼(Google 로그인)은 시스템에 억지로 편입하지 않음.

### 추천 구현 순서
1. `.btn` 정리(padding 리터럴 → 토큰화 여부 결정, `.ghost`의 `height:auto` 제거해 48px로 통일)
2. Header Button 통합(`.detail-header button` + `.calendar-header button` → 1개 클래스, 100% 중복 제거)
3. Icon Button 관계 정리(`.icon-btn`을 "배경 없는 Icon Button"으로 공식 편입)
4. Text Action Button 승격(`.log-actions button` → 정식 클래스, `.delete` 유지)
5. Danger 확인(4번에 자연 포함, 별도 작업 불필요)
6. Focus/Hover 최소 스타일 추가(접근성·Motion 원칙 최초 적용)

### 주의할 점
- `.secondary`/`.ghost`의 padding(13px 23px)은 border 1px를 보정하는 값 — 토큰화 시 이 보정을 빠뜨리면
  버튼 높이가 48px에서 틀어짐
- `filter: brightness(0.9)` active 효과는 어두운 배경(Primary)에서만 잘 보임 — 밝은 배경(Secondary/Ghost/
  Header/Text Button)에 그대로 적용하면 효과가 거의 안 보일 수 있어 다른 방식(보더/색 변화) 검토 필요
- Vanilla 구조 유지 — Button 헬퍼는 `icons.js`처럼 마크업 문자열을 반환하는 JS 함수로 만들 것, React
  컴포넌트화 금지
- 이 초안은 DESIGN.md에 아직 반영되지 않음 — 확정 후 별도 작업으로 §7(Typography) 자리 다음에 삽입 검토

---

# Current Task (직전 완료분: Component Inventory 조사)

## Goal
Component System 구축에 앞서, 현재 프로젝트(`app.js`/`style.css`)에서 실제 쓰이는 모든 UI Component를
조사해 Inventory를 만들고 중복/성숙도/구축 우선순위를 정리한다. **구현 아님 — 조사·분석만.**

## Background
Typography / Spacing / Radius / Color 토큰이 순서대로 정리됐고, 다음 단계로 Component Token(Button 등)을
만들기 전에 실제 화면에서 어떤 Component가 몇 번 쓰이고 어디서 중복/불일치가 생기는지 먼저 파악하기로 함.

## Scope
- `app.js`, `style.css`, `index.html`, `icons.js` 전체를 조사해 Component Inventory 작성
- 각 Component별: 사용 위치 / Variant / State / 사용 Token / 중복 여부 / 성숙도(Level 1~4) 정리
- 최종 Inventory 표, 우선순위(P1~P3), 추가 분석(TOP 10 사용 빈도, 시스템화 효과 TOP 5, Button 우선순위 타당성,
  신규 필요 Component, 추천 구축 순서) 정리
- **구현 금지**: `style.css`, `app.js`, `DESIGN.md`, `CHANGELOG.md` 수정 없음. 이 TASK.md에만 기록

## Definition of Done
- Component Inventory 표 작성 완료
- 중복/성숙도 평가 근거를 실제 grep/코드 대조로 확인 (추측 아님)
- 우선순위·추천 구축 순서 제시
- 코드 변경 0건

## Result

### Status
✅ 조사·분석 완료. 코드 변경 없음(`style.css`/`app.js`/`DESIGN.md`/`CHANGELOG.md` 전부 미수정, `git status` 클린).
상세 보고는 대화 응답 참고, 핵심만 아래에 기록.

### Component Inventory (요약)
| Component | 코드상 등장/호출 | Variant | 중복 | 성숙도 | 우선순위 |
|---|---|---|---|---|---|
| Toast | 19 (`showToast()` 호출) | 없음(성공/실패 동일 스타일) | - | L2 | P1 |
| Button(`.btn`) | 9 | Primary/Secondary/Ghost/Block/Disabled | - | L3 | P1 |
| Icon Button | 5 (3가지 다른 구현) | icon-btn / detail-header button / calendar-header button | **있음**(`.detail-header button`≡`.calendar-header button` 완전 동일 CSS 중복) | L2 | P1 |
| Text Action Button(`.log-actions button`) | 2 (그룹당 최대 3개) | Default / `.delete` | - | L2 | P2 |
| Card(`.card`) | 15 | 없음 | - | L3 | P3(이미 성숙, 문서화만) |
| Section Header(아이콘+h2) | 8 | - | **있음**(공유 마크업/클래스 없이 매번 손으로 조합) | L1 | P1 |
| Form Input(`.form-row`) | 7 | text/date | **있음**(`invite-url input`과 배경색 불일치) | L2 | P2 |
| Badge(`.role-badge`) | 1 | owner/viewer(현재 시각적으로 동일) | - | L3 | P3 |
| Avatar(`.avatar`) | 1(이미지/폴백 2-state) | image / initial-fallback | **있음, 버그성**(폴백은 크기·radius CSS 없음 — `img.avatar` 선택자라 `<div>` 폴백엔 미적용) | L1 | P1 |
| Empty State(`.empty-state`) | 3(2는 클래스 사용, 1은 인라인) | - | **있음**(예측 정보 카드만 표준 미준수) | L2 | P2 |
| Note/Alert(`.invite-note`/`.error-note`) | 2 | Info / Error | **있음**(radius-full vs radius-sm로 모양 불일치) | L1 | P2 |
| List Item(`.log-item`) | 2 static + 동적 | - | - | L3 | P3 |
| Navigation Bar | Topbar 1 + Detail Header 2 | Root(Topbar) / Sub(Detail Header) | - | L2 | P3 |
| Calendar Cell(`.day-cell`) | 1 호출, 월 30개+ 렌더 | period/predicted/fertile/ovulation/today 조합 | - | L3 | 도메인 특화(순서 후순위) |
| Calendar Legend | 1 | period/predicted/fertile/ovulation | - | L3 | 도메인 특화(후순위) |
| Loading(`.loading`) | 1 | - | - | L1 | P3 |
| Modal/Dialog/Bottom Sheet | **0**(네이티브 `confirm()` 2곳으로 대체) | - | - | 미구현 | 결정 필요 |

### 발견한 구체적 중복/버그
1. `.detail-header button`과 `.calendar-header button` — CSS 7줄이 완전히 동일하게 중복 선언됨
2. Avatar 폴백(`<div class="avatar" style="...">`)에 크기/radius가 전혀 적용 안 됨 — CSS 선택자가 `.topbar img.avatar`라 `<img>`만 매칭, `<div>` 폴백은 인라인 스타일(배경색만)만 받고 32×32 원형 크기가 없음
3. `.form-row textarea` — CSS엔 정의돼 있으나 실제 마크업에 `<textarea>`가 전혀 없는 죽은 CSS
4. `.invite-note`(radius-full, pill)와 `.error-note`(radius-sm)가 같은 "안내 메시지 박스" 역할인데 모양이 다름
5. 예측 정보 카드의 빈 상태 문구만 `.empty-state` 클래스 대신 인라인 style로 별도 구현됨

### 추천 구축 순서
Button(icon-btn/detail-header/calendar-header/log-actions 통합 포함) → Section Header → Input →
Toast(Success/Success 토큰 도입과 연계) → Empty State → Note/Alert → Badge/Avatar → Card(문서화만) →
Calendar Cell/Legend(도메인 특화, 마지막)

### 주의할 점
- 이 프로젝트는 번들러/프레임워크 없는 Vanilla 구조 — Component는 React 컴포넌트가 아니라 `icons.js`와 같은
  "마크업을 반환하는 JS 헬퍼 함수 + CSS 클래스" 조합으로 만드는 게 기존 관례와 맞음
- Toast Variant 도입은 이전 Color 작업에서 보류한 Green Primitive/Success Semantic Token 추가와 묶어서 진행해야 함
- Calendar Cell/Legend는 도메인 특화라 범용 Component System과 억지로 통합하지 말 것
- 발견된 항목 중 Avatar 폴백 크기 누락, textarea 죽은 CSS는 사실상 버그 — Component 설계와 별개로 별도
  수정 작업 필요 여부를 사용자가 판단해야 함 (이번 조사에서는 코드 미수정)

---

# Current Task (직전 완료분)

## Goal
예상 생리(Predicted Period) 가시성 개선 — 배포 후 QA에서 `brand-200(#ffd1da)` 예상 생리 표시가 화면에서 거의
안 보인다는 문제가 확인되어, 색상 자체를 바꾸지 않고 "강도(Intensity)" 표현으로 개선

## Background
직전 Color Token 구조 개편(commit `0a269ac`) 배포 후 QA에서 발견된 이슈. `--color-period-predicted`가
`brand-200`으로 매핑되어 흰 배경 대비 1.37:1로 도형 대비 기준(3:1) 미달 — 이전 작업 보고서에 "배포 전 확인
필요사항"으로 이미 남겨뒀던 항목이 실사용에서 확인된 것

## Scope
- `style.css`만 수정
- `--color-period-predicted` 매핑을 `brand-200` → `brand-500`으로 변경 (기존 Primitive 재사용, 신규 토큰 없음)
- `.day-cell.predicted .num`에 `color-mix()` 기반 옅은(12%) 배경 채움 추가 (실제 생리의 solid fill과
  예상 생리의 dashed outline + 옅은 채움을 "색상 차이"가 아닌 "채움 강도 차이"로 구분)
- **범위 아님**: Viewer Badge, Primitive/Semantic Token 신규 추가, Color System 구조 변경, 그 외 화면

## Definition of Done
- 예상 생리 dashed 테두리 대비 3:1 이상 (도형/UI 요소 기준)
- 신규 Primitive/Semantic Token 없음
- Viewer Badge 무변경

## Result

### 변경 파일
`style.css`만 수정 (`app.js`, Viewer Badge, Color System 구조 무변경)

### 변경 내용
- `--color-period-predicted` 매핑: `var(--brand-200)` → `var(--brand-500)` (신규 토큰 없이 기존 Primitive 재사용)
- `.day-cell.predicted .num`에 `background: color-mix(in srgb, var(--color-period-predicted) 12%, transparent);` 추가

### 검증
- `--color-period-predicted` 참조 4곳(`:root`, `.day-cell.predicted .num` 배경/테두리, `.legend-predicted .icon`) 모두 정상 반영 확인
- `:root` 커스텀 프로퍼티 총 개수 62개로 이전과 동일(신규 Primitive/Semantic 토큰 없음 확인)
- `brand-200`이 `--color-accent-soft`에서 계속 사용 중이라 고아 토큰 아님 확인
- CSS 중괄호 75/75로 구조 깨짐 없음
- 대비: 흰 배경 대비 `brand-500` 도형/테두리 = 3.52:1로 WCAG 1.4.11 Non-text Contrast(3:1) 기준 통과 (기존 `brand-200`은 1.37:1로 미달이었음)
- 브라우저 육안 확인은 **미실시** — 배포 후 실사용 중 확인 권장

### Status
✅ 구현 완료. 배포는 아래 커밋 참고.

---

# 이전 작업 (Color Token 구조 개편, 완료·배포됨)

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

# Result (이전 작업)

## Status
✅ 구현 완료, 로컬 커밋 및 push/배포 완료 (commit `2ccb40f`, `origin/main`으로 push, CHANGELOG.md 갱신
포함). Cloudflare Pages Git 연동을 통해 자동 배포됨. 새 DB 마이그레이션 없어 원격 D1 작업 불필요.

브라우저 육안 확인은 미실시 상태로 배포됨 — "배포 전 확인이 필요한 사항"에 적어둔 predicted 마커 저대비,
Viewer/Owner 배지 무구분은 실사용 중 확인 권장.

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
