const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.get('users').find({ username }).value();
  if (!user) return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
  const token = jwt.sign({ id: user.id, username: user.username }, config.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, username: user.username });
});

module.exports = router;
