// BLOOM APPLICATION SCRIPT (2026 EDITION)

const SUPABASE_URL = 'https://xmqmrkqyjnbupyalhnib.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7AqK322TINFq1y39lMgvTw_Z7Itc79G';

// Replace with your real Google Cloud Web Client ID when ready
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
let googleAccessToken = null;

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

if (window.mermaid) {
    mermaid.initialize({ startOnLoad: false, theme: 'dark' });
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeJsSingleQuote(str) {
    return String(str ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

let tasks = [];
let currentFilter = 'all';
let isSignUpMode = false;
let activeChatSessionId = null;
let chatSessions = [];
let attachedFiles = [];
let activeGuideTopic = null;
let focusAudio = null;
let isMusicPlaying = false;
let quoteIndex = 0;

const GUIDE_STORAGE_BUCKET = 'guidance_media';

const quotes = [
    { text: '"It’s not about having time, it’s about making time."', source: 'Captain America (Avengers: Endgame)' },
    { text: '"The magic you’re looking for is in the work you’re avoiding."', source: 'Modern Mindset Quote' },
    { text: '"You are stronger than you know, and your story is far from over."', source: 'Spider-Man: Into the Spider-Verse' },
    { text: '"Do or do not. There is no try."', source: 'Yoda (Star Wars)' },
    { text: '"Your focus determines your reality."', source: 'Qui-Gon Jinn (Star Wars)' },
    { text: '"Small steps every single day accumulate into massive life changes."', source: 'Bloom Philosophy' }
];

function rotateQuotes() {
    const quoteEl = document.getElementById('inspirational-quote');
    const sourceEl = document.getElementById('quote-source');
    if (!quoteEl || !sourceEl) return;

    quoteEl.style.opacity = '0';
    setTimeout(() => {
        quoteIndex = (quoteIndex + 1) % quotes.length;
        quoteEl.innerText = quotes[quoteIndex].text;
        sourceEl.innerText = `— ${quotes[quoteIndex].source}`;
        quoteEl.style.opacity = '1';
    }, 400);
}

setInterval(rotateQuotes, 30000);

function switchTab(tabId) {
    const tabs = ['auth', 'home', 'tasks', 'learn', 'guide-detail', 'chat'];
    tabs.forEach(t => {
        const view = document.getElementById(`view-${t}`);
        const navBtn = document.getElementById(`nav-${t}`);
        const mnavBtn = document.getElementById(`mnav-${t}`);

        if (view) view.classList.add('hidden');
        if (navBtn) {
            navBtn.classList.remove('bg-white/15', 'text-white');
            navBtn.classList.add('text-slate-400');
        }
        if (mnavBtn) {
            mnavBtn.classList.remove('text-rose-400');
            mnavBtn.classList.add('text-slate-400');
        }
    });

    const activeView = document.getElementById(`view-${tabId}`);
    const activeNav = document.getElementById(`nav-${tabId}`);
    const activeMNav = document.getElementById(`mnav-${tabId}`);
    const mainEl = document.getElementById('main-content');

    if (activeView) activeView.classList.remove('hidden');
    if (mainEl) mainEl.classList.toggle('bloom-chat-active', tabId === 'chat');
    if (activeNav) {
        activeNav.classList.add('bg-white/15', 'text-white');
        activeNav.classList.remove('text-slate-400');
    }
    if (activeMNav) {
        activeMNav.classList.add('text-rose-400');
        activeMNav.classList.remove('text-slate-400');
    }

    if (tabId === 'tasks') fetchTasks();
    if (tabId === 'learn') switchCategory('career');
    if (tabId === 'chat') loadChatSessions();

    if (window.lucide) lucide.createIcons();
}

// --- TASKS ---
async function fetchTasks() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const container = document.getElementById('tasks-container');

    if (!session) {
        tasks = [];
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12 bg-slate-900/30 rounded-2xl border border-white/5 space-y-3 bloom-subtle-card">
                    <p class="text-slate-400 text-sm">Please log in to view and manage your personal tasks.</p>
                    <button type="button" onclick="switchTab('auth')" class="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition-colors">
                        Log In Now
                    </button>
                </div>
            `;
        }
        const progressBar = document.getElementById('task-progress-bar');
        const progressText = document.getElementById('task-progress-text');
        if (progressBar) progressBar.style.width = '0%';
        if (progressText) progressText.innerText = '0%';
        return;
    }

    const { data, error } = await supabaseClient
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tasks:', error);
        return;
    }
    tasks = data || [];
    renderTasks();
}

async function handleAddTask(e) {
    if (e && e.preventDefault) e.preventDefault();

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert('You must be logged in to create tasks.');
        switchTab('auth');
        return;
    }

    const titleInput = document.getElementById('task-title');
    const priorityInput = document.getElementById('task-priority');
    const categoryInput = document.getElementById('task-category');
    if (!titleInput || !priorityInput || !categoryInput) return;

    const cleanTitle = titleInput.value.trim();
    if (!cleanTitle) return;

    const { error } = await supabaseClient
        .from('tasks')
        .insert([{
            title: cleanTitle,
            priority: priorityInput.value,
            category: categoryInput.value,
            completed: false,
            user_id: session.user.id
        }]);

    if (error) {
        alert('Failed to save task: ' + error.message);
        return;
    }

    titleInput.value = '';
    fetchTasks();
}

async function toggleTask(id) {
    const taskToToggle = tasks.find(t => String(t.id) === String(id));
    if (!taskToToggle) return;

    const { error } = await supabaseClient
        .from('tasks')
        .update({ completed: !taskToToggle.completed })
        .eq('id', id);

    if (!error) fetchTasks();
}

async function deleteTask(id) {
    const { error } = await supabaseClient
        .from('tasks')
        .delete()
        .eq('id', id);

    if (!error) fetchTasks();
}

function filterTasks(priority) {
    currentFilter = priority;
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('bg-rose-500/20', 'border-rose-500', 'text-rose-300');
        b.classList.add('bg-slate-900', 'border-white/10', 'text-slate-400');
    });

    const activeBtn = document.getElementById(`filter-${priority}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-rose-500/20', 'border-rose-500', 'text-rose-300');
        activeBtn.classList.remove('bg-slate-900', 'text-slate-400');
    }

    renderTasks();
}

// --- GOOGLE CALENDAR SYNC ---
function getDefaultEventWindow() {
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    return { start, end };
}

function buildGoogleCalendarWebUrl(task, start, end) {
    const fmt = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `Bloom Focus: ${task.title}`,
        details: `Category: ${task.category || 'Personal'} | Priority: ${(task.priority || 'medium').toUpperCase()}`,
        dates: `${fmt(start)}/${fmt(end)}`
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function requestGoogleCalendarToken() {
    return new Promise((resolve, reject) => {
        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith('YOUR_GOOGLE_OAUTH_CLIENT_ID')) {
            reject(new Error('OAuth Client ID not configured'));
            return;
        }
        if (!window.google?.accounts?.oauth2) {
            reject(new Error('Google Identity Services not loaded'));
            return;
        }

        const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: GOOGLE_CALENDAR_SCOPE,
            callback: (resp) => {
                if (resp.error) {
                    reject(new Error(resp.error_description || resp.error));
                    return;
                }
                googleAccessToken = resp.access_token;
                resolve(googleAccessToken);
            }
        });

        tokenClient.requestAccessToken({ prompt: googleAccessToken ? '' : 'consent' });
    });
}

async function syncTaskToGoogleCalendar(id) {
    const task = tasks.find(t => String(t.id) === String(id));
    if (!task) return;

    const statusEl = document.getElementById(`gcal-status-${id}`);
    const { start, end } = getDefaultEventWindow();
    const webCalUrl = buildGoogleCalendarWebUrl(task, start, end);

    try {
        if (statusEl) {
            statusEl.innerHTML = `<span class="text-[11px] text-sky-300 animate-pulse">Syncing with Google Calendar...</span>`;
        }

        const token = googleAccessToken || (await requestGoogleCalendarToken());
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

        const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    summary: `Bloom Focus: ${task.title}`,
                    description: `Category: ${task.category || 'Personal'} | Priority: ${(task.priority || 'medium').toUpperCase()}`,
                    start: { dateTime: start.toISOString(), timeZone },
                    end: { dateTime: end.toISOString(), timeZone }
                })
            }
        );

        if (response.status === 401) {
            googleAccessToken = null;
            return syncTaskToGoogleCalendar(id);
        }

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }

        const created = await response.json();
        if (statusEl) {
            statusEl.innerHTML = `
                <div class="flex items-center justify-between gap-2 text-[11px] text-emerald-300 mt-1.5">
                    <span>Synced to Google Calendar (${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })})</span>
                    ${created.htmlLink ? `<a href="${escapeHtml(created.htmlLink)}" target="_blank" rel="noopener noreferrer" class="underline">Open Event</a>` : ''}
                </div>
            `;
        }
    } catch (_err) {
        window.open(webCalUrl, '_blank', 'noopener,noreferrer');
        if (statusEl) {
            statusEl.innerHTML = `
                <div class="flex items-center justify-between gap-2 text-[11px] text-sky-300 mt-1.5">
                    <span>Opened Google Calendar event draft</span>
                    <a href="${escapeHtml(webCalUrl)}" target="_blank" rel="noopener noreferrer" class="underline">Open Again</a>
                </div>
            `;
        }
    }
}

function askBloomForTaskHelp(taskTitle, stepsElementId) {
    const stepsBox = document.getElementById(stepsElementId);
    const stepsText = stepsBox ? stepsBox.innerText.trim() : '';
    const prompt = stepsText
        ? `I'm working on "${taskTitle}" and generated these steps:\n${stepsText}\n\nCan you give me more help, practical tips, or help me start step 1?`
        : `Can you help me break down and get started on "${taskTitle}"?`;

    switchTab('chat');
    const input = document.getElementById('chat-input');
    if (input) {
        input.value = prompt;
        input.focus();
    }
}

async function fetchAiMicroSteps(taskTitle, elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;

    container.innerHTML = `<p class="text-xs text-teal-400 animate-pulse mt-2 flex items-center gap-1.5"><i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Generating BloomAI Micro-Steps...</p>`;
    if (window.lucide) lucide.createIcons();

    const prompt = `Break down this task into 3 short, actionable, youth-friendly micro-steps to reduce overwhelm: "${taskTitle}". Return only the 3 numbered steps (1., 2., 3.) as plain text lines without markdown bolding or stray brackets.`;

    try {
        const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', {
            body: { prompt }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));

        const rawSteps = data?.candidates?.[0]?.content?.parts?.[0]?.text
            || data?.reply
            || '1. Review task details and requirements.\n2. Break it into smaller 10-minute blocks.\n3. Complete the very first small action.';
        const stepsText = cleanModelMarkdown(rawSteps);
        const escapedTitle = escapeJsSingleQuote(taskTitle);

        container.innerHTML = `
            <div class="mt-3 p-3.5 rounded-xl bg-slate-950/90 border border-teal-500/30 text-xs space-y-2 shadow-inner">
                <div class="flex items-center justify-between flex-wrap gap-2">
                    <div class="flex items-center gap-2">
                        <span class="text-teal-400 font-bold flex items-center gap-1">
                            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                            BloomAI Micro-Steps (Do just the first 1):
                        </span>
                        <span class="text-[10px] font-semibold bg-teal-500/15 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">Bloom AI</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <button type="button" onclick="askBloomForTaskHelp('${escapedTitle}', '${elementId}')" class="text-[11px] text-rose-300 hover:text-rose-200 font-semibold flex items-center gap-1 transition-colors">
                            <i data-lucide="bot" class="w-3 h-3"></i>
                            <span>Ask Bloom AI for more help</span>
                        </button>
                        <button type="button" onclick="fetchAiMicroSteps('${escapedTitle}', '${elementId}')" class="text-[11px] text-slate-400 hover:text-teal-300 flex items-center gap-1 transition-colors">
                            <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                            <span>Regenerate with AI</span>
                        </button>
                    </div>
                </div>
                <div class="text-slate-200 leading-relaxed whitespace-pre-line">${escapeHtml(stepsText)}</div>
            </div>
        `;
    } catch (err) {
        const escapedTitle = escapeJsSingleQuote(taskTitle);
        container.innerHTML = `
            <div class="mt-2 flex items-center justify-between text-xs text-rose-400">
                <span>AI Error: ${escapeHtml(err.message)}</span>
                <button type="button" onclick="fetchAiMicroSteps('${escapedTitle}', '${elementId}')" class="underline hover:text-rose-300">Retry</button>
            </div>
        `;
    }
    if (window.lucide) lucide.createIcons();
}

function renderTasks() {
    const container = document.getElementById('tasks-container');
    if (!container) return;

    const filtered = currentFilter === 'all'
        ? tasks
        : tasks.filter(t => t.priority === currentFilter);

    const completedCount = tasks.filter(t => t.completed).length;
    const progressPct = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

    const progressBar = document.getElementById('task-progress-bar');
    const progressText = document.getElementById('task-progress-text');
    if (progressBar) progressBar.style.width = `${progressPct}%`;
    if (progressText) progressText.innerText = `${progressPct}%`;

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 bg-slate-900/30 rounded-2xl border border-white/5 bloom-subtle-card">
                <p class="text-slate-400 text-sm">No tasks found. Relax or add a new goal!</p>
            </div>
        `;
        return;
    }

    const priorityBadges = {
        high: '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">HIGH</span>',
        medium: '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">MEDIUM</span>',
        low: '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">LOW</span>'
    };

    container.innerHTML = filtered.map(t => {
        const escapedTitle = escapeJsSingleQuote(t.title);
        const escapedId = escapeJsSingleQuote(String(t.id));
        return `
        <div class="p-4 rounded-2xl bg-slate-900/80 border ${t.completed ? 'border-slate-800 opacity-60' : 'border-white/10'} transition-all hover:border-white/20 bloom-subtle-card">
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center space-x-3 min-w-0">
                    <button type="button" onclick="toggleTask('${escapedId}')" class="p-1 rounded-lg shrink-0 ${t.completed ? 'bg-rose-500 text-white' : 'border border-slate-600 hover:border-rose-400'}">
                        <i data-lucide="${t.completed ? 'check-square' : 'square'}" class="w-5 h-5"></i>
                    </button>
                    <div class="min-w-0">
                        <p class="text-sm font-semibold text-white truncate ${t.completed ? 'line-through text-slate-500' : ''}">${escapeHtml(t.title)}</p>
                        <span class="text-xs text-slate-400">${escapeHtml(t.category)}</span>
                    </div>
                </div>
                <div class="flex items-center space-x-2 shrink-0">
                    <button type="button" onclick="syncTaskToGoogleCalendar('${escapedId}')" class="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-200 text-[11px] font-semibold flex items-center gap-1 transition-colors" title="Sync to Google Calendar">
                        <i data-lucide="calendar-plus" class="w-3.5 h-3.5"></i>
                        <span>Sync to Calendar</span>
                    </button>
                    ${priorityBadges[t.priority] || priorityBadges.medium}
                    <button type="button" onclick="deleteTask('${escapedId}')" class="text-slate-500 hover:text-red-400 p-1">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div id="gcal-status-${t.id}"></div>
            <div id="ai-steps-${t.id}" class="mt-2 pt-2 border-t border-white/5">
                <button type="button" onclick="fetchAiMicroSteps('${escapedTitle}', 'ai-steps-${t.id}')" class="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1.5 transition-colors">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                    <span>Generate BloomAI Micro-Steps</span>
                </button>
            </div>
        </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// --- GUIDANCE LIBRARY ---
const learningData = {
    career: [
        {
            id: 'balancing-high-school-late-night-shifts',
            title: 'Balancing High School & Late Night Shifts',
            desc: 'Practical strategies to communicate with managers about homework deadlines, protect sleep, and avoid shift burnout.',
            type: 'Article + Video + Podcast • 4 min read',
            videoPath: 'videos/balancing-high-school-late-night-shifts.mp4.mp4',
            podcastPath: 'https://xmqmrkqyjnbupyalhnib.supabase.co/storage/v1/object/public/guidance_media/podcasts/balancing-high-school-late-night-shifts.m4a.m4a',
            transcriptPath: 'videos/Studying With a Job_Transcript.txt',
            bloomPrompt: 'Walk me through "Balancing High School & Late Night Shifts" in a warm, conversational way.'
        },
        {
            id: 'resume-zero-experience',
            title: 'Building a Resume with Zero Prior Experience',
            desc: 'How to frame coursework, self-taught tech projects, and resilience into top job applications.',
            type: 'Guide • 6 min read',
            transcriptText: 'Guide notes on turning projects, schoolwork, and consistency into strong resume bullet points.',
            bloomPrompt: 'Help me turn my real projects, schoolwork, and everyday experience into strong resume bullet points.'
        }
    ],
    emotional: [
        {
            id: 'adult-counselors-disconnect',
            title: 'Why Adult Counselors Feel Disconnected & What To Do',
            desc: 'Understanding generational advice gaps and taking ownership of your self-care journey.',
            type: 'Perspective • 5 min read',
            transcriptText: 'Perspective guide on finding support that actually fits where you are right now.',
            bloomPrompt: 'Talk through how to get practical support and stay grounded when advice feels disconnected.'
        },
        {
            id: 'late-night-overthinking',
            title: 'Overcoming Late-Night Overthinking',
            desc: 'Actionable cognitive exercises when anxiety keeps you up past 2:00 AM.',
            type: 'Mental Health • 3 min read',
            transcriptText: 'Simple wind-down steps to quiet racing thoughts late at night.',
            bloomPrompt: 'Help me wind down racing thoughts late at night with calm, practical steps.'
        }
    ],
    personal: [
        {
            id: 'five-minute-rule',
            title: 'The 5-Minute Rule Against Procrastination',
            desc: 'Trick your brain into starting tasks without feeling overwhelmed by big projects.',
            type: 'Habit Builder • 3 min read',
            transcriptText: 'Start with just five minutes of low-pressure action to build momentum.',
            bloomPrompt: 'Help me use the 5-minute rule to get started on something I have been putting off.'
        }
    ],
    destress: [
        {
            id: 'breathing-478',
            title: '4-7-8 Breathing Technique',
            desc: 'Inhale for 4s, hold for 7s, exhale for 8s to instantly lower heart rate.',
            type: 'Interactive Exercise',
            transcriptText: 'Inhale quietly through your nose for 4 seconds, hold for 7 seconds, and exhale completely for 8 seconds.',
            bloomPrompt: 'Guide me through a calm 4-7-8 breathing reset and help me decompress.'
        }
    ]
};

function getSupabasePublicFileUrl(filePath) {
    if (!filePath) return '';
    if (/^https?:\/\//i.test(filePath)) return filePath;
    const { data } = supabaseClient.storage.from(GUIDE_STORAGE_BUCKET).getPublicUrl(filePath);
    return data?.publicUrl || '';
}

function switchCategory(cat) {
    document.querySelectorAll('.cat-btn').forEach(b => {
        b.classList.remove('bg-rose-500', 'text-white');
        b.classList.add('bg-slate-900', 'text-slate-400');
    });

    const activeCatBtn = document.getElementById(`cat-${cat}`);
    if (activeCatBtn) {
        activeCatBtn.classList.add('bg-rose-500', 'text-white');
        activeCatBtn.classList.remove('bg-slate-900', 'text-slate-400');
    }

    const container = document.getElementById('learning-content');
    if (!container) return;

    const items = learningData[cat] || [];
    container.innerHTML = items.map(item => `
        <div class="p-6 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-rose-500/40 transition-all flex flex-col justify-between bloom-subtle-card">
            <div>
                <span class="text-xs font-bold text-rose-400 uppercase tracking-wider">${escapeHtml(item.type)}</span>
                <h3 class="text-lg font-bold text-white mt-2 mb-2">${escapeHtml(item.title)}</h3>
                <p class="text-slate-400 text-sm leading-relaxed mb-4">${escapeHtml(item.desc)}</p>
            </div>
            <button type="button" onclick="openGuideTopic('${escapeJsSingleQuote(cat)}', '${escapeJsSingleQuote(item.id)}')" class="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-colors">
                Open Topic Guide
            </button>
        </div>
    `).join('');
}

async function openGuideTopic(categoryKey, topicId) {
    const topic = (learningData[categoryKey] || []).find(item => item.id === topicId);
    if (!topic) return;
    activeGuideTopic = topic;

    ['auth', 'home', 'tasks', 'learn', 'guide-detail', 'chat'].forEach(t => {
        const view = document.getElementById(`view-${t}`);
        if (view) view.classList.add('hidden');
    });

    const detailView = document.getElementById('view-guide-detail');
    if (detailView) detailView.classList.remove('hidden');

    const titleEl = document.getElementById('guide-detail-title');
    const descEl = document.getElementById('guide-detail-desc');
    const badgeEl = document.getElementById('guide-detail-badge');
    const videoEl = document.getElementById('guide-video-player');
    const videoDlEl = document.getElementById('guide-video-download');
    const audioEl = document.getElementById('guide-audio-player');
    const transcriptBox = document.getElementById('guide-transcript-box');

    if (titleEl) titleEl.textContent = topic.title;
    if (descEl) descEl.textContent = topic.desc;
    if (badgeEl) badgeEl.textContent = topic.type;

    const videoUrl = getSupabasePublicFileUrl(topic.videoPath);
    if (videoEl) { videoEl.src = videoUrl; videoEl.load(); }
    if (videoDlEl) videoDlEl.href = videoUrl || '#';

    const audioUrl = getSupabasePublicFileUrl(topic.podcastPath);
    if (audioEl) { audioEl.src = audioUrl; audioEl.load(); }

    let resolvedTranscript = topic.transcriptText || '';
    if (topic.transcriptPath) {
        try {
            const txUrl = getSupabasePublicFileUrl(topic.transcriptPath);
            if (txUrl) {
                const resp = await fetch(txUrl);
                if (resp.ok) {
                    const txt = await resp.text();
                    if (txt.trim()) resolvedTranscript = txt.trim();
                }
            }
        } catch (_err) {}
    }

    topic.resolvedTranscript = resolvedTranscript;
    if (transcriptBox) transcriptBox.textContent = resolvedTranscript || 'Transcript coming soon.';
    if (window.lucide) lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function downloadActiveGuidePodcast() {
    if (!activeGuideTopic) return;
    const url = getSupabasePublicFileUrl(activeGuideTopic.podcastPath);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
}

async function downloadActiveGuideTranscript() {
    if (!activeGuideTopic) return;
    const text = activeGuideTopic.resolvedTranscript || activeGuideTopic.transcriptText || '';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${activeGuideTopic.id}-transcript.txt`;
    a.click();
}

function explainActiveGuideWithBloomAI() {
    switchTab('chat');
    const input = document.getElementById('chat-input');
    if (input && activeGuideTopic) {
        input.value = activeGuideTopic.bloomPrompt || `Explain "${activeGuideTopic.title}".`;
        input.focus();
    }
}

// --- MULTIMODAL, VOICE & CHAT ---
async function handleFileSelection(e) {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
        const reader = new FileReader();
        reader.onload = ev => {
            attachedFiles.push({
                name: file.name,
                type: file.type || 'application/octet-stream',
                data: String(ev.target.result || '').split(',')[1] || ''
            });
            renderAttachmentsPreview();
        };
        reader.readAsDataURL(file);
    }
    e.target.value = '';
}

function renderAttachmentsPreview() {
    const el = document.getElementById('chat-attachments-preview');
    if (!el) return;
    if (!attachedFiles.length) {
        el.classList.add('hidden');
        el.innerHTML = '';
        return;
    }
    el.classList.remove('hidden');
    el.innerHTML = attachedFiles.map((f, i) => `
        <span class="px-2.5 py-1 rounded-lg bg-slate-950 border border-rose-500/30 text-xs text-slate-200 inline-flex items-center gap-1.5">
            ${escapeHtml(f.name)}
            <button type="button" onclick="attachedFiles.splice(${i},1);renderAttachmentsPreview()" class="text-rose-400">×</button>
        </span>
    `).join('');
}

let recognition = null;
let isRecording = false;

function toggleVoiceRecording() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
        alert('Speech recognition is not supported in this browser.');
        return;
    }
    const micBtn = document.getElementById('mic-btn');
    const input = document.getElementById('chat-input');
    if (isRecording && recognition) {
        recognition.stop();
        return;
    }
    recognition = new SpeechRec();
    recognition.lang = 'en-US';
    recognition.onstart = () => {
        isRecording = true;
        micBtn?.classList.add('text-rose-400', 'animate-pulse');
    };
    recognition.onresult = ev => {
        if (input) input.value = ev.results[0][0].transcript;
    };
    recognition.onend = () => {
        isRecording = false;
        micBtn?.classList.remove('text-rose-400', 'animate-pulse');
        if (input?.value.trim()) handleSendMessage(new Event('submit'));
    };
    recognition.start();
}

function cleanModelMarkdown(rawText) {
    return String(rawText ?? '')
        .replace(/\[\s*\]/g, '')
        .replace(/\*{4,}/g, '**')
        .trim();
}

function formatAiMessageContent(rawText) {
    const cleaned = cleanModelMarkdown(rawText);
    if (!cleaned) return '<p>No response returned.</p>';
    return window.marked
        ? marked.parse(cleaned, { breaks: true, gfm: true })
        : `<p>${escapeHtml(cleaned).replace(/\n/g, '<br>')}</p>`;
}

async function loadChatSessions() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const listContainer = document.getElementById('chat-sessions-list');
    if (!session) {
        if (listContainer) listContainer.innerHTML = `<p class="text-xs text-slate-500 p-2 text-center">Sign in to save chat history</p>`;
        return;
    }
    const { data } = await supabaseClient.from('chat_sessions').select('*').order('created_at', { ascending: false });
    chatSessions = data || [];
    renderChatSessionsList();
    if (chatSessions.length > 0) {
        await selectChatSession(activeChatSessionId || chatSessions[0].id);
    } else {
        await createNewChatSession();
    }
}

function renderChatSessionsList() {
    const listContainer = document.getElementById('chat-sessions-list');
    if (!listContainer) return;
    listContainer.innerHTML = chatSessions.map(s => `
        <button type="button" onclick="selectChatSession('${s.id}')" class="w-full text-left px-3 py-2 rounded-xl text-xs truncate ${s.id === activeChatSessionId ? 'bg-rose-500/20 text-white border border-rose-500/40' : 'text-slate-400 hover:bg-white/5'}">
            ${escapeHtml(s.title || 'New Chat')}
        </button>
    `).join('');
}

async function createNewChatSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    const { data } = await supabaseClient.from('chat_sessions').insert([{ title: 'New Chat', user_id: session.user.id }]).select().single();
    if (data) {
        activeChatSessionId = data.id;
        chatSessions.unshift(data);
        renderChatSessionsList();
        const box = document.getElementById('chat-messages');
        if (box) box.innerHTML = '';
    }
}

async function selectChatSession(sessionId) {
    activeChatSessionId = sessionId;
    renderChatSessionsList();
    const box = document.getElementById('chat-messages');
    if (!box) return;
    const { data: messages } = await supabaseClient.from('chat_messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
    box.innerHTML = '';
    (messages || []).forEach(m => appendMessageToDOM(m.role, m.content, m.attachment_names || []));
}

function appendMessageToDOM(role, text, attachmentNames = []) {
    const chatBox = document.getElementById('chat-messages');
    if (!chatBox) return;
    const isUser = role === 'user';
    const wrapper = document.createElement('div');
    wrapper.className = `flex items-start space-x-3 ${isUser ? 'justify-end' : ''}`;
    wrapper.innerHTML = isUser
        ? `<div class="p-4 rounded-2xl rounded-tr-sm bg-rose-500 text-white text-sm max-w-[85%] whitespace-pre-wrap">${escapeHtml(text)}</div>`
        : `<div class="p-4 rounded-2xl rounded-tl-sm bg-slate-900 border border-white/10 text-sm text-slate-200 max-w-[85%] bloom-markdown">${formatAiMessageContent(text)}</div>`;
    chatBox.appendChild(wrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function handleSendMessage(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('chat-input');
    if (!input) return;
    const msg = input.value.trim();
    const filesToSend = [...attachedFiles];
    if (!msg && !filesToSend.length) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    appendMessageToDOM('user', msg || `[Attached ${filesToSend.length} file(s)]`, filesToSend.map(f => f.name));
    input.value = '';
    attachedFiles = [];
    renderAttachmentsPreview();

    try {
        const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', {
            body: { prompt: msg || 'Analyze attached files.', files: filesToSend }
        });
        if (error) throw error;
        const reply = cleanModelMarkdown(data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.reply || 'Got it!');
        appendMessageToDOM('assistant', reply);

        if (session && activeChatSessionId) {
            await supabaseClient.from('chat_messages').insert([
                { session_id: activeChatSessionId, user_id: session.user.id, role: 'user', content: msg },
                { session_id: activeChatSessionId, user_id: session.user.id, role: 'assistant', content: reply }
            ]);
        }
    } catch (err) {
        appendMessageToDOM('assistant', `Error: ${err.message}`);
    }
}

function sendQuickPrompt(promptText) {
    const input = document.getElementById('chat-input');
    if (input) input.value = promptText;
    handleSendMessage(new Event('submit'));
}

// --- AUTH ---
function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    const title = document.getElementById('auth-title');
    const btn = document.getElementById('auth-submit-btn');
    const toggle = document.getElementById('auth-toggle-btn');
    if (title) title.textContent = isSignUpMode ? 'Create Account' : 'Welcome Back';
    if (btn) btn.textContent = isSignUpMode ? 'Sign Up' : 'Sign In';
    if (toggle) toggle.innerHTML = isSignUpMode
        ? 'Already have an account? <span class="font-bold text-white">Sign In</span>'
        : "Don't have an account? <span class="font-bold text-white">Sign Up</span>";
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email')?.value.trim() || '';
    const password = document.getElementById('auth-password')?.value || '';
    const errBox = document.getElementById('auth-error');
    const okBox = document.getElementById('auth-success');
    errBox?.classList.add('hidden');
    okBox?.classList.add('hidden');

    if (isSignUpMode) {
        const { error } = await supabaseClient.auth.signUp({ email, password });
        if (error && errBox) { errBox.textContent = error.message; errBox.classList.remove('hidden'); }
        else if (okBox) { okBox.textContent = 'Account created! Check your email or sign in.'; okBox.classList.remove('hidden'); }
    } else {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error && errBox) { errBox.textContent = error.message; errBox.classList.remove('hidden'); }
        else switchTab('home');
    }
}

async function handleForgotPassword() {
    const email = document.getElementById('auth-email')?.value.trim() || '';
    if (!email) return alert('Enter your email first.');
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
    alert(error ? error.message : 'Password reset email sent.');
}

async function handleUpdatePassword(e) {
    e.preventDefault();
    const pwd = document.getElementById('new-password')?.value || '';
    const { error } = await supabaseClient.auth.updateUser({ password: pwd });
    alert(error ? error.message : 'Password updated!');
}

async function handleSignOut() {
    await supabaseClient.auth.signOut();
    googleAccessToken = null;
    switchTab('auth');
}

function updateAuthUI(session) {
    const btn = document.getElementById('auth-nav-btn');
    if (!btn) return;
    if (session) {
        btn.innerHTML = `<i data-lucide="log-out" class="w-4 h-4"></i><span>Sign Out</span>`;
        btn.onclick = handleSignOut;
    } else {
        btn.innerHTML = `<i data-lucide="log-in" class="w-4 h-4"></i><span>Log In</span>`;
        btn.onclick = () => switchTab('auth');
    }
    if (window.lucide) lucide.createIcons();
}

supabaseClient.auth.onAuthStateChange((_event, session) => {
    updateAuthUI(session);
    fetchTasks();
});

// --- FOCUS RADIO ---
function ensureFocusAudio() {
    const stationSelect = document.getElementById('music-station');
    const volSlider = document.getElementById('music-volume');
    if (!focusAudio) {
        focusAudio = new Audio(stationSelect ? stationSelect.value : 'https://streams.ilovemusic.de/iloveradio17.mp3');
    }
    if (volSlider) focusAudio.volume = Number(volSlider.value) || 0.35;
    return focusAudio;
}

function toggleMusic() {
    const audio = ensureFocusAudio();
    const icon = document.getElementById('music-icon');
    if (isMusicPlaying) {
        audio.pause();
        isMusicPlaying = false;
        if (icon) icon.setAttribute('data-lucide', 'play');
    } else {
        audio.play().then(() => {
            isMusicPlaying = true;
            if (icon) icon.setAttribute('data-lucide', 'pause');
            if (window.lucide) lucide.createIcons();
        }).catch(err => console.error(err));
    }
    if (window.lucide) lucide.createIcons();
}

function changeStation() {
    const stationSelect = document.getElementById('music-station');
    if (!stationSelect) return;
    const audio = ensureFocusAudio();
    audio.src = stationSelect.value;
    audio.load();
    if (isMusicPlaying) audio.play().catch(err => console.error(err));
}

function setMusicVolume(val) {
    const audio = ensureFocusAudio();
    audio.volume = Math.max(0, Math.min(1, Number(val) || 0));
}

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('task-form')?.addEventListener('submit', handleAddTask);
    const { data: { session } } = await supabaseClient.auth.getSession();
    updateAuthUI(session);
    switchTab(session ? 'home' : 'auth');
    if (window.lucide) lucide.createIcons();
});
