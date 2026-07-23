# Current Task

## Goal
디자인 시스템 감사에서 발견한 1순위 항목 처리 — (1) `app.js`의 존재하지 않는 CSS 변수 참조 버그 수정,
(2) `style.css`의 사용되지 않는 Color Token 정리

## Background
디자인 시스템 감사(색상/spacing/radius/shadow/border/motion/컴포넌트 일관성/접근성 전수 조사) 결과 중
가장 우선순위가 높았던 두 항목만 분리해서 진행. 원인 분석 과정에서 git 히스토리를 확인한 결과, 커밋
`15e0236`(Reskin UI with Airbnb-style design tokens)에서 `style.css`의 `:root` 색상 토큰 체계를
통째로 교체(`--pink`/`--pink-light`/`--text-muted` → `--primary`/`--luxe`/`--ink`/`--muted` 등)했지만
`app.js`의 인라인 스타일은 그때 갱신되지 않아, 존재하지 않는 변수를 참조하는 버그가 그 이후 계속 남아있었음.

## Scope
- `app.js`: 인라인 스타일 3곳(아바타 폴백, 초대 코드 안내, 예측 정보 빈 상태)의 미정의 변수
  `--pink-light`/`--pink`/`--text-muted`를 git 히스토리로 확인한 동일 역할의 실제 토큰
  `--primary-disabled`/`--primary`/`--muted`로 교체
- `style.css`: `:root`에서 0회 사용되던 색상 토큰 3개(`--body-text`, `--muted-soft`, `--border-strong`) 제거
- `DESIGN.md`: "Radius/Spacing은 디자인 스케일로 관리(사용 여부와 무관하게 유지), Color는 Semantic
  Role/Token 중심으로 관리(미사용 시 제거)"라는 원칙을 §6/§8/§9에 명문화
- **범위 아님**:
  - `--radius-lg`/`--radius-xl`/`--space-xxs` 제거 — 사용자 판단에 따라 디자인 스케일의 일부로 유지
  - `.role-badge`의 2px/10px, `.icon-btn`의 6px 등 애매한 리터럴 정리
  - Typography/Border-width/Transition 등 감사에서 발견한 다른 항목들 (후속 작업으로 분리)
  - UI/디자인 값/레이아웃/기능 변경

## Definition of Done
- `app.js`에 남은 `var(--...)` 참조가 전부 `style.css`의 실제 `:root` 토큰과 일치
- 제거한 3개 토큰의 선언·참조가 모두 사라짐
- 계산되는 색상 값에 변화 없음 (버그였던 값이 실제 토큰으로 "복구"되는 것 외 다른 값 변경 없음)
- CSS 구조(중괄호 짝) 깨짐 없음

---

# Result

## Status
✅ Completed, 로컬 커밋 및 push/배포 완료 (commit 7fd34eb, main으로 push)

## 문제 분석
`app.js:170, 254, 274`에서 `var(--pink-light)`, `var(--pink)`, `var(--text-muted)`를 참조하고 있었으나
`style.css`의 `:root`엔 해당 이름의 변수가 존재하지 않았음. CSS 커스텀 프로퍼티가 정의되지 않으면 해당
선언은 무효(invalid at computed-value time) 처리되어, `background`는 초기값(투명)으로, `color`는 상속값으로
되돌아가 있었음 — 아바타 폴백 원의 배경색이 안 보이고, 초대 코드/예측 정보 안내 문구 색이 의도한 회색이
아닌 상속된 색으로 표시되고 있었을 것으로 추정됨.

git 히스토리 대조 결과, 커밋 `15e0236`에서 `--pink`(#ff6f91, 옛 단일 액센트) → `--primary`(#ff385c),
`--pink-light`(#ffe3ea, 액센트 옅은 배경) → `--primary-disabled`(#ffd1da), `--text-muted`(#8a7676) →
`--muted`(#6a6a6a)로 역할이 그대로 이어지는 리네임이 있었음을 확인. `app.js`만 그 리네임에서 빠진 것.

## 수정 내용
- `app.js`
  - L170: 아바타 이니셜 폴백 — `background:var(--pink-light)` → `var(--primary-disabled)`,
    `color:var(--pink)` → `var(--primary)`
  - L254: 초대 코드 안내 문구 — `color:var(--text-muted)` → `var(--muted)`
  - L274: 예측 정보 빈 상태 문구 — `color:var(--text-muted)` → `var(--muted)`
- `style.css`
  - `:root`에서 `--body-text`(#3f3f3f), `--muted-soft`(#929292), `--border-strong`(#c1c1c1) 3줄 삭제
    (전부 0회 참조 확인 후 제거). `--radius-lg`/`--radius-xl`/`--space-xxs`는 0회 참조지만 사용자 결정에
    따라 "디자인 스케일의 일부"로 보고 유지
- `DESIGN.md`
  - §6 Color Principles에 "6.1 Scale vs Semantic Role" 절 추가: Radius/Spacing은 스케일로 관리(미사용도
    유지), Color는 Semantic Role/Token 중심으로 관리(미사용은 제거), Primitive Color Scale이 필요하면
    별도 설계 후 도입
  - §8 Spacing / §9 Radius에 "사용 여부와 무관하게 스케일을 유지한다"는 원칙 문장 추가

## 테스트 방법과 결과
1. `grep -n "var(--" app.js` → 남은 3곳 모두 `style.css`에 실제 존재하는 토큰(`--primary-disabled`,
   `--primary`, `--muted`×2)인 것을 확인
2. `grep -n "body-text\|muted-soft\|border-strong" style.css` → 매치 없음(선언·참조 모두 제거됨) 확인
3. CSS 중괄호 개수 74/74로 구조 깨짐 없음 확인
4. `git diff`로 계획한 라인 외 변경이 없는지 전체 대조
5. 브라우저 실사용 화면 확인은 미실시 — 존재하지 않던 값이 실제 토큰으로 연결되는 변경이라 이전에 보이던
   깨진 상태보다 나빠질 가능성은 없다고 판단했으나, 다음 로컬 실행 시 아바타 폴백(사진 없는 사용자)과
   초대 카드/예측 정보 빈 상태 화면을 육안 확인 권장

## 수정 파일
- `app.js`
- `style.css`
- `DESIGN.md`

## 기존 기능에 미치는 영향
- 레이아웃/기능 변경 없음. 색상 계산값은 "버그로 무효화되어 있던 값"이 "실제 토큰 값"으로 복구되는 것 외에
  변경 없음
- 이후 새 색상이 필요할 때는 §6.1 원칙에 따라 Semantic Role 기반으로 정의하고, 사용하지 않게 되면 제거하는
  것이 표준 프로세스가 됨

## 로컬 커밋 / 배포 여부
✅ 로컬 커밋 완료 (7fd34eb), `origin/main`으로 push 완료.
Cloudflare Pages Git 연동을 통해 자동 배포됨. (새 DB 마이그레이션 없어 원격 D1 작업 불필요)
