module.exports = function(db, app) {

    app.route('/games')
        .get(function(req, res){
            db.collection("games").find({}).toArray(function(err, result) {
                if(err) throw err;
                console.log(result); 
                res.redirect('/')
            });
        });
        

};

