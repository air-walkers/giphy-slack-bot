'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

const PUBLIC_BETA_KEY = "dc6zaTOxFJmzC";
const URL = "http://api.giphy.com/v1/gifs/random?api_key=" + PUBLIC_BETA_KEY;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const server = app.listen(process.env.PORT || 8080, () => {
    console.log('Express server listening on port %d in $s mode', server.address().port, app.settings.env);
});

app.post('/', (req, res) => {

  const searchString = req.body.text.replace(/\s/g, '+');
  let finalUrl = URL + "&tag=" + searchString;

  request({
    url: finalUrl,
    json: true
  }, function (error, response, body) {

    if (!error && response.statusCode === 200) {


      const data = {
        response_type: 'in_channel',
        attachments: [
          {image_url: body.data.fixed_height_downsampled_url}
        ],
      };
      res.json(data); // Print the json response
    }
  });

});

app.get('/slack', (req, res) => {

  const data = {
    form: {
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code: req.query.code,
    },
  };


  request.post('https://slack.com/api/oauth.access', data, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      // You are done.
      // If you want to get team info, you need to get the token here
      let token = JSON.parse(body).access_token; // Auth token

      request.post('https://slack.com/api/team.info', {form: {token: token}}, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          let team = JSON.parse(body).team.domain;
          res.redirect(`http://${team}.slack.com`);
        }
      });
    }
  });
});
