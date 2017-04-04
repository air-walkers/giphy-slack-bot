'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 8080, () => {
    console.log('Express server listening on port %d in $s mode', server.address().port, app.settings.env);
});

/*
/gif (completely random gif)
/gif [category] (random gif but related to category)
/gif -s [search] (specific gif that matches the search)
/gif -t [1-25] (trending gif, optional specify nr)
*/

const cleanSearch = (text,match) => {

    return text.replace(match, '').replace(/\s/g, '+');
  
};

const search = function(text, type, match){
    
    //using GIPHY public api key, change when in production
    const URL = "http://api.giphy.com/v1/gifs/" + type + "?api_key=dc6zaTOxFJmzC";
    const searchString = cleanSearch(text,match);
    return URL + "&tag=" + searchString;
  
};

const getType = (text, match)  => {
  
  if(match === "-t "){ // include a space after to ensure it was a command
      
      return "trending";
    
  } else if(match === "-s ") { // include a space after to ensure it was a command
    
      return "search";
    
  }else {
    
      return "random";
    
  }
  
};

const getImageUrl = (body, type) => {
  
    if(type === "search"){
      
        return body.data[0].fixed_height_downsampled_url;
        
    } else if (type === "trending"){
    //make an array of top 10 images  
        
        
      
    } else {
      
      return body.data.fixed_height_downsampled_url;
      
    }
  
}

app.post('/', (req, res) => {
  
  const searchString = req.body.text.toLowerCase();
  
  const match = searchString.match(/^-[ts]\s/);
  
  const type = getType(searchString,match);
  
  const finalUrl = search(searchString, type, match);

  request({
    url: finalUrl,
    json: true
  }, function (error, response, body) {

    if (!error && response.statusCode === 200) {
    //response ok
    
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
