require('dotenv').config({ path: '../.env' });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const {customUpdate}= require('./controllers/CustomUpdates');
const authController = require('./controllers/authController');
const preferencesController = require('./controllers/preferencesController');
const { scheduleSportsNewsJobs } = require('./controllers/newsController');

const UserModel = require('./models/user'); // 👈 import your User model here

const app = express();

app.use(express.json());

app.use(cors({
  origin: 'https://naaradupdates.com',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
}));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getCurrentTimeHHMM = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const runActionsForUser = async (userId) => {
  console.log(`✅ Running actions for user: ${userId}`);

  const user = await UserModel.findById(userId); // <-- await needed
  if (!user) {
    console.error(`❌ User with ID ${userId} not found`);
    return;
  }

  // Check if custom preferences exist and have a type or instructions
  const custom = user.preferences?.custom;

  if (!custom || (!custom.type && (!custom.specificInstructions || custom.specificInstructions.length === 0))) {
    console.log(`❌ No valid custom preferences found for user: ${userId}`);
   // await customUpdate(user);
  }

  console.log(`🔍 Found custom preferences for user: ${userId}`);

  // Run custom update
  //const response = await customUpdate(user);
  //console.log(`✅ Custom update response for user ${userId}:`, response);
};


const checkUsersPreferredTime = async () => {
  const users = await UserModel.find({});
  const currentTime = getCurrentTimeHHMM();

  console.log(`🕒 Checking users at time: ${currentTime}`);

  users.forEach((user) => {
    if (user.preferredTime === currentTime) {
      runActionsForUser(user._id);
      console.log(`✅ User ${user._id} has preferred time ${currentTime}. Running actions...`);
    }
    else{
      runActionsForUser(user._id);
      console.log(`❌ User ${user._id} does not have preferred time ${currentTime}. Skipping...`);
    }
  });
};

const startBackgroundJob = async () => {
  while (true) {
    try {
      await checkUsersPreferredTime();
    } catch (err) {
      console.error('❌ Error during check:', err);
    }

    console.log('⏳ Sleeping for 10 minutes…');
    await sleep(10 * 60 * 1000);
  }
};

const startServer = async () => {
  await mongoose.connect(process.env.MONGODB_URI|| 'mongodb+srv://aditya09sinha264:kD5q7YdF324Y4PHQ@cluster0.9tfpwwe.mongodb.net/naarad-DB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

  app.post('/api/signup', authController.signup);
  app.post('/api/login', authController.login);
  app.put('/api/preferences/:userId', preferencesController.updatePreferences);

  // Schedule sports news jobs
  //await scheduleSportsNewsJobs();

  // Start Express server
  app.listen(process.env.PORT || 3000, () => {
    console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
  });

  // Start infinite background job
  startBackgroundJob();
};

startServer();

