/*----------Initialize Firebase----------*/
var config = {
    apiKey: "AIzaSyBpmV_rgSFlVfe5CWWWB688rNNijgZbuUc",
    authDomain: "assassinsite-32c7c.firebaseapp.com",
    databaseURL: "https://assassinsite-32c7c.firebaseio.com",
    projectId: "assassinsite-32c7c",
    storageBucket: "assassinsite-32c7c.appspot.com",
    messagingSenderId: "990584642888"
};
firebase.initializeApp(config);

/*----------Firebase Change Listener----------*/
//check user logins
firebase.auth().onAuthStateChanged(function(user) {
    if(user){
        //User is logged in
        console.log("logged in!"); 
        $(".loggedOut").hide();
        $(".loggedIn").show();
        get("/users", {_id: user.uid}, function(data){
            var u = data[0];
            $("#main").html(
                "<h1>Welcome User</h1><br>"+
                "<p>"+u.email+"</p><br>"
            );
        })
    }
    else{
        //User has been logged out
        console.log("logged out");
        $(".loggedOut").show();
        $(".loggedIn").hide();
    }
})

/*----------DOM Listeners----------*/
function initializeDOM(){
    $("#signUpContainer button").show();

   /*----------Sign Up----------*/ 
    $("#signUp").on('click', function(){
        loginClick(this, signUp)
    });

   /*----------Sign In----------*/ 
    $("#signIn").on('click', function(){
        loginClick(this, signIn)
    });

    $('#logOut').on('click', function(){
        logOut();
    });
        
}
window.onload = initializeDOM;

function loginClick(selector, loginFunc){
    $("#signUpContainer .loggedOut button").not(selector).hide(500);
    $("input").fadeIn(500);
    $("#pass-field").keypress(function(e){
        if(e.keyCode == 13)
            loginFunc($("#user-field")[0].value, $("#pass-field")[0].value);
    })
    $(selector).off('click').on('click', function(){
        var email = $('#user-field')[0].value;
        var password = $('#pass-field')[0].value;
        loginFunc(email, password);
    });
}

/*----------Firebase Functions----------*/
function signUp(email, password){
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .catch(function(error) {
            genCatch(error);
        })
        .then(function(user){
            var u = user.user;
            post("/users", {_id: u.uid, email: u.email}, function(data){
                console.log("Created mongodb doc");  
            });
        });
}

function signIn(email, password){
    firebase.auth().signInWithEmailAndPassword(email, password)
        .catch(function(error) {
            genCatch(error);  
        });
}

function logOut(){
    firebase.auth().signOut()
        .catch(genCatch); 
}

function genCatch(error){
     // Handle Errors here.
     var errorCode = error.code;
     var errorMessage = error.message;
     console.log(errorMessage);
}
