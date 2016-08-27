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

            $(result).children().remove();

            if(!_val.server.isLoadedData(dataName)){
                promise = _val.server.loadDataByName(dataName);
            }else{
                promise = Promise.resolve();
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
                                jqoCell.find("table thead").append(cellObj.keysOfHashInArray.map(function(key){return "<th>" + key + "</th>";}));                                
                                jqoCell.find("table tbody").append(repeatString("<tr></tr>",cellObj.value.length));
                                cellObj.value.forEach(function(v,index){
                                    var jqoTableRowInCell = jqoCell.find("table tbody tr").eq(index);
                                    //jqoTableRowInCell.append("<td><input type='checkbox' class='rm_array'></td><td>" + index +"</td>");
                                    cellObj.keysOfHashInArray.forEach(function(key){
                                        jqoTableRowInCell.append("<td><input type='button' value='" + convertValueToStr(v[key]) + "'></td>");
                                        jqoTableRowInCell.find("td").css("padding","0");
                                        jqoTableRowInCell.find("td input:button").on("click",function(e){
                                            if($(e.target).attr("type") !== "button") return;
                                            var width = $(e.target).outerWidth();
                                            _tmp.changedDataQue.push({
                                                "data_id":cellObj.rowData._id,
                                                "key":cellObj.key,
                                                "keyList":cellObj.keysOfHashInArray,
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
                                $("<tr><td colSpan='0' style='padding: 0;'><input type='button' value='add' class='exclude'></td></tr>")
                                .appendTo(jqoCell.find("table tbody"))
                                .find("td input:button")
                                .css("background","#ddddff")
                                .on("click",function(e){
                                    var thisTr = e.target.parentNode.parentNode;
                                    var jqo = $("<tr>" + repeatString("<td style='padding: 0px;'><input type='text'></td>",cellObj.value.length) + "</tr>")
                                        .insertBefore(thisTr)
                                        .find("td input:text")
                                        .css({"width":"72px","font-size":fontSize + "px"});
                                    _tmp.changedDataQue.push({
                                        "data_id":cellObj.rowData._id,
                                        "key":cellObj.key,
                                        "keyList":cellObj.keysOfHashInArray,
                                        "index":$(thisTr.parentNode).find("tr").length - 2,
                                        "el":jqo[0]
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
                                        $(e.target).attr("type","text").css({
                                            "width":width + "px",
                                            "font-size":fontSize + "px"
                                        });
                                    });
                                    
                                })
                                $("<tr><td colSpan='0' style='padding: 0;'><input type='button' value='add' class='exclude'></td></tr>")
                                .appendTo(jqoCell.find("table tbody"))
                                .find("td input:button")
                                .css("background","#ddddff")
                                .on("click",function(e){
                                    var thisTr = e.target.parentNode.parentNode;
                                    var jqo = $("<tr><td style='padding: 0px;'><input type='text'></td></tr>")
                                        .insertBefore(thisTr)
                                        .find("td input:text")
                                        .css({"width":"72px","font-size":fontSize + "px"});
                                    _tmp.changedDataQue.push({
                                        "data_id":cellObj.rowData._id,
                                        "key":cellObj.key,
                                        "index":$(thisTr.parentNode).find("tr").length - 2,
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
                            var jqoRow = $(cellObj.el);
                            var fontSize = 11;
                            jqoRow.append([
                                "<td colSpan='" + cellObj.colList.length + "'>",
                                    "<input type='button' value='--add--'>",
                                "</td>"
                            ].join(""));
                            jqoRow.find("td input:button").on("click",function(e){
                                var jqo = $("<tr>" + repeatString("<td></td>",cellObj.colList.length) + "</tr>")
                                .insertBefore(jqoRow).find("td");
                                cellObj.colList.forEach(function(col,colIndex){
                                    var jqoCell = jqo.eq(colIndex);
                                    if(inArray(["remove","baseInfo"],col[0])){
                                    }else{
                                        var sample = cellObj.columnSample;
                                        col.forEach(function(key){sample = sample[key]});
                                        if(Array.isArray(sample)){
                                            $([
                                                "<table><thead>",
                                                (classof(sample[0]) === "object" ? Object.keys(sample[0]).map(function(key){return "<th>" + key + "</th>"}) : ""),
                                                "</thead><tbody><tr><td colSpan='0' style='padding: 0;'><input type='button' value='add' class='exclude'></td></tr></tbody></table>"])
                                                .appendTo(jqoCell)
                                                .find("tbody tr td input:button")
                                                .css("background","#ddddff")
                                                .on("click",function(e){
                                                    var thisTr = e.target.parentNode.parentNode;
                                                    $("<tr>" + (repeatString("<td style='padding: 0px;'><input type='text'></td>",(inArray(["object","array"],classof(sample[0])) ? cellObj.value.length : 1))) + "</tr>")
                                                    .insertBefore(thisTr)
                                                    .find("td input:text")
                                                    .css({"width":"72px","font-size":fontSize + "px"});
                                                });
                                        }else{
                                            $("<input type='text'>").appendTo(jqoCell)
                                            .css({"width":"72px","font-size":fontSize + "px"});                                         
                                        }
                                    }
                                });
                                _tmp.changedDataQue.push({
                                    "add":true,
                                    "el":jqo[0].parentNode,
                                    "columnSample":cellObj.columnSample,
                                    "columnList":cellObj.colList
                                })
                            });
                        }]},
                        skipKey:["_id","created","updated"],
                        addKey:["baseInfo"],
                        foldArray:true
                    }
                );
            });
        },
        updateData:function(){
            var queues = _tmp.changedDataQue;
            var ThisDataPiece = Datapiece.getClassByName($("#formEditDatabase [name='databaseName']").val());
            console.log(queues);
            //TODO update database

            //devide queues into removal, addtion and change
            //addtion -> change -> removal
            var queuesAdd = queues.filter(function(queue){
                return queue.add;
            });
            var queuesChange = queues.filter(function(queue){
                return queue.remove === undefined && queue.add === undefined;
            });
            var queuesRemove = queues.filter(function(queue){
                return queue.remove;
            }).filter(function(queue){
                return queue.el.checked
            });

            //get values from input box

            queuesAdd.forEach(function(queue){
                var dp = {};
                var jqo = $(queue.el).children("td");

                queue.columnList.forEach(function(col,colIndex){
                    if(col[0] === "remove" || col[0] === "baseInfo")  return;
                    var jqoCell = jqo.eq(colIndex);
                    var type = queue.columnSample;
                    var dp_c = dp;
                    var value;
                    col.forEach(function(c,i){
                        type = type[c];
                        if(dp_c[c] === undefined) dp_c[c] = {};
                        if(/*i < col.length-1*/1){
                            dp_c = dp_c[c];
                        }
                    });
                    if(classof(type) === "array"){
                        var values = jqoCell.find("table tbody tr input:not(.exclude)")
                            .map(function(i,el){
console.log(this,i,el);
                                return $(this).val();
                            }).get();
                        if(classof(type[0]) === "object"){
                            value = [];
                            var keys = jqoCell.find("table thead tr th").map(function(index,el){return $(this).text()}).get();
                            for(var i=0,l=jqoCell.find("table tbody tr").length-2; i<l; i++){
                                value[i] = {};
                                keys.forEach(function(key,j){
                                    value[i][key] = values[i*keys.length + j];
                                })
                            }
                        }else{
                            value = values.filter(function(v){return v !== ""});
                        }
                    }else{
                        value = jqoCell.find("input:text").val();
                        if(value === ""){
                            switch(type){
                                case "date":
                                    value = new Date();
                                    break;
                                case "localdate":
                                    value = new LocalDate();
                                    break;
                            }
                        }
                    }
                    //dp_c[col[col.length-1]] = value;
                    dp_c = value;
                    

                })
console.log(dp);
                _val.server.removeData(new ThisDataPiece(dp));
            });

            queuesRemove.forEach(function(queue){
                _val.server.removeData(new ThisDataPiece({"_id":queue.data_id}));
            });
console.log(_val.server._pendingQueue);
        }
    };
});