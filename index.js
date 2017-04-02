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

app.post('/', (req, res) => {
    console.log(req.body.text);
})
