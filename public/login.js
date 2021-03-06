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
        $('.userInfo').attr('id', user.uid);
        loadUserData();
        
        //check if searched
        var urlParams = new URLSearchParams(window.location.search);
        if(urlParams.has('search'))
            showSearchResults(urlParams.get('search'));
        else
            populateContentPane("User Info", user.uid);
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
    initializeListeners(); //main listeners initialize
    $("#signUpContainer button").show();

   /*----------Sign Up----------*/ 
    $("#signUp").on('click', function(){
        loginClick(signUp);
        $("#login-content h1, #submit").html("Sign Up");
        $(".signUps").show();
        $(".signIns").hide();
    });

   /*----------Sign In----------*/ 
    $("#signIn").on('click', function(){
        loginClick(signIn)
        $('#login-content h1, #submit').html("Sign In");
        $(".signUps").hide();
        $(".signIns").show();
    });

    $('#logOut').on('click', function(){
        logOut();
    });

   /*----------Modal Listeners----------*/ 
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
       if (event.target == $("#login-modal")[0]) {
           closeModal();
        }
       if (event.target == $("#main-modal")[0]){
           closeMainModal();
       }
    }

    //clicking close closes modal
    $(".close").on('click', function(){
        closeModal();
    });

    $(".modal-content").on('keypress', function(e){
        if(e.keyCode == 27)
            closeModal();
    });

    /*---------Reset Password---------*/
    $("#reset-pass").on('click', function(){
        $('#login-content').hide();
        $('#reset-content').show();
        $("#recovery-email, #resetButton").show();
        $("#resMess").hide();
        $("#resetButton").on('click', function(){
            var email = $('#recovery-email').val();
            firebase.auth().sendPasswordResetEmail(email)
                .then(function(){
                    $("#recovery-email, #resetButton").hide();
                    $("#resMess").html("Reset email sent to " + email).show();
                })
                .catch(function(error){
                    genCatch(error)
                });
        });
    });
        
}
window.onload = initializeDOM;

function loginClick(loginFunc){
    $('#login-modal').fadeIn(500);
    function func(){
        var email = $("#email-field")[0].value;
        var pass = $("#password-field")[0].value;
        var fName = $("#first-name")[0].value;
        var lName = $("#last-name")[0].value;
        loginFunc(email, pass, fName, lName);
    }

    $("#password-field").off('keypress').keypress(function(e){
        if(e.keyCode == 13)
            func()
    })
    $("#submit").off('click').on('click', function(){
        func();
    });
}

function closeModal(){
    $('.modal').fadeOut(500, function(){
        $('#login-content').show();
        $('#reset-content').hide();
        $('#mmc-wrapper').html("");
    });
}





/*----------Firebase Functions----------*/
function signUp(email, password, firstName, lastName){
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .catch(function(error) {
            genCatch(error);
        })
        .then(function(user){
            var u = user.user;
            var userObj = {
                _id: u.uid,
                email: u.email,
                firstName: firstName,
                lastName: lastName,
                createdGames: {init: true},
                gamesPlaying: {init: true},
                totalKills: 0
            }
            post("/users", userObj, function(data){
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


