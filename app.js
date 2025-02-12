document.addEventListener('DOMContentLoaded', () => {
  const eventNameInput = document.getElementById('eventName');
  const reminderIntervalSelect = document.getElementById('reminderInterval');
  const saveTaskButton = document.getElementById('saveTask');
  const taskListContainer = document.getElementById('taskList');

  // Load tasks from localStorage or initialize as an empty array
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

  // Save tasks back to localStorage
  function saveTasksToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  // Render all tasks
  function renderTasks() {
  taskListContainer.innerHTML = '';
  tasks.forEach((task, index) => {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';

    const lastDoneDate = new Date(task.lastDone);
    const now = new Date();
    const diffTime = now - lastDoneDate; // Difference in milliseconds

    // Calculate days elapsed
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Calculate hours and minutes elapsed
    const diffTotalMinutes = Math.floor(diffTime / (1000 * 60));
    const hours = Math.floor(diffTotalMinutes / 60);
    const minutes = diffTotalMinutes % 60;
    // Format HH:MM (with leading zeros)
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Update the UI to include both pieces of info:
    // "Last done: X day(s) ago (Time since last click: HH:MM)"
    taskItem.innerHTML = `
      <h3>${task.name}</h3>
      <p>Last done: ${diffDays} day(s) ago (Time since last click: ${formattedTime})</p>
      <p>Reminder interval: ${task.interval} day(s)</p>
      <button data-index="${index}" class="didItAgain">Did It Again</button>
    `;
    taskListContainer.appendChild(taskItem);
  });
}

  // Handle new task creation
  saveTaskButton.addEventListener('click', () => {
    const name = eventNameInput.value.trim();
    if (!name) {
      return alert('Please enter an event name.');
    }

    const interval = parseInt(reminderIntervalSelect.value, 10);
    const task = {
      name,
      interval,
      lastDone: new Date().toISOString()
    };

    tasks.push(task);
    saveTasksToLocalStorage();
    renderTasks();
    eventNameInput.value = ''; // Clear input field
  });

  // Handle "Did It Again" button click to reset timer
  taskListContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('didItAgain')) {
      console.log('Did It Again button clicked, index:', e.target.getAttribute('data-index'));
      const index = e.target.getAttribute('data-index');
      tasks[index].lastDone = new Date().toISOString();
      saveTasksToLocalStorage();
      renderTasks();
    }
  });

  // Initial render on page load
  renderTasks();
});