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
        startGames(db, subInterval) {
            var minutes = 5;
            this.make(function(){//make master interval
                console.log('querying all games')
                db.collection('games').find({hasStarted: 'true'}).toArray(function(err, res){
                    if(err) throw err;
                    for(var game of res){
                        if('roundEnd' in game){//should have a round end but check anyways

                          var roundEnd = game.roundEnd;
                          var diff = getDiff(new Date(), roundEnd);
                          console.log('diff: ' + diff);

                          if(diff <= minutes && diff > 0){
                               //make faster updating interval
                               console.log('making faster interval');
                               var id = subInterval.make(function(){
                                    var nextDiff = getDiff(new Date(), roundEnd);
                                    if(nextDiff < 0){ //end round
                                        //end function
                                        endRound(db, game._id);
                                        subInterval.clear(id);//get rid of mini interval
                                    }
                               }, 1000 * 60);
                          }
                          else if(diff < 0){//unlikely scenario in which it misses subinterval start
                                //end function
                                endRound(db, game._id);
                          }
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

function endRound(db, game_id){
    game_id = ''+game_id; //make sure it's a string
    var collection = db.collection('games');
    console.log('ending round for ' + game_id + " with collection: " + collection);
    db.collection('games').findOne({'strId': game_id}, function(err, res){//find the game
        if(err) throw err;
        var game = res;
        console.log('game ending: ' + res);
        var players = game.players;
        var round = parseInt(game.round) + 1 || 2;
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
                    sortTargets(db.collection('userlist'), game_id, player_id, player_id, 0);
                }
            }
            updatePlayers(0);//start the recursion
        });

    });
}

function sortTargets(collection, game_id, player_id, starter_id, count){
    if(count > 0 && player_id != starter_id){//check if it's come full circle
        collection.findOne({_id: player_id}, function(err, res){//find first living player
            if(err) throw err;
            var player = res;
            var game = res['gamesPlaying'][game_id];
            if('killed' in game && game.killed == 'true'){//if they're dead, check if target lives
                sortTargets(collection, game_id, game.target, starter_id, count+1);
            }
            else {//if alive, find their next living target
                var target_id = game.target;
                function getLiving(target_id){
                    collection.findOne({_id: target_id}, function(err, target){//find target
                        if(err) throw err;
                        var targetGame = target['gamesPlaying'][game_id];
                        if('killed' in targetGame && targetGame.killed == 'true')//if target is dead, get check if their target lives
                            getLiving(targetGame.target);
                        else{//if target lives, make it the player's target
                            collection.updateOne({_id: player._id}, {
                                $set: {['gamesPlaying.'+game_id+'.target']: target}
                            }, function(err, data){//get next living player in the loop
                                sortTargets(collection, game_id, target._id, starter_id, count+1);
                            });

                        }
                    });
                }
                getLiving(target_id);
            }
        });
    }
};
