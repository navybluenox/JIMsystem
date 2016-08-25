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
            _tmp.changedDataQue = [];
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
                        var jqoCell = $(cellObj.el);
                        if(cellObj.key[0] === "_id"){
                        }else if(cellObj.isArray){
                            jqoCell.append("<table><thead></thead><tbody></tbody></table>");
                            if(cellObj.isHashInArray){
                                /*jqoCell.find("table thead").append([
                                    "<tr>",
                                    ["del","index"].concat(cellObj.keysOfHashInArray).map(function(v){
                                        return "<th>" + v + "</th>";
                                    }).join(""),
                                    "</tr>"
                                ].join(""));*/
                                jqoCell.find("table tbody").append(repeatString("<tr></tr>",cellObj.value.length));
                                cellObj.value.forEach(function(v,index){
                                    var jqoTableRowInCell = jqoCell.find("table tbody tr").eq(index);
                                    //jqoTableRowInCell.append("<td><input type='checkbox' class='del_array'></td><td>" + index +"</td>");
                                    cellObj.keysOfHashInArray.forEach(function(key){
                                        var str = "";
                                        jqoTableRowInCell.append("<td><input type='button' value='" + convertValueToStr(v[key]) + "'></td>");
                                        jqoTableRowInCell.find("td").css("padding","0");
                                        jqoTableRowInCell.find("td input[type='button']").on("click",function(e){
                                            _tmp.changedDataQue.push({
                                                "data_id":cellObj.rowData._id,
                                                "key":cellObj.key,
                                                "index":index,
                                                "el":e.target
                                            });
console.log({
    "data_id":cellObj.rowData._id,
    "key":cellObj.key,
    "index":index,
    "el":e.target
});
                                            $(e.target).attr("type","text")
                                        });
                                    });
                                });
                            }else{
                                /*jqoCell.find("table thead").append([
                                    "<tr>",
                                    "<th>del</th>",
                                    "<th>index</th>",
                                    "<th>value</th>",
                                    "</tr>"
                                ].join(""));*/
                                jqoCell.find("table tbody").append(repeatString("<tr></tr>",cellObj.value.length));
                                cellObj.value.forEach(function(v,index){
                                    var jqoTableRowInCell = jqoCell.find("table tbody tr").eq(index);
                                    //jqoTableRowInCell.append("<td><input type='checkbox' class='del_array'></td><td>" + index +"</td>");
                                    jqoTableRowInCell.append("<td><input type='button' value='" + convertValueToStr(v) + "'></td>");
                                    jqoTableRowInCell.find("td").css("padding","0");
                                    jqoTableRowInCell.find("td input[type='button']").on("click",function(e){
                                        _tmp.changedDataQue.push({
                                            "data_id":cellObj.rowData._id,
                                            "key":cellObj.key,
                                            "index":index,
                                            "el":e.target
                                        });
console.log({
    "data_id":cellObj.rowData._id,
    "key":cellObj.key,
    "index":index,
    "el":e.target
});
                                        $(e.target).attr("type","text")
                                    });
                                    
                                })
                            }
                        }else{
                            cellObj.el.textContent = "";
                            jqoCell.append("<input type='button' value='" + convertValueToStr(cellObj.value) + "'>");
                            jqoCell.find("input[type='button']").on("click",function(e){
                                _tmp.changedDataQue.push({
                                    "data_id":cellObj.rowData._id,
                                    "key":cellObj.key,
                                    "el":e.target
                                });
console.log({
    "data_id":cellObj.rowData._id,
    "key":cellObj.key,
    "el":e.target
});
                                $(e.target).attr("type","text")
                            });
                        }
                        function convertValueToStr(v){
                            switch(classof(v)){
                                case "number":
                                case "string":
                                case "boolean":
                                    return "" + v;
                                case "null":
                                case "undefined":
                                    return "";
                                case "date":
                                    return dateToValue(v).str;
                                case "localdate":
                                    return v.toString();
                                default:
                                    return JSON.stringify(v);
                            }
                        }
                    },
                    {
                        leftColumn:{key:["test1","test2"],callback:[
                            //function(cellObj){console.log(cellObj)},
                            //function(cellObj){console.log(cellObj)}
                        ]},
                        rightColumn:{key:["test11","test12"],callback:[
                            //function(cellObj){console.log(cellObj)},
                            //function(cellObj){console.log(cellObj)}
                        ]},
                        bottomRow:{key:["test111","test112","test113"],
                        createCell:[true,true,false],
                        callback:[
                            //function(cellObj){console.log(cellObj)},
                            //function(cellObj){console.log(cellObj)},
                            //function(rowObj){console.log(rowObj)}                            
                        ]},
                        foldArray:true
                    }
                );
            });
        }
    };
});