/*---------Generic Helper Functions---------*/
function get(route, query,  callback){
    if(Object.keys(query).length > 0){
        route+="?";
        for(var x in query){
            route+= (x+"="+query[x]+"&");
        }
        route = route.substring(0, route.length - 1);
    }
        
   $.get(route, function(data){
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
}


/*=================================*/ 
/*---------Major Functions---------*/
/*=================================*/ 

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
    var user = firebase.auth().currentUser.uid;
    var game = {'name': name, 'start': startDate, 'end': endDate, 'description': description, 'domain': domain};
    post('/games', game, function(data){
        console.log('created game. data: ' + data);
        get('/users', {_id: user}, function(res){
            var u = res[0];
            var gameIdx = Object.keys(u.games).length;
            game._id = data._id;
            console.log(game);
            put('/users', {id: user, key: ("games."+gameIdx), value: game}, function(d){
                console.log('updated. data: ' + d);
            });
        });
    });
    
}
