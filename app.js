document.addEventListener("DOMContentLoaded", () => {
    console.log("Current Notification Permission:", Notification.permission);

    if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
            console.log("Updated Permission:", permission);
            if (permission === "granted") {
                new Notification("Notifications enabled!", {
                    body: "You will now receive reminders.",
                    icon: './icon-192x192.png'
                });
            } else {
                console.warn("User denied notifications.");
            }
        });
    } else if (Notification.permission === "denied") {
        console.error("Notifications are blocked! Enable them in browser settings.");
    }
});

  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

  function saveTasksToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log("Notifications enabled.");
      }
    });
  }

  function renderTasks() {
    taskListContainer.innerHTML = '';
    tasks.forEach((task, index) => {
      const taskItem = document.createElement('div');
      taskItem.className = 'task-item';

      const lastDoneDate = new Date(task.lastDone);
      const now = new Date();
      const diffTime = now - lastDoneDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const diffTotalSeconds = Math.floor(diffTime / 1000);
      const hours = Math.floor(diffTotalSeconds / 3600);
      const minutes = Math.floor((diffTotalSeconds % 3600) / 60);
      const seconds = diffTotalSeconds % 60;
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      taskItem.innerHTML = `
        <h3>${task.name}</h3>
        <p>
          Last done: ${diffDays} day(s) ago (Time since last click:
          <span class="timer" data-index="${index}">${formattedTime}</span>)
        </p>
        <p>Reminder: Every ${task.interval} ${task.unit}(s)</p>
        <button data-index="${index}" class="didItAgain">Did It Again</button>
      `;
      taskListContainer.appendChild(taskItem);
    });
  }

  function updateTimers() {
    document.querySelectorAll('.timer').forEach(timerEl => {
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
      timerEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    });
  }

  function sendNotification(task) {
    if (Notification.permission === "granted") {
      const intervalText = `${task.interval * ((task.notifiedCount || 0) + 1)} ${task.unit}(s)`;

      new Notification("Time's Up!", {
        body: `It's been ${intervalText} since you did: ${task.name}`,
        icon: './icon-192x192.png'
      });
    } else {
      console.log("Notification permission not granted.");
    }
  }

  function checkReminders() {
    tasks.forEach((task, index) => {
      let reminderMillis = task.unit === 'minute' ? task.interval * 60 * 1000 : task.interval * 24 * 60 * 60 * 1000;

      const lastDone = new Date(task.lastDone);
      const now = new Date();
      const diffTime = now - lastDone;
      const intervalsPassed = Math.floor(diffTime / reminderMillis);
      const notifiedCount = task.notifiedCount || 0;

      if (intervalsPassed > notifiedCount) {
        sendNotification(task);
        tasks[index].notifiedCount = intervalsPassed; // Ensure notification count updates
        saveTasksToLocalStorage();
      }
    });
  }

  saveTaskButton.addEventListener('click', () => {
    const name = eventNameInput.value.trim();
    if (!name) return alert('Please enter an event name.');

    const selectedOption = reminderIntervalSelect.options[reminderIntervalSelect.selectedIndex];
    const unit = selectedOption.getAttribute('data-unit'); // Ensure HTML has this!
    const interval = parseFloat(selectedOption.value);

    const task = {
      name,
      interval,
      unit,
      lastDone: new Date().toISOString(),
      notifiedCount: 0
    };

    tasks.push(task);
    saveTasksToLocalStorage();
    renderTasks();
    eventNameInput.value = '';
  });

  taskListContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('didItAgain')) {
      const index = e.target.getAttribute('data-index');
      tasks[index].lastDone = new Date().toISOString();
      tasks[index].notifiedCount = 0;
      saveTasksToLocalStorage();
      renderTasks();
    }
  });

  renderTasks();
  setInterval(updateTimers, 1000);
  setInterval(checkReminders, 10000); // Check reminders every minute (instead of 5 sec)