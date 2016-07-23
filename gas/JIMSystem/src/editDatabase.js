_tmp.pageFun.editDatabase = {
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

    }
}