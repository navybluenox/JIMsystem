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
            $("#formEditDatabase_cond").children("div").css({"padding":"3px"});
        },
        showTable:function(){
            var result = document.getElementById("formEditDatabase_result");
            var promise;
            var dataName = $("#formEditDatabase [name='databaseName']").val();
            if(dataName === "") return;

            $(result).children().remove();

            if(!_val.server.isLoadedData(dataName)){
                promise = _val.server.loadData(dataName);
            }else{
                promise = Promise.resolve();
            }
            
            promise.then(function(){
                var dataArr = _val.server.getData(dataName)
                    .filter(function(v){return true})
                    //.sort(function(a,b){return 1})
                    .map(function(v){return v.getValues()});
                var columnObj = _val.server.getCollectionInfoByName(dataName).getValue("column");
                var columns = ["remove","baseInfo"].concat(
                    Object.keys(columnObj).filter(function(colName){return !inArray(["_id","updated","created"],colName)})
                );

                var tableObj = createTable(result,dataArr,columns,editCells);
                var $table = tableObj.$table;

                function editCells(cellObj){
                    if(cellObj.column === "remove"){
                        var input = $('<input type="checkbox">').appendTo(cellObj.$el);
                        input.attr("name",["table","remove",cellObj.rowData._id].join("-"));
                    }else if(cellObj.column === "baseInfo"){
                        //「cellObj.value === ""」の時、新規追加した行なので、関数dataToValueを通さない
                        $([
                            "<table><tbody>",
                            "<tr>" + "<td>_id</td><td>" + cellObj.rowData._id + "</td></tr>",
                            "<tr>" + "<td>updated</td><td>" + (cellObj.value === "" ? cellObj.rowData.updated : dateToValue(cellObj.rowData.updated).str) + "</td></tr>",
                            "<tr>" + "<td>created</td><td>" + (cellObj.value === "" ? cellObj.rowData.created : dateToValue(cellObj.rowData.created).str) + "</td></tr>",
                            "</table></tbody>"
                        ].join(""))
                            .appendTo(cellObj.$el)
                            .find("tbody tr td")
                            .css("padding","0 0.25em");
                    }else{
                        if(classof(columnObj[cellObj.column]) === "array"){
                            var valueTable = $("<table><thead></thead><tbody></tbody></table>").appendTo(cellObj.$el);
                            var keyInfo = columnObj[cellObj.column][0];

                            keys = (classof(keyInfo) === "object" ? Object.keys(keyInfo) : [""]);
                            valueTable.children("tbody").data({"length":cellObj.value.length,"keys":keys,"_id":cellObj.rowData._id,"column":cellObj.column});
                            valueTable.children("thead").append("<tr>" + repeatString("<th></th>",keys.length + 1) + "</tr>");
                            var trAdd = valueTable.children("tbody").append(repeatString("<tr>" + repeatString("<td></td>",keys.length + 1) + "</tr>",cellObj.value.length));
                            $('<tr><td colSpan="' + (keys.length+1) + '"><input type="button" value="add" name="table-addarrayvalue"><span style="font-size:0.8em; padding:0 0.25em">挿入位置：</span><input type="text" name="table-setinsertposition" style="width:2em;"></td></tr>')
                                .appendTo(valueTable.children("tbody"));
                            trAdd.find('td input[name="table-addarrayvalue"]').css({"margin":"0 0.5em","background":"#ddddff"});                            
                            trAdd.find('td input[name="table-setinsertposition"]').css({"margin":"0 0.5em","text-align":"center"});                            

                            valueTable.children("thead").find("th").css({"padding":"0 0.25em","border-bottom-width":"0","text-align":"center"});
                            valueTable.children("tbody").find("td").css({"padding":"0"});

                            if(classof(keyInfo) === "object"){
                                var ths = valueTable.children("thead").children("tr").children("th");
                                keys.forEach(function(key,keyIndex){
                                    var th = ths.eq(keyIndex+1);
                                    th.text(key);
                                });
                            }

                            //追加した行用（普通は少なくとも配列がある）
                            if(cellObj.value === "")  cellObj.value = [];
                            cellObj.value.forEach(function(v,vIndex){
                                var thisRow = valueTable.children("tbody").children("tr").eq(vIndex);
                                $('<input type="checkbox">').appendTo(thisRow.children("td").eq(0))
                                    .attr("name",["table","removearrayvalue",cellObj.rowData._id,cellObj.column,vIndex].join("-"));
                                keys.forEach(function(key,keyIndex){
                                    var thisCell = thisRow.children("td").eq(keyIndex + 1);
                                    var input = $('<input type="button">').appendTo(thisCell);
                                    var names = ["table","content",cellObj.rowData._id,cellObj.column,vIndex];
                                    if(key !== "") names.push(key);
                                    input.val(key !== "" ? v[key] : v).attr("name",names.join("-"));
                                })
                            });
                        }else{
                            var input = $('<input type="button">').appendTo(cellObj.$el);
                            input.val(cellObj.value).attr("name",["table","content",cellObj.rowData._id,cellObj.column].join("-"));
                        }
                    }
                }

                //行追加ボタンを作成
                $('<tr><td colSpan="' + columns.length +'"><input type="button" value="add" name="table-add-data"></td></tr>').appendTo($table.children("tbody")).find("td input")
                .css({"width":"216px","background":"#00ff7f"})
                .data({"num_newdata":0})
                .on("click",function(e){
                    var trAdd = $(e.currentTarget).parent("td").parent("tr");
                    var tds = $("<tr>" + repeatString("<td></td>",columns.length) + "</tr>").insertBefore(trAdd).children("td");
                    var dataIndex = $(e.currentTarget).data("num_newdata");
                    columns.forEach(function(column,colIndex){
                        editCells({
                            "$el":tds.eq(colIndex),
                            "value":"",
                            "column":column,
                            "rowData":{"_id":"new" + dataIndex,"created":"now","updated":"now"}
                        });
                    });
                    $(e.currentTarget).data({"num_newdata":dataIndex+1});
                    //ボタンを自動で押して、全てテキストボックスに変換
                    tds.find('input[type="button"][name^="table-content-"]').trigger("click");
                    //セルの中央揃えのし直し
                    tableObj.styleFun();
                });

                //セルの中央揃え&表のスタイルを設定
                tableObj.styleFun();

                //値の入ったボタンに、押すとテキストボックスに変化するイベントを設定
                $table.children("tbody").on("click",'tr td input[type="button"][name^="table-content-"]',function(e){
                    var target = $(e.currentTarget);
                    var width = target.outerWidth();
                    target
                        .attr("type","text")
                        .css({"width":width + "px","font-size":"11px"});

                    //データが配列タイプのものは、押したボタンと同じカラムに入っているデータが入っているボタンを、テキストボックスに変換する
                    var names = target.attr("name").split("-");
                    var _id = names[2];
                    var key = names.slice().splice(3);
                    if(key.length > 1){
                        $table.find('input[type="button"][name^="' + ["table","content",_id,key[0],""].join("-") + '"]')
                            .attr("type","text")
                            .css({"width":width + "px","font-size":"11px"});
                    }
                })

                //配列のデータを追加するイベントを設定
                $table.children("tbody").on("click",'tr td input[type="button"][name="table-addarrayvalue"]',function(e){
                    var trAdd = $(e.currentTarget).parent("td").parent("tr");
                    var tbody = trAdd.parent("tbody");
                    var dataTbody = tbody.data();
                    var tds = $("<tr>" + repeatString("<td></td>",dataTbody.keys.length+1) +"</tr>").insertBefore(trAdd).find("td").css({"padding":"0"});
                    $('<input type="checkbox">').appendTo(tds.eq(0))
                        .attr("name",["table","removearrayvalue",dataTbody._id,dataTbody.column,dataTbody.length].join("-"));
                    dataTbody.keys.forEach(function(key,keyIndex){
                        var td = tds.eq(keyIndex+1);
                        var input = $('<input type="text">').appendTo(td).css({"width":"72px","font-size":"11px"});
                        var names = ["table","content",dataTbody._id,dataTbody.column,dataTbody.length];
                        if(key !== "") names.push(key);
                        input.attr("name",names.join("-"));
                    })
                    $table.find('input[type="button"][name^="' + ["table","content",dataTbody._id,dataTbody.column,""].join("-") + '"]').trigger("click");

                    //挿入箇所を指定した場合に、その番号を空欄にする
                    //nameを変えるのは面倒なので、とりあえず一番下に新しく挿入している
                    var insertPosition = trAdd.find('input[type="text"][name="table-setinsertposition"]').val();
                    if(insertPosition !== "" && !Number.isNaN(insertPosition)){
                        insertPosition = +insertPosition;
                        for(var i = dataTbody.length; i > insertPosition; i--){
                            dataTbody.keys.forEach(function(key){
                                var names = ["table","content",dataTbody._id,dataTbody.column,i];
                                if(key !== ""){
                                    names.push(key);
                                }
                                var targetTo = $(tbody).find('input[name="' + names.join("-") + '"]');
                                names[4] = i-1;
                                var targetFrom = $(tbody).find('input[name="' + names.join("-") + '"]');
                                targetTo.val(targetFrom.val());
                                targetFrom.val("");
                            })
                        }
                    }

                    tbody.data("length",dataTbody.length+1);
                });

                //配列のデータのチェックボックスに応じて、該当する行のボタンやテキストボックスを無効にする
                $table.children("tbody").on("click",'tr td input[type="checkbox"][name^="table-removearrayvalue-"]',function(e){
                    var target = $(e.currentTarget);
                    var names = target.attr("name").split("-");
                    var inputs = $table.find('input[name^="' + ["table","content",names[2],names[3],names[4]].join("-") + '"]');
                    inputs.trigger("click");
                    if(target.prop("checked")){
                        inputs.prop("disabled",true).css("background","#E0E0E0");
                    }else{
                        inputs.prop("disabled",false).css("background","inherit");
                    }
                })
            });
        },
        updateData:function(){
            var server = _val.server;
            var $table = $("#formEditDatabase_result").children("table"); 
            var ThisDataPiece = Datapiece.getClassByName($("#formEditDatabase [name='databaseName']").val());

            var idsCheckedRemove = $table.find('input[type="checkbox"][name^="table-remove-"]').map(function(){
                var $el = $(this);
                return {
                    "_id":$el.attr("name").split("-")[2],
                    "checked":$el.prop("checked")
                }
            }).get().filter(function(obj){return obj.checked}).map(function(obj){return obj._id});

            //add
            separateAssembleOfQueues("add",'input[type="text"][name^="table-content-new"]',"addData");
            //change
            separateAssembleOfQueues("change",'input[type="text"][name^="table-content-"]:not([name^="table-content-new"])',"changeData");

            function separateAssembleOfQueues(mode,selector,method){
                var queues = {};
                $table.find(selector).map(function(){
                    var $el = $(this);
                    var names = $el.attr("name").split("-");
                    return {
                        "_id":names[2],
                        "key":names.slice().splice(3),
                        "value":$el.val()
                    }
                }).get().filter(function(obj){return !inArray(idsCheckedRemove,obj._id)}).forEach(function(obj){
                    if(queues[obj._id] === undefined)  queues[obj._id] = {};
                    if(obj.key.length > 1){
                        if(queues[obj._id][obj.key[0]] === undefined)  queues[obj._id][obj.key[0]] = [];
                        if(obj.key.length === 2){
                            if(obj.value === "")  return;
                            queues[obj._id][obj.key[0]][obj.key[1]]  = obj.value;
                        }else{
                            if(queues[obj._id][obj.key[0]][obj.key[1]] === undefined)  queues[obj._id][obj.key[0]][obj.key[1]] = {};
                            queues[obj._id][obj.key[0]][obj.key[1]][obj.key[2]]  = obj.value;
                        }
                    }else{
                        queues[obj._id][obj.key[0]] = obj.value
                    }
                });

                //addモードの時、配列の入るデータが何も無い場合に空の配列が挿入されない不具合を解消
                if(mode === "add"){
                    var collInfo = server.getCollectionInfoByName($("#formEditDatabase [name='databaseName']").val());
                    var columns = collInfo.getValue("column");
                    var keys = Object.keys(columns).filter(function(key){return classof(columns[key]) === "array"});
                    Object.keys(queues).forEach(function(_id){
                        keys.forEach(function(key){
                            if(queues[_id][key] === undefined){
                                queues[_id][key] = [];
                            }
                        });
                    })
                //changeモードの時、_idを設定
                }else if(mode === "change"){
                    Object.keys(queues).forEach(function(_id){
                        queues[_id]._id = _id;
                    })
                }

                //arrayから指定された行を削除
                $table.find('input[name^="table-removearrayvalue-"]').map(function(){
                    $el = $(this);
                    var names = $el.attr("name").split("-");
                    return {
                        "_id":names[2],
                        "key":names[3],
                        "index":names[4],
                        "checked":$el.prop("checked")
                    }
                }).get().filter(function(obj){return obj.checked}).sort(function(a,b){
                    if(a._id !== b._id)  return a._id.charCodeAt() - b._id.charCodeAt();
                    if(a.key !== b.key)  return a.key.charCodeAt() - b.key.charCodeAt();
                    return b.index - a.index;
                }).forEach(function(obj){
                    if(queues[obj._id] === undefined)  return;
                    queues[obj._id][obj.key].splice(obj.index,1);
                })

                Object.keys(queues).forEach(function(_id){
                    server[method](new ThisDataPiece(queues[_id],{overwrite:true}));
                });
            }



            //remove
            idsCheckedRemove.filter(function(_id){ return !(/^new/.test(_id))}).forEach(function(_id){
                server.removeData(new ThisDataPiece({"_id":_id}));
            })

            server.sendUpdateQueue()
            .then(function(){
                _val.pageFun.editDatabase.showTable();
            });
        }
    };
});