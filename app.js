require('dotenv').config({ path: '../.env' });

const express = require('express');
const mongoose = require('mongoose');
const authController = require('./controllers/authController');
const preferencesController = require('./controllers/preferencesController');
const {scheduleSportsNewsJobs} = require('./controllers/newsController');
const cors = require('cors');
const app = express();
const newsController = require('./controllers/newsController');

const startServer = async () => {
  // ... other server setup (e.g., connect to MongoDB, set up Express)

  // Middleware to parse JSON
app.use(express.json());

// Middleware to enable CORS
app.use(cors(
  {
    origin: 'https://naaradupdates.com',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
    //credentials: true,
  }
));

  mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

  app.post('/api/signup', authController.signup);
  app.post('/api/login', authController.login);
  app.put('/api/preferences/:userId', preferencesController.updatePreferences);

  // Schedule sports news jobs
  await scheduleSportsNewsJobs();

  app.listen( 9000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
  });
};
startServer();
