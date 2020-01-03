var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('gameboard', { title: 'Connect4' });
});

module.exports = router;
