$(function(){
    var workListEditing;
    _val.pageFun.editWorkList = {
        onload:function(){
            _val.server.loadData("user");
            _val.server.loadData("workList");
        },updateWorkList:function(kind,_id){
            var workList;
            if(kind === "add"){

            }else if(kind === "change"){

            }else if(kind === "remove"){

            }
            //_val.server.sendUpdateQueue();
        },searchUserIdByAzusa:function(el){
            el = $(el);
            console.log(el);
            //TODO get Users(after loading)
        }
    };
});