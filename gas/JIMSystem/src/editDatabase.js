$(function(){
    _val.pageFun.editDatabase = {
        onload:function(){
            _val.server.getData("collectionInfo")
            .filter(function(collObj){
                return !inArray(["shiftTableUser","shiftTableWork","workAssign","workNotAssigned"],collObj.getValue("name"));
            })
            .sort(function(a,b){
                return a.getValue("name").charCodeAt() - b.getValue("name").charCodeAt();
            })
            .forEach(function(collInfo){
                $("#formEditDatabase select[name='databaseName']").append("<option name='" + collInfo.getValue("name") + "'>" + collInfo.getValue("name") + "</option>");
            });
        },
        showTable:function(){
            var form = document.getElementById("formEditDatabase");
            var result = document.getElementById("formEditDatabase_result");

            createTable(
                _val.server.getData($("#formEditDatabase [name='databaseName']").val())
                .filter(function(v){return true})
                .sort(function(a,b){return 1})
                .map(function(v){return v.getValues()}),
                result,
                function(el,datapiece,key){
                    console.log(el,datapiece,key);
                }
            );


        }
    };
});