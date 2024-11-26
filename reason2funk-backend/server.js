require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const ProjectSchema = new mongoose.Schema({
  name: String,
  tasks: [
    {
      name: String,
      assignedTo: String,
      link: String,
      image: String,
      status: { type: String, default: 'todo' },
    },
  ],
});

const Project = mongoose.model('Project', ProjectSchema);

// Routes
app.get('/projects', async (req, res) => {
  const projects = await Project.find();
  res.json(projects);
});

app.post('/projects', async (req, res) => {
  const project = new Project(req.body);
  await project.save();
  res.status(201).json(project);
});

app.post('/projects/:id/tasks', async (req, res) => {
  const project = await Project.findById(req.params.id);
  project.tasks.push(req.body);
  await project.save();
  res.status(201).json(project);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
