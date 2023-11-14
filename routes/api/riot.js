const express = require('express');

const router = express.Router();

const config = require('config');

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

    const summonerId = await getSummonerId(summonerName, apiKey);
    const summonerLevel = await getSummonerLevel(summonerId, apiKey);
    const matchHistory = await getMatchHistory(summonerId, apiKey);
    const data = await getMatchData(matchHistory, apiKey);

    const profileFields = {
      user: req.user.id,
      summonerName: summonerName,
      summonerId: summonerId,
      summonerLevel: summonerLevel,
      matchHistory: matchHistory,
      data: data,
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

    res.json(profile);
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

async function getSummonerId(summonerName, apiKey) {
  try {
    const response = await axios.get(
      `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}`,
      {
        headers: {
          'X-Riot-Token': apiKey,
        },
      }
    );
    return response.data.id;
  } catch (err) {
    throw err;
  }
}

async function getSummonerLevel(summonerId, apiKey) {
  try {
    const response = await axios.get(
      `https://na1.api.riotgames.com/lol/summoner/v4/summoners/${summonerId}`,
      {
        headers: {
          'X-Riot-Token': apiKey,
        },
      }
    );
    return response.data.summonerLevel;
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
