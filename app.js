/*----------Required Modules----------*/
const express = require('express');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const env = require("./environment.json");
const bodyParser = require("body-parser");

/*----------Serve webpage----------*/
var app = express();

//parse request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.json());
app.use(express.urlencoded());

// Serve up all html
app.use(express.static('public'))
//Default route (send index.html)
app.get('/', function(req, res){

    res.sendFile(path.join(__dirname + '/index.html'));

});

app.listen(env.port);


/*---------Connect to Database----------*/
const uri = env.uri;//get connection uri from environment
const client = new MongoClient(uri, { useNewUrlParser: true }); //create new client object

const routes = require("./app/routes.js");//get routes function
const gameCollection = env.gameCollection || 'testGames';//default to testGames to avoid messing with actual site

client.connect(err => { //connect!
    if(err) throw err;
    
    routes(client.db("Assassin"), app, gameCollection);//integrate db with webpage
 
    /*---------Start timer checks---------*/
    const intervalFunc = require('./app/interval.js');
    const interval = intervalFunc();//main interval

    interval.startGames(client.db("Assassin"), interval, gameCollection); 
});

