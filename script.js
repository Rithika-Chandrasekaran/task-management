// TaskFlow – Smart Task Management

const STORAGE_KEY = 'taskflow.tasks';

const taskInput = document.getElementById('taskInput');
const taskPriority = document.getElementById('taskPriority');
const taskDueDate = document.getElementById('taskDueDate');
const addTaskBtn = document.getElementById('addTaskBtn');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const taskList = document.getElementById('taskList');
const emptyMessage = document.getElementById('emptyMessage');
const statusMessage = document.getElementById('statusMessage');
const totalTasksEl = document.getElementById('totalTasks');
const completedTasksEl = document.getElementById('completedTasks');
const pendingTasksEl = document.getElementById('pendingTasks');
const highPriorityTasksEl = document.getElementById('highPriorityTasks');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('searchInput');
const sortTasks = document.getElementById('sortTasks');
const themeToggleBtn = document.getElementById('themeToggleBtn');

let tasks = [];
let currentFilter = 'all';
let currentSort = 'newest';
let currentTheme = localStorage.getItem('taskflow.theme') || 'light';

function showStatus(message, type = '') {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message';

  if (type) {
    statusMessage.classList.add(type);
  }
}

function clearInput() {
  taskInput.value = '';
  taskPriority.value = 'Medium';
  taskDueDate.value = '';
  taskInput.focus();
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  const storedTasks = localStorage.getItem(STORAGE_KEY);

  if (!storedTasks) {
    tasks = [];
    return;
  }

  try {
    const parsedTasks = JSON.parse(storedTasks);
    tasks = Array.isArray(parsedTasks) ? parsedTasks : [];
  } catch (error) {
    tasks = [];
    console.error('Unable to parse saved tasks:', error);
  }
}

function getPriorityRank(priority) {
  const priorityOrder = { High: 3, Medium: 2, Low: 1 };
  return priorityOrder[priority] || 0;
}

function sortTasksList(taskArray) {
  const sortedTasks = [...taskArray];

  sortedTasks.sort((a, b) => {
    if (currentSort === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }

    if (currentSort === 'priority') {
      const priorityDiff = getPriorityRank(b.priority) - getPriorityRank(a.priority);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    }

    if (currentSort === 'dueDate') {
      const aDate = a.dueDate ? new Date(`${a.dueDate}T00:00:00`) : new Date(8640000000000000);
      const bDate = b.dueDate ? new Date(`${b.dueDate}T00:00:00`) : new Date(8640000000000000);
      return aDate - bDate;
    }

    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return sortedTasks;
}

function getFilteredTasks() {
  let filteredTasks = tasks;

  if (currentFilter === 'pending') {
    filteredTasks = filteredTasks.filter((task) => !task.completed);
  }

  if (currentFilter === 'completed') {
    filteredTasks = filteredTasks.filter((task) => task.completed);
  }

  const searchTerm = searchInput.value.trim().toLowerCase();

  if (searchTerm) {
    filteredTasks = filteredTasks.filter((task) =>
      task.text.toLowerCase().includes(searchTerm) ||
      task.priority.toLowerCase().includes(searchTerm)
    );
  }

  return sortTasksList(filteredTasks);
}

function updateStatistics() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const highPriority = tasks.filter((task) => task.priority === 'High').length;

  totalTasksEl.textContent = total;
  completedTasksEl.textContent = completed;
  pendingTasksEl.textContent = pending;
  highPriorityTasksEl.textContent = highPriority;
}

function showEmptyState(filteredTasksCount) {
  if (filteredTasksCount === 0) {
    emptyMessage.classList.add('visible');
  } else {
    emptyMessage.classList.remove('visible');
  }
}

function formatDueDate(dueDate) {
  if (!dueDate) {
    return 'No due date';
  }

  const date = new Date(`${dueDate}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();
  taskList.innerHTML = '';

  filteredTasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.dataset.id = String(task.id);

    const main = document.createElement('div');
    main.className = 'task-main';

    const checkbox = document.createElement('button');
    checkbox.type = 'button';
    checkbox.className = 'task-check';
    checkbox.setAttribute('aria-label', task.completed ? 'Mark task as pending' : 'Mark task as completed');
    checkbox.textContent = task.completed ? '✓' : '';
    checkbox.addEventListener('click', () => toggleTask(task.id));

    const content = document.createElement('div');
    content.className = 'task-content';

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    const meta = document.createElement('div');
    meta.className = 'task-meta';

    const priorityBadge = document.createElement('span');
    priorityBadge.className = `priority-badge ${task.priority.toLowerCase()}`;
    priorityBadge.textContent = task.priority;

    const dateBadge = document.createElement('span');
    dateBadge.className = 'task-date';
    dateBadge.textContent = formatDueDate(task.dueDate);

    meta.appendChild(priorityBadge);
    meta.appendChild(dateBadge);
    content.appendChild(text);
    content.appendChild(meta);

    main.appendChild(checkbox);
    main.appendChild(content);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'edit-btn';
    editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
    editBtn.textContent = '✎';
    editBtn.addEventListener('click', () => editTask(task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(main);
    li.appendChild(actions);
    taskList.appendChild(li);
  });

  showEmptyState(filteredTasks.length);
  updateStatistics();
}

function addTask() {
  const taskText = taskInput.value.trim();
  const priority = taskPriority.value;
  const dueDate = taskDueDate.value;

  if (!taskText) {
    showStatus('Please enter a valid task before adding.', 'error');
    clearInput();
    return;
  }

  const newTask = {
    id: Date.now() + Math.random(),
    text: taskText,
    completed: false,
    priority,
    dueDate,
    createdAt: new Date().toISOString(),
  };

  tasks.unshift(newTask);
  saveTasks();
  renderTasks();
  clearInput();
  showStatus('Task added successfully!', 'success');
}

function editTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return;
  }

  const updatedText = window.prompt('Update task:', task.text);

  if (updatedText === null) {
    return;
  }

  const trimmedText = updatedText.trim();

  if (!trimmedText) {
    showStatus('Task cannot be empty.', 'error');
    return;
  }

  tasks = tasks.map((item) =>
    item.id === taskId ? { ...item, text: trimmedText } : item
  );

  saveTasks();
  renderTasks();
  showStatus('Task updated successfully!', 'success');
}

function toggleTask(taskId) {
  tasks = tasks.map((task) => {
    if (task.id === taskId) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });

  saveTasks();
  renderTasks();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderTasks();
  showStatus('Task deleted.', 'success');
}

function clearCompletedTasks() {
  const remainingTasks = tasks.filter((task) => !task.completed);

  if (remainingTasks.length === tasks.length) {
    showStatus('No completed tasks to clear.', 'success');
    return;
  }

  tasks = remainingTasks;
  saveTasks();
  renderTasks();
  showStatus('Completed tasks cleared.', 'success');
}

function applyTheme() {
  document.body.classList.toggle('dark-theme', currentTheme === 'dark');
  themeToggleBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('taskflow.theme', currentTheme);
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme();
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle('active', isActive);
  });
}

function initializeApp() {
  loadTasks();
  updateFilterButtons();
  applyTheme();
  renderTasks();
}

addTaskBtn.addEventListener('click', addTask);

themeToggleBtn.addEventListener('click', toggleTheme);

searchInput.addEventListener('input', () => {
  renderTasks();
});

sortTasks.addEventListener('change', (event) => {
  currentSort = event.target.value;
  renderTasks();
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    updateFilterButtons();
    renderTasks();
  });
});

clearCompletedBtn.addEventListener('click', clearCompletedTasks);

taskInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addTask();
  }
});

document.addEventListener('DOMContentLoaded', initializeApp);
