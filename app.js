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

  // Request notification permission (if not already granted)
  if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log("Notification permission granted.");
      }
    });
  }

  // Render all tasks (with a dedicated timer element)
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

      // Calculate total seconds elapsed, then derive hours, minutes, and seconds
      const diffTotalSeconds = Math.floor(diffTime / 1000);
      const hours = Math.floor(diffTotalSeconds / 3600);
      const minutes = Math.floor((diffTotalSeconds % 3600) / 60);
      const seconds = diffTotalSeconds % 60;
      // Format HH:MM:SS (with leading zeros)
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      taskItem.innerHTML = `
        <h3>${task.name}</h3>
        <p>
          Last done: ${diffDays} day(s) ago (Time since last click:
          <span class="timer" data-index="${index}">${formattedTime}</span>)
        </p>
        <p>Reminder interval: ${task.interval} day(s)</p>
        <button data-index="${index}" class="didItAgain">Did It Again</button>
      `;
      taskListContainer.appendChild(taskItem);
    });
  }

  // Function to update only the timer elements live
  function updateTimers() {
    const timerElements = document.querySelectorAll('.timer');
    timerElements.forEach(timerEl => {
      const index = timerEl.getAttribute('data-index');
      const task = tasks[index];
      if (!task) return;
      const lastDoneDate = new Date(task.lastDone);
      const now = new Date();
      const diffTime = now - lastDoneDate;
      const diffTotalSeconds = Math.floor(diffTime / 1000);
      const hours = Math.floor(diffTotalSeconds / 3600);
      const minutes = Math.floor((diffTotalSeconds % 3600) / 60);
      const seconds = diffTotalSeconds % 60;
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      timerEl.textContent = formattedTime;
    });
  }

  // Function to send a notification for a given task
  function sendNotification(task) {
    if (Notification.permission === "granted") {
      new Notification("Time's Up!", {
        body: `It's been ${(task.interval * ((task.notifiedCount || 0) + 1))} day(s) since you did: ${task.name}`,
        icon: './icon-192x192.png'
      });
    } else {
      console.log("Notification permission not granted.");
    }
  }

  // Function to check if tasks are overdue and send notifications
  function checkReminders() {
  tasks.forEach((task, index) => {
    let reminderMillis;
    if (task.unit === 'minute') {
      // Convert minutes to milliseconds
      reminderMillis = task.interval * 60 * 1000;
    } else {
      // Assume 'day' unit (or extend with other units as needed)
      reminderMillis = task.interval * 24 * 60 * 60 * 1000;
    }

    const lastDone = new Date(task.lastDone);
    const now = new Date();
    const diffTime = now - lastDone;

    // Calculate how many full intervals have passed
    const intervalsPassed = Math.floor(diffTime / reminderMillis);
    const notifiedCount = task.notifiedCount || 0;

    if (intervalsPassed > notifiedCount) {
      sendNotification(task);
      // Update notifiedCount so that a notification is sent only once per interval passage
      task.notifiedCount = intervalsPassed;
      saveTasksToLocalStorage();
    }
  });
}

  // Handle new task creation
saveTaskButton.addEventListener('click', () => {
  const name = eventNameInput.value.trim();
  if (!name) {
    return alert('Please enter an event name.');
  }

  // Get the selected option and its unit
  const selectedOption = reminderIntervalSelect.options[reminderIntervalSelect.selectedIndex];
  const unit = selectedOption.getAttribute('data-unit'); // "day" or "minute"
  const interval = parseFloat(selectedOption.value); // use parseFloat in case you have fractional values in the future

  const task = {
    name,
    interval,
    unit,
    lastDone: new Date().toISOString(),
    notifiedCount: 0  // Initialize notification counter
  };

  tasks.push(task);
  saveTasksToLocalStorage();
  renderTasks();
  eventNameInput.value = ''; // Clear input field
});

  // Handle "Did It Again" button click to reset timer
  taskListContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('didItAgain')) {
      const index = e.target.getAttribute('data-index');
      // Reset the lastDone and the notification counter
      tasks[index].lastDone = new Date().toISOString();
      tasks[index].notifiedCount = 0;
      saveTasksToLocalStorage();
      renderTasks();
    }
  });

  // Initial render on page load
  renderTasks();

  // Update the timer display every second
  setInterval(updateTimers, 1000);

  // Check reminders every minute (adjust as needed)
  setInterval(checkReminders, 60000);
});