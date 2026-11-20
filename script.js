/* =========================================================
   BLOOM — MAIN APPLICATION SCRIPT (script.js)
   Focus Tasks + Google Calendar Sync + Guidance Library + Bloom AI
   ========================================================= */

// 1. Google Calendar OAuth Configuration (Replace with your Web Client ID)
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
let googleAccessToken = null;

// 2. App State
const STORAGE_KEYS = {
  tasks: 'bloom_focus_tasks_v1',
  guidanceIndex: 'bloom_guidance_index_v1'
};

let tasks = loadTasks();
let currentTaskFilter = 'all';
let currentGuidanceIndex = loadGuidanceIndex();

// Sample Guidance Library Topics (Swap or extend with your Supabase / local media URLs)
const GUIDANCE_TOPICS = [
  {
    id: 'balance-routines',
    title: 'Balancing School, Work & Energy Without Burning Out',
    videoUrl: '',
    audioUrl: '',
    transcript:
      'When your schedule gets tight, energy matters more than squeezing in extra hours. Pick one priority focus block each day, protect your sleep window, and keep quick fallback steps ready on busy shift days.'
  },
  {
    id: 'deep-focus-blocks',
    title: 'How to Run Short Focus Sprints That Actually Stick',
    videoUrl: '',
    audioUrl: '',
    transcript:
      'Start with a clear task title and a realistic 25-to-45 minute timer. Put your phone out of reach, write down the very next physical action, and sync important study or project blocks onto your calendar.'
  },
  {
    id: 'steady-momentum',
    title: 'Building Momentum When Motivation Drops',
    videoUrl: '',
    audioUrl: '',
    transcript:
      'Momentum comes from low-friction starts, not waiting to feel hyped. Even ten minutes of clean progress moves a task forward and keeps you from letting small tasks pile up.'
  }
];

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.tasks);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
  } catch (err) {
    console.warn('Could not save tasks to localStorage:', err);
  }
}

function loadGuidanceIndex() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.guidanceIndex);
    const idx = Number(raw);
    return Number.isInteger(idx) && idx >= 0 && idx < GUIDANCE_TOPICS.length ? idx : 0;
  } catch {
    return 0;
  }
}

function saveGuidanceIndex(idx) {
  try {
    localStorage.setItem(STORAGE_KEYS.guidanceIndex, String(idx));
  } catch {
    // Ignore storage quota errors
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function updateGoogleStatus(text, tone = 'neutral') {
  const badge = document.getElementById('gcal-status-badge');
  if (!badge) return;

  badge.textContent = text;
  badge.className = 'text-xs px-2.5 py-1 rounded-full border transition ';

  if (tone === 'connected') {
    badge.className += 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200';
  } else if (tone === 'error') {
    badge.className += 'border-rose-400/40 bg-rose-500/15 text-rose-200';
  } else {
    badge.className += 'border-white/15 bg-slate-900/70 text-slate-300';
  }
}

/* =========================================================
   NAVIGATION / VIEW SWITCHER
   ========================================================= */
function setActiveSection(viewName) {
  const sections = {
    tasks: document.getElementById('section-tasks'),
    guidance: document.getElementById('section-guidance'),
    ai: document.getElementById('section-ai')
  };

  Object.entries(sections).forEach(([key, el]) => {
    if (!el) return;
    if (viewName === 'all' || viewName === key) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  const navMap = {
    all: document.getElementById('nav-all'),
    tasks: document.getElementById('nav-tasks'),
    guidance: document.getElementById('nav-guidance'),
    ai: document.getElementById('nav-ai')
  };

  Object.entries(navMap).forEach(([key, btn]) => {
    if (!btn) return;
    const active = key === viewName;
    btn.className = active
      ? 'px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border border-rose-400/40 bg-rose-500/20 text-white transition cursor-pointer'
      : 'px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-white/15 bg-white/5 hover:bg-white/15 text-slate-200 transition cursor-pointer';
  });
}

/* =========================================================
   FOCUS TASKS CRUD & RENDERING
   ========================================================= */
function handleTaskSubmit(event) {
  event.preventDefault();

  const titleEl = document.getElementById('task-title');
  const categoryEl = document.getElementById('task-category');
  const priorityEl = document.getElementById('task-priority');
  const durationEl = document.getElementById('task-duration');
  const timeEl = document.getElementById('task-scheduled-time');
  const autoSyncEl = document.getElementById('task-auto-gcal');

  const title = titleEl ? titleEl.value.trim() : '';
  if (!title) return;

  const newTask = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    category: categoryEl ? categoryEl.value : 'Focus',
    priority: priorityEl ? priorityEl.value : 'medium',
    duration: durationEl ? Math.max(5, Number(durationEl.value) || 45) : 45,
    scheduledTime: timeEl && timeEl.value ? timeEl.value : '',
    completed: false,
    syncedToCalendar: false
  };

  tasks.unshift(newTask);
  saveTasks();
  renderTasks();

  if (titleEl) {
    titleEl.value = '';
    titleEl.focus();
  }

  if (autoSyncEl && autoSyncEl.checked) {
    syncTaskToGoogleCalendar(newTask.id);
  }
}

function toggleTaskComplete(taskId) {
  tasks = tasks.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t));
  saveTasks();
  renderTasks();
}

function deleteTask(taskId) {
  tasks = tasks.filter(t => t.id !== taskId);
  saveTasks();
  renderTasks();
}

function setTaskFilter(filter) {
  currentTaskFilter = filter;
  renderTasks();
}

function clearCompletedTasks() {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks();
}

function getPriorityBadgeClasses(priority) {
  switch ((priority || '').toLowerCase()) {
    case 'high':
      return 'bg-rose-500/20 text-rose-200 border-rose-400/30';
    case 'low':
      return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30';
    default:
      return 'bg-amber-500/20 text-amber-200 border-amber-400/30';
  }
}

function renderTasks() {
  const listEl = document.getElementById('tasks-list');
  const countEl = document.getElementById('task-count-pill');
  if (!listEl) return;

  if (countEl) {
    countEl.textContent = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;
  }

  const filtered = tasks.filter(t => {
    if (currentTaskFilter === 'active') return !t.completed;
    if (currentTaskFilter === 'completed') return t.completed;
    return true;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="p-4 rounded-xl border border-dashed border-white/15 text-center text-sm text-slate-400">
        No tasks match this filter yet. Add a task above to use <strong>Sync to Google Calendar</strong>.
      </div>
    `;
    return;
  }

  listEl.innerHTML = filtered
    .map(task => {
      const safeId = escapeHtml(task.id);
      const safeTitle = escapeHtml(task.title);
      const safeCategory = escapeHtml(task.category || 'Focus');
      const safePriority = escapeHtml((task.priority || 'medium').toUpperCase());
      const durationMins = Number(task.duration) || 45;
      const timeLabel = task.scheduledTime
        ? new Date(task.scheduledTime).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })
        : 'Next open hour';

      return `
        <article class="p-4 rounded-xl bg-slate-950/55 border border-white/10 space-y-3 transition hover:border-white/20">
          <div class="flex items-start justify-between gap-3">
            <label class="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0">
              <input
                type="checkbox"
                ${task.completed ? 'checked' : ''}
                onchange="toggleTaskComplete('${safeId}')"
                class="mt-1 rounded border-white/25 text-rose-500 focus:ring-0 cursor-pointer"
              />
              <div class="min-w-0 flex-1">
                <div class="text-sm font-semibold break-words ${
                  task.completed ? 'line-through text-slate-400' : 'text-white'
                }">
                  ${safeTitle}
                </div>
                <div class="flex items-center gap-1.5 flex-wrap mt-1.5 text-xs">
                  <span class="px-2 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/10">
                    ${safeCategory}
                  </span>
                  <span class="px-2 py-0.5 rounded-md border ${getPriorityBadgeClasses(task.priority)}">
                    ${safePriority}
                  </span>
                  <span class="text-slate-400">${durationMins}m • ${escapeHtml(timeLabel)}</span>
                  ${
                    task.syncedToCalendar
                      ? '<span class="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-200 border border-sky-400/30">Synced</span>'
                      : ''
                  }
                </div>
              </div>
            </label>

            <button
              type="button"
              onclick="deleteTask('${safeId}')"
              class="text-xs text-slate-400 hover:text-rose-300 px-2 py-1 rounded-md hover:bg-white/5 transition cursor-pointer shrink-0"
              title="Delete task"
            >
              Delete
            </button>
          </div>

          <div class="flex items-center gap-2 flex-wrap pt-2.5 border-t border-white/10">
            <button
              type="button"
              onclick="syncTaskToGoogleCalendar('${safeId}')"
              class="bloom-lift px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-sky-500/25 to-indigo-500/25 hover:from-sky-500/35 hover:to-indigo-500/35 border border-sky-400/35 text-sky-100 transition cursor-pointer"
            >
              📅 Sync to Google Calendar
            </button>

            <button
              type="button"
              onclick="downloadTaskIcs('${safeId}')"
              class="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 transition cursor-pointer"
            >
              ⬇ Download .ics
            </button>
          </div>
        </article>
      `;
    })
    .join('');
}

/* =========================================================
   GOOGLE CALENDAR OAUTH 2.0 + REST API & .ICS FALLBACK
   ========================================================= */
function computeTaskWindow(task) {
  let start = task.scheduledTime ? new Date(task.scheduledTime) : new Date();
  if (!task.scheduledTime || Number.isNaN(start.getTime())) {
    start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
  }
  const durationMs = (Number(task.duration) || 45) * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);
  return { start, end };
}

function requestGoogleCalendarToken() {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith('YOUR_GOOGLE_OAUTH_CLIENT_ID')) {
      reject(new Error('Set your real GOOGLE_CLIENT_ID at the top of script.js first.'));
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services did not load yet. Check your connection or refresh.'));
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: CALENDAR_SCOPE,
      callback: (resp) => {
        if (resp.error) {
          reject(new Error(resp.error_description || resp.error));
          return;
        }
        googleAccessToken = resp.access_token;
        updateGoogleStatus('Calendar: Connected', 'connected');
        resolve(googleAccessToken);
      }
    });

    tokenClient.requestAccessToken({ prompt: googleAccessToken ? '' : 'consent' });
  });
}

async function syncTaskToGoogleCalendar(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  try {
    updateGoogleStatus('Calendar: Syncing...', 'neutral');
    const token = googleAccessToken || (await requestGoogleCalendarToken());
    const { start, end } = computeTaskWindow(task);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    const eventPayload = {
      summary: `Bloom Focus: ${task.title}`,
      description: `Category: ${task.category || 'Focus'} | Priority: ${(task.priority || 'medium').toUpperCase()} | Block: ${task.duration || 45} mins`,
      start: {
        dateTime: start.toISOString(),
        timeZone
      },
      end: {
        dateTime: end.toISOString(),
        timeZone
      }
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventPayload)
      }
    );

    if (response.status === 401) {
      googleAccessToken = null;
      return syncTaskToGoogleCalendar(taskId);
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `Google Calendar request failed (${response.status})`);
    }

    const created = await response.json();
    tasks = tasks.map(t => (t.id === taskId ? { ...t, syncedToCalendar: true } : t));
    saveTasks();
    renderTasks();
    updateGoogleStatus('Calendar: Synced', 'connected');

    appendBloomMessage(
      `Synced **${task.title}** to Google Calendar (${start.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })}).`
    );

    if (created.htmlLink) {
      window.open(created.htmlLink, '_blank', 'noopener,noreferrer');
    } else {
      alert(`Synced "${task.title}" to Google Calendar!`);
    }
  } catch (err) {
    console.error('Google Calendar sync error:', err);
    updateGoogleStatus('Calendar: Needs setup/auth', 'error');
    alert(`Could not sync to Google Calendar: ${err.message}`);
  }
}

function downloadTaskIcs(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const { start, end } = computeTaskWindow(task);
  const formatIcsUtc = date =>
    date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const sanitizeIcsText = text =>
    String(text || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bloom//Focus Tasks//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:bloom-${task.id}-${Date.now()}@bloom.app`,
    `DTSTAMP:${formatIcsUtc(new Date())}`,
    `DTSTART:${formatIcsUtc(start)}`,
    `DTEND:${formatIcsUtc(end)}`,
    `SUMMARY:${sanitizeIcsText(`Bloom Focus: ${task.title}`)}`,
    `DESCRIPTION:${sanitizeIcsText(
      `Category: ${task.category || 'Focus'} | Priority: ${(task.priority || 'medium').toUpperCase()}`
    )}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const slug =
    String(task.title || 'bloom-task')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'bloom-task';

  link.href = url;
  link.download = `${slug}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/* =========================================================
   GUIDANCE LIBRARY
   ========================================================= */
function populateGuidanceDropdown() {
  const selectEl = document.getElementById('guidance-topic-select');
  if (!selectEl) return;

  selectEl.innerHTML = GUIDANCE_TOPICS.map(
    (topic, index) => `<option value="${index}">${escapeHtml(topic.title)}</option>`
  ).join('');
  selectEl.value = String(currentGuidanceIndex);
}

function renderGuidanceTopic(index) {
  const clamped =
    Number.isInteger(index) && index >= 0 && index < GUIDANCE_TOPICS.length ? index : 0;
  currentGuidanceIndex = clamped;
  saveGuidanceIndex(clamped);

  const topic = GUIDANCE_TOPICS[clamped];
  const titleEl = document.getElementById('guidance-topic-title');
  const videoEl = document.getElementById('guidance-video');
  const audioEl = document.getElementById('guidance-audio');
  const transcriptEl = document.getElementById('guidance-transcript');
  const statusEl = document.getElementById('guidance-status');
  const selectEl = document.getElementById('guidance-topic-select');

  if (selectEl) selectEl.value = String(clamped);
  if (titleEl) titleEl.textContent = topic.title;
  if (transcriptEl) transcriptEl.textContent = topic.transcript || 'No transcript available.';

  if (videoEl) {
    if (topic.videoUrl) {
      videoEl.src = topic.videoUrl;
      videoEl.classList.remove('hidden');
    } else {
      videoEl.removeAttribute('src');
      videoEl.load();
    }
  }

  if (audioEl) {
    if (topic.audioUrl) {
      audioEl.src = topic.audioUrl;
    } else {
      audioEl.removeAttribute('src');
      audioEl.load();
    }
  }

  if (statusEl) {
    statusEl.textContent =
      topic.videoUrl || topic.audioUrl ? 'Media ready' : 'Transcript ready';
  }
}

function selectGuidanceTopic(value) {
  const idx = Number(value);
  renderGuidanceTopic(Number.isNaN(idx) ? 0 : idx);
}

function explainCurrentTranscriptWithBloomAI() {
  const topic = GUIDANCE_TOPICS[currentGuidanceIndex] || GUIDANCE_TOPICS[0];
  setActiveSection('all');
  appendBloomMessage(
    `Key takeaway for **${topic.title}**: ${topic.transcript}`
  );
}

/* =========================================================
   BLOOM AI CHAT PANEL
   ========================================================= */
function appendBloomMessage(text) {
  const logEl = document.getElementById('bloom-chat-log');
  if (!logEl) return;

  const bubble = document.createElement('div');
  bubble.className = 'bloom-chat-bubble-ai text-sm';
  bubble.innerHTML = escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  logEl.appendChild(bubble);
  logEl.scrollTop = logEl.scrollHeight;
}

function handleBloomChatSubmit(event) {
  event.preventDefault();
  const inputEl = document.getElementById('bloom-chat-input');
  if (!inputEl) return;

  const promptText = inputEl.value.trim();
  if (!promptText) return;

  appendBloomMessage(`You: ${promptText}`);
  inputEl.value = '';

  const openTasks = tasks.filter(t => !t.completed).length;
  appendBloomMessage(
    `Bloom AI: You currently have **${openTasks}** active focus ${
      openTasks === 1 ? 'task' : 'tasks'
    }. Pick one to tackle first and hit **Sync to Google Calendar** to lock in time for it.`
  );
}

/* =========================================================
   INITIALIZATION
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  setActiveSection('all');
  populateGuidanceDropdown();
  renderGuidanceTopic(currentGuidanceIndex);
  renderTasks();
});
