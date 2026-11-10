// --- Lofi Audio Player Engine ---
class LofiAudioPlayer {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.volume = 0.35;
    this.timerId = null;
    this.masterGain = null;
    this.noiseNode = null;
  }
  
  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }
  
  startVinylNoise() {
    if (!this.ctx || this.noiseNode) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut * 0.95) + (white * 0.05);
      const crackle = Math.random() > 0.999 ? (Math.random() - 0.5) * 0.3 : 0;
      data[i] = (lastOut * 0.08) + crackle;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 1200;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0.12;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start();
    this.noiseNode = noise;
  }
  
  playChord(frequencies, duration = 3.6) {
    if (!this.ctx || !this.isPlaying) return;
    frequencies.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      const flutter = (Math.random() - 0.5) * 2.5;
      osc.frequency.setValueAtTime(freq + flutter, this.ctx.currentTime);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450 + Math.random() * 100, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + duration);
      
      const now = this.ctx.currentTime;
      oscGain.gain.setValueAtTime(0.0001, now);
      oscGain.gain.linearRampToValueAtTime(0.12 / frequencies.length, now + 0.35);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      
      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + duration);
    });
  }
  
  startSequence() {
    const progressions = [
      [155.56, 196.0, 233.08, 293.66], // Ebmaj7
      [130.81, 196.0, 233.08, 261.63], // Cm7
      [174.61, 207.65, 261.63, 311.13], // Fm7/9
      [116.54, 174.61, 233.08, 293.66], // Bb7/9
    ];
    let chordStep = 0;
    const playNext = () => {
      if (!this.isPlaying) return;
      this.playChord(progressions[chordStep], 3.8);
      chordStep = (chordStep + 1) % progressions.length;
      this.timerId = window.setTimeout(playNext, 4000);
    };
    playNext();
  }
  
  async toggle() {
    this.init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.isPlaying = true;
      this.startVinylNoise();
      this.startSequence();
      return true;
    }
  }
  
  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.noiseNode) {
      try { this.noiseNode.stop(); } catch (e) {}
      this.noiseNode = null;
    }
  }
}

const lofiPlayer = new LofiAudioPlayer();

// --- Data & State ---
const POP_CULTURE_QUOTES = [
  { quote: "That's all it is, Miles. A leap of faith.", source: "Spider-Man: Into the Spider-Verse", category: "Courage" },
  { quote: "You'll have bad times, but it'll always wake you up to the good stuff you weren't paying attention to.", source: "Good Will Hunting", category: "Perspective" },
  { quote: "When I choose to see the good side of things, I'm not being naive. It is strategic and necessary.", source: "Everything Everywhere All At Once", category: "Resilience" },
  { quote: "It ain't about how hard you hit. It's about how hard you can get hit and keep moving forward.", source: "Rocky Balboa", category: "Grit" },
  { quote: "Don't ever let somebody tell you you can't do something. You got a dream, you gotta protect it.", source: "The Pursuit of Happyness", category: "Belief" },
  { quote: "You don't have to carry the whole mountain all at once. Just move the next stone.", source: "Modern Folklore & Cinema", category: "Calm" }
];

let tasks = [
  { id: '1', title: 'Finish history DBQ draft introduction', priority: 'high', completed: false, createdAt: Date.now() - 3600000 },
  { id: '2', title: 'Check work shift schedule for next week', priority: 'medium', completed: false, createdAt: Date.now() - 7200000 },
  { id: '3', title: 'Drink water and take a 10-minute stretch break', priority: 'low', completed: true, createdAt: Date.now() - 10800000 }
];

let chatHistory = [];
let currentTheme = 'aurora';
let isDarkMode = true;
let currentQuoteIdx = 0;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  updateTimeGreeting();
  setInterval(updateTimeGreeting, 60000);
  
  renderTasks();
  refreshQuote(false);
  
  // Lucide icons setup
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Event Listeners
  document.getElementById('lofi-toggle-btn').addEventListener('click', async () => {
    const isNowPlaying = await lofiPlayer.toggle();
    const btnText = document.getElementById('lofi-btn-text');
    btnText.textContent = isNowPlaying ? 'Lofi Radio: Playing' : 'Lofi Radio: Off';
  });

  document.getElementById('theme-menu-btn').addEventListener('click', () => {
    const dropdown = document.getElementById('theme-dropdown');
    dropdown.classList.toggle('hidden');
  });

  document.getElementById('mode-toggle-btn').addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    const htmlEl = document.documentElement;
    const modeIcon = document.getElementById('mode-icon');
    if (isDarkMode) {
      htmlEl.classList.add('dark');
      htmlEl.classList.remove('light');
      modeIcon.setAttribute('data-lucide', 'sun');
    } else {
      htmlEl.classList.remove('dark');
      htmlEl.classList.add('light');
      modeIcon.setAttribute('data-lucide', 'moon');
    }
    lucide.createIcons();
  });

  document.getElementById('add-task-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('new-task-input');
    const prioritySelect = document.getElementById('new-task-priority');
    const val = input.value.trim();
    if (!val) return;

    const newTask = {
      id: Date.now().toString(),
      title: val,
      priority: prioritySelect.value,
      completed: false,
      createdAt: Date.now()
    };
    tasks.unshift(newTask);
    input.value = '';
    renderTasks();
  });

  document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    appendChatMessage('user', message);
    chatHistory.push({ role: 'user', text: message });

    // Show typing indicator
    const typingId = 'typing-' + Date.now();
    appendTypingIndicator(typingId);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: chatHistory })
      });
      const data = await response.json();
      removeElement(typingId);
      const reply = data.reply || "I'm right here with you. Take a slow breath.";
      appendChatMessage('model', reply);
      chatHistory.push({ role: 'model', text: reply });
    } catch (err) {
      removeElement(typingId);
      const fallbackReply = generateLocalChatFallback(message);
      appendChatMessage('model', fallbackReply);
      chatHistory.push({ role: 'model', text: fallbackReply });
    }
  });

  // Close theme dropdown on outside click
  window.addEventListener('click', (e) => {
    const dropdown = document.getElementById('theme-dropdown');
    const btn = document.getElementById('theme-menu-btn');
    if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });
});

// --- Time Greeting Engine ---
function updateTimeGreeting() {
  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 17) greeting = "Good afternoon";
  
  const greetingEl = document.getElementById('time-sync-greeting');
  greetingEl.textContent = `${greeting}, Derick. Take it one step at a time.`;
}

// --- Theme Switcher ---
function setTheme(themeId) {
  currentTheme = themeId;
  const bgContainer = document.getElementById('bg-container');
  const orb1 = document.getElementById('orb-1');
  const orb2 = document.getElementById('orb-2');
  const orb3 = document.getElementById('orb-3');
  
  document.getElementById('theme-dropdown').classList.add('hidden');

  if (themeId === 'aurora') {
    bgContainer.className = "fixed inset-0 overflow-hidden pointer-events-none z-0 transition-colors duration-700 bg-gradient-to-br from-slate-950 via-teal-950/80 to-emerald-950/90";
    orb1.className = "absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl bg-emerald-500/30 transition-all duration-1000 animate-pulse";
    orb2.className = "absolute top-1/2 -right-40 w-96 h-96 rounded-full blur-3xl bg-teal-500/30 transition-all duration-1000";
    orb3.className = "absolute -bottom-40 left-1/3 w-96 h-96 rounded-full blur-3xl bg-cyan-500/25 transition-all duration-1000";
  } else if (themeId === 'twilight') {
    bgContainer.className = "fixed inset-0 overflow-hidden pointer-events-none z-0 transition-colors duration-700 bg-gradient-to-br from-neutral-950 via-indigo-950/80 to-purple-950/90";
    orb1.className = "absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl bg-violet-600/30 transition-all duration-1000 animate-pulse";
    orb2.className = "absolute top-1/2 -right-40 w-96 h-96 rounded-full blur-3xl bg-indigo-500/30 transition-all duration-1000";
    orb3.className = "absolute -bottom-40 left-1/3 w-96 h-96 rounded-full blur-3xl bg-fuchsia-500/25 transition-all duration-1000";
  } else if (themeId === 'sunset') {
    bgContainer.className = "fixed inset-0 overflow-hidden pointer-events-none z-0 transition-colors duration-700 bg-gradient-to-br from-neutral-950 via-rose-950/80 to-amber-950/80";
    orb1.className = "absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl bg-rose-500/30 transition-all duration-1000 animate-pulse";
    orb2.className = "absolute top-1/2 -right-40 w-96 h-96 rounded-full blur-3xl bg-amber-500/30 transition-all duration-1000";
    orb3.className = "absolute -bottom-40 left-1/3 w-96 h-96 rounded-full blur-3xl bg-orange-500/25 transition-all duration-1000";
  } else if (themeId === 'ocean') {
    bgContainer.className = "fixed inset-0 overflow-hidden pointer-events-none z-0 transition-colors duration-700 bg-gradient-to-br from-slate-950 via-blue-950/80 to-cyan-950/80";
    orb1.className = "absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl bg-blue-600/30 transition-all duration-1000 animate-pulse";
    orb2.className = "absolute top-1/2 -right-40 w-96 h-96 rounded-full blur-3xl bg-cyan-500/30 transition-all duration-1000";
    orb3.className = "absolute -bottom-40 left-1/3 w-96 h-96 rounded-full blur-3xl bg-sky-500/25 transition-all duration-1000";
  }
}

// --- Quote Engine ---
function refreshQuote() {
  let newIdx = Math.floor(Math.random() * POP_CULTURE_QUOTES.length);
  if (newIdx === currentQuoteIdx && POP_CULTURE_QUOTES.length > 1) {
    newIdx = (newIdx + 1) % POP_CULTURE_QUOTES.length;
  }
  currentQuoteIdx = newIdx;
  const q = POP_CULTURE_QUOTES[currentQuoteIdx];
  
  document.getElementById('quote-category').textContent = q.category;
  document.getElementById('quote-text').textContent = `"${q.quote}"`;
  document.getElementById('quote-source').textContent = `— ${q.source}`;
}

// --- Task Manager & Micro-Steps ---
function renderTasks() {
  const container = document.getElementById('task-list');
  if (tasks.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-6">No tasks added yet. Add one above to get started!</p>`;
    return;
  }

  container.innerHTML = tasks.map(t => {
    const priorityColor = t.priority === 'high' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : t.priority === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    return `
      <div class="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-black/20 hover:bg-black/30 transition group">
        <div class="flex items-center space-x-3">
          <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask('${t.id}')" class="w-4 h-4 rounded border-white/20 bg-black/40 text-emerald-500 focus:ring-0 cursor-pointer" />
          <span class="text-xs font-medium ${t.completed ? 'line-through text-slate-500' : 'text-slate-200'}">${escapeHtml(t.title)}</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${priorityColor}">${t.priority}</span>
        </div>
        <div class="flex items-center space-x-2">
          <button onclick="openMicroSteps('${escapeHtml(t.title)}')" class="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold transition flex items-center gap-1">
            <i data-lucide="zap" class="w-3 h-3"></i> Micro-Steps
          </button>
          <button onclick="deleteTask('${t.id}')" class="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-rose-400 transition">
            <i data-lucide="trash" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function toggleTask(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
}

async function openMicroSteps(taskTitle) {
  const modal = document.getElementById('micro-modal');
  const titleEl = document.getElementById('modal-task-title');
  const stepsContainer = document.getElementById('modal-steps-container');
  
  titleEl.textContent = `Micro-Steps: ${taskTitle}`;
  stepsContainer.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">Generating 3-minute win steps...</p>`;
  modal.classList.remove('hidden');

  try {
    const res = await fetch('/api/micro-steps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskTitle })
    });
    const data = await res.json();
    const steps = data.steps || generateLocalMicroSteps(taskTitle);
    renderModalSteps(steps);
  } catch (err) {
    const steps = generateLocalMicroSteps(taskTitle);
    renderModalSteps(steps);
  }
}

function renderModalSteps(steps) {
  const stepsContainer = document.getElementById('modal-steps-container');
  stepsContainer.innerHTML = steps.map((step, idx) => `
    <div class="flex items-start space-x-3 p-3 rounded-xl bg-black/30 border border-white/5">
      <div class="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">${idx + 1}</div>
      <p class="text-xs text-slate-300 leading-relaxed">${escapeHtml(step)}</p>
    </div>
  `).join('');
}

function closeMicroModal() {
  document.getElementById('micro-modal').classList.add('hidden');
}

function generateLocalMicroSteps(title) {
  const lower = title.toLowerCase();
  if (lower.includes('essay') || lower.includes('paper') || lower.includes('write')) {
    return [
      "Open your doc or notebook and write just 1 rough sentence—no self-judgment.",
      "Jot down 3 quick bullet points for what each paragraph will discuss.",
      "Take a deep breath and give yourself permission to close the laptop after 5 minutes."
    ];
  }
  return [
    `Set a 5-minute timer and prepare your workspace for "${title}".`,
    "Take on the absolute easiest 10% of the task with zero perfectionism.",
    "Stop or continue: acknowledge that breaking the freeze is 80% of the battle."
  ];
}

// --- Chat Functions ---
function appendChatMessage(role, text) {
  const chatMessages = document.getElementById('chat-messages');
  const isUser = role === 'user';
  
  const div = document.createElement('div');
  div.className = `flex items-start space-x-2 ${isUser ? 'justify-end' : ''}`;
  
  if (!isUser) {
    div.innerHTML = `
      <div class="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">B</div>
      <div class="p-3 rounded-2xl bg-white/10 border border-white/10 text-slate-200 max-w-[85%] space-y-1.5 leading-relaxed">
        <p>${formatChatText(text)}</p>
      </div>
    `;
  } else {
    div.innerHTML = `
      <div class="p-3 rounded-2xl bg-emerald-500 text-slate-950 font-medium max-w-[85%] space-y-1.5 leading-relaxed shadow-md">
        <p>${formatChatText(text)}</p>
      </div>
      <div class="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0">You</div>
    `;
  }
  
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendTypingIndicator(id) {
  const chatMessages = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.id = id;
  div.className = "flex items-start space-x-2";
  div.innerHTML = `
    <div class="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">B</div>
    <div class="p-3 rounded-2xl bg-white/10 border border-white/10 text-slate-400 text-xs flex items-center space-x-1.5">
      <span>BloomAI is thinking</span>
      <span class="animate-bounce">•</span>
      <span class="animate-bounce [animation-delay:0.2s]">•</span>
      <span class="animate-bounce [animation-delay:0.4s]">•</span>
    </div>
  `;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeElement(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function clearChatHistory() {
  chatHistory = [];
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.innerHTML = `
    <div class="flex items-start space-x-2">
      <div class="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">B</div>
      <div class="p-3 rounded-2xl bg-white/10 border border-white/10 text-slate-200 max-w-[85%] space-y-1.5 leading-relaxed">
        <p>Conversation cleared. What would you like to talk about?</p>
      </div>
    </div>
  `;
}

function generateLocalChatFallback(message) {
  const lower = message.toLowerCase();
  if (lower.includes('shift') || lower.includes('work') || lower.includes('boss')) {
    return "Balancing a job outside of school is tough. Remember: you are a student first, and your education comes before any hourly shift. If your hours feel overwhelming, try asking your manager for a slight cap or shift swap well in advance!";
  }
  if (lower.includes('tired') || lower.includes('sleep') || lower.includes('late')) {
    return "Late nights are when everything feels 10x heavier. If it's super late, secure just the minimum for tomorrow, send a polite note to your teacher if needed, and give yourself permission to sleep. You can't pour from an empty cup.";
  }
  return "I hear you loud and clear. Carrying school, work, and life all at once is heavy. Take a slow breath—you only need to handle the next 15 minutes right now. What's one tiny thing on your mind?";
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function formatChatText(text) {
  return escapeHtml(text).replace(/
/g, '<br>');
}
