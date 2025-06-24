const mongoose = require("mongoose");

const NewsLogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: String,
  date: { type: Date, default: Date.now },
  reason:String
});

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  whatsappNumber: {
    type: String,
    required: true,
    unique: true
  },

  category: {
    type: [String],
    //enum: ["sports", 'movies', "news", 'youtube', 'custom'],
    //required: true
  },

  customInterestTags: [String],

  alertPaused: {
    type: Boolean,
    default: true
  },

  preferences: {
    sports: {
      subcategory: {
        type: String,
        enum: ['cricket', 'football', 'basketball']
      },
      tags: [String],
      favPlayers: [String],
      favTeams: [String],
      upateType:[String],
      matchFormat:[String],
      eventScope:[String],
      instructionTags:[String], 
      
      aiGeneratedAnswers: [{
        questions: String,
        answers: String
      }],
      //specificInstructions: String
    },
    news: {
      tags: [String],
      newsSources: [String],
      newsdepth: [String],
      newsFormatPreference:[String],
      newsFrequency:[String],
      //localNewsArea: String,
      instructionTags: [String],
      aiGeneratedAnswers: {
        questions: String,
        answers: String
      }
    },
    youtube: {
      favoriteChannels: [String],
      topicsOfInterest: [String],
      preferredVideoDuration: String,
      specificInstructions: String
    },
    movies: {
      specificInstructions: String
    },
    custom: {
      specificInstructions: String
    }
  },

  frequencyTiming: {
    frequency: {
      type: String,
      enum: ['Real-time', 'Morning Digest', 'Evening Summary', 'Custom'],
      //required: true
    },
    preferredTime: String,
    //timezone: "IST",
    deliveryPlatform: {
      type: String,
      default: 'whatsapp'
    }
  },

  // eg: "08:00 AM"

  newsHistory: [NewsLogSchema],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", UserSchema);
