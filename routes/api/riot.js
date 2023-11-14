const express = require('express');

const router = express.Router();

const config = require('config');

const auth = require('../../middleware/auth');

const axios = require('axios');

const Profile = require('../../models/Profile');

// @route   POST api/riot
// @desc    Create a profile based on the user's summoner name
// @access  Private

router.post('/', auth, async (req, res) => {
  try {
    const apiKey = config.get('api_key');
    const summonerName = req.body.summonerName;
    const summonerExist = await checkSummonerExist(summonerName, apiKey);

    if (!summonerExist) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'Summoner does not exist' }] });
    }

    const { puuid, summonerLevel, profileIconId } = await getSummonerData(
      summonerName,
      apiKey
    );
    const matchHistory = await getMatchHistory(puuid, apiKey);

    const profileFields = {
      user: req.user.id,
      summonerName: summonerName,
      puuid: puuid,
      summonerLevel: summonerLevel,
      profileIconId: profileIconId,
      matchHistory: matchHistory,
    };

    let profile = await Profile.findOne({ summonerName });

    if (profile) {
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );

      return res.json(profile);
    }

    profile = new Profile(profileFields);

    await profile.save();

    return res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

async function checkSummonerExist(summonerName, apiKey) {
  try {
    const response = await axios.get(
      `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}`,
      {
        headers: {
          'X-Riot-Token': apiKey,
        },
      }
    );
    return true;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      //Summoner not found
      return false;
    } else throw err;
  }
}

async function getSummonerData(summonerName, apiKey) {
  try {
    const response = await axios.get(
      `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}`,
      {
        headers: {
          'X-Riot-Token': apiKey,
        },
      }
    );
    return response.data;
  } catch (err) {
    throw err;
  }
}

async function getMatchHistory(puuid, apiKey) {
  try {
    const response = await axios.get(
      `https://na1.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20`,
      {
        headers: {
          'X-Riot-Token': apiKey,
        },
      }
    );
    return response;
  } catch (err) {
    throw err;
  }
}

async function getMatchData(matchId, apiKey) {
  try {
    const response = await axios.get(
      `https://na1.api.riotgames.com/lol/match/v5/matches/${matchId}`,
      {
        headers: {
          'X-Riot-Token': apiKey,
        },
      }
    );

    const {
      metadata: { participants },
      info: { participantsDto, teams },
    } = response;

    const data = {
      matchId: matchId,
      participants: participants,
      participantsDto: participantsDto,
      teams: teams,
    };

    return data;
  } catch (err) {
    throw err;
  }
}

module.exports = router;
