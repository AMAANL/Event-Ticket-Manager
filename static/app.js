const state = {
  authMode: "login",
  activeView: "create",
  token: localStorage.getItem("gatepass_token") || "",
  username: localStorage.getItem("gatepass_user") || "",
  events: [],
  tickets: [],
};

const els = {
  loginScreen: document.querySelector("#loginScreen"),
  appScreen: document.querySelector("#appScreen"),
  sessionLabel: document.querySelector("#sessionLabel"),
  logoutBtn: document.querySelector("#logoutBtn"),
  loginTab: document.querySelector("#loginTab"),
  registerTab: document.querySelector("#registerTab"),
  authForm: document.querySelector("#authForm"),
  authSubmit: document.querySelector("#authSubmit"),
  authMessage: document.querySelector("#authMessage"),
  username: document.querySelector("#username"),
  password: document.querySelector("#password"),
  taskTabs: document.querySelectorAll(".task-tab"),
  views: document.querySelectorAll(".view"),
  eventForm: document.querySelector("#eventForm"),
  eventName: document.querySelector("#eventName"),
  eventList: document.querySelector("#eventList"),
  renameEventForm: document.querySelector("#renameEventForm"),
  eventSelect: document.querySelector("#eventSelect"),
  selectedEventName: document.querySelector("#selectedEventName"),
  importForm: document.querySelector("#importForm"),
  attendeeFile: document.querySelector("#attendeeFile"),
  replaceExisting: document.querySelector("#replaceExisting"),
  importSubmit: document.querySelector("#importSubmit"),
  importResult: document.querySelector("#importResult"),
  fieldList: document.querySelector("#fieldList"),
  attendanceTable: document.querySelector("#attendanceTable"),
  downloadJsonBtn: document.querySelector("#downloadJsonBtn"),
  downloadAttendanceBtn: document.querySelector("#downloadAttendanceBtn"),
  scannerVideo: document.querySelector("#scannerVideo"),
  cameraPlaceholder: document.querySelector("#cameraPlaceholder"),
  startCameraBtn: document.querySelector("#startCameraBtn"),
  stopCameraBtn: document.querySelector("#stopCameraBtn"),
  scanForm: document.querySelector("#scanForm"),
  scanPayload: document.querySelector("#scanPayload"),
  scanResult: document.querySelector("#scanResult"),
};

let scannerStream = null;
let scannerActive = false;

function setAuthMode(mode) {
  state.authMode = mode;
  els.loginTab.classList.toggle("active", mode === "login");
  els.registerTab.classList.toggle("active", mode === "register");
  els.authSubmit.textContent = mode === "login" ? "Login" : "Register";
  setAuthMessage("");
}

function setActiveView(view) {
  state.activeView = view;
  for (const tab of els.taskTabs) {
    tab.classList.toggle("active", tab.dataset.view === view);
  }
  for (const panel of els.views) {
    panel.classList.toggle("active", panel.id === `${view}View`);
  }
}

function setSession(token, username) {
  state.token = token;
  state.username = username;
  localStorage.setItem("gatepass_token", token);
  localStorage.setItem("gatepass_user", username);
  renderSession();
}

function clearSession() {
  stopCamera();
  state.token = "";
  state.username = "";
  state.events = [];
  state.tickets = [];
  localStorage.removeItem("gatepass_token");
  localStorage.removeItem("gatepass_user");
  renderSession();
  renderEvents();
  renderImportResult(null);
  renderTicketList();
  setScanResult("Waiting for scan", "neutral");
}

function renderSession() {
  const signedIn = Boolean(state.token);
  els.loginScreen.classList.toggle("hidden", signedIn);
  els.appScreen.classList.toggle("hidden", !signedIn);
  els.sessionLabel.textContent = signedIn ? `Signed in as ${state.username}` : "Signed out";
  els.importSubmit.disabled = !signedIn || !state.events.length;
  els.downloadJsonBtn.disabled = !signedIn || !state.tickets.length;
  els.downloadAttendanceBtn.disabled = !signedIn || !state.tickets.length;
}

function selectedEvent() {
  return state.events.find((event) => String(event.id) === String(els.eventSelect.value));
}

function summarizeAttendee(attendeeData = {}) {
  const entries = Object.entries(attendeeData).filter(([, value]) => String(value).trim());
  if (!entries.length) return "No attendee data";
  return entries.map(([key, value]) => `${key}: ${value}`).join(" | ");
}

function attendanceFields() {
  const event = selectedEvent();
  const schema = event?.field_schema || [];
  const extraFields = [];

  for (const ticket of state.tickets) {
    for (const key of Object.keys(ticket.attendee_data || {})) {
      if (!schema.includes(key) && !extraFields.includes(key)) {
        extraFields.push(key);
      }
    }
  }

  return [...schema, ...extraFields];
}

function renderEvents() {
  els.eventSelect.innerHTML = "";
  els.eventList.innerHTML = "";

  if (!state.events.length) {
    const option = document.createElement("option");
    option.textContent = "No events yet";
    option.value = "";
    els.eventSelect.append(option);

    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Create your first event to start importing attendees.";
    els.eventList.append(empty);
  } else {
    for (const event of state.events) {
      const option = document.createElement("option");
      option.value = event.id;
      option.textContent = `${event.name} (#${event.id})`;
      els.eventSelect.append(option);

      const row = document.createElement("button");
      row.className = "event-row";
      row.type = "button";
      row.textContent = `${event.name} | ${event.field_schema?.length || 0} fields`;
      row.addEventListener("click", () => {
        els.eventSelect.value = event.id;
        syncSelectedEvent();
        setActiveView("update");
      });
      els.eventList.append(row);
    }
  }

  syncSelectedEvent();
  renderSession();
}

function syncSelectedEvent() {
  const event = selectedEvent();
  els.selectedEventName.value = event?.name || "";
  renderFields(event?.field_schema || []);
  loadTickets().catch(() => {
    state.tickets = [];
    renderTicketList();
  });
}

function renderFields(fields = []) {
  els.fieldList.innerHTML = "";

  for (const field of fields) {
    const chip = document.createElement("span");
    chip.className = "field-chip";
    chip.textContent = field;
    els.fieldList.append(chip);
  }
}

function renderTicketList() {
  els.attendanceTable.innerHTML = "";

  if (!state.tickets.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No attendees imported for this event yet.";
    els.attendanceTable.append(empty);
    renderSession();
    return;
  }

  const fields = attendanceFields();
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  const headerRow = document.createElement("tr");

  for (const heading of ["Status", "Ticket ID", ...fields]) {
    const th = document.createElement("th");
    th.textContent = heading;
    headerRow.append(th);
  }
  thead.append(headerRow);

  for (const ticket of state.tickets) {
    const row = document.createElement("tr");
    const status = document.createElement("td");
    const id = document.createElement("td");

    status.innerHTML = ticket.used
      ? '<span class="status-pill present">Present</span>'
      : '<span class="status-pill pending">Not scanned</span>';
    id.textContent = ticket.ticket_id;
    row.append(status, id);

    for (const field of fields) {
      const cell = document.createElement("td");
      cell.textContent = ticket.attendee_data?.[field] ?? "";
      row.append(cell);
    }
    tbody.append(row);
  }

  table.append(thead, tbody);
  els.attendanceTable.append(table);
  renderSession();
}

function renderImportResult(result) {
  if (!result) {
    els.importResult.textContent = "No attendee file imported.";
    els.importResult.className = "import-result neutral";
    return;
  }

  els.importResult.textContent = `Generated ${result.imported} individual QR JSON payloads. Download the full JSON list before sharing tickets.`;
  els.importResult.className = "import-result ok";
  renderFields(result.fields);
}

function setScanResult(message, kind = "neutral") {
  els.scanResult.textContent = message;
  els.scanResult.className = `scan-result ${kind}`;
}

function setAuthMessage(message, kind = "neutral") {
  els.authMessage.textContent = message;
  els.authMessage.className = `form-message ${kind}`;
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, { ...options, headers });
  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(data?.detail || "Request failed");
  }
  return data;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return {
      detail: response.ok ? text : `${response.status} ${response.statusText}: ${text}`,
    };
  }
}

async function apiForm(path, formData) {
  const headers = {};
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, {
    method: "POST",
    headers,
    body: formData,
  });
  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(data?.detail || "Request failed");
  }
  return data;
}

async function loadEvents() {
  if (!state.token) {
    renderEvents();
    return;
  }
  state.events = await api("/events");
  renderEvents();
}

async function loadTickets() {
  const event = selectedEvent();
  if (!state.token || !event) {
    state.tickets = [];
    renderTicketList();
    return;
  }
  state.tickets = await api(`/event/${event.id}/tickets`);
  renderTicketList();
}

async function validatePayload(payload) {
  const result = typeof payload === "string"
    ? await api(`/scan/${encodeURIComponent(payload)}`, { method: "POST", body: "{}" })
    : await api("/scan", {
        method: "POST",
        body: JSON.stringify(payload),
      });
  const kind = result.status === "PRESENT MARKED" ? "ok" : "warn";
  setScanResult(`${result.status}\n${summarizeAttendee(result.attendee_data)}`, kind);
  await loadTickets();
}

function parseScanText(text) {
  const value = text.trim();
  if (!value) {
    throw new Error("QR payload is empty");
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function eventDownloadName(suffix, extension) {
  const event = selectedEvent();
  const baseName = event?.name || "event";
  return `${baseName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${suffix}.${extension}`;
}

function downloadBlob(content, type, filename) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadQrJson() {
  if (!state.tickets.length) return;

  const event = selectedEvent();
  const payload = {
    event_id: event.id,
    event_name: event.name,
    generated_at: new Date().toISOString(),
    tickets: state.tickets.map((ticket) => ({
      ticket_id: ticket.ticket_id,
      attendee_data: ticket.attendee_data,
      qr_json: ticket.qr_json,
      qr_image: ticket.qr_path,
      present: ticket.used,
    })),
  };

  downloadBlob(
    JSON.stringify(payload, null, 2),
    "application/json",
    eventDownloadName("qr-list", "json"),
  );
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function downloadAttendanceCsv() {
  if (!state.tickets.length) return;

  const fields = attendanceFields();
  const headers = ["Status", "Ticket ID", ...fields];
  const rows = state.tickets.map((ticket) => [
    ticket.used ? "Present" : "Not scanned",
    ticket.ticket_id,
    ...fields.map((field) => ticket.attendee_data?.[field] ?? ""),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  downloadBlob(
    csv,
    "text/csv",
    eventDownloadName("attendance-report", "csv"),
  );
}

function stopCamera() {
  scannerActive = false;
  if (scannerStream) {
    for (const track of scannerStream.getTracks()) {
      track.stop();
    }
  }
  scannerStream = null;
  els.scannerVideo.srcObject = null;
  els.scannerVideo.classList.add("hidden");
  els.cameraPlaceholder.classList.remove("hidden");
  els.startCameraBtn.disabled = false;
  els.stopCameraBtn.classList.add("hidden");
}

async function startCamera() {
  if (!("BarcodeDetector" in window)) {
    setScanResult("Camera QR scanning is not supported in this browser. Paste the QR JSON instead.", "warn");
    return;
  }

  try {
    const detector = new BarcodeDetector({ formats: ["qr_code"] });
    scannerStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });

    els.scannerVideo.srcObject = scannerStream;
    els.scannerVideo.classList.remove("hidden");
    els.cameraPlaceholder.classList.add("hidden");
    els.startCameraBtn.disabled = true;
    els.stopCameraBtn.classList.remove("hidden");
    scannerActive = true;
    await els.scannerVideo.play();
    setScanResult("Scanning for QR code", "neutral");

    const scanFrame = async () => {
      if (!scannerActive) return;
      try {
        const codes = await detector.detect(els.scannerVideo);
        if (codes.length) {
          const raw = codes[0].rawValue;
          els.scanPayload.value = raw;
          await validatePayload(parseScanText(raw));
          stopCamera();
          return;
        }
      } catch (error) {
        setScanResult(error.message, "bad");
      }
      requestAnimationFrame(scanFrame);
    };

    requestAnimationFrame(scanFrame);
  } catch (error) {
    stopCamera();
    setScanResult(error.message, "bad");
  }
}

els.loginTab.addEventListener("click", () => setAuthMode("login"));
els.registerTab.addEventListener("click", () => setAuthMode("register"));
els.logoutBtn.addEventListener("click", clearSession);
els.eventSelect.addEventListener("change", syncSelectedEvent);
els.downloadJsonBtn.addEventListener("click", downloadQrJson);
els.downloadAttendanceBtn.addEventListener("click", downloadAttendanceCsv);
els.startCameraBtn.addEventListener("click", startCamera);
els.stopCameraBtn.addEventListener("click", stopCamera);

for (const tab of els.taskTabs) {
  tab.addEventListener("click", () => setActiveView(tab.dataset.view));
}

els.authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = els.username.value.trim();
  const password = els.password.value;

  try {
    if (state.authMode === "register") {
      await api("/register", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setAuthMessage("Registered. Logging you in now.", "ok");
      setAuthMode("login");
    }

    const login = await api("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setSession(login.access_token, username);
    await loadEvents();
    setActiveView("create");
  } catch (error) {
    if (state.authMode === "register" && error.message === "User exists") {
      setAuthMode("login");
      setAuthMessage("That username already exists. Use Login with the same username and password.", "bad");
    } else {
      setAuthMessage(error.message, "bad");
    }
  }
});

els.eventForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = els.eventName.value.trim();
  if (!name) return;

  try {
    const created = await api("/event", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    els.eventName.value = "";
    state.events.unshift(created);
    renderEvents();
    els.eventSelect.value = created.id;
    syncSelectedEvent();
    setActiveView("update");
  } catch (error) {
    alert(error.message);
  }
});

els.renameEventForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const current = selectedEvent();
  const name = els.selectedEventName.value.trim();
  if (!current || !name) return;

  try {
    const updated = await api(`/event/${current.id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
    state.events = state.events.map((eventRecord) => (
      eventRecord.id === updated.id ? updated : eventRecord
    ));
    renderEvents();
    els.eventSelect.value = updated.id;
    syncSelectedEvent();
  } catch (error) {
    alert(error.message);
  }
});

els.importForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const current = selectedEvent();
  const file = els.attendeeFile.files[0];
  if (!current || !file) return;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("replace_existing", els.replaceExisting.checked ? "true" : "false");

  try {
    els.importSubmit.disabled = true;
    els.importSubmit.textContent = "Generating...";
    const result = await apiForm(`/event/${current.id}/import`, formData);
    current.field_schema = result.fields;
    renderImportResult(result);
    els.attendeeFile.value = "";
    await loadTickets();
  } catch (error) {
    alert(error.message);
  } finally {
    els.importSubmit.textContent = "Import & Generate QR JSON";
    renderSession();
  }
});

els.scanForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await validatePayload(parseScanText(els.scanPayload.value));
  } catch (error) {
    setScanResult(error.message, "bad");
  }
});

setAuthMode("login");
setActiveView("create");
renderSession();
if (state.token) {
  loadEvents().catch(() => clearSession());
}
