/*---------Generic Helper Functions---------*/
function get(route, query,  callback){
   $.get(route, query, function(data){
       callback(data);
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
}


/*=================================*/ 
/*---------Major Functions---------*/
/*=================================*/ 

function activate(divID){
   $('.active').removeClass('active');
   $('#divID').addClass('active');
}

/*---------Update Nav Column---------*/
function refreshNavCol(){
    $('#yourCreations, #yourPlaying').html('');
    var user = firebase.auth().currentUser.uid; 
    get('/users', {_id: user}, function(data){
        var u = data[0];
        var createdGames = u.createdGames;
        if(Object.keys(createdGames).length == 0){
            $('#yourCreations').html("You haven't created any games yet!");
        }else{
            for(var idx in createdGames){
                var game = createdGames[idx];
                $('#yourCreations').append(createGameDiv(game.name, game._id));
            }
        }
        
        var gamesPlaying = u.gamesPlaying;
        if(Object.keys(gamesPlaying).length == 0){
            $('#yourPlaying').html("You aren't playing any games yet!");
        }
        else{
            for(var idx in gamesPlaying){
                var game = gamesPlaying[idx];
                $("#yourPlaying").append(createGameDiv(game.name, game._id));
            }
        }
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
         $('#main-modal-content').css({'margin': '5% auto'});
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
        var description = $('.gameDescription').val();
        var domain = $('.userRestrict').val();
        createGame(name, startDate, endDate, description, domain);
        closeMainModal();    
    });
}

/*---Create Game---*/
function createGame(name, startDate, endDate, description, domain){
    var loader = startLoading();
    var user = firebase.auth().currentUser.uid;
    var game = {'name': name, 'start': startDate, 'end': endDate, 'description': description, 'domain': domain};
    post('/games', game, function(data){
        console.log('created game. data: ' + data);
        get('/users', {_id: user}, function(res){
            var u = res[0];
            var gameIdx = Object.keys(u.createdGames).length || 0;
            game._id = data._id;
            game.isModerator = true;
            console.log(game);
            put('/users', {id: user, key: ("createdGames."+gameIdx), value: game}, function(d){
                console.log('updated. data: ' + d);
                stopLoading(loader);
                refreshNavCol();
            });
        });
    });
    
}

function createGameDiv(gameName, id){
     return '<div class="toolItem" id="'+id+'">'+gameName+'</div>';
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
}

/*---------Search Functionality---------*/
function showSearchResults(search){
    get('/games', {name: {$regex: '(?i).*'+search+'.*'}}, function(data){
        $('#content-pane').html('');
        for(var res of data){
            $('#content-pane').append('<div>'+res.name+'</div><br>');
        }
    });
}

/*---Populate Content Pane*/
function populateContentPane(type, user = undefined){ //add some stuff to the pane
    switch(type){
        case "User Info":
            populateUserInfo(user);
            break;
        case "Game":
            //do some other stuff
            break;
    }
}

//do some stuffs
function populateUserInfo(user) {
    get("/users", {_id: user.uid}, function(data){
        var u = data[0];
        console.log(data);
        $("#content-pane").html(
            "<h1>Welcome</h1><br>"+
            "<h2>User: </h2>" + "<p>"+u.firstName+" " + u.lastName + "</p><br>" +
            "<h2>Total Kills: </h2>" + "<p>"+ u.totalKills + "</p>"
        );
    })
}
