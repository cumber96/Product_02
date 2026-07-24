import {
  Settings,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  UserPlus,
  SquarePen,
  NotebookText,
  Heart,
  Droplet,
  Circle,
  Egg,
  X,
} from "./icons.js";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const ERROR_MESSAGES = {
  invite_code_required: "이미 첫 사용자가 등록되어 있어요. 초대 링크를 통해서만 가입할 수 있어요.",
  invalid_invite_code: "초대 코드가 유효하지 않거나 만료됐어요. 새 초대 링크를 요청해주세요.",
  already_full: "이미 두 명 모두 등록되어 있어요.",
  invalid_id_token: "로그인에 실패했어요. 다시 시도해주세요.",
};

let CONFIG = null;
const state = {
  me: null,
  prediction: null,
  logs: [],
  loveLogs: [],
  currentMonth: new Date(),
  inviteResult: null,
  selectedDate: null,
  settingsOpen: false,
  sheetOpen: false,
};

const appEl = document.getElementById("app");

// ---------- API ----------
async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include",
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || "request_failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ---------- Boot ----------
async function boot() {
  renderLoading();
  CONFIG = await api("/api/config");
  const pendingInvite = extractInviteCode();

  try {
    const me = await api("/api/me");
    state.me = me;
    await loadAppData();
    await renderApp();
  } catch {
    renderLogin(pendingInvite);
  }
}

async function loadAppData() {
  const [prediction, cycles, loveLogs] = await Promise.all([
    api("/api/prediction"),
    api("/api/cycles"),
    api("/api/love-logs"),
  ]);
  state.prediction = prediction;
  state.logs = cycles.logs;
  state.loveLogs = loveLogs.logs;
}

function extractInviteCode() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("invite");
  if (code) {
    sessionStorage.setItem("pendingInviteCode", code);
    url.searchParams.delete("invite");
    window.history.replaceState({}, "", url.pathname + url.search);
  }
  return sessionStorage.getItem("pendingInviteCode");
}

function renderLoading() {
  appEl.innerHTML = `<div class="loading">불러오는 중…</div>`;
}

// ---------- Login screen ----------
function renderLogin(pendingInvite) {
  appEl.innerHTML = `
    <div class="login-screen">
      <h1>우리 둘의 생리주기 캘린더</h1>
      <p>구글 계정으로 로그인해주세요</p>
      ${pendingInvite ? `<div class="invite-note">초대 링크로 접속했어요</div>` : ""}
      <div id="google-btn" class="google-btn-slot"></div>
      <div id="login-error"></div>
    </div>
  `;
  renderGoogleButton(document.getElementById("google-btn"));
}

function renderGoogleButton(container) {
  if (!window.google || !window.google.accounts || !window.google.accounts.id) {
    setTimeout(() => renderGoogleButton(container), 300);
    return;
  }
  window.google.accounts.id.initialize({
    client_id: CONFIG.googleClientId,
    callback: handleGoogleCredential,
  });
  window.google.accounts.id.renderButton(container, {
    theme: "filled_black",
    size: "large",
    shape: "pill",
    text: "signin_with",
    width: 260,
  });
}

async function handleGoogleCredential(response) {
  const inviteCode = sessionStorage.getItem("pendingInviteCode") || undefined;
  try {
    await api("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken: response.credential, inviteCode }),
    });
    sessionStorage.removeItem("pendingInviteCode");
    await boot();
  } catch (err) {
    const el = document.getElementById("login-error");
    if (el) {
      const msg = ERROR_MESSAGES[err.data && err.data.error] || "로그인 중 문제가 발생했어요.";
      el.innerHTML = `<div class="error-note">${msg}</div>`;
    }
  }
}

// ---------- Home screen ----------
async function renderApp() {
  if (state.settingsOpen) return renderSettingsScreen();

  appEl.innerHTML = `
    <div class="home-header">
      <div class="home-date">${formatLong(ymd(new Date()))}</div>
      <div class="home-header-actions">
        <button class="icon-btn" data-action="open-notifications" aria-label="알림">${Bell()}</button>
        <button class="icon-btn" data-action="open-settings" aria-label="설정">${Settings()}</button>
      </div>
    </div>

    ${renderTodayHero()}
    ${renderPredictionCarousel()}
    ${renderCalendarCard()}
    ${renderSelectedDateDetail()}
    ${renderSheet()}
  `;
}

// ---------- Today Hero ----------
// Prediction 계산 로직(classifyDate)을 그대로 재사용해 오늘 상태만 텍스트로 요약
function renderTodayHero() {
  const p = state.prediction;
  // Prediction Carousel의 빈 상태 안내와 중복되지 않도록, 예측할 데이터가 없으면 Hero는 표시하지 않음
  if (!p || !p.hasData) return "";
  const { title, subtitle } = getTodayHeroStatus(classifyDate(ymd(new Date())));
  return `
    <div class="hero">
      <div class="hero-title">${title}</div>
      <div class="hero-subtitle">${subtitle}</div>
    </div>
  `;
}

function getTodayHeroStatus(flags) {
  if (flags.period) return { title: "오늘은 생리 기간", subtitle: "몸이 힘든 시기예요, 무리하지 마세요" };
  if (flags.predicted) return { title: "오늘은 예상 생리 기간", subtitle: "곧 생리가 시작될 수 있어요" };
  if (flags.ovulation) return { title: "오늘은 배란일", subtitle: "임신 확률이 가장 높은 날" };
  if (flags.fertile) return { title: "오늘은 가임기", subtitle: "임신 확률이 높은 날" };
  return { title: "오늘은 비가임기", subtitle: "임신 확률 낮은 날" };
}

// ---------- Settings screen ----------
async function renderSettingsScreen() {
  const pushStatus = await getPushStatus();
  const { user, partnerConnected, partner } = state.me;
  const isOwner = user.role === "owner";

  appEl.innerHTML = `
    <div class="detail-header">
      <button class="icon-btn header" data-action="close-settings" aria-label="뒤로">${ArrowLeft()}</button>
      <div class="detail-date">설정</div>
    </div>
    <div class="list">${renderProfileRow(user, isOwner)}</div>
    ${isOwner ? renderInviteList(partnerConnected) : renderPartnerList(partner)}
    <div class="list">${renderNotificationRow(pushStatus)}</div>
    <div class="list">
      <button class="list-row danger" data-action="logout">
        <span class="list-row-title">${LogOut({ size: 20 })} 로그아웃</span>
      </button>
    </div>
  `;
}

function renderProfileRow(user, isOwner) {
  return `
    <div class="list-row">
      ${
        user.picture
          ? `<img class="avatar" src="${user.picture}" alt="">`
          : `<div class="avatar" style="background:var(--color-accent-soft);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--color-accent)">${escapeHtml(
              (user.name || "?")[0]
            )}</div>`
      }
      <div class="list-row-content">
        <div class="profile-name">${escapeHtml(user.name || user.email)}</div>
        <span class="role-badge ${isOwner ? "" : "viewer"}">${isOwner ? "owner" : "viewer"}</span>
      </div>
    </div>
  `;
}

function renderNotificationRow(pushStatus) {
  const title = `<div class="list-row-title">${Bell()} 알림</div>`;
  if (pushStatus === "unsupported") {
    return `
      <div class="list-row list-row-stack">
        ${title}
        <p class="hint">이 브라우저에서는 알림을 지원하지 않아요.</p>
      </div>
    `;
  }
  if (pushStatus === "needs-install") {
    return `
      <div class="list-row list-row-stack">
        ${title}
        <p class="hint">아이폰에서 알림을 받으려면 먼저 사파리 하단 <b>공유 버튼</b> → <b>홈 화면에 추가</b>로 앱을 설치해주세요. 설치 후 홈 화면 아이콘으로 다시 열면 켤 수 있어요.</p>
      </div>
    `;
  }
  if (pushStatus === "subscribed") {
    return `
      <div class="list-row list-row-stack">
        ${title}
        <p class="hint">알림이 켜져 있어요. 상대방이 기록을 업데이트하면 알려드려요.</p>
        <button class="btn ghost block" data-action="unsubscribe-push">알림 끄기</button>
      </div>
    `;
  }
  return `
    <div class="list-row list-row-stack">
      ${title}
      <p class="hint">상대방이 기록을 업데이트하면 바로 알려드려요.</p>
      <button class="btn block" data-action="subscribe-push">알림 켜기</button>
    </div>
  `;
}

function renderInviteList(partnerConnected) {
  if (partnerConnected) return "";
  const result = state.inviteResult;
  return `
    <div class="list">
      <div class="list-row list-row-stack">
        <div class="list-row-title">${UserPlus()} 남자친구 초대하기</div>
        ${
          result
            ? `
          <div class="invite-box">
            <div class="invite-url">
              <input id="invite-url-input" readonly value="${escapeHtml(result.url)}">
              <button class="btn secondary" data-action="copy-invite">복사</button>
            </div>
            <div style="font-size:12px;color:var(--color-text-secondary)">코드: ${escapeHtml(result.code)} · 7일간 유효</div>
          </div>
        `
            : `<button class="btn" data-action="create-invite">초대 링크 만들기</button>`
        }
      </div>
    </div>
  `;
}

function renderPartnerList(partner) {
  if (partner) return "";
  return `<div class="list"><div class="list-row"><div class="list-row-title">아직 연결된 사용자가 없어요</div></div></div>`;
}

// ---------- Prediction Horizontal Card Carousel ----------
function renderPredictionCarousel() {
  const p = state.prediction;
  if (!p || !p.hasData) {
    return `
      <div class="prediction">
        <div class="prediction-empty">아직 기록이 없어요. 첫 생리 시작일을 기록하면 예측이 시작돼요.</div>
      </div>
    `;
  }

  const cards = [
    {
      tone: "period",
      icon: Droplet({ size: 16 }),
      label: "생리 예정일",
      relative: formatRelativeDays(p.nextPredictedStart),
      date: formatDotWithWeekday(p.nextPredictedStart),
    },
    {
      tone: "ovulation",
      icon: Egg({ size: 16 }),
      label: "배란 예정일",
      relative: formatRelativeDays(p.ovulationDate),
      date: formatDotWithWeekday(p.ovulationDate),
    },
    {
      tone: "fertile",
      icon: Circle({ size: 16 }),
      label: "가임기",
      relative: formatRelativeDays(p.fertileWindowStart),
      date: `${formatDot(p.fertileWindowStart)}부터`,
    },
  ];

  return `
    <div class="prediction">
      <div class="prediction-track" tabindex="0" aria-label="예측 정보, 좌우로 넘겨보세요">
        ${cards
          .map(
            (c) => `
          <div class="prediction-slide tone-${c.tone}">
            <div class="prediction-icon">${c.icon}</div>
            <div class="label">${c.label}</div>
            <div class="prediction-meta">
              <span class="relative">${c.relative}</span>
              <span class="date">${c.date}</span>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

// ---------- Calendar ----------
function renderCalendarCard() {
  const year = state.currentMonth.getFullYear();
  const month = state.currentMonth.getMonth();
  const cells = buildCalendarCells(year, month);
  const monthLabel = `${year}.${String(month + 1).padStart(2, "0")}`;

  return `
    <div class="card calendar-card">
      <div class="calendar-header">
        <button class="icon-btn month-nav" data-action="prev-month" aria-label="이전 달">${ChevronLeft({ size: 14 })}</button>
        <div class="month-label">${monthLabel}</div>
        <button class="icon-btn month-nav" data-action="next-month" aria-label="다음 달">${ChevronRight({ size: 14 })}</button>
      </div>
      <div class="weekday-row">${WEEKDAYS.map((w) => `<div>${w}</div>`).join("")}</div>
      <div class="calendar-grid">${cells.map(renderDayCell).join("")}</div>
      <div class="legend">
        <div class="legend-row">
          <span class="legend-item"><span class="legend-swatch swatch-period"></span>생리기간</span>
          <span class="legend-item"><span class="legend-swatch swatch-predicted"></span>예상 생리기간</span>
          <span class="legend-item"><span class="legend-swatch swatch-fertile"></span>가임기</span>
        </div>
        <div class="legend-row">
          <span class="legend-item"><span class="legend-swatch swatch-ovulation"></span>배란일</span>
          <span class="legend-item">${Heart({ size: 14 })}사랑기록</span>
          <span class="legend-item"><span class="legend-swatch swatch-record"></span>캘린더 기록</span>
        </div>
      </div>
    </div>
  `;
}

// 같은 상태(key)가 이웃 셀에도 있으면 배경/Band가 이어져 보이도록 — 주가 바뀌는 지점(같은 행이 아닐 때)은 연결하지 않음
function isRangeConnected(cells, index, key, dir) {
  const neighborIndex = index + dir;
  if (Math.floor(neighborIndex / 7) !== Math.floor(index / 7)) return false;
  const neighbor = cells[neighborIndex];
  return !!(neighbor && neighbor[key]);
}

function renderDayCell(cell, index, cells) {
  if (!cell) return `<div class="day-cell empty"></div>`;
  const classes = ["day-cell"];
  if (cell.period) classes.push("period");
  if (cell.predicted) classes.push("predicted");
  if (cell.fertile) classes.push("fertile");
  if (cell.ovulation) classes.push("ovulation");
  if (cell.today) classes.push("today");
  if (cell.selected) classes.push("selected");

  ["period", "fertile"].forEach((key) => {
    if (!cell[key]) return;
    if (isRangeConnected(cells, index, key, -1)) classes.push(`${key}-connect-prev`);
    if (isRangeConnected(cells, index, key, 1)) classes.push(`${key}-connect-next`);
  });

  const markers =
    (cell.love ? `<span class="cell-marker love">${Heart({ size: 11 })}</span>` : "") +
    (cell.hasNote ? `<span class="cell-marker record"></span>` : "");

  return `<div class="${classes.join(" ")}" data-action="open-date" data-date="${cell.date}" role="gridcell" aria-selected="${cell.selected}" aria-label="${cell.day}일"><span class="num">${cell.day}</span>${markers}</div>`;
}

// 생리/예상/가임기/배란/사랑기록/메모 여부를 하루 단위로 판정 — 캘린더 그리드와 Selected Date Detail이 동일 로직을 공유
function classifyDate(dateStr) {
  const coveringLog = state.logs.find((l) => dateStr >= l.start_date && dateStr <= (l.end_date || l.start_date));
  const p = state.prediction;
  const inPeriod = !!coveringLog;
  const inPredicted =
    p && p.hasData && p.nextPredictedStart && dateStr >= p.nextPredictedStart && dateStr <= p.predictedPeriodEnd;
  const inFertile =
    p && p.hasData && p.fertileWindowStart && dateStr >= p.fertileWindowStart && dateStr <= p.fertileWindowEnd;
  const isOvulation = p && p.hasData && dateStr === p.ovulationDate;
  const hasLove = state.loveLogs.some((l) => l.date === dateStr);

  return {
    period: inPeriod,
    predicted: !inPeriod && inPredicted,
    fertile: inFertile,
    ovulation: isOvulation,
    love: hasLove,
    hasNote: !!(coveringLog && coveringLog.note),
  };
}

function buildCalendarCells(year, month) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const todayStr = ymd(new Date());

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = ymd(new Date(year, month, d));
    cells.push({
      day: d,
      date: dateStr,
      ...classifyDate(dateStr),
      today: dateStr === todayStr,
      selected: dateStr === state.selectedDate,
    });
  }
  return cells;
}

// ---------- Selected Date Detail (Home 인라인 Summary) ----------
function findLogForDate(dateStr) {
  return state.logs.find((l) => dateStr >= l.start_date && dateStr <= (l.end_date || l.start_date)) || null;
}

function renderSelectedDateDetail() {
  const dateStr = state.selectedDate;
  if (!dateStr) return "";

  const isOwner = state.me.user.role === "owner";
  const log = findLogForDate(dateStr);
  const loveLogsForDate = state.loveLogs.filter((l) => l.date === dateStr);
  const status = renderSelectedDateStatus(dateStr, log);

  return `
    <div class="card selected-date">
      <div class="selected-date-head">
        <div>
          <div class="home-date">${formatShort(dateStr)}</div>
          ${status ? `<div class="selected-date-status">${status}</div>` : ""}
        </div>
        <button class="icon-btn" data-action="close-date" aria-label="닫기">${X()}</button>
      </div>

      <div class="selected-date-row">
        <div class="selected-date-row-label">${NotebookText({ size: 16 })} 캘린더 기록</div>
        <div class="selected-date-row-value">${
          log ? `${formatShort(log.start_date)}${log.end_date ? " ~ " + formatShort(log.end_date) : " ~ 진행중"}` : "기록 없음"
        }</div>
      </div>
      ${
        log && log.note
          ? `
      <div class="selected-date-row">
        <div class="selected-date-row-label">메모</div>
        <div class="selected-date-row-value">${escapeHtml(log.note)}</div>
      </div>`
          : ""
      }

      <div class="selected-date-row">
        <div class="selected-date-row-label">${Heart({ size: 16 })} 사랑기록</div>
        <div class="selected-date-row-value">${loveLogsForDate.length ? "있음" : "없음"}</div>
      </div>

      ${
        isOwner
          ? `<button class="btn ghost block" data-action="open-sheet">${SquarePen({ size: 16 })} 기록 관리</button>`
          : ""
      }
    </div>
  `;
}

function renderSelectedDateStatus(dateStr, log) {
  if (log) {
    const dayNum = Math.round((parseYmd(dateStr) - parseYmd(log.start_date)) / 86400000) + 1;
    return `생리 ${dayNum}일째`;
  }
  const flags = classifyDate(dateStr);
  if (flags.ovulation) return "배란 예상일";
  if (flags.predicted) return "예상 생리 기간";
  if (flags.fertile) return "가임기";
  return "";
}

// ---------- Bottom Sheet (입력 중심: 추가/수정) ----------
// Owner만 열 수 있는 화면(Selected Date Detail의 "기록 관리" 버튼도 Owner 전용) — 여기선 별도 권한 체크 안 함
function renderSheet() {
  if (!state.sheetOpen || !state.selectedDate) return "";
  const dateStr = state.selectedDate;
  const log = findLogForDate(dateStr);
  const loveLogsForDate = state.loveLogs.filter((l) => l.date === dateStr);

  return `
    <div class="sheet-backdrop" data-action="close-sheet"></div>
    <div class="sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-head">
        <div class="home-date">${formatShort(dateStr)} 기록 관리</div>
        <button class="icon-btn" data-action="close-sheet" aria-label="닫기">${X()}</button>
      </div>
      <div class="selected-date-section">
        ${renderCycleManageSection(dateStr, log)}
      </div>
      <div class="selected-date-section">
        ${renderLoveManageSection(dateStr, loveLogsForDate)}
      </div>
    </div>
  `;
}

// 기록이 있으면 그 값을 채운 수정 폼, 없으면 빈 추가 폼 — 항상 입력 폼이 먼저 보이고
// 삭제는 폼 아래 작은 링크로만 존재(상시 노출되는 액션 버튼 행을 두지 않음)
function renderCycleManageSection(dateStr, log) {
  const subhead = `<div class="selected-date-subhead">${NotebookText({ size: 16 })} 캘린더 기록</div>`;

  return `
    ${subhead}
    <form id="cycle-log-form" data-id="${log ? log.id : ""}">
      <div class="form-row">
        <label>시작일</label>
        <input type="date" name="start_date" value="${log ? log.start_date : dateStr}" required>
      </div>
      <div class="form-row">
        <label>종료일 (선택)</label>
        <input type="date" name="end_date" value="${log && log.end_date ? log.end_date : ""}">
      </div>
      <div class="form-row">
        <label>메모 (선택)</label>
        <input type="text" name="note" value="${log ? escapeHtml(log.note || "") : ""}" placeholder="컨디션, 복용 약물 등">
      </div>
      <button type="submit" class="btn block">저장</button>
    </form>
    ${log ? `<button class="text-btn delete" data-action="delete-log" data-id="${log.id}">이 기록 삭제</button>` : ""}
  `;
}

function renderLoveManageSection(dateStr, loveLogsForDate) {
  const subhead = `<div class="selected-date-subhead">${Heart({ size: 16 })} 사랑 기록</div>`;
  const items = loveLogsForDate
    .map(
      (l) => `
      <div class="log-item">
        <div class="note">${l.note ? escapeHtml(l.note) : "메모 없음"}</div>
        <button class="text-btn delete" data-action="delete-love-log" data-id="${l.id}">삭제</button>
      </div>
    `
    )
    .join("");

  return `
    ${subhead}
    <form id="add-love-log-form">
      <div class="form-row">
        <label>메모 (선택)</label>
        <input type="text" name="note" placeholder="오늘 있었던 일">
      </div>
      <button type="submit" class="btn block">사랑기록 추가</button>
    </form>
    ${items ? `<div class="manage-list">${items}</div>` : ""
    }
  `;
}

// ---------- Actions ----------
appEl.addEventListener("click", onAppClick);
appEl.addEventListener("submit", onAppSubmit);

async function onAppClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === "logout") return handleLogout();
  if (action === "prev-month") {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1);
    return renderApp();
  }
  if (action === "next-month") {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1);
    return renderApp();
  }
  if (action === "create-invite") return handleCreateInvite();
  if (action === "copy-invite") return copyInviteUrl();
  if (action === "subscribe-push") return subscribeToPush();
  if (action === "open-sheet") {
    state.sheetOpen = true;
    return renderApp();
  }
  if (action === "close-sheet") {
    state.sheetOpen = false;
    return renderApp();
  }
  if (action === "delete-log") return handleDeleteLog(btn.dataset.id);
  if (action === "open-date") {
    const date = btn.dataset.date;
    state.selectedDate = state.selectedDate === date ? null : date;
    state.sheetOpen = false;
    return renderApp();
  }
  if (action === "close-date") {
    state.selectedDate = null;
    state.sheetOpen = false;
    return renderApp();
  }
  if (action === "delete-love-log") return handleDeleteLoveLog(btn.dataset.id);
  if (action === "open-notifications") return showToast("알림센터는 준비 중이에요");
  if (action === "open-settings") {
    state.settingsOpen = true;
    return renderApp();
  }
  if (action === "close-settings") {
    state.settingsOpen = false;
    return renderApp();
  }
  if (action === "unsubscribe-push") return handleUnsubscribePush();
}

async function onAppSubmit(e) {
  const form = e.target.closest("form");
  if (!form) return;
  e.preventDefault();
  if (form.id === "cycle-log-form") return handleSaveCycleLog(form);
  if (form.id === "add-love-log-form") return handleAddLoveLog(form);
}

// 기록이 있으면(data-id 있음) 수정, 없으면 추가 — 하나의 폼/핸들러로 통일
async function handleSaveCycleLog(form) {
  const id = form.dataset.id;
  const fd = new FormData(form);
  const start_date = fd.get("start_date");
  const end_date = fd.get("end_date") || null;
  const note = fd.get("note") || null;
  if (!start_date) return;
  try {
    if (id) {
      await api(`/api/cycles/${id}`, { method: "PATCH", body: JSON.stringify({ start_date, end_date, note }) });
      showToast("기록을 수정했어요");
    } else {
      await api("/api/cycles", { method: "POST", body: JSON.stringify({ start_date, end_date, note }) });
      showToast("기록을 추가했어요");
    }
    await loadAppData();
    await renderApp();
  } catch {
    showToast(id ? "수정 실패" : "추가 실패");
  }
}

async function handleDeleteLog(id) {
  if (!confirm("이 기록을 삭제할까요?")) return;
  try {
    await api(`/api/cycles/${id}`, { method: "DELETE" });
    await loadAppData();
    showToast("삭제했어요");
    await renderApp();
  } catch {
    showToast("삭제 실패");
  }
}

async function handleAddLoveLog(form) {
  const fd = new FormData(form);
  const note = fd.get("note") || null;
  try {
    await api("/api/love-logs", {
      method: "POST",
      body: JSON.stringify({ date: state.selectedDate, note }),
    });
    await loadAppData();
    showToast("사랑기록을 추가했어요");
    await renderApp();
  } catch {
    showToast("추가 실패");
  }
}

async function handleDeleteLoveLog(id) {
  if (!confirm("이 사랑기록을 삭제할까요?")) return;
  try {
    await api(`/api/love-logs/${id}`, { method: "DELETE" });
    await loadAppData();
    showToast("삭제했어요");
    await renderApp();
  } catch {
    showToast("삭제 실패");
  }
}

async function handleCreateInvite() {
  try {
    state.inviteResult = await api("/api/invite", { method: "POST" });
    await renderApp();
  } catch (err) {
    showToast((err.data && ERROR_MESSAGES[err.data.error]) || "초대 링크 생성 실패");
  }
}

function copyInviteUrl() {
  const input = document.getElementById("invite-url-input");
  if (!input) return;
  input.select();
  if (navigator.clipboard) navigator.clipboard.writeText(input.value);
  showToast("링크를 복사했어요");
}

async function handleLogout() {
  await api("/api/auth/logout", { method: "POST" });
  state.me = null;
  state.prediction = null;
  state.logs = [];
  state.inviteResult = null;
  renderLogin(null);
}

// ---------- Push notifications ----------
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js");
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function getPushStatus() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  if (isIOS() && !isStandalone()) return "needs-install";
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return sub ? "subscribed" : "not-subscribed";
  } catch {
    return "unsupported";
  }
}

async function subscribeToPush() {
  const reg = await registerServiceWorker();
  if (!reg) return;
  await navigator.serviceWorker.ready;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    showToast("알림 권한이 거부됐어요");
    return;
  }
  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(CONFIG.vapidPublicKey),
    });
    const subJson = sub.toJSON();
    await api("/api/push/subscribe", {
      method: "POST",
      body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
    });
    showToast("알림 설정 완료!");
    await renderApp();
  } catch {
    showToast("알림 설정 실패");
  }
}

async function handleUnsubscribePush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await api("/api/push/subscribe", { method: "DELETE", body: JSON.stringify({ endpoint }) });
    }
    showToast("알림을 껐어요");
    await renderApp();
  } catch {
    showToast("알림 끄기 실패");
  }
}

// ---------- Toast ----------
let toastTimer = null;

function showToast(message) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2000);
}

// ---------- Utils ----------
function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseYmd(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function diffDaysFromToday(dateStr) {
  return Math.round((parseYmd(dateStr) - parseYmd(ymd(new Date()))) / 86400000);
}

function formatRelativeDays(dateStr) {
  if (!dateStr) return "-";
  const diff = diffDaysFromToday(dateStr);
  if (diff === 0) return "오늘";
  return diff > 0 ? `${diff}일 뒤` : `${Math.abs(diff)}일 지남`;
}

function formatDot(dateStr) {
  if (!dateStr) return "-";
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}.${Number(d)}`;
}

function formatDotWithWeekday(dateStr) {
  if (!dateStr) return "-";
  return `${formatDot(dateStr)} (${WEEKDAYS[parseYmd(dateStr).getDay()]})`;
}

function formatShort(dateStr) {
  if (!dateStr) return "-";
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}월 ${Number(d)}일`;
}

function formatLong(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${Number(m)}월 ${Number(d)}일 ${WEEKDAYS[date.getDay()]}요일`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- Init ----------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

boot();
