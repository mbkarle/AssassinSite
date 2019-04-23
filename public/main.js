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
   $.post(route, data, function(res){callback(res)}); 
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
     for(var obj of items){
         var tag = obj.type || "div";
         var classes = "";for(var c of obj.classes){classes+=c+" "};
         var inner = obj.content || "";
         var html = "<"+tag+" class='"+classes+"'";
         if(tag != "input")
            html+=">"+inner+"</"+tag+">";
         else
             html+="placeholder='"+inner+"'>";
         $("#mmc-wrapper").append(html);
     }
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
            classes: [],//todo
            content: "Game Name"
        },
        {
            type: 'button',
            classes: ['modal-createB'],
            content: "Create"
        }
    ]
    openNewModal(items);
    $(".modal-createB").on('click', closeMainModal);
}

/*---Create Game---*/
function createGame(/*some parameters*/){

}
