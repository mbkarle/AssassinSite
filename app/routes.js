module.exports = function(db, app) {

    app.route('/games')
        .get(function(req, res){
            db.collection("games").find({}).toArray(function(err, result) {
                if(err) throw err;
                console.log(result); 
            });
        });

    app.route("/users")
        .get(function(req, res){
            var query = req.query;
            console.log(query);
            db.collection("userlist").find(query).toArray(function(err, result){
                if(err) throw err;
                console.log(result);
                res.json(result);
            });
        })

        .post(function(req, res){
            console.log("Req body: " + req.body);
            db.collection("userlist").insertOne(req.body, function(err, result){
                if(err) throw err;
                console.log(result);
            });
        });
        

};

