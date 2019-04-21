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
