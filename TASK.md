# Current Task

## Goal
1차 리뷰 항목 3-3: 캘린더 기록 확인 방식 변경 + 사랑기록 신규 기능

## Background
1차 리뷰 남은 개선사항 진행 순서:
1. 상단 예측 정보 구성 변경 ✅ 완료 (commit 4828b25)
2. 배란 예상일 마킹 변경 ✅ 완료 (commit 0fa3ebe)
3. 캘린더 기록 확인 방식 변경 ← 이번 작업
4. 설정 페이지 추가

원 요청: "캘린더 하단 리스트 제거 / 날짜 선택 시 상세 페이지 / 상세 페이지에서 캘린더 기록·사랑기록 확인 가능".
작업 착수 전 확인 결과, **"사랑기록"은 코드베이스에 전혀 존재하지 않는 완전히 새로운 기능**임을 확인함
(DB 테이블/API/UI 모두 없음). 사용자에게 확인한 결과 "새 기능으로 함께 개발"하기로 결정, 이번 작업 범위에
사랑기록 최소 기능(날짜별 기록 추가/조회/삭제)을 포함시킴.

## Scope
- 캘린더 하단에 항상 보이던 "📋 기록" 리스트 제거
- 캘린더 날짜를 탭하면 해당 날짜의 상세 페이지로 이동
- 상세 페이지에서:
  - 그 날짜를 포함하는 생리 기록(캘린더 기록) 조회, Owner는 수정/삭제/오늘 종료 가능 (기존 리스트에 있던 기능 이전)
  - 그 날짜의 사랑기록 조회, Owner는 추가/삭제 가능 (신규)
- 새 기록 추가(생리 기록 시작일 지정) 폼은 기존 위치(홈 화면) 그대로 유지 — 이번 범위 아님
- 설정 페이지(4번)는 이번 범위 아님

## Definition of Done
- 하단 리스트 완전히 제거, 캘린더 아래 중복 표시 없음
- 캘린더 아무 날짜나 탭하면 상세 페이지로 전환되고 뒤로가기(‹)로 복귀 가능
- 상세 페이지에 해당 날짜의 캘린더 기록 유무가 정확히 반영됨 (기간에 포함되는 로직 기존과 동일)
- 상세 페이지에서 사랑기록을 추가/삭제할 수 있고, 새로고침 후에도 유지됨 (D1에 저장)
- Owner/Viewer 권한 분리 유지: Viewer는 상세 페이지에서 조회만 가능 (수정/삭제/추가 버튼 없음), API 레벨에서도 403 처리
- 기존 기능(캘린더 마킹, 생리 기록 추가/수정/삭제, 알림, 예측 카드)에 영향 없음

---

# Result

## Status
✅ Completed, 원격 D1 마이그레이션 적용 + push/배포 완료 (commit 398e063, main으로 push)

## 문제 분석
기존에는 캘린더 아래 "📋 기록" 리스트가 모든 생리 기록을 항상 나열했고, 날짜와 기록을 연결해서 보려면
캘린더와 리스트를 번갈아 봐야 했음. 사용자가 요청한 "날짜 선택 → 상세 페이지" 방식이 이 문제를 해결함.
추가로 "사랑기록"을 상세 페이지에서 보여달라는 요청이 있었는데, 확인 결과 이 기능 자체가 아직 없어서
데이터 모델(테이블/API)부터 새로 설계해야 하는 상황이었음. 사용자와 협의해 최소 기능(날짜 + 선택적 메모,
추가/조회/삭제)으로 범위를 좁혀 진행함.

## 수정 내용
### 신규: 사랑기록 데이터/API
- `migrations/0002_love_logs.sql`: `love_logs` 테이블 신규 생성 (`id`, `date`, `note`, `created_by`, `created_at`) + 날짜 인덱스
- `functions/api/love-logs/index.js`: `GET`(전체 목록), `POST`(생성, Owner 전용, 파트너 알림 발송) — `functions/api/cycles/index.js`와 동일한 패턴
- `functions/api/love-logs/[id].js`: `DELETE`(Owner 전용, 파트너 알림 발송)
- `package.json`: `d1:migrate:local:love`, `d1:migrate:remote:love` 스크립트 추가

### 캘린더 → 상세 페이지 전환
- `app.js`
  - `state`에 `loveLogs`, `selectedDate` 추가, `loadAppData()`에서 `/api/love-logs`도 함께 로드
  - `renderApp()`에 `selectedDate`가 있으면 상세 화면(`renderDetailScreen`)으로 분기하는 로직 추가
  - 캘린더 하단의 `renderLogListCard()` 완전히 제거 (사용하지 않는 코드로 남기지 않음)
  - `buildCalendarCells()`가 각 날짜 셀에 `date` 필드를 포함하도록 수정, `renderDayCell()`에 `data-action="open-date"` 부여 → 모든 날짜 칸이 탭 가능해짐
  - 상세 화면 신규 함수: `renderDetailScreen`, `renderDetailCycleSection`(해당 날짜의 생리 기록 표시 + 기존 수정/삭제/오늘종료 로직 이전), `renderDetailLoveSection`(해당 날짜의 사랑기록 목록 + Owner용 추가 폼), `findLogForDate`(날짜가 포함되는 생리 기록 탐색), `formatLong`(상세 헤더용 "n월 n일 요일" 포맷)
  - 액션 핸들러 추가: `open-date`(상세 진입), `close-detail`(캘린더로 복귀), `delete-love-log`
  - 폼 핸들러 추가: `add-love-log-form` → `handleAddLoveLog`, `handleDeleteLoveLog`
- `style.css`
  - `.day-cell`에 `cursor: pointer` 추가 (탭 가능함을 시각적으로 표시)
  - `.detail-header`, `.detail-header button`, `.detail-header .detail-date` 추가 (상세 페이지 상단 뒤로가기 + 날짜 타이틀, 기존 `.calendar-header` 버튼 스타일과 톤 일치)

## 테스트 방법과 결과
1. `node --check app.js` 구문 검증 통과
2. 로컬 D1에 `0002_love_logs.sql` 마이그레이션 적용, Owner/Viewer 테스트 유저 2명 + 생리 기록 4건 생성
3. `wrangler pages dev` + Playwright(Chromium, 390px 모바일 뷰포트)로 실제 화면 흐름 검증
   - 캘린더에서 생리 기록이 있는 날짜(6/25) 탭 → 상세 페이지에 "캘린더 기록"(6/24~6/28, 메모) + "수정/삭제" 버튼(Owner) 정상 표시
   - 사랑기록 추가 폼에 메모 입력 후 제출 → 목록에 즉시 반영, 토스트 "사랑기록을 추가했어요" 확인
   - 사랑기록 삭제 → 목록에서 사라지고 "이 날짜에 사랑기록이 없어요" 빈 상태로 복귀, 토스트 "삭제했어요" 확인
   - 생리 기록이 없는 날짜(6/10) 탭 → "이 날짜에 기록된 생리 기록이 없어요" 빈 상태 정상 표시
   - 뒤로가기(‹) → 캘린더로 정상 복귀, 하단에 리스트 없음, 캘린더 마킹(생리 기록 빨간 원) 정상 유지
   - Viewer 세션으로 같은 날짜 상세 페이지 진입 → 수정/삭제/사랑기록 추가 버튼 전혀 노출되지 않고 조회만 가능함을 확인
4. API 레벨 권한 확인: Viewer 세션으로 `POST /api/love-logs` 직접 호출 → `403 forbidden` 확인 (프론트 숨김뿐 아니라 서버에서도 차단됨)
5. 테스트에 사용한 로컬 유저/세션/기록 데이터 모두 삭제, `wrangler pages dev` 프로세스 종료

## 수정 파일
- `app.js`
- `style.css`
- `package.json`
- `migrations/0002_love_logs.sql` (신규)
- `functions/api/love-logs/index.js` (신규)
- `functions/api/love-logs/[id].js` (신규)

## 기존 기능에 미치는 영향
- 생리 기록 추가 폼(홈 화면), 캘린더 마킹, 예측 카드, 알림 발송 로직은 변경하지 않음.
- 생리 기록의 수정/삭제/오늘종료 기능은 삭제된 것이 아니라 "하단 리스트 → 날짜별 상세 페이지"로 위치만 이동함.
- 원격(운영) DB에는 아직 `love_logs` 테이블이 없으므로, 배포 전에 `wrangler d1 execute --remote --file=./migrations/0002_love_logs.sql` (또는 `npm run d1:migrate:remote:love`) 실행이 반드시 필요함.

## 로컬 커밋 / 배포 여부
✅ 로컬 커밋 완료 (398e063).
✅ 원격 D1에 `0002_love_logs.sql` 마이그레이션 적용 완료 — 적용 전 기존 데이터(users 2건, cycle_logs 12건) 확인,
적용 후에도 동일하게 유지됨을 재확인 (신규 `love_logs` 테이블만 추가, 데이터 손실 없음).
✅ `origin/main`으로 push 완료. Cloudflare Pages Git 연동을 통해 자동 배포됨.

## Next Recommended Task
1차 리뷰 항목 4: 설정 페이지 추가 (알림 설정 / 로그인 및 계정 / 기타 앱 설정) — 사용자 승인 후 진행
