// BLOOM APPLICATION SCRIPT (2026 EDITION)
// SUPABASE CONFIGURATION
const SUPABASE_URL = 'https://xmqmrkqyjnbupyalhnib.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7AqK322TINFq1y39lMgvTw_Z7Itc79G';

// Initialize Supabase Client
const supabaseClient = window.supabase.createClient(:https://xmqmrkqyjnbupyalhnib.supabase.co
                                                    , sb_publishable_7AqK322TINFq1y39lMgvTw_Z7Itc79G);

// --- UPDATED TASK MANAGEMENT WITH SUPABASE ---
let tasks = [];
let currentFilter = 'all';

async function fetchTasks() {
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
    const title = document.getElementById('task-title').value;
    const priority = document.getElementById('task-priority').value;
    const category = document.getElementById('task-category').value;

    const { error } = await supabaseClient
        .from('tasks')
        .insert([{ title, priority, category, completed: false }]);

    if (error) {
        console.error('Error adding task:', error);
        return;
    }

    document.getElementById('task-title').value = '';
    fetchTasks();
}

async function toggleTask(id, currentStatus) {
    const { error } = await supabaseClient
        .from('tasks')
        .update({ completed: !currentStatus })
        .eq('id', id);

    if (error) console.error('Error updating task:', error);
    fetchTasks();
}

async function deleteTask(id) {
    const { error } = await supabaseClient
        .from('tasks')
        .delete()
        .eq('id', id);

    if (error) console.error('Error deleting task:', error);
    fetchTasks();
}

// Make sure to call fetchTasks() on DOM load instead of local storage
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    fetchTasks();
    switchCategory('career');
});
// 1. POP CULTURE / MOVIE INSPIRATIONAL QUOTES (30s Rotation)
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

// Rotate quotes every 30 seconds
setInterval(rotateQuotes, 30000);

// 2. TAB NAVIGATION SYSTEM
function switchTab(tabId) {
    const tabs = ['home', 'tasks', 'learn', 'chat'];
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

// 3. TASK MANAGEMENT SYSTEM
let tasks = JSON.parse(localStorage.getItem('bloom_tasks')) || [
    { id: 1, title: 'Submit AP History Essay draft', priority: 'high', category: 'School', completed: false },
    { id: 2, title: 'Confirm shift coverage for Friday night', priority: 'medium', category: 'Job', completed: false },
    { id: 3, title: '5-minute guided breathing session', priority: 'low', category: 'Personal', completed: true }
];

let currentFilter = 'all';

function saveTasks() {
    localStorage.setItem('bloom_tasks', JSON.stringify(tasks));
    renderTasks();
}

function handleAddTask(e) {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const priority = document.getElementById('task-priority').value;
    const category = document.getElementById('task-category').value;

    tasks.push({
        id: Date.now(),
        title,
        priority,
        category,
        completed: false
    });

    document.getElementById('task-title').value = '';
    saveTasks();
}

function toggleTask(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
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

function renderTasks() {
    const container = document.getElementById('tasks-container');
    if (!container) return;

    let filtered = tasks;
    if (currentFilter !== 'all') {
        filtered = tasks.filter(t => t.priority === currentFilter);
    }

    // Update Progress
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

    container.innerHTML = filtered.map(t => `
        <div class="p-4 rounded-2xl bg-slate-900/80 border ${t.completed ? 'border-slate-800 opacity-60' : 'border-white/10'} flex items-center justify-between transition-all hover:border-white/20">
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
    `).join('');

    lucide.createIcons();
}

// 4. LEARNING PLATFORM DATA & SWITCHER
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

// 5. BLOOM AI CHATBOT INTERACTION
function sendQuickPrompt(promptText) {
    document.getElementById('chat-input').value = promptText;
    handleSendMessage(new Event('submit'));
}

function handleSendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    const chatContainer = document.getElementById('chat-messages');

    // Add User Message
    const userMsgHtml = `
        <div class="flex items-start justify-end space-x-3">
            <div class="bg-rose-600 text-white p-4 rounded-2xl rounded-tr-none max-w-[85%] text-sm leading-relaxed shadow-md">
                ${text}
            </div>
        </div>
    `;
    chatContainer.insertAdjacentHTML('beforeend', userMsgHtml);
    input.value = '';
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Simulate AI Dynamic Response
    setTimeout(() => {
        let aiReply = "I hear you. Balancing everything right now sounds tough, but taking things one step at a time makes a huge difference. You're doing better than you think!";
        
        if (text.toLowerCase().includes('exhausted') || text.toLowerCase().includes('job')) {
            aiReply = "Balancing school assignments with long work hours is exhausting. Make sure to schedule at least 15 uninterrupted minutes for yourself tonight without any screens or tasks.";
        } else if (text.toLowerCase().includes('understand')) {
            aiReply = "It's really hard when adults give advice that feels disconnected from your daily reality. Remember, your struggles are valid, and you have full control over how you build your future step by step.";
        }

        const aiMsgHtml = `
            <div class="flex items-start space-x-3">
                <div class="p-2 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300">
                    <i data-lucide="flower-2" class="w-4 h-4"></i>
                </div>
                <div class="bg-slate-800/80 border border-white/10 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200 text-sm leading-relaxed">
                    ${aiReply}
                </div>
            </div>
        `;
        chatContainer.insertAdjacentHTML('beforeend', aiMsgHtml);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        lucide.createIcons();
    }, 800);
}

// INITIALIZATION ON DOM LOAD
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    renderTasks();
    switchCategory('career');
});
