# Current Task

## Goal
Pretendard를 프로젝트 기본 폰트로 적용 (셀프 호스팅, Subset woff2)

## Background
아이콘 교체(Lucide) 작업 이후, 별도로 진행한 디자인 작업. 진행 순서:
1. 현재 폰트 적용 구조 조사 — `style.css`의 `body`에 이미 "Pretendard"가 폰트 스택에 있었지만
   `@font-face`가 어디에도 없어 실제로는 전혀 로드되지 않고 있었음. 순서도 `-apple-system`/`Inter`가
   앞에 있어 웹폰트를 추가해도 애플 기기에서는 절대 선택되지 않는 구조였음.
2. 적용 방법 설계: React/TS/번들러 없는 정적 배포 구조이므로 CDN 대신 셀프 호스팅으로 결정.
3. Pretendard 공식 배포판을 확인한 결과 "Dynamic Subset"은 굵기당 92개 조각 파일(4개 굵기 기준 368개
   파일 + 약 3,300줄 CSS)로 구성되어 있음을 확인, 손으로 관리하기엔 과함을 사용자에게 알리고
   굵기당 파일 1개인 단순 "Subset"으로 변경 확정.

## Scope
- `/fonts` 디렉터리 신규 생성, Pretendard 공식 저장소에서 Regular(400)/Medium(500)/SemiBold(600)/
  Bold(700) subset woff2 4개 다운로드
- `style.css` 상단에 `@font-face` 4개 추가 (`font-display: swap`)
- `body`의 `font-family`를 Pretendard 우선으로 재정렬
- `index.html`에 자주 쓰이는 두 굵기(400, 600) `<link rel="preload">` 추가
- **범위 아님**: font-size/font-weight/line-height 변경(Typography Scale 개선은 다음 작업으로 분리),
  레이아웃/기능 변경, CDN/React/TypeScript/번들러 도입

## Definition of Done
- Pretendard가 실제로 로드되어 화면에 적용됨 (기존엔 이름만 있고 미적용 상태였음)
- 기존 font-size/font-weight/line-height 값 변경 없음
- preload 적용, `font-display: swap`으로 텍스트 안 보이는 시간 없음
- 브라우저 콘솔에 폰트 관련 오류 없음, Lighthouse에 폰트 관련 경고 없음
- 레이아웃 깨짐 없음 (모바일 뷰포트 포함)

---

# Result

## Status
✅ Completed, push/배포 완료 (commit 3715076, main으로 push)

## 문제 분석
`style.css`의 `body` 폰트 스택에 `"Pretendard"`라는 이름이 이미 들어 있었지만, `@font-face` 선언이
프로젝트 어디에도 없어 웹폰트로 로드되고 있지 않았음 — 이름만 있고 실체가 없는 상태였음. 게다가 스택
순서상 `-apple-system`/`BlinkMacSystemFont`/`"Inter"`가 앞서 있어, 설령 폰트를 로드해도 애플 기기(가장
흔한 사용 환경)에서는 시스템 폰트가 먼저 매칭되어 절대 쓰이지 않는 구조였음. 이번 작업은 "이름만 있던
설정"을 실제로 동작하게 만드는 것이었음.

## 수정 내용
- `/fonts` (신규 디렉터리): Pretendard 공식 GitHub 저장소(`orioncactus/pretendard`)의
  `packages/pretendard/dist/web/static/woff2-subset/`에서 4개 파일 다운로드
  - `Pretendard-Regular.subset.woff2` (400, 267KB)
  - `Pretendard-Medium.subset.woff2` (500, 268KB)
  - `Pretendard-SemiBold.subset.woff2` (600, 269KB)
  - `Pretendard-Bold.subset.woff2` (700, 271KB)
  - 한글 완성형+영문+기호만 포함된 subset이라 원본 풀세트 대비 용량이 훨씬 작음
- `style.css`
  - 파일 최상단에 `@font-face` 4개 추가, 모두 `font-display: swap`
  - `body`의 `font-family`를 `"Pretendard", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", Roboto, sans-serif`로 변경 (Pretendard 최우선, 로드 실패시에만 시스템 폰트 폴백).
    기존에 있던 `"Inter"`는 제거함 — Pretendard와 마찬가지로 `@font-face` 없이 이름만 있던 죽은 폴백이라
    실질적 동작 변화 없음
  - font-size/font-weight/line-height는 일절 변경하지 않음
- `index.html`
  - `<link rel="preload">` 2개 추가: Regular(400)와 SemiBold(600)만 선택
  - 이유: 로그인 화면(h1=600, 본문=400)과 홈 화면 모두 이 두 굵기가 최초 화면에 보장적으로 쓰이는 반면,
    500(버튼/라벨)과 700(예측 카드 숫자)은 화면 상태에 따라 등장 시점이 달라 preload 대상에서 제외 —
    Lighthouse가 "미사용 preload"로 지적할 여지를 없앰
  - `crossorigin` 속성 포함 (동일 출처라도 폰트 preload는 항상 anonymous CORS 모드로 요청되므로,
    빠뜨리면 실제 `@font-face` 요청과 매칭되지 않아 preload가 무효화됨)

## 테스트 방법과 결과
1. 다운로드한 4개 파일이 유효한 WOFF2 포맷인지 `file` 명령으로 확인 — 모두 정상
2. CSS 중괄호 짝 검증 통과
3. 로컬 wrangler dev + Playwright(Chromium)로 실제 로딩 확인
   - `document.fonts`로 로드 상태 확인: 로그인 화면(미인증)에서는 400/600만 `status=loaded`, 500/700은
     `unloaded` (해당 화면에 그 굵기 텍스트가 없으므로 정상 — 필요할 때만 로드되는 브라우저 기본 동작)
   - 인증된 홈 화면에서는 400/500/600/700 전부 `status=loaded`
   - `getComputedStyle(document.body).fontFamily`로 Pretendard가 최우선으로 적용됨을 확인
   - 스크린샷으로 로그인 화면·홈 화면 모두 Pretendard 특유의 한글 글자 형태로 정상 렌더링, 레이아웃
     깨짐 없음 확인
4. 브라우저 콘솔 오류: 폰트 관련 오류 0건 (로그인 화면에서 보이는 Google Identity Services 관련 경고는
   `localhost` 테스트 환경의 기존 한계로 폰트와 무관, 이전 작업들에서도 동일하게 확인된 사항)
5. Lighthouse(`--preset=desktop`, performance 카테고리) 실행
   - `font-display-insight` 감사 **score 1 (통과)** — `font-display: swap` 정상 인식
   - `network-requests` 상세에서 두 preload 파일이 `resourceType: Font`, `priority: High`로 실제
     우선순위 상승되어 요청됨을 확인 — "미사용 preload" 경고 없음
   - `render-blocking-insight`는 `style.css` 자체(2.8KB)만 지적, 폰트 관련 항목 없음
   - 폰트로 인한 신규 경고/오류 없음
6. 테스트 데이터 모두 정리, dev 서버 종료 완료

## 수정 파일
- `/fonts/Pretendard-Regular.subset.woff2` (신규)
- `/fonts/Pretendard-Medium.subset.woff2` (신규)
- `/fonts/Pretendard-SemiBold.subset.woff2` (신규)
- `/fonts/Pretendard-Bold.subset.woff2` (신규)
- `style.css`
- `index.html`

## 기존 기능에 미치는 영향
- font-size/font-weight/line-height, 레이아웃, 기능은 전혀 변경하지 않음 — 글꼴만 교체됨
- Typography Scale(디자인 토큰화)은 이번 범위에서 제외, 다음 작업으로 분리
- React/TypeScript/번들러/CDN 도입 없음, 정적 배포 구조 그대로 유지

## 로컬 커밋 / 배포 여부
✅ 로컬 커밋 완료 (3715076), 사용자 확인 후 `origin/main`으로 push 완료.
Cloudflare Pages Git 연동을 통해 자동 배포됨. (새 DB 마이그레이션 없어 원격 D1 작업 불필요)
