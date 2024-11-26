require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1); // Exit the app if the database connection fails
  });

// Define the Project schema
const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tasks: [
    {
      name: { type: String, required: true },
      assignedTo: String,
      link: String,
      image: String,
      status: { type: String, default: 'todo' },
    },
  ],
}, { timestamps: true }); // Add timestamps for createdAt and updatedAt

// Create the Project model
const Project = mongoose.model('Project', ProjectSchema);

// Routes
app.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/projects', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = new Project(req.body);
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error('Error creating project:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/projects/:id/tasks', async (req, res) => {
  try {
    const { id } = req.params;
    const task = req.body;

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

// Default error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
