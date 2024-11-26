document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const projectInput = document.getElementById('projectInput');
    const addProjectButton = document.getElementById('addProjectButton');
    const projectList = document.getElementById('projectList');
    const taskSection = document.getElementById('taskSection');
    const currentProjectName = document.getElementById('currentProjectName');
    const taskInput = document.getElementById('taskInput');
    const assignedToInput = document.getElementById('assignedToInput');
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
                li.textContent = project.name;
                li.addEventListener('click', () => loadProject(project._id));
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
                            link: link || null,
                            image: imageDataUrl || null,
                            status: 'todo',
                        }),
                    });
                    taskInput.value = '';
                    assignedToInput.value = '';
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

        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.draggable = true;
            li.dataset.taskIndex = index;

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
            deleteButton.addEventListener('click', () => deleteTask(index));
            taskActions.appendChild(deleteButton);

            li.appendChild(taskActions);

            if (task.status === 'todo') {
                todoList.appendChild(li);
            } else if (task.status === 'in-progress') {
                inProgressList.appendChild(li);
            } else if (task.status === 'done') {
                doneList.appendChild(li);
            }
        });
    }

    async function deleteTask(taskIndex) {
        try {
            const project = await fetchJSON(`${API_BASE_URL}/projects/${currentProjectId}`);
            project.tasks.splice(taskIndex, 1);
            await fetchJSON(`${API_BASE_URL}/projects/${currentProjectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(project),
            });
            await loadProject(currentProjectId);
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }

    // Event listeners
    addProjectButton.addEventListener('click', addProject);
    addTaskButton.addEventListener('click', addTask);

    // Initialize the app
    renderProjects();
});
