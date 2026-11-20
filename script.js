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
    e.preventDefault();

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
    const taskToToggle = tasks.find(t => t.id === id);
    if (!taskToToggle) return;

    const { error } = await supabaseClient
        .from('tasks')
        .update({ completed: !taskToToggle.completed })
        .eq('id', id);

    if (error) {
        console.error('Error updating task:', error);
        return;
    }
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
                    <button type="button" onclick="fetchAiMicroSteps('${escapedTitle}', '${elementId}')" class="text-[11px] text-slate-400 hover:text-teal-300 flex items-center gap-1 transition-colors">
                        <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                        <span>Regenerate with AI</span>
                    </button>
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
        return;
    }

    const priorityBadges = {
        high: '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">HIGH</span>',
        medium: '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">MEDIUM</span>',
        low: '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">LOW</span>'
    };

    container.innerHTML = filtered.map(t => {
        const escapedTitle = escapeJsSingleQuote(t.title);
        return `
        <div class="p-4 rounded-2xl bg-slate-900/80 border ${t.completed ? 'border-slate-800 opacity-60' : 'border-white/10'} transition-all hover:border-white/20 bloom-subtle-card">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <button type="button" onclick="toggleTask(${t.id})" class="p-1 rounded-lg ${t.completed ? 'bg-rose-500 text-white' : 'border border-slate-600 hover:border-rose-400'}">
                        <i data-lucide="${t.completed ? 'check-square' : 'square'}" class="w-5 h-5"></i>
                    </button>
                    <div>
                        <p class="text-sm font-semibold text-white ${t.completed ? 'line-through text-slate-500' : ''}">${escapeHtml(t.title)}</p>
                        <span class="text-xs text-slate-400">${escapeHtml(t.category)}</span>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    ${priorityBadges[t.priority] || priorityBadges.medium}
                    <button type="button" onclick="deleteTask(${t.id})" class="text-slate-500 hover:text-red-400 p-1">
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

    if (window.lucide) lucide.createIcons();
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
           videoPath: 'videos/balancing-high-school-late-shifts.mp4.mp4',
            podcastPath: 'podcasts/balancing-high-school-late-night-shifts.m4a',
        transcriptPath: 'Studying With a Job_Transcript.txt', // <-- Match the exact full filename in your bucket root!
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

// Clean stray model bracket/asterisk artifacts outside code fences & tables
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
    let processedText = cleaned.replace(/```mermaid\s*([\s\S]*?)```/g, (match, code) => {
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
            : escapeHtml(processedText).replace(/\n/g, '<br>');
    } catch {
        html = escapeHtml(processedText).replace(/\n/g, '<br>');
    }

    html = html
        .replace(/<table>/g, '<div class="my-3 overflow-x-auto rounded-xl border border-white/10"><table class="w-full text-left text-xs border-collapse">')
        .replace(/<\/table>/g, '</table></div>')
        .replace(/<thead>/g, '<thead class="bg-slate-900/90 text-rose-300 uppercase text-[11px]">')
        .replace(/<th>/g, '<th class="p-2.5 border-b border-white/10 font-semibold whitespace-nowrap">')
        .replace(/<td>/g, '<td class="p-2.5 border-b border-white/5 text-slate-200 align-top">')
        .replace(/<h1>/g, '<h1 class="text-lg font-bold text-white mt-3 mb-1.5">')
        .replace(/<h2>/g, '<h2 class="text-base font-bold text-rose-300 mt-3 mb-1.5">')
        .replace(/<h3>/g, '<h3 class="text-sm font-bold text-white mt-2.5 mb-1">')
        .replace(/<ul>/g, '<ul class="list-disc pl-5 my-2 space-y-1">')
        .replace(/<ol>/g, '<ol class="list-decimal pl-5 my-2 space-y-1">')
        .replace(/<p>/g, '<p class="mb-2 last:mb-0">');

    mermaidBlocks.forEach((block, i) => {
        html = html.replace(`%%MERMAID_BLOCK_${i}%%`, block);
    });

    return html;
}

async function renderDiagramsInChat() {
    if (window.mermaid) {
        try {
            await mermaid.run({ querySelector: '#chat-messages .mermaid' });
        } catch (err) {
            console.warn("Diagram render warning:", err);
        }
    }
}

// --- EXPLORE BLOOM AI MULTI-CHAT SYSTEM ---
let currentSessionId = null;
let chatSessions = [];
let isSendingMessage = false;

async function loadChatSessions() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const listContainer = document.getElementById('chat-sessions-list');
    const chatContainer = document.getElementById('chat-messages');

    if (!session) {
        chatSessions = [];
        currentSessionId = null;
        if (listContainer) {
            listContainer.innerHTML = `<p class="text-xs text-slate-400 p-2">Log in to save and switch between chats.</p>`;
        }
        if (chatContainer) {
            chatContainer.innerHTML = `
                <div class="text-center py-12 space-y-3">
                    <p class="text-slate-400 text-sm">Please log in to chat with Bloom AI.</p>
                    <button type="button" onclick="switchTab('auth')" class="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition-colors">
                        Log In Now
                    </button>
                </div>
            `;
        }
        return;
    }

    const { data, error } = await supabaseClient
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading chat sessions:", error);
        return;
    }

    chatSessions = data || [];
    renderChatSessionsList();

    if (chatSessions.length > 0 && !currentSessionId) {
        selectChatSession(chatSessions[0].id);
    } else if (chatSessions.length === 0) {
        await createNewChatSession();
    }
}

function renderChatSessionsList() {
    const listContainer = document.getElementById('chat-sessions-list');
    if (!listContainer) return;

    if (chatSessions.length === 0) {
        listContainer.innerHTML = `<p class="text-xs text-slate-500 px-2 py-1">No chats yet.</p>`;
        return;
    }

    listContainer.innerHTML = chatSessions.map(s => `
        <div onclick="selectChatSession('${escapeJsSingleQuote(s.id)}')" class="group flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${s.id === currentSessionId ? 'bg-rose-500/20 border border-rose-500/40 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}">
            <span class="truncate max-w-[160px]">${escapeHtml(s.title)}</span>
            <button type="button" onclick="deleteChatSession(event, '${escapeJsSingleQuote(s.id)}')" class="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-opacity" title="Delete chat">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

async function createNewChatSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert("Please log in to create a chat.");
        switchTab('auth');
        return;
    }

    const { data, error } = await supabaseClient
        .from('chat_sessions')
        .insert([{ user_id: session.user.id, title: 'New Conversation' }])
        .select()
        .single();

    if (error) {
        console.error("Error creating session:", error);
        return;
    }

    chatSessions.unshift(data);
    selectChatSession(data.id);
    renderChatSessionsList();
}

async function selectChatSession(sessionId) {
    currentSessionId = sessionId;
    renderChatSessionsList();

    const activeSession = chatSessions.find(s => s.id === sessionId);
    const titleEl = document.getElementById('active-chat-title');
    if (titleEl && activeSession) {
        titleEl.innerText = activeSession.title;
    }

    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;

    chatContainer.innerHTML = `<div class="text-center text-xs text-slate-500 py-4">Loading conversation...</div>`;

    const { data, error } = await supabaseClient
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
        chatContainer.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="p-2 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 shrink-0">
                    <i data-lucide="flower-2" class="w-4 h-4"></i>
                </div>
                <div class="bloom-chat-bubble-ai bg-slate-800/80 border border-white/10 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200 text-sm leading-relaxed">
                    Hey there. 👋 I’m Bloom. Ask me anything, upload an image or file, or ask me to create a visual roadmap!
                </div>
            </div>
        `;
    } else {
        chatContainer.innerHTML = data.map(m => {
            if (m.role === 'user') {
                return `
                    <div class="flex items-start justify-end space-x-3">
                        <div class="bg-rose-600 text-white p-4 rounded-2xl rounded-tr-none max-w-[85%] text-sm leading-relaxed shadow-md whitespace-pre-wrap">
                            ${escapeHtml(m.content)}
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="flex items-start space-x-3">
                        <div class="p-2 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 shrink-0">
                            <i data-lucide="flower-2" class="w-4 h-4"></i>
                        </div>
                        <div class="bloom-chat-bubble-ai bg-slate-800/80 border border-white/10 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200 text-sm leading-relaxed">
                            ${formatAiMessageContent(m.content)}
                        </div>
                    </div>
                `;
            }
        }).join('');
    }
    chatContainer.scrollTop = chatContainer.scrollHeight;
    if (window.lucide) lucide.createIcons();
    await renderDiagramsInChat();
}

async function deleteChatSession(event, sessionId) {
    event.stopPropagation();
    if (!confirm("Delete this chat conversation?")) return;

    const { error } = await supabaseClient
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

    if (error) {
        console.error("Error deleting session:", error);
        return;
    }

    chatSessions = chatSessions.filter(s => s.id !== sessionId);
    if (currentSessionId === sessionId) {
        currentSessionId = null;
        if (chatSessions.length > 0) {
            selectChatSession(chatSessions[0].id);
        } else {
            await createNewChatSession();
        }
    } else {
        renderChatSessionsList();
    }
}

function sendQuickPrompt(promptText) {
    const input = document.getElementById('chat-input');
    if (!input) return;
    input.value = promptText;
    handleSendMessage(new Event('submit'));
}

async function handleSendMessage(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (isSendingMessage) return;

    const input = document.getElementById('chat-input');
    const text = input ? input.value.trim() : '';
    if (!text && attachedFiles.length === 0) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert("Please log in to chat.");
        switchTab('auth');
        return;
    }

    if (!currentSessionId) {
        await createNewChatSession();
    }

    const chatContainer = document.getElementById('chat-messages');
    const filesSnapshot = [...attachedFiles];
    const attachedNames = filesSnapshot.map(f => f.name).join(', ');
    const displayPrompt = text
        ? (attachedNames ? `${text} [Attached: ${attachedNames}]` : text)
        : `[Attached: ${attachedNames}]`;

    if (input) input.value = '';
    attachedFiles = [];
    renderAttachmentsPreview();
    isSendingMessage = true;

    if (chatContainer) {
        chatContainer.insertAdjacentHTML('beforeend', `
            <div class="flex items-start justify-end space-x-3">
                <div class="bg-rose-600 text-white p-4 rounded-2xl rounded-tr-none max-w-[85%] text-sm leading-relaxed shadow-md whitespace-pre-wrap">
                    ${escapeHtml(displayPrompt)}
                </div>
            </div>
        `);

        chatContainer.insertAdjacentHTML('beforeend', `
            <div id="bloom-typing-row" class="flex items-start space-x-3">
                <div class="p-2 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 shrink-0">
                    <i data-lucide="flower-2" class="w-4 h-4"></i>
                </div>
                <div class="bloom-chat-bubble-ai bg-slate-800/80 border border-white/10 p-4 rounded-2xl rounded-tl-none text-slate-400 text-sm animate-pulse">
                    Bloom is thinking...
                </div>
            </div>
        `);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        if (window.lucide) lucide.createIcons();
    }

    try {
        await supabaseClient.from('chat_messages').insert([{
            session_id: currentSessionId,
            user_id: session.user.id,
            role: 'user',
            content: displayPrompt
        }]);

        const activeSession = chatSessions.find(s => s.id === currentSessionId);
        if (activeSession && activeSession.title === 'New Conversation' && text) {
            const shortTitle = text.slice(0, 36);
            await supabaseClient
                .from('chat_sessions')
                .update({ title: shortTitle })
                .eq('id', currentSessionId);
            activeSession.title = shortTitle;
            const titleEl = document.getElementById('active-chat-title');
            if (titleEl) titleEl.innerText = shortTitle;
            renderChatSessionsList();
        }

        const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', {
            body: {
                prompt: text || 'Analyze the attached file(s).',
                files: filesSnapshot
            }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));

        const rawReply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text
            || data?.reply
            || "I didn't receive a text response—please try again.";
        const formattedHtml = formatAiMessageContent(rawReply);

        document.getElementById('bloom-typing-row')?.remove();

        if (chatContainer) {
            chatContainer.insertAdjacentHTML('beforeend', `
                <div class="flex items-start space-x-3">
                    <div class="p-2 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 shrink-0">
                        <i data-lucide="flower-2" class="w-4 h-4"></i>
                    </div>
                    <div class="bloom-chat-bubble-ai bg-slate-800/80 border border-white/10 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200 text-sm leading-relaxed">
                        ${formattedHtml}
                    </div>
                </div>
            `);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            if (window.lucide) lucide.createIcons();
            await renderDiagramsInChat();
        }

        await supabaseClient.from('chat_messages').insert([{
            session_id: currentSessionId,
            user_id: session.user.id,
            role: 'assistant',
            content: rawReply
        }]);
    } catch (err) {
        console.error("Chat error:", err);
        document.getElementById('bloom-typing-row')?.remove();
        if (chatContainer) {
            chatContainer.insertAdjacentHTML('beforeend', `
                <div class="flex items-start space-x-3">
                    <div class="p-2 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 shrink-0">
                        <i data-lucide="alert-circle" class="w-4 h-4"></i>
                    </div>
                    <div class="bloom-chat-bubble-ai bg-slate-800/80 border border-rose-500/30 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-rose-300 text-sm">
                        Couldn't complete that request: ${escapeHtml(err.message)}
                    </div>
                </div>
            `);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            if (window.lucide) lucide.createIcons();
        }
    } finally {
        isSendingMessage = false;
    }
}

// --- AUTHENTICATION ---
let isSignUpMode = false;

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    const titleEl = document.getElementById('auth-title');
    const subtitleEl = document.getElementById('auth-subtitle');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleBtn = document.getElementById('auth-toggle-btn');

    if (titleEl) titleEl.innerText = isSignUpMode ? 'Create Your Account' : 'Welcome Back';
    if (subtitleEl) subtitleEl.innerText = isSignUpMode
        ? 'Sign up to save tasks and Bloom AI chats.'
        : 'Sign in to sync your tasks and Bloom AI chats.';
    if (submitBtn) submitBtn.innerText = isSignUpMode ? 'Create Account' : 'Sign In';
    if (toggleBtn) {
        toggleBtn.innerHTML = isSignUpMode
            ? 'Already have an account? <span class="font-bold text-white">Sign In</span>'
            : "Don't have an account? <span class=\"font-bold text-white\">Sign Up</span>";
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email')?.value.trim();
    const password = document.getElementById('auth-password')?.value;
    const errEl = document.getElementById('auth-error');
    const okEl = document.getElementById('auth-success');

    if (errEl) errEl.classList.add('hidden');
    if (okEl) okEl.classList.add('hidden');

    const res = isSignUpMode
        ? await supabaseClient.auth.signUp({ email, password })
        : await supabaseClient.auth.signInWithPassword({ email, password });

    if (res.error) {
        if (errEl) {
            errEl.textContent = res.error.message;
            errEl.classList.remove('hidden');
        }
        return;
    }

    if (isSignUpMode && !res.data.session) {
        if (okEl) {
            okEl.textContent = 'Check your email to confirm your account, then sign in.';
            okEl.classList.remove('hidden');
        }
        return;
    }

    switchTab('home');
}

async function handleForgotPassword() {
    const email = document.getElementById('auth-email')?.value.trim();
    const errEl = document.getElementById('auth-error');
    const okEl = document.getElementById('auth-success');

    if (!email) {
        if (errEl) {
            errEl.textContent = 'Enter your email address first.';
            errEl.classList.remove('hidden');
        }
        return;
    }

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
    if (error && errEl) {
        errEl.textContent = error.message;
        errEl.classList.remove('hidden');
    } else if (okEl) {
        okEl.textContent = 'Password reset link sent to your email.';
        okEl.classList.remove('hidden');
    }
}

async function handleUpdatePassword(e) {
    e.preventDefault();
    const password = document.getElementById('new-password')?.value;
    const errEl = document.getElementById('reset-error');
    const { error } = await supabaseClient.auth.updateUser({ password });
    if (error && errEl) {
        errEl.textContent = error.message;
        errEl.classList.remove('hidden');
    } else {
        document.getElementById('reset-password-form')?.classList.add('hidden');
        document.getElementById('auth-form')?.classList.remove('hidden');
        switchTab('home');
    }
}

async function syncAuthButton() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const btn = document.getElementById('auth-nav-btn');
    if (!btn) return;

    if (session) {
        btn.innerHTML = `<i data-lucide="log-out" class="w-4 h-4"></i><span>Log Out</span>`;
        btn.onclick = async () => {
            await supabaseClient.auth.signOut();
            switchTab('home');
        };
    } else {
        btn.innerHTML = `<i data-lucide="log-in" class="w-4 h-4"></i><span>Log In</span>`;
        btn.onclick = () => switchTab('auth');
    }
    if (window.lucide) lucide.createIcons();
}

// --- FOCUS RADIO ---
let isPlayingMusic = false;

function toggleMusic() {
    const audio = document.getElementById('bg-audio');
    const icon = document.getElementById('music-icon');
    if (!audio) return;

    if (isPlayingMusic) {
        audio.pause();
        isPlayingMusic = false;
        if (icon) icon.setAttribute('data-lucide', 'play');
    } else {
        audio.play().then(() => {
            isPlayingMusic = true;
            if (icon) icon.setAttribute('data-lucide', 'pause');
            if (window.lucide) lucide.createIcons();
        }).catch(err => console.warn('Audio play blocked/error:', err));
    }
    if (window.lucide) lucide.createIcons();
}

function changeStation() {
    const select = document.getElementById('music-station');
    const audio = document.getElementById('bg-audio');
    const source = document.getElementById('bg-audio-source');
    if (!select || !audio || !source) return;

    source.src = select.value;
    audio.load();
    if (isPlayingMusic) {
        audio.play().catch(err => console.warn('Station switch error:', err));
    }
}

function setMusicVolume(val) {
    const audio = document.getElementById('bg-audio');
    if (audio) audio.volume = parseFloat(val);
}

function handleAudioError() {
    isPlayingMusic = false;
    const icon = document.getElementById('music-icon');
    if (icon) icon.setAttribute('data-lucide', 'play');
    if (window.lucide) lucide.createIcons();
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    const taskForm = document.getElementById('task-form');
    if (taskForm) taskForm.addEventListener('submit', handleAddTask);

    const volInput = document.getElementById('music-volume');
    const audio = document.getElementById('bg-audio');
    if (volInput && audio) audio.volume = parseFloat(volInput.value);

    supabaseClient.auth.onAuthStateChange((event) => {
        syncAuthButton();
        if (event === 'PASSWORD_RECOVERY') {
            switchTab('auth');
            document.getElementById('auth-form')?.classList.add('hidden');
            document.getElementById('reset-password-form')?.classList.remove('hidden');
        }
    });

    await syncAuthButton();
    if (window.lucide) lucide.createIcons();
});
