document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');

    // Load saved tasks from localStorage if any
    const savedTasks = JSON.parse(localStorage.getItem('youth_tasks')) || [
        { text: 'Complete resume review with career coach', completed: false },
        { text: 'Review CompTIA A+ study notes', completed: true }
    ];

    function renderTasks() {
        taskList.innerHTML = '';
        savedTasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.textContent = task.text;
            if (task.completed) {
                li.classList.add('completed');
            }

            li.addEventListener('click', () => {
                task.completed = !task.completed;
                saveAndRender();
            });

            taskList.appendChild(li);
        });
    }

    function saveAndRender() {
        localStorage.setItem('youth_tasks', JSON.stringify(savedTasks));
        renderTasks();
    }

    addTaskBtn.addEventListener('click', () => {
        const text = taskInput.value.trim();
        if (text) {
            savedTasks.push({ text, completed: false });
            taskInput.value = '';
            saveAndRender();
        }
    });

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTaskBtn.click();
        }
    });

    renderTasks();
});
