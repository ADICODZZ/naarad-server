const { duration } = require("moment-timezone");
const mongoose = require("mongoose");

const NewsLogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: String,
  date: { type: Date, default: Date.now },
  reason: String
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
      upateType: [String],
      matchFormat: [String],
      eventScope: [String],
      instructionTags: [String],

      aiGeneratedAnswers: [{
        question: String,
        answer: String
      }],
      previousMessages: [{
      message: String,
      sentAt: { type: Date, default: Date.now }
    }]
    },

    news: {
      tags: [String],
      newsSources: [String],
      newsdepth: [String],
      newsFormatPreference: [String],
      newsFrequency: [String],
      instructionTags: [String],
      aiGeneratedAnswers: {
        questions: String,
        answers: String
      },
      previousMessages: [{
      message: String,
      sentAt: { type: Date, default: Date.now }
    }]
    },

    youtube: {
      favoriteChannels: [String],
      videoStyle:[String],
      duration:[String],
      topicsOfInterest: [String],
      preferredVideoDuration: String,
      specificInstructions: String,
      lastUpdate: { type: Date },
      previousMessages: [{
      message: String,
      sentAt: { type: Date, default: Date.now }
    }]
    },

    movies: {
      specificInstructions: String
    },

  custom: {
    category:{type: String} , // Optional: if you actually want a `type` field inside custom
    specificInstructions: [String],
    lastUpdate: { type: Date },
    previousMessages: [{
      message: String,
      sentAt: { type: Date, default: Date.now }
    }]
  ,
  //default: {}
}

  },

  frequencyTiming: {
    frequency: {
      type: String,
      enum: ['Real-time', 'Morning Digest', 'Evening Summary', 'Custom'],
    },
    preferredTime: String,
    deliveryPlatform: {
      type: String,
      default: 'whatsapp'
    }
  },

  newsHistory: [NewsLogSchema],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", UserSchema);
