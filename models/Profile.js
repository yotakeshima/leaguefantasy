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
  summonerId: {
    type: String,
    required: true,
  },
  summonerLevel: {
    type: Number,
  },
  matchHistory: {
    type: Array,
  },
  data: {
    type: Object,
  },
});

module.exports = Profile = mongoose.model('profile', ProfileSchema);
