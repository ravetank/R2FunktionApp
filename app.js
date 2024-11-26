document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const projectInput = document.getElementById('projectInput');
  const addProjectButton = document.getElementById('addProjectButton');
  const projectList = document.getElementById('projectList');
  const taskSection = document.getElementById('taskSection');
  const currentProjectName = document.getElementById('currentProjectName');
  const taskInput = document.getElementById('taskInput');
  const assignedToInput = document.getElementById('assignedToInput');
  const priorityInput = document.getElementById('priorityInput'); // New input for priority
  const deadlineInput = document.getElementById('deadlineInput'); // New input for deadline
  const linkInput = document.getElementById('linkInput');
  const imageInput = document.getElementById('imageInput');
  const addTaskButton = document.getElementById('addTaskButton');
  const todoList = document.getElementById('todoList');
  const inProgressList = document.getElementById('inProgressList');
  const doneList = document.getElementById('doneList');

  const API_BASE_URL = 'https://r2funktionapp.onrender.com'; // Update to your deployed backend URL
  let currentProjectId = null;

  // Helper functions
  async function fetchJSON(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Projects
  async function renderProjects() {
    try {
      const projects = await fetchJSON(`${API_BASE_URL}/projects`);
      projectList.innerHTML = '';
      projects.forEach((project) => {
        const li = document.createElement('li');

        const projectNameSpan = document.createElement('span');
        projectNameSpan.textContent = project.name;
        projectNameSpan.classList.add('project-name');
        projectNameSpan.addEventListener('click', () => loadProject(project._id));

        const projectActions = document.createElement('div');
        projectActions.classList.add('project-actions');

        // View Button
        const viewButton = document.createElement('button');
        viewButton.textContent = 'View';
        viewButton.addEventListener('click', () => loadProject(project._id));
        projectActions.appendChild(viewButton);

        // Delete Button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => deleteProject(project._id));
        projectActions.appendChild(deleteButton);

        li.appendChild(projectNameSpan);
        li.appendChild(projectActions);
        projectList.appendChild(li);
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }

  async function addProject() {
    const projectName = projectInput.value.trim();
    if (projectName) {
      try {
        await fetchJSON(`${API_BASE_URL}/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: projectName, tasks: [] }),
        });
        projectInput.value = '';
        await renderProjects();
      } catch (error) {
        console.error('Error adding project:', error);
      }
    } else {
      alert('Please enter a project name.');
    }
  }

  async function deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await fetchJSON(`${API_BASE_URL}/projects/${projectId}`, {
          method: 'DELETE',
        });
        if (projectId === currentProjectId) {
          // Hide the task section if the current project is deleted
          taskSection.style.display = 'none';
          currentProjectId = null;
        }
        await renderProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  }

  // Tasks
  async function loadProject(projectId) {
    try {
      const project = await fetchJSON(`${API_BASE_URL}/projects/${projectId}`);
      currentProjectName.textContent = project.name;
      currentProjectId = project._id;
      renderTasks(project.tasks);
      taskSection.style.display = 'block';
    } catch (error) {
      console.error('Error loading project:', error);
    }
  }

  async function addTask() {
    const taskName = taskInput.value.trim();
    const assignedTo = assignedToInput.value.trim();
    const priority = priorityInput.value;
    const deadline = deadlineInput.value;
    const link = linkInput.value.trim();
    const imageFile = imageInput.files[0];

    if (taskName && currentProjectId) {
      let imageDataUrl = null;
      if (imageFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          imageDataUrl = e.target.result;
          await saveTask(imageDataUrl);
        };
        reader.readAsDataURL(imageFile);
      } else {
        await saveTask();
      }

      async function saveTask(imageDataUrl) {
        try {
          await fetchJSON(`${API_BASE_URL}/projects/${currentProjectId}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: taskName,
              assignedTo: assignedTo || null,
              priority: priority || 'Medium',
              deadline: deadline || null,
              link: link || null,
              image: imageDataUrl || null,
              status: 'todo',
            }),
          });
          taskInput.value = '';
          assignedToInput.value = '';
          priorityInput.value = 'Medium';
          deadlineInput.value = '';
          linkInput.value = '';
          imageInput.value = '';
          await loadProject(currentProjectId);
        } catch (error) {
          console.error('Error adding task:', error);
        }
      }
    } else {
      alert('Please enter a task name and select a project.');
    }
  }

  function renderTasks(tasks) {
    todoList.innerHTML = '';
    inProgressList.innerHTML = '';
    doneList.innerHTML = '';

    // Sort tasks by priority (High, Medium, Low)
    tasks.sort((a, b) => {
      const priorities = { High: 1, Medium: 2, Low: 3 };
      return priorities[a.priority] - priorities[b.priority];
    });

    tasks.forEach((task) => {
      const li = document.createElement('li');
      li.draggable = true;
      li.dataset.taskId = task._id;

      const taskDetails = document.createElement('div');
      taskDetails.classList.add('task-details');

      const taskName = document.createElement('span');
      taskName.textContent = task.name;
      taskDetails.appendChild(taskName);

      if (task.assignedTo) {
        const assignedTo = document.createElement('span');
        assignedTo.textContent = `Assigned to: ${task.assignedTo}`;
        taskDetails.appendChild(assignedTo);
      }

      if (task.priority) {
        const priority = document.createElement('span');
        priority.textContent = `Priority: ${task.priority}`;
        priority.classList.add(`priority-${task.priority.toLowerCase()}`);
        taskDetails.appendChild(priority);
      }

      if (task.deadline) {
        const deadline = document.createElement('span');
        deadline.textContent = `Deadline: ${new Date(task.deadline).toLocaleDateString()}`;
        taskDetails.appendChild(deadline);
      }

      if (task.link) {
        const link = document.createElement('a');
        link.href = task.link;
        link.textContent = 'View Link';
        link.target = '_blank';
        taskDetails.appendChild(link);
      }

      if (task.image) {
        const img = document.createElement('img');
        img.src = task.image;
        img.classList.add('task-image');
        taskDetails.appendChild(img);
      }

      li.appendChild(taskDetails);

      const taskActions = document.createElement('div');
      taskActions.classList.add('task-actions');

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.classList.add('delete-button');
      deleteButton.addEventListener('click', () => deleteTask(task._id));
      taskActions.appendChild(deleteButton);

      li.appendChild(taskActions);

      // Add drag and drop event listeners
      li.addEventListener('dragstart', handleDragStart);
      li.addEventListener('dragend', handleDragEnd);

      if (task.status === 'todo') {
        todoList.appendChild(li);
      } else if (task.status === 'in-progress') {
        inProgressList.appendChild(li);
      } else if (task.status === 'done') {
        doneList.appendChild(li);
      }
    });

    // Add event listeners to the columns
    const columns = document.querySelectorAll('.kanban-column');
    columns.forEach((column) => {
      column.addEventListener('dragover', handleDragOver);
      column.addEventListener('drop', handleDrop);
    });
  }

  async function deleteTask(taskId) {
    try {
      await fetchJSON(`${API_BASE_URL}/projects/${currentProjectId}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      await loadProject(currentProjectId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  // Drag and Drop Handlers
  let draggedTaskId = null;

  function handleDragStart(e) {
    draggedTaskId = e.target.dataset.taskId;
    e.target.classList.add('dragging');
  }

  function handleDragEnd(e) {
    e.target.classList.remove('dragging');
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  async function handleDrop(e) {
    e.preventDefault();
    const newStatus = e.currentTarget.dataset.status;
    try {
      // Update the task status using the new endpoint
      await fetchJSON(`${API_BASE_URL}/projects/${currentProjectId}/tasks/${draggedTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      await loadProject(currentProjectId);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  }

  // Event listeners
  addProjectButton.addEventListener('click', addProject);
  addTaskButton.addEventListener('click', addTask);

  // Initialize the app
  renderProjects();
});
