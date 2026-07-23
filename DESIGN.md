# DESIGN.md

# Design Guidelines

이 문서는 프로젝트의 디자인 원칙과 UI 구현 규칙을 정의한다.

새로운 UI를 추가하거나 기존 UI를 수정할 때는
항상 이 문서를 먼저 확인한다.

디자인보다 사용성을 우선하며,
새로운 스타일을 만드는 것보다 일관성을 유지하는 것을 목표로 한다.

---

# 1. Design Philosophy

사용자는 디자인을 보기 위해 앱을 사용하는 것이 아니라,
자신의 목적을 빠르고 편하게 해결하기 위해 앱을 사용한다.

따라서 디자인은 화려함보다 이해하기 쉬움과 일관성을 우선한다.

모든 UI는 아래 질문에 답할 수 있어야 한다.

- 사용자가 무엇을 해야 하는가?
- 현재 어떤 상태인가?
- 다음 행동은 무엇인가?

디자인은 사용자의 고민을 줄이는 방향으로 결정한다.

---

# 2. Core Principles

## 2.1 Consistency First

새로운 UI를 만들기보다 기존 패턴을 재사용한다.

같은 기능은 항상 같은 형태로 표현한다.

---

## 2.2 One Primary Action

한 화면에는 하나의 Primary Action만 존재한다.

사용자가 가장 먼저 해야 하는 행동이 명확해야 한다.

---

## 2.3 Reduce Cognitive Load

사용자가 고민해야 하는 선택지를 최소화한다.

- 불필요한 버튼 제거
- 불필요한 설명 제거
- 필요한 정보만 먼저 노출

---

## 2.4 Clear Feedback

사용자의 모든 행동에는 피드백이 있어야 한다.

예)

- 저장 완료
- 삭제 완료
- 오류 발생
- 로딩 중

---

## 2.5 Structure Before Color

상태 구분은 색상보다 구조를 우선한다.

색상은 보조 수단이다.

---

## 2.6 Progressive Disclosure

처음부터 모든 정보를 보여주지 않는다.

필요한 순간에 필요한 정보만 제공한다.

---

# 3. Visual Language

디자인 키워드

- Calm
- Friendly
- Minimal
- Soft
- Clean
- Readable
- Trustworthy

새로운 UI는 위 키워드를 유지해야 한다.

---

# 4. Component Principles

## Button

- Primary Button은 화면당 하나를 원칙으로 한다.
- Secondary Button은 Primary를 보조한다.
- Danger Action은 명확히 구분한다.

---

## Card

카드는 관련된 정보를 하나의 그룹으로 묶는다.

장식용으로 사용하지 않는다.

---

## Modal

모달은 반드시 사용자의 결정이 필요한 경우에만 사용한다.

---

## Bottom Sheet

모바일 환경에서는 선택 중심 UI에 Bottom Sheet를 우선 고려한다.

---

## Toast

Toast는 사용자의 행동 결과를 짧게 알려주는 용도로만 사용한다.

---

# 5. Icon System

## Library

Lucide SVG

---

## Style

- Outline Only
- Filled Icon 사용 금지

---

## Stroke

2px

---

## Size

기본

- 16
- 20
- 24

필요 이상으로 다양한 크기를 사용하지 않는다.

---

## Icon Rules

ArrowLeft
→ 화면 이동(뒤로가기)

ChevronLeft / ChevronRight
→ 같은 화면 안 탐색(월 이동 등)

Settings
→ 설정

Bell
→ 알림

UserPlus
→ 사용자 초대

Sparkles
→ 예측 / 인사이트

SquarePen
→ 새 기록 작성

NotebookPen
→ 기록 목록

Heart
→ 사랑 기록

LogOut
→ 로그아웃

---

## Calendar Marker Rules

달력 셀 안의 작은 상태 표시는 아이콘으로 변경하지 않는다.

다음 요소는 CSS 도형으로 유지한다.

- 생리
- 예상 생리
- 배란
- 오늘
- 가임기

Legend(설명 영역)에서만 Lucide 아이콘을 사용할 수 있다.

---

## Icon Implementation Rules

현재 프로젝트는 React, TypeScript, 번들러를 사용하지 않는다.

따라서

- lucide-react 사용 금지
- React Component 사용 금지
- CDN 의존 금지

아이콘은 프로젝트 내부의 `icons.js`에서 중앙 관리한다.

UI 코드에 SVG를 반복 작성하지 않는다.

새로운 아이콘이 필요하면 먼저 `icons.js`에 추가한 후 사용한다.

동일한 의미의 기능에는 항상 동일한 아이콘을 사용한다.

---

# 6. Color Principles

색상은 항상 역할(Semantic) 기준으로 사용한다.

컴포넌트 CSS는 Primitive Token을 직접 참조하지 않는다. 반드시 Semantic Token을 거친다.

색상만으로 상태를 구분하지 않는다.

Color Token은 Primitive → Semantic 2단계로 관리한다. Component Token은 기본적으로 만들지 않는다 (6.6 참고).

---

## 6.1 Primitive Token 정의

Primitive는 "색 자체"만 정의한다. 역할이나 용도를 이름에 포함하지 않는다.

```css
/* Brand */
--color-brand-200: #ffd1da;
--color-brand-500: #ff385c;
--color-brand-600: #e00b41;

/* Neutral */
--color-neutral-0: #ffffff;
--color-neutral-50: #f7f7f7;
--color-neutral-100: #ebebeb;
--color-neutral-200: #dddddd;
--color-neutral-600: #6a6a6a;
--color-neutral-900: #222222;

/* Red */
--color-red-50: #fdeceb;
--color-red-600: #c13515;

/* Green */
--color-green-50: #edf8f2;
--color-green-600: #1f7a4d;

/* Purple */
--color-purple-100: #f3ebfa;
--color-purple-600: #460479;
```

### 규칙

- Primitive 이름에 `period`, `fertile`, `danger`, `accent` 같은 역할을 포함하지 않는다. (`--color-period-500` ❌, `--color-brand-500` ✅)
- 숫자는 명도 순서를 의미할 뿐 사용처를 의미하지 않는다.
- 현재 실제로 쓰이는 값만 등록한다. 스케일을 채우기 위한 중간 단계(예: neutral-300, neutral-400, neutral-800)는 실사용이 생기기 전까지 추가하지 않는다.
- Primitive는 컴포넌트 CSS에서 직접 참조하지 않는다.

---

## 6.2 Semantic Token 정의

Semantic은 색이 UI에서 수행하는 역할을 정의한다. 컴포넌트 CSS는 항상 Semantic Token만 참조한다.

```css
/* Text */
--color-text-primary: var(--color-neutral-900);
--color-text-secondary: var(--color-neutral-600);
--color-text-inverse: var(--color-neutral-0);

/* Surface */
--color-surface-canvas: var(--color-neutral-0);
--color-surface-soft: var(--color-neutral-50);
--color-surface-strong: var(--color-neutral-100);

/* Border */
--color-border-soft: var(--color-neutral-100);
--color-border-default: var(--color-neutral-200);
--color-border-strong: var(--color-neutral-900);

/* Accent */
--color-accent: var(--color-brand-500);
--color-accent-active: var(--color-brand-600);
--color-accent-disabled: var(--color-brand-200);

/* Danger */
--color-danger: var(--color-red-600);
--color-danger-soft: var(--color-red-50);

/* Success */
--color-success: var(--color-green-600);
--color-success-soft: var(--color-green-50);

/* Period */
--color-period: var(--color-brand-500);
--color-period-predicted: var(--color-brand-500);

/* Fertile */
--color-fertile: var(--color-purple-100);
--color-fertile-strong: var(--color-purple-600);

/* Ovulation */
--color-ovulation: var(--color-purple-600);
```

### 규칙

- 같은 Primitive 값을 여러 Semantic Token이 가리켜도 된다. `--color-period`와 `--color-period-predicted`가 지금 같은 값이어도, 역할이 다르므로 토큰은 분리한다. 나중에 두 값이 달라져도 컴포넌트 CSS는 바꾸지 않아도 된다.
- Accent 위에 올라가는 텍스트/아이콘은 별도 `on-accent` 토큰을 만들지 않고 `--color-text-inverse`를 사용한다.
- 어떤 Semantic 역할에도 속하지 않는 색이 필요하면 6.9 절차를 따른다. 역할을 만들지 않고 임의로 Primitive를 직접 참조하지 않는다.

---

## 6.3 Brand Color 원칙

Brand는 하나만 사용한다.

Primary / Secondary / Tertiary Brand Color를 만들지 않는다.

Brand가 필요한 곳은 전부 `--color-accent` 계열(`--color-accent`, `--color-accent-active`, `--color-accent-disabled`)로 해결한다.

새 화면에서 "포인트 컬러가 하나 더 필요하다"는 요구가 생기면, 색을 추가하기 전에 구조(레이아웃 / 타이포그래피 / 여백)로 해결할 수 있는지 먼저 검토한다.

---

## 6.4 Status Color 원칙

Status는 사용자 행동의 결과를 알리는 색이다.

- Danger: 삭제, 오류, 되돌릴 수 없는 행동
- Success: 저장 완료 등 긍정적 결과

Status 색은 Brand Color와 혼용하지 않는다. `--color-accent`를 오류/성공 표시에 사용하지 않는다.

색상만으로 상태를 표현하지 않는다. 아이콘, 텍스트, 위치 등 색 이외의 신호를 함께 제공한다.

---

## 6.5 Calendar Color 원칙

Period, Fertile, Ovulation은 생리주기 데이터를 나타내는 고유한 의미 영역이다. Brand Color, Status Color와 역할을 분리한다.

- `--color-period` / `--color-period-predicted`: 실제 생리 기록 / 예측 생리
- `--color-fertile` / `--color-fertile-strong`: 가임기 배경 / 가임기 강조(아이콘 등)
- `--color-ovulation`: 배란 예상일

Period가 Brand Color와 같은 값(`--color-brand-500`)을 가리키는 것은 허용한다. 다만 이는 우연히 같은 색일 뿐이며, Period는 항상 `--color-period`로 참조하고 `--color-accent`를 직접 참조하지 않는다.

Calendar 셀 안의 마킹은 5장 Calendar Marker Rules에 따라 CSS 도형으로 유지하며, 아이콘으로 대체하지 않는다.

---

## 6.6 Component Token 사용 원칙

Component Token은 기본적으로 만들지 않는다.

Button, Input, Toast, Card 등은 Semantic Token을 직접 참조한다.

```css
.btn {
  background: var(--color-accent);
  color: var(--color-text-inverse);
}
```

Component Token은 아래 조건을 모두 만족할 때만 예외적으로 도입한다.

- 동일한 역할이 3개 이상의 컴포넌트에서 반복되고
- Semantic Token만으로는 의미가 불명확하거나, 값이 한꺼번에 바뀌어야 할 때 참조를 일일이 찾아 바꿔야 하는 실질적인 유지보수 비용이 생길 때

조건을 만족하지 못하면 Semantic Token을 그대로 사용한다. "나중에 필요할 것 같다"는 이유로 미리 만들지 않는다.

---

## 6.7 Token Naming Rule

```
--color-{category}-{step}       (Primitive)
--color-{role}                  (Semantic)
--color-{role}-{state}          (Semantic, 상태가 있는 경우)
```

- Primitive: `--color-brand-500`, `--color-neutral-900`처럼 색 계열과 명도 단계만 표기한다.
- Semantic: `--color-text-primary`, `--color-accent-active`처럼 역할(과 상태)을 표기한다.
- 상태 접미사는 `-active`, `-disabled`, `-soft`, `-strong`, `-predicted` 등 실제로 존재하는 상태만 사용한다.
- 축약어를 사용하지 않는다. (`--color-txt-pri` 같은 표기 금지)

---

## 6.8 Color 변경 원칙

- Primitive 값 변경은 해당 값을 참조하는 모든 Semantic Token에 영향을 준다. 변경 전 참조 범위를 확인한다.
- Semantic Token 추가/변경은 실제 사용처가 생긴 뒤에 한다. 사용처 없이 역할만 미리 정의하지 않는다.
- 실제 역할과 사용 목적이 없는 Color Token은 제거한다. Radius/Spacing과 달리 Color는 스케일 보존을 이유로 미사용 토큰을 남기지 않는다.
- Semantic → Primitive 매핑만 바꾸는 것도 "색상 값 변경"으로 간주한다. 시각적 결과가 바뀌므로 단순 리네임과 동일하게 취급하지 않는다.

---

## 6.9 새 Color 추가 절차

1. 정말 새로운 색이 필요한지 먼저 확인한다. 기존 Semantic Token 중 재사용 가능한 것이 있는지 검토한다.
2. 어떤 역할(Semantic)인지 먼저 정의한다. Text / Surface / Border / Accent / Danger / Success / Period / Fertile / Ovulation 중 어디에도 속하지 않으면, 새 역할을 만들 필요가 있는지 사용자와 먼저 확인한다.
3. 이미 등록된 Primitive로 표현 가능한지 확인한다. 가능하면 새 Primitive를 추가하지 않는다.
4. Primitive가 정말 없다면 색 계열(Brand / Neutral / Red / Green / Purple 등)과 명도 단계를 정해 추가한다.
5. Semantic Token을 추가하고 Primitive를 연결한다.
6. WCAG 대비를 확인한다. (일반 텍스트 4.5:1, 큰 텍스트/UI 요소 3:1)
7. 이 문서(DESIGN.md)에 반영한다.

---

# 7. Typography

텍스트는 계층을 명확하게 표현한다.

- Display (현재 미사용 — 필요해지면 정의)
- Title
- Subtitle
- Body
- Caption
- Button

## 7.1 Primitive Token

`style.css`의 `:root`에 정의되어 있다. 새로운 값을 추가하지 않고 기존 값만 재사용한다.

```css
--font-size-title: 20px;
--font-size-subtitle-lg: 18px;
--font-size-subtitle: 16px;
--font-size-body: 14px;
--font-size-caption: 13px;
--font-size-caption-sm: 12px;
--font-size-caption-xs: 11px;

--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

--line-height-tight: 1.2;
--line-height-snug: 1.25;
--line-height-relaxed: 1.5;

--tracking-tight: -0.18px;
```

## 7.2 사용 규칙

- 새 텍스트 스타일이 필요하면 위 primitive를 조합해 사용한다. 목록에 없는 새 font-size/font-weight
  값을 임의로 추가하지 않는다.
- `@font-face`의 `font-weight`는 토큰을 참조하지 않는다 — CSS 스펙상 `@font-face` 디스크립터는
  커스텀 프로퍼티(`var()`)를 지원하지 않는다.
- line-height를 명시하지 않는 텍스트(대부분의 UI 텍스트)는 브라우저 기본값(`normal`)을 그대로 둔다.
  임의로 숫자 line-height를 추가하지 않는다.

---

# 8. Spacing

8pt Grid를 기본으로 사용한다.

허용 간격

- 4
- 8
- 12
- 16
- 24
- 32
- 48
- 64

Spacing Token은 디자인 스케일의 일부로 관리하며, 현재 참조 여부만으로 제거하지 않는다.

---

# 9. Radius

Radius는 프로젝트 전체에서 일관성을 유지한다.

새로운 Radius 값을 추가하지 않는다.

Radius Token은 사용 여부와 관계없이 디자인 스케일(xs~xl~full)을 유지한다.

새로운 컴포넌트는 기존 Radius Scale 안에서 선택하여 사용하며, 임의의 Radius 값을 추가하지 않는다.

---

# 10. Motion

애니메이션은 의미가 있을 때만 사용한다.

기본 Duration

150~250ms

기본 Easing

ease-out

과도한 Bounce Animation은 사용하지 않는다.

---

# 11. Accessibility

최소 터치 영역

44px

색상만으로 상태를 표현하지 않는다.

명도 대비를 유지한다.

아이콘이 장식용인 경우

aria-hidden="true"

를 사용한다.

의미 전달이 필요한 아이콘은 적절한 접근성 속성을 제공한다.

---

# 12. Do

- 기존 컴포넌트를 우선 사용한다.
- 같은 기능은 같은 UI를 사용한다.
- Primary Action을 명확하게 만든다.
- 사용자의 행동에는 항상 피드백을 제공한다.
- 디자인보다 사용성을 우선한다.
- 아이콘은 icons.js에서 관리한다.

---

# 13. Don't

- 같은 기능에 다른 아이콘 사용
- Filled / Outline 혼용
- 화면마다 다른 버튼 스타일
- 의미 없는 애니메이션
- 색상만으로 상태 표현
- UI 코드에 SVG를 직접 반복 작성
- 새로운 컴포넌트를 불필요하게 추가

---

# 14. UI Change Checklist

새로운 UI를 추가하거나 수정하기 전에 아래 항목을 확인한다.

- 기존 컴포넌트로 해결 가능한가?
- 기존 패턴을 재사용할 수 있는가?
- Primary Action이 명확한가?
- 사용자가 현재 상태를 이해할 수 있는가?
- 행동 후 피드백이 제공되는가?
- icons.js의 기존 아이콘을 재사용할 수 있는가?
- DESIGN.md 원칙을 위반하지 않는가?