# Changelog

이 프로젝트의 주요 변경 사항을 버전별로 기록합니다.

## [Unreleased]

### Added

- 사랑기록 기능 추가: 날짜별로 사랑기록을 남기고 조회/삭제 가능 (Owner만 추가/삭제, Viewer는 조회만)
- 설정 페이지 추가: 홈 화면 우측 상단 ⚙️ 아이콘으로 진입, 알림 켜기/끄기와 로그아웃 제공

### Changed

- 기본 폰트를 Pretendard로 적용 (셀프 호스팅 woff2 subset, `/fonts`). 기존에도 이름은 있었으나 실제로는 로드되지 않던 상태였음
- font-size/font-weight/line-height/letter-spacing을 `:root`의 Typography Primitive Token(`--font-size-*`, `--font-weight-*`, `--line-height-*`, `--tracking-tight`)으로 토큰화. 기존 값 그대로 재사용해 화면상 변화는 없음
- 전체 아이콘을 이모지/문자(⚙️🔔💌📊✍️📋💜‹›)에서 Lucide 기반 SVG 아이콘으로 교체, `icons.js`에서 중앙 관리
- 캘린더 하단에 항상 표시되던 기록 리스트 제거, 날짜를 탭하면 해당 날짜의 상세 페이지에서 캘린더 기록과 사랑기록을 확인
- 홈 화면에 항상 떠 있던 알림/iOS 설치 안내 배너를 제거하고 설정 페이지로 이전

- 상단 예측 정보 카드 구성 변경: "다음 예상 생리일 / 배란 예상일 / 가임기"(캘린더와 중복 표시) 제거, "평균 생리주기 / 평균 생리기간 / 마지막 생리일"로 교체
- 캘린더의 배란 예상일 마킹을 이모지(💧)에서 기존 범례 dot 스타일과 통일된 채워진 점 표시로 변경

### Fixed

- 새 기록 추가 시 저장은 되지만 캘린더/목록이 즉시 갱신되지 않던 버그 수정 (`showToast` 함수 누락)
- 기록 저장 시 앱 푸시가 중복 발송되던 버그 수정 (사용자당 누적된 구독을 정리하지 않던 문제)
- `app.js`의 아바타 폴백/초대 코드 안내/예측 정보 빈 상태 문구가 존재하지 않는 CSS 변수(`--pink-light`, `--pink`, `--text-muted`)를 참조하던 버그 수정 — 실제 토큰(`--primary-disabled`, `--primary`, `--muted`)으로 연결

### Removed

- `style.css`에서 사용되지 않던 Color Token 3개 제거 (`--body-text`, `--muted-soft`, `--border-strong`)

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