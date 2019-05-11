module.exports = function(){
    return  {
        // to keep a reference to all the intervals
        intervals : new Set(),

        // create another interval
        make(...args) {
            var newInterval = setInterval(...args);
            this.intervals.add(newInterval);
            return newInterval;
        },

        // clear a single interval
        clear(id) {
            this.intervals.delete(id);
            return clearInterval(id);
        },

        // clear all intervals
        clearAll() {
            for (var id of this.intervals) {
                this.clear(id);
            }
        },

        // feed all game deadlines into master loop
        startGames(db, subInterval, gameCollection) {
            var minutes = 2;
            this.make(function(){//make master interval
                console.log('queried all games at ' + new Date());
                db.collection(gameCollection).find({hasStarted: 'true'}).toArray(function(err, res){
                    if(err) throw err;
                    for(var game of res){
                        if('roundEnd' in game){//should have a round end but check anyways

                          var roundEnd = game.roundEnd;
                          var diff = getDiff(new Date(), roundEnd);
                          console.log('diff: ' + diff);

                          if(diff <= minutes){
                               //make faster updating interval
                               console.log('making faster interval, game.strId: '+ game.strId);
                               var id = subInterval.make(function(){
                                    var nextDiff = getDiff(new Date(), roundEnd);
                                    if(nextDiff < 0){ //end round
                                        //end function
                                        console.log('call endRound, id:'+game._id);
                                        endRound(db, game._id, gameCollection);
                                        subInterval.clear(id);//get rid of mini interval
                                    }
                               }, 1000 * 60);
                          }
                          /*else if(diff < 0){//unlikely scenario in which it misses subinterval start
                                //end function
                                endRound(db, game._id);
                          }*/
                        }
                    }

                });

            }, (minutes * 60000));//every fifteen minutes, check if games are near end of round
        }

    }
}

function getDiff(date1, date2){
    console.log("Date 2: " + date2);
    date1 = new Date(date1);
    date2 = new Date(date2); //check date format
    return Math.ceil((date2.getTime()-date1.getTime())/(1000*60));
}

function endRound(db, game_id, gameCollection){
    game_id = ''+game_id; //make sure it's a string
    var collection = db.collection(gameCollection);
    console.log('ending round for ' + game_id + " with collection: " + collection);
    db.collection(gameCollection).findOne({'strId': game_id}, function(err, res){//find the game
        if(err) throw err;
        var game = res;
        console.log('Full game: ' + JSON.stringify(game));
        var players = game.players;
        var round = parseInt(""+game.round, 10) + 1 || 2;
        console.log('GameID: ' + game._id + '; game.round: ' + game.round + '; parsed next round: ' + round);
        var roundEnd = new Date();
        roundEnd.setDate(roundEnd.getDate() + parseInt(game.killInterval));

        collection.updateOne({'strId': game_id}, {$set: {round: round, roundEnd: roundEnd}},  function(err, result){//update the game with round info
            if(err) throw err;
            function updatePlayers(id){//recursive function to check if players were killed by round end
                if(id < players.length){
                    var player_id = ""+players[id];
                    db.collection('userlist').findOne({_id: player_id}, function(err, user){//find each player
                        if(err) throw err;
                        var userGame = user.gamesPlaying[game_id];
                        if(!('roundEligible' in userGame && userGame.roundEligible >= round)){//kill player
                            db.collection('userlist').updateOne({_id: player_id}, {$set:{//set player to killed
                                ['gamesPlaying.'+game_id+'.killed']: 'true'
                            }}, function(err, data){
                                if(err) throw err;
                                updatePlayers(id + 1);//after setting player, update next
                            });

                        }
                        else{
                            updatePlayers(id+1);//if eligible, update next
                        }

                    });
                }
                else{//exit function: now that all players have been killed by round, sort out new targets
                    sortTargets(db.collection('userlist'), game_id, players, 0, 0,{});
                }
            }
            updatePlayers(0);//start the recursion
        });

    });
}

/*---------Sort Targets after round end---------*/
/*
 * Assume all players not eligible have been killed by round end
 * Take in collection, game id, players array, index to start
 * Calls itself to synchronize database requests
 * @params count and tracker solely for debugging/logging purposes
 */
function sortTargets(collection, game_id, players, idx, count, tracker){
    

    if(idx < players.length){//check index to keep within array
        var player = ''+players[idx]; //get player at index, add to string to guarantee type
        var gameString = 'gamesPlaying.'+game_id; //store game property name
        
        collection.findOne({_id:player}, {[gameString]:1}, function(err, res){//get player game
            if(err) throw err;
            var game = res['gamesPlaying'][game_id];
            if(isAlive(game)){//if player is alive
                count++; 
                /*
                 * recursive function to find next living target
                 */
                function getTarget(game){
                    collection.findOne({_id: ""+game.target}, {[gameString]:1}, function(err, r){
                        if(err) throw err;
                        var targetGame = r['gamesPlaying'][game_id];
                        if(isAlive(targetGame)){//if target lives, assign to player
                            var update = {$set: {[gameString+'.target']:r['_id']}};
                            //put target_id as player's target in db
                            collection.updateOne({_id: player}, update, function(err, result){
                                if(err) throw err;
                                tracker[player] = r['_id']; //add to tracker object
                                sortTargets(collection, game_id, players, idx+1, count, tracker);//move on to next player
                            });
                        }
                        else {// if target is dead, check their target
                            getTarget(targetGame);
                        }
                    });
                }
                
                //call to assign target to player and begin recursion
                getTarget(game);

            }

            else { //if player is dead
                sortTargets(collection, game_id, players, idx+1, count, tracker);//move on to next player
            }

        });
    }

    else{//exit recursion once all is done
        console.log('/*---------Targets Sorted---------*/');
        console.log(count + ' players remaining');
        var start = Object.keys(tracker)[0];
        var assassin = start;
        do {
            var target = tracker[assassin];
            console.log(assassin + " has " + target);
            assassin = target;
        }while(assassin != start);
        console.log('/*---------Targets Sorted---------*/');
        
    }
}

function isAlive(game){
    var killed = ('killed' in game && game.killed == 'true');
    var votedKilled = false;
    if('killVote' in game){
        for(var voter in game.killVote){
            if(game.killVote[voter] == 'true'){
                votedKilled = true;
                break;
            }
        }
    }
    return !(killed || votedKilled);
}

