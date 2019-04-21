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
            var user = {_id: req.body._id, email: req.body.email};
            db.collection("userlist").insertOne(user, function(err, result){
                if(err) throw err;
                console.log(result);
            });
        });
        

};

