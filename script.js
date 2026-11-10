/* ==========================================
   BLOOM - INTERACTIVE LOGIC & STATE ENGINE
   Optimized for All Internet Speeds
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initQuotesRotator();
    initFocusTimer();
    initTaskManager();
    initLearningLibrary();
    initChatbot();
    initBreathingModal();
});

/* 1. Tab Navigation */
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            navButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            btn.classList.add('active');
            const targetEl = document.getElementById(`${targetTab}-tab`);
            if (targetEl) targetEl.classList.add('active');
        });
    });
}

// Global switchTab helper for hero buttons
window.switchTab = function(tabName) {
    const btn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
    if (btn) btn.click();
};

/* 2. Pop Culture Quote Rotator (Every 30 Seconds) */
const quotes = [
    { quote: "It's not about how hard you hit. It's about how hard you can get hit and keep moving forward.", author: "Rocky Balboa" },
    { quote: "Do. Or do not. There is no try.", author: "Yoda, Star Wars" },
    { quote: "Our lives are defined by opportunities, even the ones we miss.", author: "The Curious Case of Benjamin Button" },
    { quote: "It's only after we've lost everything that we're free to do anything.", author: "Fight Club" },
    { quote: "The flower that blooms in adversity is the most rare and beautiful of all.", author: "Mulan" },
    { quote: "Every champion was once a contender that refused to give up.", author: "Rocky Balboa" },
    { quote: "Happiness can be found in the darkest of times, if one only remembers to turn on the light.", author: "Albus Dumbledore, Harry Potter" }
];

function initQuotesRotator() {
    const quoteEl = document.getElementById('inspirationalQuote');
    const authorEl = document.getElementById('quoteAuthor');
    if (!quoteEl || !authorEl) return;

    let currentIndex = 0;

    setInterval(() => {
        quoteEl.style.opacity = 0;
        authorEl.style.opacity = 0;

        setTimeout(() => {
            currentIndex = (currentIndex + 1) % quotes.length;
            quoteEl.textContent = `"${quotes[currentIndex].quote}"`;
            authorEl.textContent = `— ${quotes[currentIndex].author}`;
            quoteEl.style.opacity = 1;
            authorEl.style.opacity = 1;
        }, 300);
    }, 30000); // 30 seconds
}

/* 3. Pomodoro Focus Timer Widget */
let timerInterval = null;
let timeLeft = 25 * 60;
let isRunning = false;

function initFocusTimer() {
    const toggleBtn = document.getElementById('toggleTimerBtn');
    const display = document.getElementById('timerDisplay');
    if (!toggleBtn || !display) return;

    toggleBtn.addEventListener('click', () => {
        if (isRunning) {
            clearInterval(timerInterval);
            isRunning = false;
            toggleBtn.textContent = 'Resume';
            toggleBtn.style.background = 'var(--accent-glow)';
        } else {
            isRunning = true;
            toggleBtn.textContent = 'Pause';
            toggleBtn.style.background = 'var(--danger)';

            timerInterval = setInterval(() => {
                if (timeLeft > 0) {
                    timeLeft--;
                    updateTimerDisplay(display);
                } else {
                    clearInterval(timerInterval);
                    isRunning = false;
                    alert('Focus session complete! Take a well-deserved 5-minute break.');
                    timeLeft = 25 * 60;
                    toggleBtn.textContent = 'Start Focus';
                    updateTimerDisplay(display);
                }
            }, 1000);
        }
    });
}

function updateTimerDisplay(displayEl) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    displayEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/* 4. Task & Priority Manager */
let tasks = [
    { id: 1, title: 'Chemistry Lab Report (Due Thursday)', priority: 'high', category: 'School', completed: false },
    { id: 2, title: 'Evening Shift at Work', priority: 'high', category: 'Work', completed: false },
    { id: 3, title: 'Review Weekly Budget & Savings', priority: 'medium', category: 'Personal', completed: false }
];

function initTaskManager() {
    const taskForm = document.getElementById('taskForm');
    if (!taskForm) return;

    renderTasks();

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleInput = document.getElementById('taskTitle');
        const priorityInput = document.getElementById('taskPriority');
        const categoryInput = document.getElementById('taskCategory');

        const newTask = {
            id: Date.now(),
            title: titleInput.value.trim(),
            priority: priorityInput.value,
            category: categoryInput.value,
            completed: false
        };

        tasks.push(newTask);
        titleInput.value = '';
        renderTasks();
    });
}

window.deleteTask = function(id) {
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
};

window.toggleTaskComplete = function(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        renderTasks();
    }
};

function renderTasks() {
    const highList = document.getElementById('highTaskList');
    const medList = document.getElementById('medTaskList');
    const lowList = document.getElementById('lowTaskList');

    if (!highList || !medList || !lowList) return;

    highList.innerHTML = '';
    medList.innerHTML = '';
    lowList.innerHTML = '';

    let highCount = 0;
    let medCount = 0;
    let lowCount = 0;
    let completedTotal = 0;

    tasks.forEach(task => {
        if (task.completed) completedTotal++;

        const taskEl = document.createElement('div');
        taskEl.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskEl.innerHTML = `
            <div class="task-item-top">
                <span class="task-title" style="${task.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHtml(task.title)}</span>
                <span class="task-cat-tag">${escapeHtml(task.category)}</span>
            </div>
            <div class="task-item-actions">
                <button class="task-btn" onclick="toggleTaskComplete(${task.id})">${task.completed ? 'Undo' : 'Complete'}</button>
                <button class="task-btn delete" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        `;

        if (task.priority === 'high') {
            highList.appendChild(taskEl);
            highCount++;
        } else if (task.priority === 'medium') {
            medList.appendChild(taskEl);
            medCount++;
        } else {
            lowList.appendChild(taskEl);
            lowCount++;
        }
    });

    document.getElementById('highCount').textContent = highCount;
    document.getElementById('medCount').textContent = medCount;
    document.getElementById('lowCount').textContent = lowCount;
    document.getElementById('completedCount').textContent = completedTotal;
    document.getElementById('pendingCount').textContent = tasks.length - completedTotal;
}

/* 5. Learning & Growth Library */
const libraryItems = [
    {
        title: "Breaking the Procrastination Loop When Exhausted",
        category: "emotional",
        badge: "Emotional & Mental",
        desc: "Practical neuroscience insights for teens working long hours who struggle with executive dysfunction late at night.",
        type: "Article • 5 min read"
    },
    {
        title: "Modern Tech Careers: Breaking In Without a Degree in 2026",
        category: "career",
        badge: "Careers & Tech",
        desc: "Up-to-date roadmap covering frontend web development, UI/UX design portfolios, certifications, and networking.",
        type: "Guide & Roadmap"
    },
    {
        title: "60-Second Destressing Box Breathing Routine",
        category: "physical",
        badge: "Physical & Energy",
        desc: "Instant nervous system reset technique used by athletes and high performers before high-stakes moments.",
        type: "Interactive Tool"
    },
    {
        title: "Setting Healthy Boundaries with Family & Roommates",
        category: "personal",
        badge: "Personal Life",
        desc: "How to carve out personal space, quiet time, and emotional peace when sharing a bedroom or living space.",
        type: "Article • 4 min read"
    },
    {
        title: "Managing Burnout While Balancing School & Job",
        category: "career",
        badge: "Careers & Tech",
        desc: "Time blocking strategies specifically tailored for young adults working outside of school hours.",
        type: "Video & Summary"
    },
    {
        title: "Late Night Emotional Overwhelm First Aid",
        category: "emotional",
        badge: "Emotional & Mental",
        desc: "Grounding exercises and zero-judgment reframing for those heavy 2 AM thoughts when nobody else is awake.",
        type: "Guide"
    }
];

function initLearningLibrary() {
    const grid = document.getElementById('libraryGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (!grid) return;

    renderLibraryCards('all');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderLibraryCards(btn.getAttribute('data-filter'));
        });
    });
}

function renderLibraryCards(filter) {
    const grid = document.getElementById('libraryGrid');
    grid.innerHTML = '';

    const filtered = filter === 'all' ? libraryItems : libraryItems.filter(item => item.category === filter);

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'library-card glass-card';
        card.innerHTML = `
            <div class="lib-card-media">
                <span class="lib-badge">${escapeHtml(item.badge)}</span>
                <div style="color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">${escapeHtml(item.type)}</div>
            </div>
            <div class="lib-card-body">
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.desc)}</p>
                <button class="lib-action-btn" onclick="openResourceModal('${escapeHtml(item.title)}')">Read / Explore</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.openResourceModal = function(title) {
    alert(`Opening "${title}" in your reader workspace. Enjoy learning at your own pace!`);
};

/* 6. Bloom Companion Chatbot */
function initChatbot() {
    const chatForm = document.getElementById('chatForm');
    const chatMessages = document.getElementById('chatMessages');
    if (!chatForm) return;

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;

        appendUserMessage(text);
        input.value = '';

        // Simulate intelligent, empathetic companion response
        setTimeout(() => {
            generateBotResponse(text);
        }, 700);
    });
}

window.sendQuickPrompt = function(promptText) {
    const input = document.getElementById('chatInput');
    if (input) {
        input.value = promptText;
        document.getElementById('chatForm').dispatchEvent(new Event('submit'));
    }
};

function appendUserMessage(text) {
    const chatMessages = document.getElementById('chatMessages');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message user-msg';
    msgDiv.innerHTML = `
        <div class="msg-bubble">${escapeHtml(text)}</div>
        <span class="msg-time">${time}</span>
    `;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendBotMessage(text) {
    const chatMessages = document.getElementById('chatMessages');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot-msg';
    msgDiv.innerHTML = `
        <div class="msg-bubble">${escapeHtml(text)}</div>
        <span class="msg-time">${time}</span>
    `;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateBotResponse(userText) {
    const lower = userText.toLowerCase();
    let reply = "I hear you, and it is completely valid to feel that way. When school and work pile up and you're running on empty, remember you don't have to fix everything in one night. What's one tiny step we can take right now to lighten your load?";

    if (lower.includes('overwhelm') || lower.includes('burnt out') || lower.includes('burnout')) {
        reply = "Take a slow, deep breath. Working a job outside of school with zero downtime is brutal. Let's pause for just 60 seconds. You've survived 100% of your hardest days so far. Want to drop all pending low-priority tasks for tonight and focus on just one essential thing?";
    } else if (lower.includes('procrastinat') || lower.includes('energy') || lower.includes('lazy')) {
        reply = "Procrastination isn't laziness—it's emotional exhaustion. When your brain is overloaded, it shuts down to protect you. Try the 5-minute rule: open just one task, set a timer for 5 minutes, and allow yourself to stop right after. Often, starting is the hardest part.";
    } else if (lower.includes('career') || lower.includes('tech') || lower.includes('job') || lower.includes('frontend')) {
        reply = "Breaking into tech and frontend development is an incredible path, especially when you're building real projects like web apps with adaptive interfaces. Focus on mastering HTML, CSS, and modern JavaScript, build 2-3 standout portfolio projects, and keep your GitHub active. You've got this!";
    }

    appendBotMessage(reply);
}

/* 7. Breathing Modal & Utilities */
function initBreathingModal() {
    // modal logic handled via global functions
}

window.openBreathingModal = function() {
    const modal = document.getElementById('breathingModal');
    if (modal) modal.classList.add('active');
};

window.closeBreathingModal = function() {
    const modal = document.getElementById('breathingModal');
    if (modal) modal.classList.remove('active');
};

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
