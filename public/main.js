/*---------Generic Helper Functions---------*/
function get(route, query,  callback){
    query.current_user = firebase.auth().currentUser.uid;
    $.get(route, query, function(data){
       callback(data);
   }); 

}

function getUser(callback){
    var id = firebase.auth().currentUser.uid;
    get('/users', {_id: id}, function(data){
        callback(data[0]);
    });
}

function post(route, data, callback){
 //   $.post(route, data, callback, 'json');
    $.ajax({
      type:    "POST",
      url:     route,
      data:    data,
      success: callback, 
      // vvv---- This is the new bit
      error:   function(jqXHR, textStatus, errorThrown) {
            alert("Error, status = " + textStatus + ", " +
                  "error thrown: " + errorThrown
            );
      },
      dataType: 'json',
      contentType: 'application/x-www-form-urlencoded'
    }).always(function(data){console.log(data);});
}

function put(route, data, callback){
    $.ajax({
        url: route,
        type: 'PUT',
        data: data,
        success: callback
    });
}

function ajaxDelete(route, data, callback){
    $.ajax({
        url: route,
        type: 'DELETE',
        data: data,
        success: callback
    });
}

function genCatch(error){
     // Handle Errors here.
     var errorCode = error.code;
     var errorMessage = error.message;
     console.log(errorMessage);
     alert(errorMessage);
}
/*---------Main Content DOM Listeners---------*/

/*---Create Game Button ---*/
function initializeListeners(){
    $('.createGame').on('click', launchGameCreation);
    $('.search').on('input', function(){
        showSearchResults($(this).val());
    });

}

function loadUserData(){
    refreshNavCol();
    checkNotifications();
}

function refreshToolListeners(){
    $('.toolItem').on('click', function(){
        activate($(this).attr('data-type'), $(this).attr('id'));
    });
}



/*=================================*/ 
/*---------Major Functions---------*/
/*=================================*/ 

function activate(data_type, divID){
   interval.clearAll();
   $('.active').removeClass('active');
   $('#'+divID).addClass('active');
   populateContentPane(data_type, divID);
}

/*---------Update Nav Column---------*/
function refreshNavCol(){
    $('#yourCreations, #yourPlaying').html('');
    var user = firebase.auth().currentUser.uid; 
    getUser(function(data){
        var u = data;
        var createdGames = u.createdGames;
        if(Object.keys(createdGames).length == 0){
            $('#yourCreations').html("You haven't created any games yet!");
        }else{
            for(var idx in createdGames){
                var game = createdGames[idx];
                $('#yourCreations').append(createGameDiv(game.name, "createdGames-"+idx));
                 if(idx in u.gamesPlaying)
                   $('#createdGames-'+game._id).removeClass('toolItem').addClass('inactive').append(' (playing)');
           }
        }
        
        var gamesPlaying = u.gamesPlaying;
        if(Object.keys(gamesPlaying).length == 0){
            $('#yourPlaying').html("You aren't playing any games yet!");
        }
        else{
            for(var idx in gamesPlaying){
                var game = gamesPlaying[idx];
                $("#yourPlaying").append(createGameDiv(game.name, "gamesPlaying-"+idx));
            }
        }
        refreshToolListeners();
    });

}

/*---Open and Populate Modal---*/
/*
 * @param items - array of div objects
 * each div object may include:
 *      type (div or input)
 *      class (array of string class names)
 *      content (string of innertext)
 */
function openNewModal(items){
    var count = 0;
     for(var obj of items){
         var tag = obj.type || "div";
         var classes = "";for(var c of obj.classes){classes+=c+" "};
         var inner = obj.content || "";
         var html = "<"+tag+" class='"+classes+"'";
         if(tag == 'textarea')
             html+="placeholder='"+inner+"'></"+tag+">";
         else if(tag != "input")
            html+=">"+inner+"</"+tag+">";
         else
             html+="placeholder='"+inner+"'>";
         $("#mmc-wrapper").append(html);
         count++;
     }
     if(count > 4){
         $('#main-modal-content').css({'margin': '2% auto'});
     }
     else
         $('#main-modal-content').css({'margin': '15% auto'});
     $('#main-modal').fadeIn(500);
}

function closeMainModal(){
    $("#main-modal").fadeOut(500, function(){
        $("#mmc-wrapper").html("");
    });
}

/*---------Join Game---------*/
function joinGame(id){
    getUser(function(user){
       var gameIndex = id; 
       put('/games', {filter: {strId: id}, op: '$push', key: 'players', value: user}, function(game){
           game = game.value;
           if(!(id in user.gamesPlaying) && game.hasStarted == 'false'){
               if(!('isModerator' in game))
                   game.isModerator = (game.id in user.createdGames)

               
               put('/users', {id: user._id, key: 'gamesPlaying.'+gameIndex, value: game}, function(data){
                   console.log(data);
                   refreshNavCol();
               });
           }
           else{
               alert('This game has started or you are already a participant');
           }

       });
    });
}

/*---Get input for game creation---*/
function launchGameCreation(){
    var items = [
        {
            type:'h1',
            classes: [],
            content: "Create Game"
        },
        {
            type:'input',
            classes: ['gameNameInp'],//todo
            content: "Game Name"
        },
        {
            type: 'div',
            classes: ['modal-container'],
            content: '<h3 class="contained-inp cont-label">Start Date</h3><h3 class="contained-inp cont-label">End Date</h3>'
        },
        {
            type: 'div',
            classes: ['modal-container'],
            content: '<input id="startD" class="contained-inp" type="date"><input id="endD" class="contained-inp" type="date">'
        },
        {
            type: 'input',
            classes: ['locationInp'],
            content: 'Game Location'
        },
        {
            type: 'div',
            classes: ['modal-container'],
            content: '<input class="killInterval" placeholder="Kill interval? # of Days" type="number" min="1" max="365">'
        },
        {
            type: 'textarea',
            classes: ['tall-input', 'gameDescription'],
            content: 'Description or unique rules'
        },
        {
            type: 'input',
            classes:['userRestrict'],
            content: 'Regulate user domain? @example.com'
        },
        {
            type: 'input',
            classes: ['gamePass'],
            content: 'Add game password?'
        },
        {
            type: 'button',
            classes: ['modal-createB'],
            content: "Create"
        }
    ]
    openNewModal(items);
    $(".modal-createB").on('click', function(){
        var name = $('.gameNameInp').val();
        var startDate = $('#startD').val();
        var endDate = $('#endD').val();
        var loc = $('.locationInp').val();
        var description = $('.gameDescription').val();
        var domain = $('.userRestrict').val();
        var password = $('.gamePass').val();
        var killInterval = $('.killInterval').val();
        createGame(name, startDate, endDate, loc, description, domain, password, killInterval);
        closeMainModal();
    });
}

/*---Create Game---*/
function createGame(name, startDate, endDate, loc, description, domain, password, killInterval){
    var loader = startLoading();
    var game = {'name': name, 'start': startDate, 'end': endDate, 'location': loc, 'description': description, 'domain': domain, 'password': password, "hasStarted": false, killInterval: killInterval };
    if(game.password.length == 0)
        delete game.password;
    getUser(function(u){
        var owner = u.firstName + " " + u.lastName;
        game.owner = owner;
        game.ownerId = u._id;
        post('/games', game, function(data){
            console.log('created game. data: ' + data);
            var gameIdx = data._id; //change!
            game._id = gameIdx;
            game.isModerator = true;
            console.log(game);

            put('/users', {id: u._id, key: ("createdGames."+gameIdx), value: game}, function(d){
                console.log('updated. data: ' + d);
                stopLoading(loader);
                refreshNavCol();
            });
        });
    });
    
}


function createGameDiv(gameName, id){
     return '<div class="toolItem" data-type="Game" id="'+id+'">'+gameName+'</div>';
}

function checkNotifications(){
    getUser(function(user){
        if('notifications' in user){
            var notifications = [];
            for(var n of user.notifications)
                notifications.push(new InternalNotification(n.title, n.message, n.buttons, n.data));
            openNotifications(notifications, 0);
        }
    });
}

function openNotifications(notifications, idx){
    if(idx < notifications.length){
        openNewModal(notifications[idx].modal_items);
        dismissNotification(function(data){console.log(data);});
        $(document).off('click').on('click', function(){
            openNotifications(notifications, idx + 1);
        });
    }
    else{
        $(document).off('click');
        closeMainModal();
    }

}


/*---Loading animation---*/
function startLoading(){
    $('#main-modal').show();
    $('#main-modal-content').hide();
    $('.loading').show();
    var deg = 0;
    return setInterval(function(){
        deg += 10;
        $('.loading').css({'transform':'rotate('+deg+'deg)'});
    }, 100);
}

function stopLoading(timer){
    clearInterval(timer);
    $('#main-modal-content').show();
    $('.loading').hide();
    $('.modal').hide();
}

/*---------Search Functionality---------*/
function showSearchResults(search){
    get('/games', {name: {$regex: '(?i).*'+search+'.*'}}, function(data){
        $('#content-pane').html('');
        for(var res of data){
            var title = "<div class='search-title'>"+res.name+"</div><hr>";
            var sUser = "<div class='search-item'>Owner: "+res.owner+"</div>";
            var sLoc = "<div class='search-item'>Location: "+res.location+"</div>";
            var sDate = "<div class='search-item'>Start Date: " + res.start+"</div>";
            var id = res._id;
            $('#content-pane').append('<div id="'+id+'" class="search-result">'+title+'<div class="search-items">'+sUser+sLoc+sDate+'</div></div><br>');
            $('.search-result').on('click', function(){
                get('/games', {strId: $(this).attr('id')}, function(games){
                    var game = games[0];
                    populateContentPane('Searched-Game', game)
                });
            });
        }
    });
}

/*---Populate Content Pane---*/
function populateContentPane(type, id){ //add some stuff to the pane
    switch(type){
        case "User Info":
            populateUserInfo(id);
            break;
        case "Game":
            gameInfoFromDiv(id);     
            break;
        case "Searched-Game":
            populateGameInfo(id);
            break;
    }
}

//do some stuffs
function populateUserInfo(id) {
    getUser(function(data){
        var u = data;
        console.log(data);
        $("#content-pane").html(
            "<h1>Welcome</h1><br>"+
            "<h2>User: </h2>" + "<p>"+u.firstName+" " + u.lastName + "</p><br>" +
            "<h2>Total Kills: </h2>" + "<p>"+ u.totalKills + "</p>"
        );
    })
}

function gameInfoFromDiv(id){
    var user = firebase.auth().currentUser;
    var uid = user.uid;
    var userDomain = "@" + user.email.split("@")[1];
    var gameID = id.split('-')[1];
    getUser(function(data){
        var game = data[id.split('-')[0]][gameID];
        console.log('game info');
        populateGameInfo(game);
    });
}

function populateGameInfo(game){
    var user = firebase.auth().currentUser;
    var userDomain = "@" + user.email.split("@")[1];
    getUser(function(user){
        $("#content-pane").load('gameContent.html', function(){
                $('.gameName').html(game.name);
                $('.location').html(game.location);
                $('.owner').html(game.owner);
                $('.startDate').html(game.start);
                $('.description').html(game.description);
                if(!(game._id in user.gamesPlaying)){
                    $('.joinButton').fadeIn(500, function(){
                        $('.joinButton').on('click', function(){
                            joinGameClick(game, userDomain);            
                        });
                    });
                }
                if(game.isModerator == 'true'){
                    $('.editButton').fadeIn(500);
                }
                if(game.hasStarted == 'true'){
                    $('.gameActive').fadeIn(500);
                    get('/users', {_id: game.target}, function(targetData){
                        var targetUser = targetData[0];
                        $('.target').html(targetUser.firstName + " " + targetUser.lastName);
                    });
                    if('safeties' in game)
                        $('.safeties').html(game.safeties.join(', '));
                    var deadline = new Date(game.killDeadline);
                    interval.make(function(){
                        $('.deadline').html("Time to kill target: <br>" + dateCountdown(deadline));
                        console.log('changing countdown');
                    }, 1000);
                }
        });
    });
}

function startGame(id) {
    var loader = startLoading();
    getUser(function(user){
        get('/games',{strId: id},function(game){
            var game = game[0];
            if(id in user.createdGames && game.hasStarted == 'false'){
                var gameID = game._id;
                var playArr = game.players;
                var playIds = [];
                var targetArr = [];
                console.log(playArr);
                for(let i=0; i < playArr.length; i++){
                    playIds.push(playArr[i]._id);
                }
                console.log(playIds);
                targets = match(playIds);

                var date = new Date();
                date.setDate(date.getDate() + parseInt(game.killInterval, 10));

                function putTarget(user, target, idx, max){//function to recursively add targets
                    put('/users', {id: user, setPair:{['gamesPlaying.'+gameID+'.target']: target, ['gamesPlaying.'+gameID+'.hasStarted']: true, ['gamesPlaying.'+gameID+'.killDeadline']: date}}, function(res){
                        if(idx < max){
                            putTarget(target, targets[target], idx + 1, max);
                        }
                        else{
                            put('/games', {filter: {strId:id}, key: 'hasStarted', value: true}, function(result){
                                stopLoading(loader);
                            });
                        }
                    });
                }

                var starter = Object.keys(targets)[0];
                var target = targets[starter];
                var max = Object.keys(targets).length - 1;
                putTarget(starter, target, 0, max);
            }
            else{
                alert('Error: game has already started or you do not have permission to start game');
                stopLoading(loader);
            }
        });
    });
}

function joinGameClick(game, userDomain){
    var id = game._id;
    var domainBool = (game.domain.length == 0 || game.domain == userDomain);
    if('password' in game){
        $('.joinPass').slideDown(300);
        $('.joinButton').off('click').on('click', function(){
            if($('.joinPass').val() == game.password && domainBool)
                joinGame(id);
            else if(domainBool)
                $('.joinPass').css({'border-color': 'red'});
            else
                alert("You don't belong to the required domain");
        });
    }
    else if(domainBool){
        joinGame(id);
    }
    else{
        alert("You don't belong to the required domain");
    }
}

function deleteUser(){
    var user = firebase.auth().currentUser;
    ajaxDelete('/users', {_id: user.uid}, function(data){
        console.log('deleted from mongo');
        user.delete().then(function(){
            console.log('deleted from firebase');
        }).catch(genCatch);
    });
}

function dateCountdown(deadline){
    var now = new Date().getTime();
    var distance = deadline.getTime() - now;

    // Time calculations for days, hours, minutes and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    return (distance > 0)?(days + " days " + hours + " hrs " + minutes + " min " + seconds + " sec "):"Deadline Passed!"
}

/*---------Report player killed---------*/
function reportPlayerKilled(id, gameId){
    get('/games', {strId: gameId}, function(owner){
        var gameName = game.name;
        var message = 'Your assassin reported you as dead in ' + gameName + '. Please confirm whether or not this is the case.';
        var report = new InternalNotification('Player Killed', message, ['Dispute', 'Confirm'], {gameId: gameId});
        var keyPair = {notifications: report.dbStore};
        sendNotification(id, report, function(response){
            sendNotification(owner._id, report, function(res){
                console.log('pushed kill report');
            });
        });
    });
}

function sendNotification(recipient, notification, callback){
    put('/users', {filter: {_id: recipient}, setPair: {notifications: notification.dbStore}, op: '$push'}, function(response){
        callback(response);
    });
}

function dismissNotification(callback){
    put('/users', {filter: {_id: firebase.auth().currentUser.uid}, key: 'notifications', value: -1, op: '$pop'}, function(data){
       callback(data);
    });
}

/*---------Global intervals object for countdowns---------*/
var interval = {
    // to keep a reference to all the intervals
    intervals : new Set(),

    // create another interval
    make(...args) {
        var newInterval = setInterval(...args);
        this.intervals.add(newInterval);
        return newInterval;
    },

    // clear a single interval
    clear(id) {
        this.intervals.delete(id);
        return clearInterval(id);
    },

    // clear all intervals
    clearAll() {
        for (var id of this.intervals) {
            this.clear(id);
        }
    }
};

/*---------Notification Button Listeners---------*/
var notificationButtons = {
    'Confirm': function(){

    }
}
