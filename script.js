// BLOOM APPLICATION SCRIPT (2026 EDITION - SUPABASE, GEMINI AI, AUTH, MULTI-CHAT & FOCUS RADIO)

// SUPABASE CONFIGURATION
const SUPABASE_URL = 'https://xmqmrkqyjnbupyalhnib.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7AqK322TINFq1y39lMgvTw_Z7Itc79G';

// Initialize Supabase Client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
                <div class="text-center py-12 bg-slate-900/30 rounded-2xl border border-white/5 space-y-3">
                    <p class="text-slate-400 text-sm">Please log in to view and manage your personal tasks.</p>
                    <button onclick="switchTab('auth')" class="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition-colors">
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

    const newTask = {
        title: titleInput.value,
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
    lucide.createIcons();

    const prompt = `Break down this task into 3 short, actionable, youth-friendly micro-steps to reduce overwhelm: "${taskTitle}". Return only the 3 numbered steps (1., 2., 3.) as plain text lines without markdown bolding.`;

    try {
        const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', {
            body: { prompt: prompt }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));

        const stepsText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "1. Review task details and requirements.\n2. Break it into smaller 10-minute blocks.\n3. Complete the very first small action.";
        const escapedTitle = taskTitle.replace(/'/g, "\\'");

        container.innerHTML = `
            <div class="mt-3 p-3.5 rounded-xl bg-slate-950/90 border border-teal-500/30 text-xs space-y-2 shadow-inner">
                <div class="flex items-center justify-between flex-wrap gap-2">
                    <div class="flex items-center gap-2">
                        <span class="text-teal-400 font-bold flex items-center gap-1">
                            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                            BloomAI Micro-Steps (Do just the first 1):
                        </span>
                        <span class="text-[10px] font-semibold bg-teal-500/15 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">Gemini AI</span>
                    </div>
                    <button onclick="fetchAiMicroSteps('${escapedTitle}', '${elementId}')" class="text-[11px] text-slate-400 hover:text-teal-300 flex items-center gap-1 transition-colors">
                        <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                        <span>Regenerate with AI</span>
                    </button>
                </div>
                <div class="text-slate-200 whitespace-pre-line leading-relaxed pl-1">${stepsText.trim()}</div>
            </div>
        `;
    } catch (err) {
        console.error("Micro-steps error:", err);
        const escapedTitle = taskTitle.replace(/'/g, "\\'");
        container.innerHTML = `
            <div class="mt-2 flex items-center justify-between text-xs text-rose-400">
                <span>AI Error: ${err.message}</span>
                <button onclick="fetchAiMicroSteps('${escapedTitle}', '${elementId}')" class="underline hover:text-rose-300">Retry</button>
            </div>
        `;
    }
    lucide.createIcons();
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
            <div class="text-center py-12 bg-slate-900/30 rounded-2xl border border-white/5">
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
        const escapedTitle = t.title.replace(/'/g, "\\'");
        return `
        <div class="p-4 rounded-2xl bg-slate-900/80 border ${t.completed ? 'border-slate-800 opacity-60' : 'border-white/10'} transition-all hover:border-white/20">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <button onclick="toggleTask(${t.id})" class="p-1 rounded-lg ${t.completed ? 'bg-rose-500 text-white' : 'border border-slate-600 hover:border-rose-400'}">
                        <i data-lucide="${t.completed ? 'check-square' : 'square'}" class="w-5 h-5"></i>
                    </button>
                    <div>
                        <p class="text-sm font-semibold text-white ${t.completed ? 'line-through text-slate-500' : ''}">${t.title}</p>
                        <span class="text-xs text-slate-400">${t.category}</span>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    ${priorityBadges[t.priority]}
                    <button onclick="deleteTask(${t.id})" class="text-slate-500 hover:text-red-400 p-1">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div id="ai-steps-${t.id}" class="mt-2 pt-2 border-t border-white/5">
                <button onclick="fetchAiMicroSteps('${escapedTitle}', 'ai-steps-${t.id}')" class="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1.5 transition-colors">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                    <span>Generate BloomAI Micro-Steps</span>
                </button>
            </div>
        </div>
        `;
    }).join('');

    lucide.createIcons();
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
    const tabs = ['auth', 'home', 'tasks', 'learn', 'chat'];
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

    if (activeView) activeView.classList.remove('hidden');
    if (activeNav) {
        activeNav.classList.add('bg-white/15', 'text-white');
        activeNav.classList.remove('text-slate-400');
    }
    if (activeMNav) {
        activeMNav.classList.add('text-rose-400');
        activeMNav.classList.remove('text-slate-400');
    }

    lucide.createIcons();
}

// LEARNING PLATFORM DATA & SWITCHER
const learningData = {
    career: [
        {
            title: 'Balancing High School & Late Night Shifts',
            desc: 'Practical strategies to communicate with managers about homework deadlines and avoid shift burnout.',
            type: 'Article • 4 min read'
        },
        {
            title: 'Building a Resume with Zero Prior Experience',
            desc: 'How to frame coursework, self-taught tech projects, and resilience into top job applications.',
            type: 'Guide • 6 min read'
        }
    ],
    emotional: [
        {
            title: 'Why Adult Counselors Feel Disconnected & What To Do',
            desc: 'Understanding generational advice gaps and taking ownership of your self-care journey.',
            type: 'Perspective • 5 min read'
        },
        {
            title: 'Overcoming Late-Night Overthinking',
            desc: 'Actionable cognitive exercises when anxiety keeps you up past 2:00 AM.',
            type: 'Mental Health • 3 min read'
        }
    ],
    personal: [
        {
            title: 'The 5-Minute Rule Against Procrastination',
            desc: 'Trick your brain into starting tasks without feeling overwhelmed by big projects.',
            type: 'Habit Builder • 3 min read'
        }
    ],
    destress: [
        {
            title: '4-7-8 Breathing Technique',
            desc: 'Inhale for 4s, hold for 7s, exhale for 8s to instantly lower heart rate.',
            type: 'Interactive Exercise'
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
        <div class="p-6 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-rose-500/40 transition-all flex flex-col justify-between">
            <div>
                <span class="text-xs font-bold text-rose-400 uppercase tracking-wider">${item.type}</span>
                <h3 class="text-lg font-bold text-white mt-2 mb-2">${item.title}</h3>
                <p class="text-slate-400 text-sm leading-relaxed mb-4">${item.desc}</p>
            </div>
            <button onclick="alert('Opening resource guide...')" class="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-colors">
                Read Guide
            </button>
        </div>
    `).join('');
}

// --- EXPLORE BLOOM AI MULTI-CHAT SYSTEM ---
let currentSessionId = null;
let chatSessions = [];

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
                    <button onclick="switchTab('auth')" class="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition-colors">
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
        <div onclick="selectChatSession('${s.id}')" class="group flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${s.id === currentSessionId ? 'bg-rose-500/20 border border-rose-500/40 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}">
            <span class="truncate max-w-[160px]">${s.title}</span>
            <button onclick="deleteChatSession(event, '${s.id}')" class="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-opacity" title="Delete chat">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
        </div>
    `).join('');
    lucide.createIcons();
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

    if (error) {
        console.error("Error loading messages:", error);
        return;
    }

    if (!data || data.length === 0) {
        chatContainer.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="p-2 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300">
                    <i data-lucide="flower-2" class="w-4 h-4"></i>
                </div>
                <div class="bg-slate-800/80 border border-white/10 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200 text-sm leading-relaxed">
                    Hey there. 👋 I’m Bloom. What’s on your mind today?
                </div>
            </div>
        `;
    } else {
        chatContainer.innerHTML = data.map(m => {
            if (m.role === 'user') {
                return `
                    <div class="flex items-start justify-end space-x-3">
                        <div class="bg-rose-600 text-white p-4 rounded-2xl rounded-tr-none max-w-[85%] text-sm leading-relaxed shadow-md">
                            ${m.content}
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="flex items-start space-x-3">
                        <div class="p-2 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300">
                            <i data-lucide="flower-2" class="w-4 h-4"></i>
                        </div>
                        <div class="bg-slate-800/80 border border-white/10 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                            ${m.content}
                        </div>
                    </div>
                `;
            }
        }).join('');
    }
    chatContainer.scrollTop = chatContainer.scrollHeight;
    lucide.createIcons();
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
    document.getElementById('chat-input').value = promptText;
    handleSendMessage(new Event('submit'));
}

async function handleSendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

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

    // Save user message
    await supabaseClient.from('chat_messages').insert([{
        session_id: currentSessionId,
        user_id: session.user.id,
        role: 'user',
        content: text
    }]);

    // AI-generated smart title on the first message
    const activeSession = chatSessions.find(s => s.id === currentSessionId);
    if (activeSession && activeSession.title === 'New Conversation') {
        try {
            const titlePrompt = `Generate a short, punchy 2 to 4 word title summarizing this user question: "${text}". Return ONLY the title text with no quotes, punctuation, or extra words.`;
            const { data: titleData } = await supabaseClient.functions.invoke('gemini-proxy', {
                body: { prompt: titlePrompt }
            });
            const generatedTitle = titleData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || (text.length > 25 ? text.substring(0, 25) + '...' : text);
            
            await supabaseClient.from('chat_sessions').update({ title: generatedTitle }).eq('id', currentSessionId);
            activeSession.title = generatedTitle;
            renderChatSessionsList();
            const titleEl = document.getElementById('active-chat-title');
            if (titleEl) titleEl.innerText = generatedTitle;
        } catch (err) {
            console.warn("Auto-title generation error, using fallback:", err);
            const fallbackTitle = text.length > 25 ? text.substring(0, 25) + '...' : text;
            await supabaseClient.from('chat_sessions').update({ title: fallbackTitle }).eq('id', currentSessionId);
            activeSession.title = fallbackTitle;
            renderChatSessionsList();
        }
    }

    chatContainer.insertAdjacentHTML('beforeend', `
        <div class="flex items-start justify-end space-x-3">
            <div class="bg-rose-600 text-white p-4 rounded-2xl rounded-tr-none max-w-[85%] text-sm leading-relaxed shadow-md">
                ${text}
            </div>
        </div>
    `);
    input.value = '';
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const typingId = 'typing-' + Date.now();
    chatContainer.insertAdjacentHTML('beforeend', `
        <div id="${typingId}" class="flex items-start space-x-3">
            <div class="p-2 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300">
                <i data-lucide="flower-2" class="w-4 h-4 animate-spin"></i>
            </div>
            <div class="bg-slate-800/80 border border-white/10 p-4 rounded-2xl rounded-tl-none text-slate-400 text-sm">
                Bloom is thinking...
            </div>
        </div>
    `);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    lucide.createIcons();

    try {
        const currentDateStr = new Date().toLocaleString();
        const systemPrompt = `You are Bloom, an advanced, deeply supportive, and intelligent AI companion for teenagers and young adults navigating school, jobs, and mental health. Provide rich, detailed, natural, and actionable guidance without robotic placeholders or rigid constraints. Current date and time: ${currentDateStr}.\n\nUser says: ${text}`;

        const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', {
            body: { prompt: systemPrompt }
        });

        document.getElementById(typingId)?.remove();
        if (error) throw error;
        if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));

        const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm right here with you. Take a deep breath!";

        // Save AI reply
        await supabaseClient.from('chat_messages').insert([{
            session_id: currentSessionId,
            user_id: session.user.id,
            role: 'assistant',
            content: aiReply
        }]);

        chatContainer.insertAdjacentHTML('beforeend', `
            <div class="flex items-start space-x-3">
                <div class="p-2 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300">
                    <i data-lucide="flower-2" class="w-4 h-4"></i>
                </div>
                <div class="bg-slate-800/80 border border-white/10 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                    ${aiReply}
                </div>
            </div>
        `);
    } catch (err) {
        document.getElementById(typingId)?.remove();
        console.error("AI Chat Error:", err);
        chatContainer.insertAdjacentHTML('beforeend', `
            <div class="flex items-start space-x-3">
                <div class="p-2 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300">
                    <i data-lucide="alert-circle" class="w-4 h-4"></i>
                </div>
                <div class="bg-slate-800/80 border border-rose-500/30 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-rose-200 text-sm leading-relaxed">
                    Connection error: ${err.message}
                </div>
            </div>
        `);
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;
    lucide.createIcons();
}

    if (!currentSessionId) {
        await createNewChatSession();
    }

    const chatContainer = document.getElementById('chat-messages');

    // Save user message
    await supabaseClient.from('chat_messages').insert([{
        session_id: currentSessionId,
        user_id: session.user.id,
        role: 'user',
        content: text
    }]);

    // Auto-name the chat after the first message
    const activeSession = chatSessions.find(s => s.id === currentSessionId);
    if (activeSession && activeSession.title === 'New Conversation') {
        const newTitle = text.length > 26 ? text.substring(0, 26) + '...' : text;
        await supabaseClient.from('chat_sessions').update({ title: newTitle }).eq('id', currentSessionId);
        activeSession.title = newTitle;
        renderChatSessionsList();
        const titleEl = document.getElementById('active-chat-title');
        if (titleEl) titleEl.innerText = newTitle;
    }

    chatContainer.insertAdjacentHTML('beforeend', `
        <div class="flex items-start justify-end space-x-3">
            <div class="bg-rose-600 text-white p-4 rounded-2xl rounded-tr-none max-w-[85%] text-sm leading-relaxed shadow-md">
                ${text}
            </div>
        </div>
    `);
    input.value = '';
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const typingId = 'typing-' + Date.now();
    chatContainer.insertAdjacentHTML('beforeend', `
        <div id="${typingId}" class="flex items-start space-x-3">
            <div class="p-2 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300">
                <i data-lucide="flower-2" class="w-4 h-4 animate-spin"></i>
            </div>
            <div class="bg-slate-800/80 border border-white/10 p-4 rounded-2xl rounded-tl-none text-slate-400 text-sm">
                Bloom is thinking...
            </div>
        </div>
    `);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    lucide.createIcons();

    try {
        const systemPrompt = `You are Bloom, a warm, empathetic, and modern AI companion for teenagers and young adults navigating school, jobs, and mental health. Keep responses concise, supportive, and practical.\n\nUser says: ${text}`;

        const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', {
            body: { prompt: systemPrompt }
        });

        document.getElementById(typingId)?.remove();
        if (error) throw error;
        if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error));

        const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm right here with you. Take a deep breath!";

        // Save AI reply
        await supabaseClient.from('chat_messages').insert([{
            session_id: currentSessionId,
            user_id: session.user.id,
            role: 'assistant',
            content: aiReply
        }]);

        chatContainer.insertAdjacentHTML('beforeend', `
            <div class="flex items-start space-x-3">
                <div class="p-2 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300">
                    <i data-lucide="flower-2" class="w-4 h-4"></i>
                </div>
                <div class="bg-slate-800/80 border border-white/10 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                    ${aiReply}
                </div>
            </div>
        `);
    } catch (err) {
        document.getElementById(typingId)?.remove();
        console.error("AI Chat Error:", err);
        chatContainer.insertAdjacentHTML('beforeend', `
            <div class="flex items-start space-x-3">
                <div class="p-2 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300">
                    <i data-lucide="alert-circle" class="w-4 h-4"></i>
                </div>
                <div class="bg-slate-800/80 border border-rose-500/30 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-rose-200 text-sm leading-relaxed">
                    Connection error: ${err.message}
                </div>
            </div>
        `);
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;
    lucide.createIcons();
}

// --- SUPABASE AUTHENTICATION & PASSWORD RECOVERY LOGIC ---
let isSignUpMode = false;

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    document.getElementById('auth-title').innerText = isSignUpMode ? 'Create Account' : 'Welcome Back';
    document.getElementById('auth-subtitle').innerText = isSignUpMode
        ? 'Join Bloom to organize your focus and peace of mind.'
        : 'Sign in to sync your tasks and Bloom AI chats.';
    document.getElementById('auth-submit-btn').innerText = isSignUpMode ? 'Sign Up' : 'Sign In';
    document.getElementById('auth-toggle-btn').innerHTML = isSignUpMode
        ? 'Already have an account? <span class="font-bold text-white">Sign In</span>'
        : "Don't have an account? <span class=\"font-bold text-white\">Sign Up</span>";

    const forgotLink = document.getElementById('forgot-pwd-link');
    if (forgotLink) forgotLink.style.display = isSignUpMode ? 'none' : 'inline-block';

    document.getElementById('auth-error').classList.add('hidden');
    document.getElementById('auth-success')?.classList.add('hidden');
}

async function handleForgotPassword() {
    const emailInput = document.getElementById('auth-email');
    const errorBox = document.getElementById('auth-error');
    const successBox = document.getElementById('auth-success');

    errorBox.classList.add('hidden');
    if (successBox) successBox.classList.add('hidden');

    const email = emailInput.value.trim();
    if (!email) {
        errorBox.innerText = 'Please type your email address in the box above first, then click "Forgot password?".';
        errorBox.classList.remove('hidden');
        emailInput.focus();
        return;
    }

    try {
        const redirectUrl = window.location.origin + window.location.pathname;
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl
        });

        if (error) throw error;

        if (successBox) {
            successBox.innerText = 'Password reset link sent! Check your email inbox (and spam folder).';
            successBox.classList.remove('hidden');
        }
    } catch (err) {
        errorBox.innerText = err.message;
        errorBox.classList.remove('hidden');
    }
}

async function handleUpdatePassword(e) {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    const errorBox = document.getElementById('reset-error');
    const submitBtn = document.getElementById('reset-submit-btn');

    errorBox.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Updating...';

    try {
        const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
        if (error) throw error;

        document.getElementById('reset-password-form').classList.add('hidden');
        document.getElementById('auth-form').classList.remove('hidden');
        document.getElementById('auth-footer-toggle').classList.remove('hidden');
        switchTab('tasks');
    } catch (err) {
        errorBox.innerText = err.message;
        errorBox.classList.remove('hidden
