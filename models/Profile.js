const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  summonerName: {
    type: String,
    required: true,
  },
  puuid: {
    type: String,
    required: true,
  },
  summonerLevel: {
    type: Number,
  },
  profileIconId: {
    type: Number,
  },
  matchHistory: {
    type: Array,
  },
});

module.exports = Profile = mongoose.model('profile', ProfileSchema);
