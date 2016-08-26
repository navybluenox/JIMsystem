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
                        var fontSize = 11;
                        if(cellObj.key[0] === "baseInfo"){
                            jqoCell.append([
                                "<table><tbody>",
                                "<tr><td>_id</td><td>" + cellObj.rowData._id + "</td></tr>",
                                "<tr><td>created</td><td>" + convertValueToStr(cellObj.rowData.created) + "</td></tr>",
                                "<tr><td>updated</td><td>" + convertValueToStr(cellObj.rowData.updated) + "</td></tr>",
                                "</tbody></table>"
                            ].join(""));
                            jqoCell.find("table tr td").css("padding","0 0.25em");
                        }else if(cellObj.key[0] === "created" || cellObj.key[0] === "updated"){
                        }else if(cellObj.isArray){
                            jqoCell.append("<table><thead></thead><tbody></tbody></table>");
                            if(cellObj.isHashInArray){
                                /*jqoCell.find("table thead").append([
                                    "<tr>",
                                    ["rm","index"].concat(cellObj.keysOfHashInArray).map(function(v){
                                        return "<th>" + v + "</th>";
                                    }).join(""),
                                    "</tr>"
                                ].join(""));*/
                                jqoCell.find("table tbody").append(repeatString("<tr></tr>",cellObj.value.length));
                                cellObj.value.forEach(function(v,index){
                                    var jqoTableRowInCell = jqoCell.find("table tbody tr").eq(index);
                                    //jqoTableRowInCell.append("<td><input type='checkbox' class='rm_array'></td><td>" + index +"</td>");
                                    cellObj.keysOfHashInArray.forEach(function(key){
                                        var str = "";
                                        jqoTableRowInCell.append("<td><input type='button' value='" + convertValueToStr(v[key]) + "'></td>");
                                        jqoTableRowInCell.find("td").css("padding","0");
                                        jqoTableRowInCell.find("td input:button").on("click",function(e){
                                            if($(e.target).attr("type") !== "button") return;
                                            var width = $(e.target).outerWidth();
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
                                            $(e.target).attr("type","text").css({
                                                "width":width+"px",
                                                "font-size":fontSize + "px"
                                            });
                                        });
                                    });
                                });
                            }else{
                                /*jqoCell.find("table thead").append([
                                    "<tr>",
                                    "<th>rm</th>",
                                    "<th>index</th>",
                                    "<th>value</th>",
                                    "</tr>"
                                ].join(""));*/
                                jqoCell.find("table tbody").append(repeatString("<tr></tr>",cellObj.value.length));
                                cellObj.value.forEach(function(v,index){
                                    var jqoTableRowInCell = jqoCell.find("table tbody tr").eq(index);
                                    //jqoTableRowInCell.append("<td><input type='checkbox' class='rm_array'></td><td>" + index +"</td>");
                                    jqoTableRowInCell.append("<td><input type='button' value='" + convertValueToStr(v) + "'></td>");
                                    jqoTableRowInCell.find("td").css("padding","0");
                                    jqoTableRowInCell.find("td input:button").on("click",function(e){
                                        if($(e.target).attr("type") !== "button") return;
                                        var width = $(e.target).outerWidth();
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
                                        $(e.target).attr("type","text").css({
                                            "width":width + "px",
                                            "font-size":fontSize + "px"
                                        });
                                    });
                                    
                                })
                                $("<tr><td colSpan='0'><input type='button' value='add'></td></tr>")
                                .appendTo(jqoCell.find("table tbody"))
                                .find("td input:button")
                                .on("click",function(e){
                                    var thisTr = e.target.parentNode.parentNode;
                                    var jqo = $("<tr><td style='padding: 0px;'><input type='text'></td></tr>")
                                        .insertBefore(thisTr)
                                        .find("td input:text")
                                        .css({"width":"72px","font-size":fontSize + "px"});
                                    _tmp.changedDataQue.push({
                                        "data_id":cellObj.rowData._id,
                                        "key":cellObj.key,
                                        "index":$(thisTr.parentNode).find("tr").length - 1,
                                        "el":jqo[0]
                                    });
console.log({
    "data_id":cellObj.rowData._id,
    "key":cellObj.key,
    "index":$(thisTr.parentNode).find("tr").length - 1,
    "el":jqo[0]
});
                                });
                            }
                        }else{
                            cellObj.el.textContent = "";
                            jqoCell.append("<input type='button' value='" + convertValueToStr(cellObj.value) + "'>");
                            jqoCell.find("input:button").on("click",function(e){
                                if($(e.target).attr("type") !== "button") return;
                                var width = $(e.target).outerWidth();
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
                                $(e.target).attr("type","text").css({
                                    "width":width + "px",
                                    "font-size":fontSize + "px"
                                });
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
                        leftColumn:{key:["remove"],callback:[function(cellObj){
                            var jqoCell = $(cellObj.el);
                            jqoCell.append("<input type='checkbox'>");
                            jqoCell.find("input:checkbox").on("click",function(e){
                                if($(e.target).prop("checked")){
                                    _tmp.changedDataQue.push({
                                        "data_id":cellObj.rowData._id,
                                        "remove":true,
                                        "el":e.target
                                    });
                                }
                            });
                        }]},
                        bottomRow:{key:["add"],createCell:[false],callback:[function(cellObj){
console.log(cellObj);
                            var jqoCell = $(cellObj.el);
                            jqoCell.append([
                                "<td colSpan='" + cellObj.colList.length + "'>",
                                    "<input type='button' value='--add--'>",
                                "</td>"
                            ].join(""));
                            jqoCell.find("td input:button").on("click",function(e){

                            });
                        }]},
                        skipKey:["_id","created","updated"],
                        addKey:["baseInfo"],
                        foldArray:true
                    }
                );
            });
        }
    };
});