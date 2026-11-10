const popCultureQuotes = [
    { quote: '"It's not who I am underneath, but what I do that defines me."', author: "Batman Begins (2005)" },
    { quote: '"With great power comes great responsibility."', author: "Spider-Man (2002)" },
    { quote: '"The secret is not thinking about the 400 things you have to do, but taking it one step at a time."', author: "Spider-Man: Into the Spider-Verse" },
    { quote: '"No matter how hard the past is, you can always begin again."', author: "Avatar: The Last Airbender" },
    { quote: '"Our fate lives within us. You only have to be brave enough to see it."', author: "Brave (2012)" },
    { quote: '"Don't let anyone ever make you feel like you don't deserve what you want."', author: "10 Things I Hate About You" }
];

let quoteIndex = 0;

function rotateQuote() {
    const quoteEl = document.getElementById('hero-quote');
    const authorEl = document.getElementById('hero-author');
    
    if (quoteEl && authorEl) {
        quoteEl.style.opacity = '0';
        setTimeout(() => {
            quoteIndex = (quoteIndex + 1) % popCultureQuotes.length;
            quoteEl.textContent = popCultureQuotes[quoteIndex].quote;
            authorEl.textContent = `— ${popCultureQuotes[quoteIndex].author}`;
            quoteEl.style.opacity = '1';
        }, 500);
    }
}

setInterval(rotateQuote, 30000);

function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const activePane = document.getElementById(`${tabId}-tab`);
    if (activePane) activePane.classList.add('active');

    const activeBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.getAttribute('data-tab'));
    });
});

let tasks = JSON.parse(localStorage.getItem('bloom_tasks')) || [
    { id: 1, title: 'Finish history essay rough draft', priority: 'high', completed: false },
    { id: 2, title: 'Check weekend work schedule with manager', priority: 'medium', completed: false },
    { id: 3, title: '5-minute deep breathing break before bed', priority: 'low', completed: false }
];

const taskForm = document.getElementById('task-form');
if (taskForm) {
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleInput = document.getElementById('task-title');
        const priorityInput = document.getElementById('task-priority');

        const newTask = {
            id: Date.now(),
            title: titleInput.value.trim(),
            priority: priorityInput.value,
            completed: false
        };

        tasks.push(newTask);
        saveAndRenderTasks();
        titleInput.value = '';
    });
}

function saveAndRenderTasks() {
    localStorage.setItem('bloom_tasks', JSON.stringify(tasks));
    
    const lists = {
        high: document.getElementById('list-high'),
        medium: document.getElementById('list-medium'),
        low: document.getElementById('list-low')
    };

    const counts = { high: 0, medium: 0, low: 0 };

    Object.values(lists).forEach(list => {
        if (list) list.innerHTML = '';
    });

    tasks.forEach(task => {
        counts[task.priority]++;
        const targetList = lists[task.priority];
        if (!targetList) return;

        const taskEl = document.createElement('div');
        taskEl.className = `task-card-item ${task.completed ? 'completed' : ''}`;
        taskEl.innerHTML = `
            <span>${escapeHtml(task.title)}</span>
            <div class="task-controls">
                <button class="action-icon-btn" onclick="toggleTask(${task.id})" title="Mark Complete">
                    <i data-lucide="${task.completed ? 'rotate-ccw' : 'check'}"></i>
                </button>
                <button class="action-icon-btn" onclick="deleteTask(${task.id})" title="Delete Task">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
        targetList.appendChild(taskEl);
    });

    const countHigh = document.getElementById('count-high');
    const countMed = document.getElementById('count-medium');
    const countLow = document.getElementById('count-low');

    if (countHigh) countHigh.textContent = counts.high;
    if (countMed) countMed.textContent = counts.medium;
    if (countLow) countLow.textContent = counts.low;

    if (window.lucide) lucide.createIcons();
}

window.toggleTask = function(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveAndRenderTasks();
};

window.deleteTask = function(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveAndRenderTasks();
};

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, match => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[match]));
}

const learningResources = [
    { category: 'careers', title: 'Real Career Paths Without a 4-Year Degree', desc: 'Up-to-date guides on tech certifications, trades, and entry-level pathways that actually pay well.', type: 'Article' },
    { category: 'emotional', title: 'Late-Night Anxiety & Overwhelm Reset', desc: 'A quick 4-7-8 guided breathing exercise designed to quiet racing thoughts at 2:00 AM.', type: 'Activity' },
    { category: 'personal', title: 'When Adults Don't Get It: Self-Advocacy', desc: 'How to stand your ground and communicate boundaries when family or counselors give outdated advice.', type: 'Video' },
    { category: 'physical', title: 'Sleep Recovery on 5-6 Hours Schedule', desc: 'Practical sleep hygiene tips for working students who rarely get enough downtime.', type: 'Article' },
    { category: 'careers', title: 'Balancing High School & Part-Time Shifts', desc: 'Practical time-blocking tactics to avoid burnout when you have zero free time.', type: 'Guide' }
];

function renderLearningContent(filter = 'all') {
    const container = document.getElementById('learning-grid');
    if (!container) return;
    
    container.innerHTML = '';
    const filtered = filter === 'all' ? learningResources : learningResources.filter(r => r.category === filter);

    filtered.forEach(res => {
        const card = document.createElement('div');
        card.className = 'learn-card-item';
        card.innerHTML = `
            <div class="learn-card-body">
                <span class="learn-tag">${res.category} • ${res.type}</span>
                <h4>${res.title}</h4>
                <p>${res.desc}</p>
            </div>
            <div class="learn-card-footer">
                <span>Start ${res.type}</span>
                <i data-lucide="arrow-right"></i>
            </div>
        `;
        container.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderLearningContent(btn.getAttribute('data-filter'));
    });
});

const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userMsg = chatInput.value.trim();
        if (!userMsg) return;

        appendMessage(userMsg, 'user-bubble');
        chatInput.value = '';

        setTimeout(() => {
            const reply = generateCompanionResponse(userMsg);
            appendMessage(reply, 'bot-bubble');
        }, 750);
    });
}

function appendMessage(text, bubbleClass) {
    if (!chatMessages) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${bubbleClass}`;
    bubble.innerHTML = `<p>${escapeHtml(text)}</p>`;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateCompanionResponse(msg) {
    const lower = msg.toLowerCase();
    if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('sleep') || lower.includes('burnout')) {
        return "I hear you loud and clear. Working and going to school back-to-back drains everything you have. Don't try to fix your whole life tonight. Can you take 5 minutes to breathe, drink some water, and drop the heavy stuff for right now?";
    } else if (lower.includes('work') || lower.includes('school') || lower.includes('busy') || lower.includes('overwhelmed') || lower.includes('procrastinat')) {
        return "When everything feels like too much, procrastination is usually your brain freezing up from overload. Let's make it stupid simple: go to the Dashboard tab and pick ONE single high-priority task. Just one. What is it?";
    } else if (lower.includes('advice') || lower.includes('counselor') || lower.includes('adult') || lower.includes('lost')) {
        return "Most traditional advice from adults is completely out of touch with how things work today. You aren't doing anything wrong by feeling stuck. What specific choice are you trying to figure out right now?";
    } else {
        return "I'm right here with you, 24/7. No lectures, no judgment. Tell me more about what's making today feel so tough.";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    saveAndRenderTasks();
    renderLearningContent();
});
