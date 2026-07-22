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
  currentMonth: new Date(),
  editingLogId: null,
  inviteResult: null,
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
  const [prediction, cycles] = await Promise.all([api("/api/prediction"), api("/api/cycles")]);
  state.prediction = prediction;
  state.logs = cycles.logs;
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

// ---------- App screen ----------
async function renderApp() {
  const { user, partnerConnected, partner } = state.me;
  const isOwner = user.role === "owner";
  const pushStatus = await getPushStatus();

  appEl.innerHTML = `
    <div class="topbar">
      <div class="who">
        ${
          user.picture
            ? `<img class="avatar" src="${user.picture}" alt="">`
            : `<div class="avatar" style="background:var(--pink-light);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--pink)">${escapeHtml(
                (user.name || "?")[0]
              )}</div>`
        }
        <div>
          <div class="name">${escapeHtml(user.name || user.email)}</div>
          <span class="role-badge ${isOwner ? "" : "viewer"}">${isOwner ? "owner" : "viewer"}</span>
        </div>
      </div>
      <button class="icon-btn" data-action="logout">로그아웃</button>
    </div>

    ${renderIOSBanner()}
    ${renderPushSection(pushStatus)}
    ${isOwner ? renderInviteCard(partnerConnected) : renderPartnerCard(partner)}
    ${renderSummaryCard()}
    ${renderCalendarCard()}
    ${isOwner ? renderAddLogForm() : ""}
    ${renderLogListCard(isOwner)}
  `;
}

function renderIOSBanner() {
  if (!isIOS() || isStandalone()) return "";
  return `
    <div class="banner">
      <strong>📱 홈 화면에 추가해주세요</strong>
      아이폰에서 알림을 받으려면 사파리 하단 <b>공유 버튼</b> → <b>홈 화면에 추가</b>를 눌러 앱을 설치해야 해요. 설치 후 이 앱을 홈 화면 아이콘으로 다시 열어주세요.
    </div>
  `;
}

function renderPushSection(pushStatus) {
  if (pushStatus === "needs-install" || pushStatus === "unsupported") return "";
  if (pushStatus === "subscribed") {
    return `<div class="banner">🔔 알림이 켜져 있어요</div>`;
  }
  return `
    <div class="banner">
      <strong>🔔 알림을 받아보세요</strong>
      상대방이 기록을 업데이트하면 바로 알려드려요.
      <div style="margin-top:8px"><button class="btn" data-action="subscribe-push">알림 받기</button></div>
    </div>
  `;
}

function renderInviteCard(partnerConnected) {
  if (partnerConnected) return "";
  const result = state.inviteResult;
  return `
    <div class="card">
      <h2>💌 남자친구 초대하기</h2>
      ${
        result
          ? `
        <div class="invite-box">
          <div class="invite-url">
            <input id="invite-url-input" readonly value="${escapeHtml(result.url)}">
            <button class="btn secondary" data-action="copy-invite">복사</button>
          </div>
          <div style="font-size:12px;color:var(--text-muted)">코드: ${escapeHtml(result.code)} · 7일간 유효</div>
        </div>
      `
          : `<button class="btn" data-action="create-invite">초대 링크 만들기</button>`
      }
    </div>
  `;
}

function renderPartnerCard(partner) {
  if (partner) return "";
  return `<div class="card"><h2>아직 연결된 사용자가 없어요</h2></div>`;
}

function renderSummaryCard() {
  const p = state.prediction;
  if (!p || !p.hasData) {
    return `
      <div class="card">
        <h2>📊 예측 정보</h2>
        <p style="font-size:13px;color:var(--text-muted);margin:0">아직 기록이 없어요. 첫 생리 시작일을 기록하면 예측이 시작돼요.</p>
      </div>
    `;
  }
  return `
    <div class="card">
      <h2>📊 예측 정보</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="label">평균 생리주기</div>
          <div class="value">${p.avgCycleLength}일</div>
        </div>
        <div class="summary-item">
          <div class="label">평균 생리기간</div>
          <div class="value">${p.avgPeriodLength}일</div>
        </div>
        <div class="summary-item">
          <div class="label">마지막 생리일</div>
          <div class="value">${formatShort(p.lastStartDate)}</div>
        </div>
      </div>
    </div>
  `;
}

function renderCalendarCard() {
  const year = state.currentMonth.getFullYear();
  const month = state.currentMonth.getMonth();
  const cells = buildCalendarCells(year, month);

  return `
    <div class="card">
      <div class="calendar-header">
        <button data-action="prev-month" aria-label="이전 달">‹</button>
        <div class="month-label">${year}년 ${month + 1}월</div>
        <button data-action="next-month" aria-label="다음 달">›</button>
      </div>
      <div class="weekday-row">${WEEKDAYS.map((w) => `<div>${w}</div>`).join("")}</div>
      <div class="calendar-grid">${cells.map(renderDayCell).join("")}</div>
      <div class="legend">
        <span><i class="dot period"></i>생리 기록</span>
        <span><i class="dot predicted"></i>예상 생리</span>
        <span><i class="dot fertile"></i>가임기</span>
        <span><i class="dot ovulation"></i>배란 예상일</span>
      </div>
    </div>
  `;
}

function renderDayCell(cell) {
  if (!cell) return `<div class="day-cell empty"></div>`;
  const classes = ["day-cell"];
  if (cell.period) classes.push("period");
  if (cell.predicted) classes.push("predicted");
  if (cell.fertile) classes.push("fertile");
  if (cell.ovulation) classes.push("ovulation");
  if (cell.today) classes.push("today");
  return `<div class="${classes.join(" ")}"><span class="num">${cell.day}</span></div>`;
}

function buildCalendarCells(year, month) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const todayStr = ymd(new Date());

  const periodRanges = state.logs.map((l) => [l.start_date, l.end_date || l.start_date]);
  const p = state.prediction;

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = ymd(new Date(year, month, d));
    const inPeriod = periodRanges.some(([s, e]) => dateStr >= s && dateStr <= e);
    const inPredicted =
      p && p.hasData && p.nextPredictedStart && dateStr >= p.nextPredictedStart && dateStr <= p.predictedPeriodEnd;
    const inFertile =
      p && p.hasData && p.fertileWindowStart && dateStr >= p.fertileWindowStart && dateStr <= p.fertileWindowEnd;
    const isOvulation = p && p.hasData && dateStr === p.ovulationDate;

    cells.push({
      day: d,
      period: inPeriod,
      predicted: !inPeriod && inPredicted,
      fertile: inFertile,
      ovulation: isOvulation,
      today: dateStr === todayStr,
    });
  }
  return cells;
}

function renderAddLogForm() {
  return `
    <div class="card">
      <h2>✍️ 새 기록 추가</h2>
      <form id="add-log-form">
        <div class="form-row">
          <label>시작일</label>
          <input type="date" name="start_date" value="${ymd(new Date())}" required>
        </div>
        <div class="form-row">
          <label>종료일 (선택)</label>
          <input type="date" name="end_date">
        </div>
        <div class="form-row">
          <label>메모 (선택)</label>
          <input type="text" name="note" placeholder="컨디션, 복용 약물 등">
        </div>
        <button type="submit" class="btn block">기록 저장</button>
      </form>
    </div>
  `;
}

function renderLogListCard(isOwner) {
  if (state.logs.length === 0) {
    return `<div class="card"><h2>📋 기록</h2><div class="empty-state">아직 기록이 없어요</div></div>`;
  }
  const items = state.logs
    .map((log) => {
      if (isOwner && state.editingLogId === log.id) {
        return `
          <form id="edit-log-form" data-id="${log.id}">
            <div class="form-row">
              <label>시작일</label>
              <input type="date" name="start_date" value="${log.start_date}" required>
            </div>
            <div class="form-row">
              <label>종료일</label>
              <input type="date" name="end_date" value="${log.end_date || ""}">
            </div>
            <div class="form-row">
              <label>메모</label>
              <input type="text" name="note" value="${escapeHtml(log.note || "")}">
            </div>
            <div style="display:flex;gap:8px">
              <button type="submit" class="btn">저장</button>
              <button type="button" class="btn ghost" data-action="cancel-edit">취소</button>
            </div>
          </form>
        `;
      }
      return `
        <div class="log-item">
          <div>
            <div class="dates">${formatShort(log.start_date)} ${log.end_date ? "~ " + formatShort(log.end_date) : "(진행중)"}</div>
            ${log.note ? `<div class="note">${escapeHtml(log.note)}</div>` : ""}
          </div>
          ${
            isOwner
              ? `
            <div class="log-actions">
              ${!log.end_date ? `<button data-action="quick-end" data-id="${log.id}">오늘 종료</button>` : ""}
              <button data-action="edit-log" data-id="${log.id}">수정</button>
              <button class="delete" data-action="delete-log" data-id="${log.id}">삭제</button>
            </div>
          `
              : ""
          }
        </div>
      `;
    })
    .join("");

  return `<div class="card"><h2>📋 기록</h2>${items}</div>`;
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
  if (action === "edit-log") {
    state.editingLogId = btn.dataset.id;
    return renderApp();
  }
  if (action === "cancel-edit") {
    state.editingLogId = null;
    return renderApp();
  }
  if (action === "delete-log") return handleDeleteLog(btn.dataset.id);
  if (action === "quick-end") return handleQuickEnd(btn.dataset.id);
}

async function onAppSubmit(e) {
  const form = e.target.closest("form");
  if (!form) return;
  e.preventDefault();
  if (form.id === "add-log-form") return handleAddLog(form);
  if (form.id === "edit-log-form") return handleEditLog(form);
}

async function handleAddLog(form) {
  const fd = new FormData(form);
  const start_date = fd.get("start_date");
  const end_date = fd.get("end_date") || null;
  const note = fd.get("note") || null;
  if (!start_date) return;
  try {
    await api("/api/cycles", { method: "POST", body: JSON.stringify({ start_date, end_date, note }) });
    await loadAppData();
    showToast("기록을 추가했어요");
    await renderApp();
  } catch (err) {
    showToast("추가 실패");
  }
}

async function handleEditLog(form) {
  const id = form.dataset.id;
  const fd = new FormData(form);
  const start_date = fd.get("start_date");
  const end_date = fd.get("end_date") || null;
  const note = fd.get("note") || null;
  try {
    await api(`/api/cycles/${id}`, { method: "PATCH", body: JSON.stringify({ start_date, end_date, note }) });
    state.editingLogId = null;
    await loadAppData();
    showToast("기록을 수정했어요");
    await renderApp();
  } catch {
    showToast("수정 실패");
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

async function handleQuickEnd(id) {
  try {
    await api(`/api/cycles/${id}`, { method: "PATCH", body: JSON.stringify({ end_date: ymd(new Date()) }) });
    await loadAppData();
    await renderApp();
  } catch {
    showToast("업데이트 실패");
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

function formatShort(dateStr) {
  if (!dateStr) return "-";
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}월 ${Number(d)}일`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- Init ----------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

boot();
