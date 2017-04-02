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
