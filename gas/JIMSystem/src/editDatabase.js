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
                        if(cellObj.key[0] === "_id"){
                        }else if(cellObj.isArray){
                            $(cellObj.el).append("<table><thead></thead><tbody></tbody></table>");
                            if(cellObj.isHashInArray){
                                $(cellObj.el).find("table thead").append([
                                    "<tr>",
                                    ["del","index"].concat(cellObj.keysOfHashInArray).map(function(v){
                                        return "<th>" + v + "</th>";
                                    }).join(""),
                                    "</tr>"
                                ].join(""));
                                $(cellObj.el).find("table tbody").append(repeatString("<tr></tr>",cellObj.value.length));
                                cellObj.value.forEach(function(v,index){
                                    var jqo = $(cellObj.el).find("table tbody tr").eq(index);
                                    jqo.append("<td><input type='checkbox' class='del_array'></td><td>" + index +"</td>");
                                    cellObj.keysOfHashInArray.forEach(function(key){
                                        var str = "";
                                        switch(classof(v[key])){
                                            case "number":
                                            case "string":
                                            case "boolean":
                                                str = "" + v[key];
                                                break;
                                            case "null":
                                            case "undefined":
                                                str = JSON.stringify(v[key]);
                                                break;
                                            case "date":
                                                str = dateToValue(v[key]).str;
                                                break;
                                            case "localdate":
                                                str = v[key].toString();
                                                break;
                                            default:
                                                break;
                                        }
                                        jqo.append("<td><input type='button'>" + str + "</td>");
                                        jqo.find("tr td input[type='button']").on("click",function(e){
                                            console.log(e.target);
                                        });
                                    });
                                });
                            }else{
                                $(cellObj.el).find("table thead").append([
                                    "<tr>",
                                    "<th>del</th>",
                                    "<th>index</th>",
                                    "<th>value</th>",
                                    "</tr>"
                                ].join(""));


                                //TODO NOW!!
                            }
                        }else{
                            cellObj.el.textContent = "";
                            $(cellObj.el).append("<input type='button' value='" + cellObj.value + "'>");
                            $(cellObj.el).find("input[type='button']").on("click",function(e){
                                console.log($(cellObj.el.parentNode)[0]);
                            });
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