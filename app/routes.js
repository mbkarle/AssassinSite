module.exports = function(db, app) {

    app.route('/games')
        .get(function(req, res){
            var query = req.query || {};
            db.collection("games").find(query).toArray(function(err, result) {
                if(err) throw err;
                res.json(result);
            });
        })
        .post(function(req, res){
            var toInsert = req.body;
            db.collection('games').insertOne(toInsert, function(err, result){
                if(err) throw err;
                console.log("ID: " + toInsert._id);
                var response = {result: result, _id: toInsert._id};
                res.json(response);
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
            db.collection("userlist").insertOne(toInsert, function(err, result){
                if(err) throw err;
                res.json(result);
            });
        })

        .put(function(req, res){
            var body = req.body;
            db.collection('userlist').updateOne({_id: body.id}, {
                $set: {[body.key]: body.value}
            }, function(err, result){if(err) throw err;res.json(result);});
        });
        

};

