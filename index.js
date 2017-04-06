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

const getParams = (text, type, searchString) => {
  switch (type) {
    case "search":
      return "&limit=1&q=" + searchString;
    case "trending":
      return "&limit=10";
    default:
      return "&tag=" + searchString; // random
  }
}

const search = function(text, type, match){
    
  //using GIPHY public api key, change when in production
  const searchString = cleanSearch(text,match);
  const params = getParams(text, type, searchString);

  const URL = "http://api.giphy.com/v1/gifs/" + type + "?api_key=dc6zaTOxFJmzC" + params;
  return URL;
  
};

const getType = (match)  => {
  
  // match is an object. We need to coerse it to a string
  console.log(`"${String(match).replace(' ', '')}"`)
  switch (String(match).replace(' ', '')) {
    case "-t":
      return "trending";

    case "-s":
      return "search";

    case "-help":
      return "help";

    default:
      return "random";
  }
  
};

const getAttachments = (body, type) => {

  // trending will return an array of image urls, everything else is just a single image url.
  if (type === 'trending') {
    return body.data.map(gif => ({ image_url: gif.images.fixed_height_downsampled.url }));
  }
  
  return [{ image_url: getImageUrl(body, type) }];
}

const getImageUrl = (body, type) => {
  
    if (type === "search") {
      return body.data[0].images.fixed_height_downsampled.url;
    }

    // random
    return body.data.fixed_height_downsampled_url;
  
}

const getResponseType = (type) => {
  if (type === 'trending') {
    return 'ephemeral';
  }
  return 'in_channel';
}

const getData = (body, type) => {
  if (body.data.length === 0) {
    return ({
      text: "Sorry, your search returned 0 results. ",
    });
  }

  return {
    response_type: getResponseType(type),
    attachments: getAttachments(body, type),
  };
};


const getHelpData = () => {
  let text = "*Giphy Bot*\n";
  text += "/gif -help, Brings up the help, were you are right now.\n";
  text += "/gif [search term], Will return a random GIF related to your search term.\n";
  text += "/gif -s [search term], Will return the specific GIF that matches your search term.\n"
  text += "/gif -t, Will return the top 10 trending GIFs privately so only you can see them.\n"
  text += "\n";
  text += "This bot was built with :heart: by Jay and Matt."
  return {
    text,
    mrkdwn: true,
  };
};

app.post('/', (req, res) => {
  
  const searchString = req.body.text.toLowerCase();
  
  const match = searchString.match(/^-s\s|^-t|-help/);
  
  const type = getType(match);

  if (type === 'help') {
    res.json(getHelpData());
    return
  }
  
  const finalUrl = search(searchString, type, match);

  console.log(finalUrl);

  request({
    url: finalUrl,
    json: true
  }, function (error, response, body) {

    if (!error && response.statusCode === 200) {
    //response ok
      // console.log(`type: ${type}; image: ${getImageUrl(body, type)}`);
      console.log(getResponseType(type), type);

      const data = getData(body, type);
      
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
