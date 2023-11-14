const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');

// @route  POST api/auth
// @desc   Authenticate user & get token
// @access Public

router.post(
  '/',
  [
    check('name', 'Please include a valid name').exists(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //if there are errors, return a 400 error with the errors array
      return res.status(400).json({ errors: errors.array() });
    }
    //pulls the name and password
    const { name, password } = req.body;
    try {
      //See if user exists, if true return 400 error 'user exists'
      let user = await User.findOne({ name });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }
      //compares the password and the user.password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }
      //return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
        },
      };
      //signs the token
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          //if there is an error throw the error
          if (err) throw err;
          //if there is no error, return the token
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
