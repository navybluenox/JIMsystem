$(function(){
    _val.pageFun.editDatabase = {
        onload:function(){
            _val.server.getData("collectionInfo")
            .filter(function(collObj){
                return !inArray(["shiftTableUser","shiftTableWork","workAssign","workNotAssigned","systemConfig","collectionInfo"],collObj.getValue("name"));
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
            var promise;
            var dataName = $("#formEditDatabase [name='databaseName']").val();

            if(!_val.server.isLoadedData(dataName)){
                promise = _val.server.loadDataByName(dataName);
            }else{
                promise = Promise.resolve();;
            }
            
            promise.then(function(){
                var dataArr = _val.server.getData(dataName)
                    .filter(function(v){return true})
                    .sort(function(a,b){return 1})
                    .map(function(v){return v.getValues()});
                createTable(
                    dataArr,
                    result,
                    0,
                    function(cellObj){
                        console.log(cellObj);
                        if(cellObj.rowData._id === "dummy"){
                            if($(cellObj.el.parentNode).find("td").length !== 1){
                                var el = cellObj.el.parentNode;
                                $(el).find("td").remove();
                                $(el).append([
                                    "<td colSpan='0'>",
                                        "<input type='button' value='追加'>",
                                        "<input type='hidden' value='0'>",
                                    "</td>"
                                ].join("")).find("td input[type='button']").css("margin","0 auto");

                            }
                        }else{
                            if(cellObj.key.join(".") === "_id"){
                            }else if(cellObj.key.join(".") === "_button_"){
                                $(cellObj.el).addClass("_button_");
                                $(cellObj.el).append([
                                        "<input type='button' name='" + [cellObj.rowData._id,"_","change"].join("") + "' value='change'>",
                                        "<input type='button' name='" + [cellObj.rowData._id,"_","remove"].join("") + "' value='remove'>"
                                ].join(""))
                            }else{
                                cellObj.el.textContent = "";
                                $(cellObj.el)
                                    .append([
                                        "<input type='button' name='" + [cellObj.rowData._id,"_","input"].join("") + "' value='" + cellObj.value + "'>",
                                        "<input type='hidden' name='" + [cellObj.rowData._id,"_","raw"].join("") + "' value='" + cellObj.value + "'>"
                                    ].join(""));
                                $(cellObj.el).find("input[type='button']").on("click",function(e){
                                    //TODO
                                    console.log($(cellObj.el.parentNode)[0]);
                                })
                            }
                        }
                    },
                    {
                        leftColumn:{key:["test1","test2"],callback:[
                            function(cellObj){console.log(cellObj)},
                            function(cellObj){console.log(cellObj)}
                        ]},
                        rightColumn:{key:["test11","test12"],callback:[
                            function(cellObj){console.log(cellObj)},
                            function(cellObj){console.log(cellObj)}
                        ]},
                        bottomRow:{key:["test111","test112","test113"],
                        createCell:[true,true,false],
                        callback:[
                            function(cellObj){console.log(cellObj)},
                            function(cellObj){console.log(cellObj)},
                            function(rowObj){console.log(rowObj)}                            
                        ]},
                        foldArray:true
                    }
                );
            });
        }
    };
});