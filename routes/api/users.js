const express = require('express');

const router = express.Router();

const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const config = require('config');

const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

const axios = require('axios');

// @route   POST api/users
// @desc    Register user
// @access  Public

router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //pulls the name and password
    const { name, password } = req.body;

    try {
      //Checks if summonerName is a valid summoner name to register
      const apiKey = config.get('api_key');
      const summonerExist = await checkSummonerExist(name, apiKey);

      if (!summonerExist) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Summoner does not exist' }] });
      }

      //See if user exists, if true return 400 error 'user exists'
      let user = await User.findOne({ name });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({
        name,
        password,
      });

      //Encrypt password
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      //Return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

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

module.exports = router;
