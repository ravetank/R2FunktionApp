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

    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    let currentProjectIndex = null;

    function saveProjects() {
        localStorage.setItem('projects', JSON.stringify(projects));
    }

    function renderProjects() {
        projectList.innerHTML = '';
        projects.forEach((project, index) => {
            const li = document.createElement('li');
            li.textContent = project.name;
            projectList.appendChild(li);
        });
    }

    function renderTasks(tasks) {
        todoList.innerHTML = '';
        inProgressList.innerHTML = '';
        doneList.innerHTML = '';

        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.draggable = true;
            li.dataset.taskIndex = index;

            li.addEventListener('dragstart', dragStart);
            li.addEventListener('dragend', dragEnd);

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
            taskActions.appendChild(deleteButton);

            li.appendChild(taskActions);

            // Append to the correct column
            if (task.status === 'todo') {
                todoList.appendChild(li);
            } else if (task.status === 'in-progress') {
                inProgressList.appendChild(li);
            } else if (task.status === 'done') {
                doneList.appendChild(li);
            }
        });
    }

    function addProject() {
        const projectName = projectInput.value.trim();
        if (projectName) {
            projects.push({ name: projectName, tasks: [] });
            saveProjects();
            projectInput.value = '';
            renderProjects();
        } else {
            alert('Please enter a project name.');
        }
    }

    function addTask() {
        const taskName = taskInput.value.trim();
        const assignedTo = assignedToInput.value.trim();
        const link = linkInput.value.trim();
        const imageFile = imageInput.files[0];

        if (taskName) {
            let imageDataUrl = null;
            if (imageFile) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imageDataUrl = e.target.result;
                    saveTask(imageDataUrl);
                };
                reader.readAsDataURL(imageFile);
            } else {
                saveTask();
            }

            function saveTask(imageDataUrl) {
                projects[currentProjectIndex].tasks.push({
                    name: taskName,
                    assignedTo: assignedTo || null,
                    link: link || null,
                    image: imageDataUrl || null,
                    status: 'todo',
                });
                saveProjects();
                taskInput.value = '';
                assignedToInput.value = '';
                linkInput.value = '';
                imageInput.value = '';
                renderTasks(projects[currentProjectIndex].tasks);
            }
        } else {
            alert('Please enter a task name.');
        }
    }

    // Event listeners
    addProjectButton.addEventListener('click', addProject);

    projectList.addEventListener('click', (event) => {
        if (event.target.tagName === 'LI') {
            const projectName = event.target.textContent;
            currentProjectIndex = projects.findIndex(p => p.name === projectName);
            taskSection.style.display = 'block';
            currentProjectName.textContent = projectName;
            renderTasks(projects[currentProjectIndex].tasks);
        }
    });

    addTaskButton.addEventListener('click', () => {
        if (currentProjectIndex !== null) {
            addTask();
        } else {
            alert('Please select a project first.');
        }
    });

    // Delete task
    document.getElementById('kanbanBoard').addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-button')) {
            const taskIndex = event.target.closest('li').dataset.taskIndex;
            projects[currentProjectIndex].tasks.splice(taskIndex, 1);
            saveProjects();
            renderTasks(projects[currentProjectIndex].tasks);
        }
    });

    // Drag and Drop functionality
    function dragStart(event) {
        event.dataTransfer.setData('text/plain', event.target.dataset.taskIndex);
        event.dataTransfer.effectAllowed = 'move';
        event.target.classList.add('dragging');
    }

    function dragEnd(event) {
        event.target.classList.remove('dragging');
    }

    const kanbanColumns = document.querySelectorAll('.kanban-column');

    kanbanColumns.forEach(column => {
        const ul = column.querySelector('.task-list');
        ul.addEventListener('dragover', dragOver);
        ul.addEventListener('drop', drop);
    });

    function dragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }

    function drop(event) {
        event.preventDefault();
        const taskIndex = event.dataTransfer.getData('text/plain');
        const newStatus = event.target.closest('.kanban-column').dataset.status;

        projects[currentProjectIndex].tasks[taskIndex].status = newStatus;
        saveProjects();
        renderTasks(projects[currentProjectIndex].tasks);
    }

    // Initialize the app
    renderProjects();
});
