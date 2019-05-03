module.exports = function(db, app) {

    app.route('/games')
        .get(function(req, res){
            var query = req.query || {};
            console.log('query: ' + query.strId);
            db.collection("games").find(query).toArray(function(err, result) {
                console.log("result " + JSON.stringify(result));
                if(err) throw err;
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
            putFunc(db, 'games', req.body, function(result){
                console.log("Games Result: " + JSON.stringify(result));
                res.json(result);
            });
        });

    app.route("/users")
        .get(function(req, res){
            var query = req.query;
            console.log(query);
            db.collection("userlist").find(query).toArray(function(err, result){
                if(err) throw err;
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

        

};

function putFunc(db, collectionName, obj, success){
    var operation = obj.op || "$set";
    var filter;
    if('filter' in obj)
        filter = obj.filter;
    else
        filter = {_id: obj.id};
    db.collection(collectionName).findOneAndUpdate(filter, {
        [operation]: {[obj.key]: obj.value}
    }, function(err, result){
        if(err) throw err;
        success(result);
    });
}

//TODO: write middleware to process permissions
