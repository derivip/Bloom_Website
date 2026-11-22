// BLOOM APPLICATION SCRIPT (2026 EDITION - SUPABASE, GEMINI AI, GUIDANCE DETAIL, MULTIMODAL, MULTI-CHAT & FOCUS RADIO)

// SUPABASE CONFIGURATION
const SUPABASE_URL = 'https://xmqmrkqyjnbupyalhnib.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7AqK322TINFq1y39lMgvTw_Z7Itc79G';

// Initialize Supabase Client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize Mermaid for visual roadmaps & diagrams
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

// --- TASK MANAGEMENT WITH SUPABASE (PER-USER ISOLATED) ---
let tasks = [];
let currentFilter = 'all';

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
        renderWeeklyProgressChart();
        return;
    }

    const { data, error } = await supabaseClient
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tasks:', error);
        renderWeeklyProgressChart();
        return;
    }
    tasks = data || [];
    renderTasks();
}

async function handleAddTask(e) {
    if (e && e.preventDefault) e.preventDefault();

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert("You must be logged in to create tasks.");
        switchTab('auth');
        return;
    }

    const titleInput = document.getElementById('task-title');
    const priorityInput = document.getElementById('task-priority');
    const categoryInput = document.getElementById('task-category');

    if (!titleInput || !priorityInput || !categoryInput) return;

    const cleanTitle = titleInput.value.trim();
    if (!cleanTitle) return;

    const newTask = {
        title: cleanTitle,
        priority: priorityInput.value,
        category: categoryInput.value,
        completed: false,
        user_id: session.user.id
    };

    const { error } = await supabaseClient
        .from('tasks')
        .insert([newTask]);

    if (error) {
        console.error("Supabase Error:", error.message);
        alert("Failed to save task: " + error.message);
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

    if (error) {
        console.error('Error updating task:', error);
        return;
    }

    const completionMap = JSON.parse(localStorage.getItem('bloom_task_completed_dates') || '{}');
    if (!taskToToggle.completed) {
        completionMap[String(id)] = new Date().toISOString();
    } else {
        delete completionMap[String(id)];
    }
    localStorage.setItem('bloom_task_completed_dates', JSON.stringify(completionMap));

    fetchTasks();
}

async function deleteTask(id) {
    const { error } = await supabaseClient
        .from('tasks')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting task:', error);
        return;
    }
    fetchTasks();
}

function filterTasks(priority) {
    currentFilter = priority;
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('bg-rose-500/20', 'border-rose-500', 'text-rose-300');
        b.classList.add('bg-slate-900', 'border-white/10', 'text-slate-400');
    });

    const activeFilterBtn = document.getElementById(`filter-${priority}`);
    if (activeFilterBtn) {
        activeFilterBtn.classList.add('bg-rose-500/20', 'border-rose-500', 'text-rose-300');
        activeFilterBtn.classList.remove('bg-slate-900', 'text-slate-400');
    }

    renderTasks();
}

function elaborateTaskStepsWithBloomAI(taskTitle, stepsElementId) {
    const stepsBox = document.getElementById(stepsElementId);
    const stepsText = stepsBox ? stepsBox.innerText.trim() : '';
    const prompt = stepsText
        ? `Elaborate on these micro-steps for "${taskTitle}":\n${stepsText}\n\nGive concrete examples, quick tips, and a simple way to tackle step 1 right now.`
        : `Elaborate on how to break down and start "${taskTitle}" with clear, practical micro-steps and examples.`;

    switchTab('chat');

    const input = document.getElementById('chat-input');
    if (input) {
        input.value = prompt;
        input.focus();
    }
}

// --- GEMINI AI MICRO-STEPS FOR TASKS ---
async function fetchAiMicroSteps(taskTitle, elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;

    container.innerHTML = `<p class="text-xs text-teal-400 animate-pulse mt-2 flex items-center gap-1.5"><i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Generating BloomAI Micro-Steps...</p>`;
    if (window.lucide) lucide.createIcons();

    const prompt = `Break down this task into 3 short, actionable, youth-friendly micro-steps to reduce overwhelm: "${taskTitle}". Return only the 3 numbered steps (1., 2., 3.) as plain text lines without markdown bolding or stray brackets.`;

    try {
        const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', {
            body: { prompt: prompt }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));

        const rawSteps = data?.candidates?.[0]?.content?.parts?.[0]?.text
            || data?.reply
            || "1. Review task details and requirements.\n2. Break it into smaller 10-minute blocks.\n3. Complete the very first small action.";
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
                        <button type="button" onclick="elaborateTaskStepsWithBloomAI('${escapedTitle}', '${elementId}')" class="text-[11px] text-rose-300 hover:text-rose-200 font-semibold flex items-center gap-1 transition-colors">
                            <i data-lucide="sparkles" class="w-3 h-3"></i>
                            <span>Elaborate with Bloom AI</span>
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
        console.error("Micro-steps error:", err);
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

    let filtered = tasks;
    if (currentFilter !== 'all') {
        filtered = tasks.filter(t => t.priority === currentFilter);
    }

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
    } else {
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
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <button type="button" onclick="toggleTask('${escapedId}')" class="p-1 rounded-lg ${t.completed ? 'bg-rose-500 text-white' : 'border border-slate-600 hover:border-rose-400'}">
                            <i data-lucide="${t.completed ? 'check-square' : 'square'}" class="w-5 h-5"></i>
                        </button>
                        <div>
                            <p class="text-sm font-semibold text-white ${t.completed ? 'line-through text-slate-500' : ''}">${escapeHtml(t.title)}</p>
                            <span class="text-xs text-slate-400">${escapeHtml(t.category)}</span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        ${priorityBadges[t.priority] || priorityBadges.medium}
                        <button type="button" onclick="deleteTask('${escapedId}')" class="text-slate-500 hover:text-red-400 p-1">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div id="ai-steps-${t.id}" class="mt-2 pt-2 border-t border-white/5">
                    <button type="button" onclick="fetchAiMicroSteps('${escapedTitle}', 'ai-steps-${t.id}')" class="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1.5 transition-colors">
                        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                        <span>Generate BloomAI Micro-Steps</span>
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }

    renderWeeklyProgressChart();
    if (window.lucide) lucide.createIcons();
}

// --- WEEKLY PROGRESS CHART & SUMMARY ---
function toLocalDateKey(dateInput) {
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getWeeklyTaskStats() {
    const completionMap = JSON.parse(localStorage.getItem('bloom_task_completed_dates') || '{}');
    const days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        days.push({
            key: toLocalDateKey(d),
            label: d.toLocaleDateString('en-US', { weekday: 'short' }),
            completed: 0,
            added: 0
        });
    }

    const dayLookup = Object.fromEntries(days.map(d => [d.key, d]));
    const categoryCounts = {};
    let weeklyCompleted = 0;
    let weeklyAdded = 0;

    tasks.forEach(t => {
        const createdKey = t.created_at ? toLocalDateKey(t.created_at) : '';
        if (dayLookup[createdKey]) {
            dayLookup[createdKey].added += 1;
            weeklyAdded += 1;
        }

        if (t.completed) {
            const rawDoneDate = completionMap[String(t.id)] || t.completed_at || t.created_at;
            const doneKey = rawDoneDate ? toLocalDateKey(rawDoneDate) : '';
            if (dayLookup[doneKey]) {
                dayLookup[doneKey].completed += 1;
                weeklyCompleted += 1;
                const cat = t.category || 'General';
                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            }
        }
    });

    const topCategoryEntry = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
    const topCategory = topCategoryEntry ? `${topCategoryEntry[0]} (${topCategoryEntry[1]})` : 'None yet';
    const bestDay = [...days].sort((a, b) => b.completed - a.completed)[0];
    const bestDayText = bestDay && bestDay.completed > 0 ? `${bestDay.label} (${bestDay.completed})` : '—';

    return { days, weeklyCompleted, weeklyAdded, topCategory, bestDayText };
}

function renderWeeklyProgressChart() {
    const chartEl = document.getElementById('weekly-progress-chart');
    const summaryEl = document.getElementById('weekly-work-summary');
    if (!chartEl || !summaryEl) return;

    const { days, weeklyCompleted, weeklyAdded, topCategory, bestDayText } = getWeeklyTaskStats();
    const maxCount = Math.max(1, ...days.map(d => Math.max(d.completed, d.added)));

    chartEl.innerHTML = days.map(d => {
        const heightPct = d.completed > 0 ? Math.max(18, Math.round((d.completed / maxCount) * 100)) : 8;
        const barColor = d.completed > 0
            ? 'bg-gradient-to-t from-rose-500 to-teal-400'
            : 'bg-slate-800';
        return `
            <div class="flex flex-col items-center justify-end h-full gap-1.5 pb-2" title="${escapeHtml(d.label)}: ${d.completed} completed, ${d.added} added">
                <span class="text-[10px] font-bold ${d.completed > 0 ? 'text-teal-300' : 'text-slate-500'}">${d.completed}</span>
                <div class="w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${barColor}" style="height: ${heightPct}%;"></div>
                <span class="text-[10px] text-slate-400 font-medium">${escapeHtml(d.label)}</span>
            </div>
        `;
    }).join('');

    summaryEl.innerHTML = `
        <div class="p-3 rounded-xl bg-slate-950/70 border border-white/5">
            <span class="text-slate-400 block text-[11px]">Completed (7 Days)</span>
            <span class="text-white font-bold text-sm mt-0.5 block">${weeklyCompleted} / ${weeklyAdded || weeklyCompleted} tasks</span>
        </div>
        <div class="p-3 rounded-xl bg-slate-950/70 border border-white/5">
            <span class="text-slate-400 block text-[11px]">Top Focus Area</span>
            <span class="text-teal-300 font-bold text-sm mt-0.5 block">${escapeHtml(topCategory)}</span>
        </div>
        <div class="p-3 rounded-xl bg-slate-950/70 border border-white/5">
            <span class="text-slate-400 block text-[11px]">Most Productive Day</span>
            <span class="text-rose-300 font-bold text-sm mt-0.5 block">${escapeHtml(bestDayText)}</span>
        </div>
    `;
}

function summarizeWeeklyWorkWithBloomAI() {
    const { days, weeklyCompleted, weeklyAdded, topCategory, bestDayText } = getWeeklyTaskStats();
    const dailyBreakdown = days.map(d => `${d.label}: ${d.completed} completed (${d.added} added)`).join(', ');
    const openTasks = tasks.filter(t => !t.completed).slice(0, 5).map(t => `- ${t.title} [${t.priority}]`).join('\n');

    const prompt = `Review my 7-day task progress and give me an encouraging, practical work summary:\n` +
        `• Completed this week: ${weeklyCompleted} (Added: ${weeklyAdded})\n` +
        `• Top category: ${topCategory}\n` +
        `• Best day: ${bestDayText}\n` +
        `• Daily breakdown: ${dailyBreakdown}\n` +
        (openTasks ? `\nRemaining open tasks:\n${openTasks}\n` : '') +
        `\nHighlight what went well, spot any patterns, and suggest 1 realistic priority for tomorrow.`;

    switchTab('chat');
    const input = document.getElementById('chat-input');
    if (input) {
        input.value = prompt;
        input.focus();
    }
}

// POP CULTURE / MOVIE INSPIRATIONAL QUOTES (30s Rotation)
const quotes = [
    { text: '"It’s not about having time, it’s about making time."', source: 'Captain America (Avengers: Endgame)' },
    { text: '"The magic you’re looking for is in the work you’re avoiding."', source: 'Modern Mindset Quote' },
    { text: '"You are stronger than you know, and your story is far from over."', source: 'Spider-Man: Into the Spider-Verse' },
    { text: '"Do or do not. There is no try."', source: 'Yoda (Star Wars)' },
    { text: '"Your focus determines your reality."', source: 'Qui-Gon Jinn (Star Wars)' },
    { text: '"Small steps every single day accumulate into massive life changes."', source: 'Bloom Philosophy' }
];

let quoteIndex = 0;

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
    }, 500);
}

setInterval(rotateQuotes, 30000);

// TAB NAVIGATION SYSTEM
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
    document.body.classList.toggle('overflow-hidden', tabId === 'chat');
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

// --- GUIDANCE LIBRARY WITH TOPIC DETAIL, VIDEO, M4A PODCAST, TRANSCRIPT & BLOOM AI ---
const GUIDE_STORAGE_BUCKET = 'guidance_media';
let activeGuideTopic = null;

function getSupabasePublicFileUrl(filePath) {
    if (!filePath) return '';
    if (/^https?:\/\//i.test(filePath)) return filePath;
    const { data } = supabaseClient.storage.from(GUIDE_STORAGE_BUCKET).getPublicUrl(filePath);
    return data?.publicUrl || '';
}

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
            bloomPrompt: `Walk me through "Balancing High School & Late Night Shifts" in a warm, conversational way. Break down realistic habits for handling schoolwork, late shifts, and energy without burning out, and ask how it fits my week.`
        },
        {
            id: 'resume-zero-experience',
            title: 'Building a Resume with Zero Prior Experience',
            desc: 'How to frame coursework, self-taught tech projects, and resilience into top job applications.',
            type: 'Guide • 6 min read',
            transcriptText: 'Guide notes on turning projects, schoolwork, and consistency into strong resume bullet points.',
            bloomPrompt: 'Help me turn my real projects, schoolwork, and everyday experience into strong resume bullet points in a friendly, conversational way.'
        }
    ],
    emotional: [
        {
            id: 'adult-counselors-disconnect',
            title: 'Why Adult Counselors Feel Disconnected & What To Do',
            desc: 'Understanding generational advice gaps and taking ownership of your self-care journey.',
            type: 'Perspective • 5 min read',
            transcriptText: 'Perspective guide on finding support that actually fits where you are right now.',
            bloomPrompt: 'Talk through how to get practical support and stay grounded when advice feels disconnected from real life.'
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

    const tabs = ['auth', 'home', 'tasks', 'learn', 'guide-detail', 'chat'];
    tabs.forEach(t => {
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
    if (videoEl) {
        videoEl.src = videoUrl;
        videoEl.load();
    }
    if (videoDlEl) {
        videoDlEl.href = videoUrl || '#';
    }

    const audioUrl = getSupabasePublicFileUrl(topic.podcastPath);
    if (audioEl) {
        audioEl.src = audioUrl;
        audioEl.load();
    }

    let resolvedTranscript = topic.transcriptText || '';
    if (topic.transcriptPath) {
        try {
            const txUrl = getSupabasePublicFileUrl(topic.transcriptPath);
            if (txUrl) {
                const resp = await fetch(txUrl);
                if (resp.ok) {
                    const remoteText = await resp.text();
                    if (remoteText.trim()) resolvedTranscript = remoteText.trim();
                }
            }
        } catch (err) {
            console.warn('Using local fallback transcript:', err);
        }
    }

    topic.resolvedTranscript = resolvedTranscript;
    if (transcriptBox) {
        transcriptBox.textContent = resolvedTranscript || 'Transcript coming soon.';
    }

    if (window.lucide) lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function triggerFileDownload(url, fallbackText, filename) {
    try {
        if (url && /^https?:\/\//i.test(url)) {
            const response = await fetch(url);
            if (response.ok) {
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
                return;
            }
        }
    } catch (err) {
        console.warn('Direct fetch download fallback:', err);
    }

    if (fallbackText) {
        const blob = new Blob([fallbackText], { type: 'text/plain;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
    }
}

async function downloadActiveGuidePodcast() {
    if (!activeGuideTopic) return;
    const audioUrl = getSupabasePublicFileUrl(activeGuideTopic.podcastPath);
    await triggerFileDownload(audioUrl, null, `${activeGuideTopic.id}.m4a`);
}

async function downloadActiveGuideTranscript() {
    if (!activeGuideTopic) return;
    const txUrl = getSupabasePublicFileUrl(activeGuideTopic.transcriptPath);
    await triggerFileDownload(txUrl, activeGuideTopic.resolvedTranscript || activeGuideTopic.transcriptText || '', `${activeGuideTopic.id}-transcript.txt`);
}

function explainActiveGuideWithBloomAI() {
    if (!activeGuideTopic) {
        switchTab('chat');
        return;
    }

    const transcriptSnippet = (activeGuideTopic.resolvedTranscript || activeGuideTopic.transcriptText || '').slice(0, 3500);
    const basePrompt = activeGuideTopic.bloomPrompt || `Explain "${activeGuideTopic.title}" in a warm, conversational way.`;
    const fullPrompt = transcriptSnippet
        ? `${basePrompt}\n\nTranscript context:\n${transcriptSnippet}`
        : basePrompt;

    switchTab('chat');
    const input = document.getElementById('chat-input');
    if (input) {
        input.value = fullPrompt;
        input.focus();
    }
}

// --- MULTIMODAL FILE ATTACHMENTS (WITH FAST IMAGE COMPRESSION) & VOICE INPUT ---
let attachedFiles = [];

function compressImage(file, maxWidth = 1024, quality = 0.8) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve({
                    name: file.name,
                    type: 'image/jpeg',
                    data: dataUrl.split(',')[1]
                });
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function getFileMimeType(file) {
    if (file.type) return file.type;
    const ext = file.name.split('.').pop()?.toLowerCase();
    const map = {
        txt: 'text/plain',
        md: 'text/plain',
        csv: 'text/csv',
        js: 'text/javascript',
        html: 'text/html',
        css: 'text/css',
        json: 'application/json',
        pdf: 'application/pdf'
    };
    return map[ext] || 'text/plain';
}

async function handleFileSelection(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
        if (file.size > 8 * 1024 * 1024) {
            alert(`"${file.name}" is larger than 8MB. Please pick a smaller file.`);
            continue;
        }

        if (file.type.startsWith('image/')) {
            const compressed = await compressImage(file);
            attachedFiles.push(compressed);
            renderAttachmentsPreview();
        } else {
            const mime = getFileMimeType(file);
            await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (uploadEvent) => {
                    attachedFiles.push({
                        name: file.name,
                        type: mime,
                        data: String(uploadEvent.target.result || '').split(',')[1] || ''
                    });
                    renderAttachmentsPreview();
                    resolve();
                };
                reader.readAsDataURL(file);
            });
        }
    }
    e.target.value = '';
}

function renderAttachmentsPreview() {
    const previewContainer = document.getElementById('chat-attachments-preview');
    if (!previewContainer) return;

    if (attachedFiles.length === 0) {
        previewContainer.classList.add('hidden');
        previewContainer.innerHTML = '';
        return;
    }

    previewContainer.classList.remove('hidden');
    previewContainer.innerHTML = attachedFiles.map((f, index) => `
        <div class="flex items-center gap-2 bg-slate-950 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs text-slate-200">
            <i data-lucide="${f.type.startsWith('image/') ? 'image' : 'file-text'}" class="w-3.5 h-3.5 text-rose-400"></i>
            <span class="truncate max-w-[140px]">${escapeHtml(f.name)}</span>
            <button type="button" onclick="removeAttachment(${index})" class="text-slate-500 hover:text-rose-400 ml-1">
                <i data-lucide="x" class="w-3 h-3"></i>
            </button>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

function removeAttachment(index) {
    attachedFiles.splice(index, 1);
    renderAttachmentsPreview();
}

let recognition = null;
let isRecording = false;

function toggleVoiceRecording() {
    const micBtn = document.getElementById('mic-btn');
    const input = document.getElementById('chat-input');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser. Try Chrome or Edge!");
        return;
    }

    if (isRecording && recognition) {
        recognition.stop();
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        isRecording = true;
        if (micBtn) micBtn.classList.add('bg-rose-500/20', 'text-rose-400', 'animate-pulse');
        if (input) input.placeholder = "Listening... Speak now...";
    };

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
        }
        if (input) input.value = transcript;
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        stopVoiceUI();
    };

    recognition.onend = () => {
        stopVoiceUI();
        if (input && input.value.trim().length > 0) {
            handleSendMessage(new Event('submit'));
        }
    };

    recognition.start();
}

function stopVoiceUI() {
    isRecording = false;
    const micBtn = document.getElementById('mic-btn');
    const input = document.getElementById('chat-input');
    if (micBtn) micBtn.classList.remove('bg-rose-500/20', 'text-rose-400', 'animate-pulse');
    if (input) input.placeholder = "Ask Bloom anything...";
}

function cleanModelMarkdown(rawText) {
    let text = String(rawText ?? '').trim();
    if (!text) return '';

    const codeFences = [];
    text = text.replace(/```[\s\S]*?```/g, (block) => {
        const token = `@@CODE_FENCE_${codeFences.length}@@`;
        codeFences.push(block);
        return token;
    });

    text = text.replace(/\[\s*\]/g, '');
    text = text.replace(/\*{4,}/g, '**');
    text = text.replace(/(?<!\*)\*\*\*([^\n*]+?)\*\*\*(?!\*)/g, '**$1**');

    codeFences.forEach((block, idx) => {
        text = text.replace(`@@CODE_FENCE_${idx}@@`, block);
    });

    return text.trim();
}

function formatAiMessageContent(rawText) {
    const cleaned = cleanModelMarkdown(rawText);
    if (!cleaned) return '<p>No response returned.</p>';

    const mermaidBlocks = [];
    let processedText = cleaned.replace(/```mermaid\s*([\s\S]*?)```/g, (_match, code) => {
        const placeholder = `%%MERMAID_BLOCK_${mermaidBlocks.length}%%`;
        mermaidBlocks.push(`
            <div class="my-3 p-4 rounded-2xl bg-slate-950 border border-rose-500/30 overflow-x-auto shadow-inner">
                <div class="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
                    <i data-lucide="git-branch" class="w-3.5 h-3.5"></i>
                    <span>Bloom Visual Roadmap</span>
                </div>
                <div class="mermaid flex justify-center">${escapeHtml(code.trim())}</div>
            </div>
        `);
        return placeholder;
    });

    let html = '';
    try {
        html = window.marked
            ? marked.parse(processedText, { breaks: true, gfm: true })
            : `<p>${escapeHtml(processedText).replace(/\n/g, '<br>')}</p>`;
    } catch {
        html = `<p>${escapeHtml(processedText).replace(/\n/g, '<br>')}</p>`;
    }

    mermaidBlocks.forEach((block, idx) => {
        html = html.replace(`%%MERMAID_BLOCK_${idx}%%`, block);
    });

    return html;
}

// --- MULTI-CHAT SESSIONS WITH SUPABASE ---
let activeChatSessionId = null;
let chatSessions = [];

async function loadChatSessions() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const listContainer = document.getElementById('chat-sessions-list');
    const chatBox = document.getElementById('chat-messages');

    if (!session) {
        if (listContainer) listContainer.innerHTML = `<p class="text-xs text-slate-500 p-2 text-center">Sign in to save chat history</p>`;
        if (chatBox) {
            chatBox.innerHTML = `
                <div class="flex items-start space-x-3">
                    <div class="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/40 shrink-0">
                        <i data-lucide="bot" class="w-4 h-4 text-rose-400"></i>
                    </div>
                    <div class="p-4 rounded-2xl rounded-tl-sm bg-slate-900 border border-white/10 text-sm text-slate-200 max-w-[85%] bloom-chat-bubble-ai">
                        Hey! I'm BloomAI. You can chat with me right now, or log in to save multiple chat threads across devices.
                    </div>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        }
        return;
    }

    const { data, error } = await supabaseClient
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading chat sessions:', error);
        return;
    }

    chatSessions = data || [];
    renderChatSessionsList();

    if (chatSessions.length > 0) {
        if (!activeChatSessionId || !chatSessions.some(s => s.id === activeChatSessionId)) {
            await selectChatSession(chatSessions[0].id);
        } else {
            await selectChatSession(activeChatSessionId);
        }
    } else {
        await createNewChatSession();
    }
}

function renderChatSessionsList() {
    const listContainer = document.getElementById('chat-sessions-list');
    if (!listContainer) return;

    if (chatSessions.length === 0) {
        listContainer.innerHTML = `<p class="text-xs text-slate-500 p-2 text-center">No chats yet.</p>`;
        return;
    }

    listContainer.innerHTML = chatSessions.map(s => {
        const isActive = s.id === activeChatSessionId;
        const safeTitle = escapeHtml(s.title || 'New Chat');
        return `
            <div class="group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-rose-500/20 border border-rose-500/40 text-white' : 'hover:bg-white/5 text-slate-400 border border-transparent'}" onclick="selectChatSession('${s.id}')">
                <div class="flex items-center gap-2 truncate pr-1 flex-1">
                    <i data-lucide="message-square" class="w-3.5 h-3.5 shrink-0 ${isActive ? 'text-rose-400' : 'text-slate-500'}"></i>
                    <span class="text-xs font-medium truncate">${safeTitle}</span>
                </div>
                <button type="button" onclick="event.stopPropagation(); deleteChatSession('${s.id}')" class="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded transition-opacity" title="Delete chat">
                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
            </div>
        `;
    }).join('');
    if (window.lucide) lucide.createIcons();
}

async function createNewChatSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data, error } = await supabaseClient
        .from('chat_sessions')
        .insert([{ title: 'New Chat', user_id: session.user.id }])
        .select()
        .single();

    if (error) {
        console.error('Error creating chat session:', error);
        return;
    }

    activeChatSessionId = data.id;
    chatSessions.unshift(data);
    renderChatSessionsList();
    renderWelcomeMessage();
}

async function deleteChatSession(sessionId) {
    const { error } = await supabaseClient
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

    if (error) {
        console.error('Error deleting session:', error);
        return;
    }

    chatSessions = chatSessions.filter(s => s.id !== sessionId);
    if (activeChatSessionId === sessionId) {
        activeChatSessionId = chatSessions.length > 0 ? chatSessions[0].id : null;
    }

    renderChatSessionsList();
    if (activeChatSessionId) {
        await selectChatSession(activeChatSessionId);
    } else {
        await createNewChatSession();
    }
}

async function selectChatSession(sessionId) {
    activeChatSessionId = sessionId;
    renderChatSessionsList();

    const chatBox = document.getElementById('chat-messages');
    if (!chatBox) return;

    chatBox.innerHTML = `<div class="text-center py-6 text-xs text-slate-500 animate-pulse">Loading conversation...</div>`;

    const { data: messages, error } = await supabaseClient
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error loading messages:', error);
        chatBox.innerHTML = `<div class="text-center py-6 text-xs text-red-400">Failed to load messages.</div>`;
        return;
    }

    chatBox.innerHTML = '';
    if (!messages || messages.length === 0) {
        renderWelcomeMessage();
    } else {
        messages.forEach(m => {
            appendMessageToDOM(m.role, m.content, m.attachment_names || []);
        });
    }
    chatBox.scrollTop = chatBox.scrollHeight;
}

function renderWelcomeMessage() {
    const chatBox = document.getElementById('chat-messages');
    if (!chatBox) return;
    chatBox.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/40 shrink-0">
                <i data-lucide="bot" class="w-4 h-4 text-rose-400"></i>
            </div>
            <div class="p-4 rounded-2xl rounded-tl-sm bg-slate-900 border border-white/10 text-sm text-slate-200 max-w-[85%] bloom-chat-bubble-ai">
                Hey! I'm BloomAI. How are you feeling today? Ask me about goals, school/work balance, stress, or attach a file/image to analyze.
            </div>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

function appendMessageToDOM(role, text, attachmentNames = []) {
    const chatBox = document.getElementById('chat-messages');
    if (!chatBox) return;

    const isUser = role === 'user';
    const wrapper = document.createElement('div');
    wrapper.className = `flex items-start space-x-3 ${isUser ? 'justify-end' : ''}`;

    let attachmentsHtml = '';
    if (attachmentNames && attachmentNames.length > 0) {
        attachmentsHtml = `<div class="flex flex-wrap gap-1.5 mb-2">` +
            attachmentNames.map(name => `<span class="inline-flex items-center gap-1 text-[11px] bg-black/30 px-2 py-0.5 rounded border border-white/10"><i data-lucide="paperclip" class="w-3 h-3"></i>${escapeHtml(name)}</span>`).join('') +
            `</div>`;
    }

    const bodyHtml = isUser
        ? `${attachmentsHtml}<div class="whitespace-pre-wrap">${escapeHtml(text)}</div>`
        : `${attachmentsHtml}<div class="bloom-markdown">${formatAiMessageContent(text)}</div>`;

    if (isUser) {
        wrapper.innerHTML = `
            <div class="p-4 rounded-2xl rounded-tr-sm bg-rose-500 text-white text-sm max-w-[85%] shadow-md bloom-chat-bubble-user">
                ${bodyHtml}
            </div>
        `;
    } else {
        wrapper.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/40 shrink-0">
                <i data-lucide="bot" class="w-4 h-4 text-rose-400"></i>
            </div>
            <div class="p-4 rounded-2xl rounded-tl-sm bg-slate-900 border border-white/10 text-sm text-slate-200 max-w-[85%] space-y-2 bloom-chat-bubble-ai">
                <div class="flex items-center justify-between gap-2 pb-1 border-b border-white/5">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-rose-400">Bloom AI</span>
                    <span class="text-[10px] text-slate-500">AI-generated guidance</span>
                </div>
                ${bodyHtml}
            </div>
        `;
    }

    chatBox.appendChild(wrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
    if (window.lucide) lucide.createIcons();
    if (!isUser && window.mermaid) {
        const mermaidNodes = wrapper.querySelectorAll('.mermaid');
        if (mermaidNodes.length > 0) {
            mermaid.run({ nodes: mermaidNodes }).catch(err => console.error('Mermaid render error:', err));
        }
    }
}

async function handleSendMessage(e) {
    if (e && e.preventDefault) e.preventDefault();

    const input = document.getElementById('chat-input');
    const chatBox = document.getElementById('chat-messages');
    if (!input || !chatBox) return;

    const msg = input.value.trim();
    const filesToSend = [...attachedFiles];
    if (!msg && filesToSend.length === 0) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    const displayText = msg || (filesToSend.length > 0 ? `[Attached ${filesToSend.length} file(s)]` : '');
    const fileNames = filesToSend.map(f => f.name);

    appendMessageToDOM('user', displayText, fileNames);
    input.value = '';
    attachedFiles = [];
    renderAttachmentsPreview();

    let currentSessionId = activeChatSessionId;
    if (session) {
        if (!currentSessionId) {
            const { data: newSess } = await supabaseClient
                .from('chat_sessions')
                .insert([{ title: msg ? msg.slice(0, 32) : 'Attachment Chat', user_id: session.user.id }])
                .select()
                .single();
            if (newSess) {
                currentSessionId = newSess.id;
                activeChatSessionId = newSess.id;
                chatSessions.unshift(newSess);
                renderChatSessionsList();
            }
        } else {
            const currentSess = chatSessions.find(s => s.id === currentSessionId);
            if (currentSess && currentSess.title === 'New Chat' && msg) {
                const newTitle = msg.slice(0, 32) + (msg.length > 32 ? '...' : '');
                await supabaseClient
                    .from('chat_sessions')
                    .update({ title: newTitle })
                    .eq('id', currentSessionId);
                currentSess.title = newTitle;
                renderChatSessionsList();
            }
        }

        if (currentSessionId) {
            await supabaseClient
                .from('chat_messages')
                .insert([{
                    session_id: currentSessionId,
                    user_id: session.user.id,
                    role: 'user',
                    content: displayText,
                    attachment_names: fileNames
                }]);
        }
    }

    const typingId = 'typing-' + Date.now();
    const typingEl = document.createElement('div');
    typingEl.id = typingId;
    typingEl.className = 'flex items-start space-x-3';
    typingEl.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/40 shrink-0">
            <i data-lucide="bot" class="w-4 h-4 text-rose-400"></i>
        </div>
        <div class="p-4 rounded-2xl rounded-tl-sm bg-slate-900 border border-white/10 text-sm text-slate-400 bloom-chat-bubble-ai">
            <span class="animate-pulse">BloomAI is thinking...</span>
        </div>
    `;
    chatBox.appendChild(typingEl);
    chatBox.scrollTop = chatBox.scrollHeight;
    if (window.lucide) lucide.createIcons();

    try {
        const systemPrompt = "You are BloomAI, a warm, empathetic, insightful mentor and life coach for youth and young adults. Give clear, practical, structured answers. Use clean markdown formatting and tables when comparing options. Only include a ```mermaid flowchart``` when mapping a multi-step roadmap, decision tree, or workflow.";

        const payload = {
            prompt: msg || "Please analyze the attached file(s) and share helpful insights.",
            systemInstruction: systemPrompt,
            files: filesToSend
        };

        const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', {
            body: payload
        });

        const typingNode = document.getElementById(typingId);
        if (typingNode) typingNode.remove();

        if (error) throw error;
        if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));

        const rawReply = data?.candidates?.[0]?.content?.parts?.[0]?.text
            || data?.reply
            || "I'm here with you! Could you share a little more detail?";
        const reply = cleanModelMarkdown(rawReply);

        appendMessageToDOM('assistant', reply);

        if (session && currentSessionId) {
            await supabaseClient
                .from('chat_messages')
                .insert([{
                    session_id: currentSessionId,
                    user_id: session.user.id,
                    role: 'assistant',
                    content: reply,
                    attachment_names: []
                }]);
        }
    } catch (err) {
        console.error("Chat error:", err);
        const typingNode = document.getElementById(typingId);
        if (typingNode) typingNode.remove();

        const errDiv = document.createElement('div');
        errDiv.className = 'flex items-start space-x-3';
        errDiv.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/40 shrink-0">
                <i data-lucide="alert-circle" class="w-4 h-4 text-red-400"></i>
            </div>
            <div class="p-4 rounded-2xl rounded-tl-sm bg-red-950/40 border border-red-500/30 text-sm text-red-200 max-w-[85%]">
                BloomAI hit a snag: ${escapeHtml(err.message)}
            </div>
        `;
        chatBox.appendChild(errDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        if (window.lucide) lucide.createIcons();
    }
}

function sendQuickPrompt(promptText) {
    const input = document.getElementById('chat-input');
    if (input) input.value = promptText;
    handleSendMessage(new Event('submit'));
}

// --- SUPABASE AUTHENTICATION ---
let isSignUpMode = false;

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    const titleEl = document.getElementById('auth-title');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleBtn = document.getElementById('auth-toggle-btn');

    if (titleEl) titleEl.textContent = isSignUpMode ? 'Create Account' : 'Welcome Back';
    if (submitBtn) submitBtn.textContent = isSignUpMode ? 'Sign Up' : 'Sign In';
    if (toggleBtn) {
        toggleBtn.innerHTML = isSignUpMode
            ? 'Already have an account? <span class="font-bold text-white">Sign In</span>'
            : "Don't have an account? <span class="font-bold text-white">Sign Up</span>";
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');
    const errorBox = document.getElementById('auth-error');
    const successBox = document.getElementById('auth-success');
    if (!emailInput || !passwordInput) return;

    if (errorBox) errorBox.classList.add('hidden');
    if (successBox) successBox.classList.add('hidden');

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (isSignUpMode) {
        const { error } = await supabaseClient.auth.signUp({ email, password });
        if (error) {
            if (errorBox) { errorBox.textContent = error.message; errorBox.classList.remove('hidden'); }
        } else if (successBox) {
            successBox.textContent = 'Account created! Check your email or sign in.';
            successBox.classList.remove('hidden');
        }
    } else {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            if (errorBox) { errorBox.textContent = error.message; errorBox.classList.remove('hidden'); }
        } else {
            emailInput.value = '';
            passwordInput.value = '';
            switchTab('home');
        }
    }
}

async function handleForgotPassword() {
    const emailInput = document.getElementById('auth-email');
    const email = emailInput ? emailInput.value.trim() : '';
    if (!email) {
        alert('Enter your email address first.');
        return;
    }
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
    if (error) alert(error.message);
    else alert('Password reset link sent to your email.');
}

async function handleUpdatePassword(e) {
    e.preventDefault();
    const newPwdInput = document.getElementById('new-password');
    if (!newPwdInput) return;
    const { error } = await supabaseClient.auth.updateUser({ password: newPwdInput.value });
    if (error) alert(error.message);
    else {
        alert('Password updated!');
        document.getElementById('reset-password-form')?.classList.add('hidden');
        document.getElementById('auth-form')?.classList.remove('hidden');
    }
}

async function handleSignOut() {
    await supabaseClient.auth.signOut();
    activeChatSessionId = null;
    chatSessions = [];
    switchTab('auth');
}

function updateAuthUI(session) {
    const authNavBtn = document.getElementById('auth-nav-btn');
    if (!authNavBtn) return;

    if (session) {
        authNavBtn.innerHTML = `<i data-lucide="log-out" class="w-4 h-4"></i><span>Sign Out</span>`;
        authNavBtn.onclick = handleSignOut;
    } else {
        authNavBtn.innerHTML = `<i data-lucide="log-in" class="w-4 h-4"></i><span>Log In</span>`;
        authNavBtn.onclick = () => switchTab('auth');
    }
    if (window.lucide) lucide.createIcons();
}

supabaseClient.auth.onAuthStateChange((_event, session) => {
    updateAuthUI(session);
    fetchTasks();
    if (session && document.getElementById('view-chat') && !document.getElementById('view-chat').classList.contains('hidden')) {
        loadChatSessions();
    }
});

// --- FOCUS RADIO STREAM PLAYER ---
let focusAudio = null;
let isMusicPlaying = false;

function ensureFocusAudio() {
    const stationSelect = document.getElementById('music-station');
    const volSlider = document.getElementById('music-volume');
    if (!focusAudio) {
        focusAudio = new Audio(stationSelect ? stationSelect.value : 'https://streams.ilovemusic.de/iloveradio17.mp3');
        focusAudio.preload = 'none';
    }
    if (volSlider) {
        focusAudio.volume = Math.max(0, Math.min(1, Number(volSlider.value) || 0.35));
    }
    return focusAudio;
}

function updateMusicIcon() {
    const icon = document.getElementById('music-icon');
    if (icon) icon.setAttribute('data-lucide', isMusicPlaying ? 'pause' : 'play');
    if (window.lucide) lucide.createIcons();
}

function toggleMusic() {
    const audio = ensureFocusAudio();
    if (isMusicPlaying) {
        audio.pause();
        isMusicPlaying = false;
        updateMusicIcon();
    } else {
        audio.play().then(() => {
            isMusicPlaying = true;
            updateMusicIcon();
        }).catch(err => {
            console.error('Radio playback failed:', err);
        });
    }
}

function changeStation() {
    const stationSelect = document.getElementById('music-station');
    if (!stationSelect) return;
    const audio = ensureFocusAudio();
    audio.src = stationSelect.value;
    audio.load();
    if (isMusicPlaying) {
        audio.play().catch(err => console.error('Station switch error:', err));
    }
}

function setMusicVolume(val) {
    const audio = ensureFocusAudio();
    audio.volume = Math.max(0, Math.min(1, Number(val) || 0));
}

// INITIALIZATION ON PAGE LOAD
document.addEventListener('DOMContentLoaded', async () => {
    const taskForm = document.getElementById('task-form');
    if (taskForm) taskForm.addEventListener('submit', handleAddTask);

    renderWeeklyProgressChart();

    const { data: { session } } = await supabaseClient.auth.getSession();
    updateAuthUI(session);

    if (session) {
        switchTab('home');
    } else {
        switchTab('auth');
    }

    const quoteEl = document.getElementById('inspirational-quote');
    const sourceEl = document.getElementById('quote-source');
    if (quoteEl && sourceEl) {
        quoteEl.innerText = quotes[0].text;
        sourceEl.innerText = `— ${quotes[0].source}`;
    }

    if (window.lucide) lucide.createIcons();
});
