module.exports = function(db, app) {

    app.route('/games')
        .get(function(req, res){
            getFunc(db, 'games', req.query, function(result){
                res.json(result);
            });
        })
        .post(function(req, res){
            var toInsert = req.body;
            db.collection('games').insertOne(toInsert, function(err, result){
                if(err) throw err;
                db.collection('games').updateOne({_id: toInsert._id}, {$set: {strId: toInsert._id.toString()}}, function(err, resp){
                    if(err) throw err;
                    console.log("ID: " + toInsert._id);
                    var response = {result: result, _id: toInsert._id};
                    res.json(response);
                });
            });
        })
        .put(function(req, res){
            console.log('Games Request: ' + JSON.stringify(req.body));
            putFunc(db, 'games', req.body, function(result){
                console.log("Games Result: " + JSON.stringify(result));
                res.json(result);
            });
        });

    app.route("/users")
        .get(function(req, res){
           getFunc(db, 'userlist', req.query, function(result){
               console.log('returning users');
               res.json(result);
           });
       })

        .post(function(req, res){
                   
            console.log("Req body: " + req.body);
            var toInsert = req.body;
            delete toInsert.createdGames.init;
            delete toInsert.gamesPlaying.init;

            db.collection("userlist").insertOne(toInsert, function(err, result){
                if(err) throw err;
                res.json(result);
            });
        })

        .put(function(req, res){
            var body = req.body;
            putFunc(db, 'userlist', body, function(result){
                res.json(result);
            });
        })

        .delete(function(req, res){
            db.collection('userlist').deleteOne(req.query, function(err, result){
                if(err) throw err;
                res.json(result);
            })
        });

    app.route("/vote")
        .put(function(req, res){
            var body = req.body;
            putFunc(db, 'userlist', body, function(data){ //puts a vote in the killed users document
                var killedUser = data.value;
                var killVote = killedUser.gamesPlaying[body.gameId].killVote[body.currId];
                if(killVote == 'true'){
                    db.collection('userlist').find({_id: body.killer}).toArray(function(err, user){
                        if(err)throw err;
                        user = user[0];
                        var game = user.gamesPlaying[body.gameId];
                        console.log('Game: '+ JSON.stringify(game));
                        if(!('usersKilled' in game && game.usersKilled.includes(body.filter._id))){//Kill is confirmed
                            var curr_kills = game.kills || "0";
                            var kills = parseInt(curr_kills) + 1;
                            var totalKills = parseInt(user.totalKills) + 1;
                            var toPut = {
                                filter:{_id: user._id},
                                setPair:{['gamesPlaying.'+body.gameId+'.usersKilled']: body.filter._id},
                                op: '$push'
                            };
                            putFunc(db, 'userlist', toPut, function(response){
                                var nextTarget = killedUser.gamesPlaying[game._id].target;
                                var deadline = new Date();
                                deadline.setDate(deadline.getDate() + 7);
                                toPut.setPair = {
                                    ['gamesPlaying.'+game._id+'.kills']:kills,
                                    totalKills: totalKills,
                                    ['gamesPlaying.'+game._id+'.target']:nextTarget,
                                    ['gamesPlaying.'+game._id+'.killDeadline']:deadline
                                };
                                toPut.op = '$set';
                                putFunc(db, 'userlist', toPut, function(nextRes){
                                    res.json(nextRes);
                                });
                            });
                        }
                        else{
                            res.json(data);
                        }
                    });
                }
                else{
                    res.json(data);
                }
            });
        });
                    

};

function getFunc(db, collectionName, query, success){
    var curr_user = query.current_user;
    var desired = null, omit = null;
    if('desired' in query){
        desired = query.desired;
        delete query.desired;
    }
    if('omit' in query){
        omit = query.omit;
        delete query.omit;
    }

    delete query.current_user;
    var filter = Object.keys(query)[0];
    if(typeof filter != 'undefined' && filter.includes('target'))
        return success({'message': "You can't do that..."});
    db.collection(collectionName).find(query).toArray(function(err, result){
        var toSend = [];
        result.forEach((res) => {
            var permissioned = processPermissions(curr_user, res);
            var finRes = {};
            if(desired != null){
                for(var prop of desired){
                    finRes[prop] = (prop in permissioned)?permissioned[prop]:null;
                    if(finRes[prop] == null)
                        delete finRes[prop];
                }
            }
            else{
                finRes = permissioned;
            }
            if(omit != null){
                for(var prop of omit){
                    if(prop in finRes)
                        delete finRes[prop];
                }
            }
            toSend.push(finRes);
        });
        if(err) throw err;
        success(toSend);
    });


}

function putFunc(db, collectionName, obj, success){
    var operation = obj.op || "$set";
    if(operation == '$pop')
        obj.value = parseInt(obj.value);
    var filter = ('filter' in obj)?obj.filter:{_id: obj.id};
    var setPair = ('setPair' in obj)?obj.setPair:{[obj.key]: obj.value};
    db.collection(collectionName).findOneAndUpdate(filter, {
        [operation]: setPair
    }, {returnOriginal: false}, function(err, result){
        if(err) throw err;
        success(result);
    });
}

//TODO: write middleware to process permissions

function processPermissions (firebaseuid, user_json ) {
    var omitted_fields = require('./omissions.json');
    var fieldsToOmit;
    if (firebaseuid === user_json._id){
        fieldsToOmit = omitted_fields.Self;
        console.log('SELF');
    }
    else {
        fieldsToOmit = omitted_fields.User;
        console.log('RANDOM USER');
    }
    fieldsToOmit.forEach(field => delete user_json[field]);
    return user_json;
}


