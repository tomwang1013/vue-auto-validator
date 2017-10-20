const express = require('express');
const app = express();

app.all('/remote_url', function (req, res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.json({ valid: true, message: 'remote validation failed' });
});

app.listen(3001);