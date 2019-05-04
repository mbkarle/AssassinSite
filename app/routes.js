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

function getFunc(db, collectionName, query, success){
    var curr_user = query.current_user;
    delete query.current_user;
    db.collection(collectionName).find(query).toArray(function(err, result){
        var toSend = [];
        result.forEach((res) => toSend.push(processPermissions(curr_user, res)));
        if(err) throw err;
        success(result);
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
    }, function(err, result){
        if(err) throw err;
        success(result);
    });
}

//TODO: write middleware to process permissions

function processPermissions (firebaseuid, user_json) {
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
