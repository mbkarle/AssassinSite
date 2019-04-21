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
        $("#login-modal").fadeOut(500);
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
        loginClick(signUp);
        $("#login-modal h1, #submit").html("Sign Up");
    });

   /*----------Sign In----------*/ 
    $("#signIn").on('click', function(){
        loginClick(signIn)
        $('#login-modal h1, #submit').html("Sign In");
    });

    $('#logOut').on('click', function(){
        logOut();
    });

   /*----------Modal Listeners----------*/ 
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
       if (event.target == $("#login-modal")[0]) {
           $('.modal').fadeOut(500);
        }
    }

    //clicking close closes modal
    $(".close").on('click', function(){
        $('.modal').fadeOut(500);
    });
        
}
window.onload = initializeDOM;

function loginClick(loginFunc){
    $('.modal').fadeIn(500);
    $("#password-field").off('keypress').keypress(function(e){
        if(e.keyCode == 13)
            loginFunc($("#email-field")[0].value, $("#password-field")[0].value);
    })
    $("#submit").off('click').on('click', function(){
        var email = $('#email-field')[0].value;
        var password = $('#password-field')[0].value;
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
