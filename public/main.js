/*---------Generic Helper Functions---------*/
function get(route, query,  callback){
    query.current_user = query.current_user || firebase.auth().currentUser.uid;
    $.get(route, query, function(data){
       callback(data);
   }); 

}

function getUser(callback, desired){
    var query = {_id:id};
    if(!(typeof desired == 'undefined'))
        query.desired = desired;
    var id = firebase.auth().currentUser.uid;
    get('/users', {_id: id, desired: desired}, function(data){
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
    data.current_user = firebase.auth().currentUser.uid;
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

function refreshGamePage(game){
    refreshNavCol();
    populateGameInfo(game);
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
    }, ['gamesPlaying', 'createdGames']);

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
    $('#mmc-wrapper').html('');
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
function joinGame(id, joining_id, callback){
    var joining = joining_id || firebase.auth().currentUser.uid;
    get('/users', {_id: joining, current_user: joining, desired:['gamesPlaying', '_id', 'createdGames']}, function(user){
	user = user[0];
       var gameIndex = id; 
       put('/games', {filter: {strId: id}, op: '$push', key: 'players', value: user._id}, function(game){
           game = game.value;
           if(!(id in user.gamesPlaying) && game.hasStarted == 'false'){
               if(!('isModerator' in game))
                   game.isModerator = (game._id in user.createdGames)

               
               delete game.players;
               put('/users', {id: user._id, key: 'gamesPlaying.'+gameIndex, value: game}, function(data){
                   console.log(data);
		   if(callback)
		       callback();
		   else
                       refreshGamePage(game);
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
    var items = modalContent['Create Game'];
    openNewModal(items);
    $(".modal-createB").on('click', function(){
        var name = $('.gameNameInp').val();
        var startDate = $('#startD').val();
        var endDate = $('#endD').val();
        var loc = $('.locationInp').val();
        var description = encodeURI($('.gameDescription').val());
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
            $('.close').hide();
            $('.nextModal').show();
            openNotifications(notifications, 0);
        }
    });
}

function openNotifications(notifications, idx){
    if(idx < notifications.length){
        openNewModal(notifications[idx].modal_items);
        $(document).off('click').on('click', function(){
            openNotifications(notifications, idx + 1);
        });
        $('.modal-button').off('click').on('click', function(){
            notificationButtons[$(this).text()]($(this).attr('data-info'));
            dismissNotification(idx, function(data){
                console.log(data);
            })
        });
    }
    else{
        $('.close').show();
        $('.nextModal').hide();
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
    var desired = ['name', 'owner', 'location', 'start', '_id'];
    get('/games', {name: {$regex: '(?i).*'+search+'.*'}, desired: desired}, function(data){
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
		    getUser(function(user){
			if(game._id in user.gamesPlaying)
			    populateContentPane('Searched-Game', user.gamesPlaying[game._id]);
		        else
			    populateContentPane('Searched-Game', game);
		    });
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
        $("#content-pane").load('userInfo.html', function(){
            $('.email').html(u.email);
            $('.userName').html(u.firstName + ' ' + u.lastName);
            $('.totalKills').html(u.totalKills);
            $('.totalGames').html(Object.keys(u.gamesPlaying).length);
            var games = u.gamesPlaying;
            $('.currentGames').html('');
            for(id in games){
                var game = games[id];
                if(game.hasStarted == 'true')
                    $('.currentGames').append(game.name + "<br>");
            }
        });
    }, ['firstName', 'lastName', 'totalKills', 'gamesPlaying', 'email']);
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
                $('.description').html(((game.description).includes('%'))?decode(game.description):decode(encodeURI(game.description)));
                $('.kills').html(game.kills);

                if(!(game._id in user.gamesPlaying)){
                    $('.joinButton').fadeIn(500, function(){
                        $('.joinButton').on('click', function(){
                            joinGameClick(game, userDomain);            
                        });
                    });
                }

                if(game.isModerator == 'true' || game._id in user.createdGames){
                    $('.editButton').fadeIn(500).on('click', function(){
                        var items = modalContent['Create Game'];
                        items[items.length - 1] = {
                            type: 'button',
                            classes: ['modal-editB'],
                            content: 'Save Edits'
                        };
                        openNewModal(items);
                        $('.modal-editB').on('click', function(){
                            var setPair = {
                                name: $('.gameNameInp').val(),
                                start: $('#startD').val(),
                                end: $('#endD').val(),
                                loc: $('.locationInp').val(),
                                description: encodeURI($('.gameDescription').val()),
                                domain: $('.userRestrict').val(),
                                password: $('.gamePass').val(),
                                killInterval: $('.killInterval').val()
                            };
                            for(key in setPair){
                                if(key == "")
                                    delete setPair[key];
                            }
                            put('/games', {filter:{strId: game._id}, setPair: setPair}, function(data){
                                console.log("Updated Game: " + JSON.stringify(data));
                                propagateGameChange(game._id, function(){
                                    refreshNavCol();
                                    getUser(function(userRes){
                                        closeMainModal();
                                         if(game._id in userRes.createdGames)
                                            populateGameInfo(userRes.createdGames[game._id]);
                                         else
                                            populateGameInfo(userRes.gamesPlaying[game._id]); 
                                    });
                                });
                            });
                        });
                    });

                    $('.addSafetiesButton').fadeIn(500).on('click', function(){
                        var items = modalContent['Add Safeties'];
                        openNewModal(items);
                        $('.addMoreSafeties').on('click', function(){
                            $('.addSafeties').append('<input class="addSafety" placeholder="Add a safety item">');
                        });
                        $('.completeSafeties').on('click', function(){
                            var safeties = [];
                            var safetyInputs = $('.addSafeties input');
                            for(input of safetyInputs){
                                if(input.value.length > 0)
                                    safeties.push(input.value);
                            }
                            addSafeties(game._id, safeties);   
                        });
                    });
                }
                if(game.hasStarted == 'true'){
                    $('.gameActive').fadeIn(500);
                    get('/users', {_id: game.target, desired: ['_id', 'firstName', 'lastName']}, function(targetData){
                        var targetUser = targetData[0];
                        if(targetUser._id == user._id){
                            $('.target').html('You won');
                            $('.deadline').html('You won');
                            $('.reportKill').hide();
                            interval.clearAll();
                        }
                        else{
                            $('.target').html(targetUser.firstName + " " + targetUser.lastName);
                        }
                    });
                    
                    //check for safeties
                    get('/games', {strId: game._id, desired: ['safeties']}, function(gameRes){
                        var gameRes = gameRes[0];
                        if('safeties' in gameRes)
                            $('.safeties').html(gameRes.safeties.join(', '));
                    });
                    
                    //check if dead
                    if(isAlive(game, user._id)){ //TODO: fix deadline display
                        get('/games', {strId: game._id, desired: ['roundEnd', 'round']}, function(data){
                            if('roundEnd' in data[0]){
                                var roundEnd = new Date(data[0]['roundEnd']);
                                interval.make(function(){
                                    $('.deadline').html("Round ends in: <br>" + dateCountdown(roundEnd));
                                    console.log('changing countdown');
                                }, 1000);
                                $('.round').html(data[0]['round']);
                            }
                        });

                        $('.reportKill').on('click', function(){
                            reportPlayerKilled(game.target, game._id);
                            alert('A report has been sent. The target or moderator must confirm the kill before it is official.');
                        });

                        if('roundEligible' in game)
                            $('.roundEligible').html(game.roundEligible);
                    }
                    else{
                        $('.deadline').html("You've been killed!");
                        $('.reportKill').hide().off('click');
                    }
                }
                else if(game.isModerator == 'true' || game._id in user.createdGames){
                    $('.startButton').fadeIn(500).on('click', function(){
                        startGame(game._id);
                    });
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
                var playIds = game.players;
                var targetArr = [];
                
                console.log(playIds);
                targets = match(playIds);

                var date = new Date();
                date.setDate(date.getDate() + parseInt(game.killInterval, 10));

                var gameString = 'gamesPlaying.'+gameID;
                function putTarget(user, target, idx, max){//function to recursively add targets
                    put('/users', {
                        filter:{_id: user},
                        setPair:{
                            ['gamesPlaying.'+gameID+'.target']: target,
                            ['gamesPlaying.'+gameID+'.hasStarted']: true,
                            [gameString+'.roundElegible']:1
                        }
                    }, function(res){
                        if(idx < max){
                            putTarget(target, targets[target], idx + 1, max);
                        }
                        else{
                            stopLoading(loader);
                        }
                    });
                }

                var starter = Object.keys(targets)[0];
                var target = targets[starter];
                var max = Object.keys(targets).length - 1;
                put('/games', {
                    filter: {strId: gameID},
                    setPair: {hasStarted: 'true', round:1, roundEnd: date}
                }, function(data){
                    putTarget(starter, target, 0, max);
                });
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
        openNewModal([
                {
                    type: 'h1',
                    classes: [],
                    content: 'Join Game'
                },
                {
                    type: 'input',
                    classes: ['joinPass'],
                    content: 'Entry Code'
                },
                {
                    type: 'button',
                    classes: ['joinButton'],
                    content: 'Join Game'
                }
        ]);
        $('.joinButton').off('click').on('click', function(){
            if($('.joinPass').val() == game.password && domainBool){
                joinGame(id);
                closeMainModal();
            }
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
    get('/games', {strId: gameId, desired:['name', 'ownerId']}, function(game){
        var game = game[0];
        var gameName = game.name;
        var owner = game.ownerId;
        var message = 'Your assassin reported you as dead in ' + gameName + '. Please confirm whether or not this is the case.';
        var report = new InternalNotification('Player Killed', message, ['Dispute', 'Confirm'], {
            userId: id,
            gameId: gameId,
            killer: firebase.auth().currentUser.uid,
        });
        var keyPair = {notifications: report.dbStore};
        sendNotification(id, report, function(response){
            var killedName = response.value.firstName + " " + response.value.lastName;
            report.updateMessage(killedName + ' was reported dead in ' + gameName + '. Please confirm whether or not this is the case.');
            sendNotification(owner, report, function(res){
                console.log('pushed kill report, ' + res);
                var killVote = {[owner]: null, [id]: null};
                put('/users', {filter: {_id: id}, setPair: {['gamesPlaying.'+gameId+'.killVote']: killVote}}, function(data){
                    console.log('Put kill vote object');
                });
            });
        });
    });
}

function sendNotification(recipient, notification, callback){
    put('/users', {filter: {_id: recipient}, setPair: {notifications: notification.dbStore}, op: '$push'}, function(response){
        callback(response);
    });
}

function dismissNotification(idx, callback){
    getUser(function(user){
        var notifications = user.notifications;
        var op, setPair;
        if(notifications.length > 1){
            notifications.splice(idx, 1);
            op = '$set';
            setPair = {notifications: notifications};
        }
        else{
            op = "$pull";
            setPair = {notifications: {title: notifications[0].title}};
        }
        put('/users', {filter: {_id: user._id}, setPair: setPair, op: op}, function(data){
            callback(data);
        })
    });
} 

function vote(vote, gameId, userId, killer){
    var currId = firebase.auth().currentUser.uid;
    put('/vote', {currId: currId, killer: killer, gameId: gameId, filter: {_id: userId}, setPair: {['gamesPlaying.'+gameId+'.killVote.' + currId]: vote}}, function(data){
            console.log(data);
    });
}

function isAlive(game, userId){
    var isVoting = ('killVote' in game);
    var votingAlive = !(isVoting && (game.killVote[game.ownerId] == 'true' || game.killVote[userId] == 'true'));
    var isKilled = ('killed' in game && game.killed == 'true');
    return (votingAlive && !isKilled);
}

function propagateGameChange(id, callback){
    var loader = startLoading();
    get('/games', {strId: id}, function(game){
        var game = game[0];
        var gameId = game._id;
        var players = game.players || [];
        players.push(game.ownerId);
        var update = {
            ['gamesPlaying.'+gameId+'.name']: game.name,
            ['gamesPlaying.'+gameId+'.start']: game.start,
            ['gamesPlaying.'+gameId+'.end']: game.end,
            ['gamesPlaying.'+gameId+'.loc']: game.loc,
            ['gamesPlaying.'+gameId+'.description']: game.description,
            ['gamesPlaying.'+gameId+'.domain']: game.domain,
            ['gamesPlaying.'+gameId+'.password']: game.password,
            ['gamesPlaying.'+gameId+'.killInterval']: game.killInterval,
            ['gamesPlaying.'+gameId+'.safeties']: game.safeties
        }
        function propagate(idx){
            if(idx == players.length - 1){
                var gameString = 'createdGames'+gameId;
                var update = {
                    [gameString+'.name']: game.name,
                    [gameString+'.start']: game.start,
                    [gameString+'.end']: game.end,
                    [gameString+'.loc']: game.loc,
                    [gameString+'.description']: game.description,
                    [gameString+'.domain']: game.domain,
                    [gameString+'.password']: game.password,
                    [gameString+'.killInterval']: game.killInterval,
                    [gameString+'.safeties']: game.safeties
                }
            }
            if(idx < players.length){
                var player = players[idx];
                put('/users', {filter: {_id: player}, setPair: update}, function(data){
                    propagate(idx + 1);
                });
            }
            else{
                stopLoading(loader);
                callback();
            }
        }
        propagate(0);
    });
}

function addSafeties(gameId, safeties){
    put('/games', {filter: {strId: gameId}, setPair: {safeties: safeties}}, function(safetyRes){
        console.log('Added safeties: ' + safetyRes);
        propagateGameChange(gameId, function(){
            refreshNavCol();
            getUser(function(userRes){
                closeMainModal();
                if(gameId in userRes.createdGames)
                    populateGameInfo(userRes.createdGames[gameId]);
                else
                    populateGameInfo(userRes.gamesPlaying[gameId]);

            });
        });
    });

}
    
function decode(string){
    var newLines = string.replace(/%0A/g, '<br>');
    return newLines.replace(/%20/g, ' ');
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
    'Confirm': function(id){
        var data = JSON.parse(id);
        vote(true, data.gameId, data.userId, data.killer); 
    },

    'Dispute': function(id){
        var data = JSON.parse(id);
        vote(false, data.gameId, data.userId, data.killer);
    }
}
