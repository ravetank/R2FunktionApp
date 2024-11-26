require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1); // Exit the app if the database connection fails
  });

// Define the Task schema
const TaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  assignedTo: String, // In future, this can reference a User model
  link: String,
  image: String,
  status: { type: String, default: 'todo', enum: ['todo', 'in-progress', 'done'] },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  deadline: Date,
}, { timestamps: true });

// Define the Project schema
const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tasks: [TaskSchema],
}, { timestamps: true });

// Create the Project model
const Project = mongoose.model('Project', ProjectSchema);

// Routes

// Get all projects
app.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single project by ID
app.get('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (err) {
    console.error('Error fetching project:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new project
app.post('/projects', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = new Project({ name, tasks: [] });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error('Error creating project:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a project by ID (used for updating tasks)
app.put('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProject = req.body;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await Project.findByIdAndUpdate(id, updatedProject, { new: true });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (err) {
    console.error('Error updating project:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a project by ID
app.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await Project.findByIdAndDelete(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Error deleting project:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a task to a project
app.post('/projects/:id/tasks', async (req, res) => {
  try {
    const { id } = req.params;
    const task = req.body;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    if (!task.name) {
      return res.status(400).json({ error: 'Task name is required' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.tasks.push(task);
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error('Error adding task:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a task within a project
app.put('/projects/:projectId/tasks/:taskId', async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const updatedTask = req.body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: 'Invalid project or task ID' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update task fields
    Object.assign(task, updatedTask);
    await project.save();
    res.json(project);
  } catch (err) {
    console.error('Error updating task:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a task from a project
app.delete('/projects/:projectId/tasks/:taskId', async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: 'Invalid project or task ID' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.remove();
    await project.save();
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Default error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
