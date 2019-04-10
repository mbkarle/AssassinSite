const express = require('express');
const path = require('path');

var app = express();

// Serve up all html
app.use(express.static('public'))
//Default route (send index.html)
app.get('/', function(req, res){

    res.sendFile(path.join(__dirname + '/index.html'));

});

app.listen(8080);
