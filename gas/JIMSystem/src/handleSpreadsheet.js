$(function(){
    var pageFun;
    var formAddData;
    _val.pageFun.handleSpreadsheet = {
        onload:function(){
            _val.server.loadData("fileInfo");
            pageFun = _val.pageFun.handleSpreadsheet;
            formAddData = $("#formAddToDatabase");

            formAddData.find('[name="dataName"]').append(
                ['<option value=""></option>'].concat(Datapiece.sort(_val.server.getData("collectionInfo"),"name").map(function(collInfo){
                    var name = collInfo.getValue("name");
                    return '<option value="' + name + '">' + name + '</option>';
                }))
            )
        },onunload:function(){
            pageFun = _val.pageFun.handleSpreadsheet;
            formAddData = $("#formAddToDatabase");
        },writeSpreadsheet:function(spreadsheetName,sheetName,contentConfig){
            var dataName = formAddData.find('[name="dataName"]').val();
            _val.server.loadData(dataName).then(function(datapieces){
                var content;
                if(contentConfig === "all"){
                    content = datapieces.map(function(datapiece){return datapiece.getValues()});
                }else if(contentConfig === "column"){
                    content = [];
                }
                var spreadsheet = new Spreadsheet(spreadsheetName,sheetName,content);
                var collInfo = _val.server.getCollectionInfoByName(dataName);
                return spreadsheet.writeSheetData(
                    collInfo.getValue("column"),
                    collInfo.getValue("columnOrder"),
                    100,
                    ["text"],
                    function(value,key,rowIndex,columnIndex){
                        return {"text":value};
                    }
                );
            }).then(function(){
                //formAddData.find('[name="dataName"],[name="writeAll"],[name="writeColumn"]').prop("disabled",true);
            });
        },readSpreadsheet:function(spreadsheetName,sheetName){
            var spreadsheet = new Spreadsheet(spreadsheetName,sheetName);
            var dataName = formAddData.find('[name="dataName"]').val();
            var columnType = _val.server.getCollectionInfoByName(dataName).getValue("column");

            //
            spreadsheet.readSheetData(columnType).then(function(v){
                var column = Object.keys(v.type);
                if(dataName !== ""){
                    var columnOrder = _val.server.getCollectionInfoByName(dataName).getValue("columnOrder").map(function(v){return v.split(".")[0]});
                    column.sort(function(a,b){
                        return columnOrder.indexOf(a) - columnOrder.indexOf(b);
                    });
                }
                var mw = new ModalWindow({"callback":function(parent){
                    parent.append("<div></div><div></div>");
                    var table = createTable(parent.find("div").eq(0),spreadsheet.getData(),column,function(cellObj){
                        switch(classof(cellObj.value)){
                            case "array":
                                cellObj.el.append("<ol></ol>");
                                cellObj.el.children("ol").append(cellObj.value.map(function(val,index){
                                    return '<li>' + index + '. ' + castIntoString(val) + '</li>';
                                }).join(""));
                                break;
                            default:
                                cellObj.el.text(castIntoString(cellObj.value));
                                break;
                        }
                    }).el;
                    parent.find("div").eq(0).css({"overflow":"auto","height":"85%"});
                    parent.find("div").eq(1).css({"background":"#eeeeee","padding":"1em"});
                    table.find("td").css({"padding":"0","font-size":"0.9em"});
                    table.find("td:last-child").css({"padding-left":"0.5em"});
                    table.find("ol").css({"list-style":"none","padding":"0","margin":"0"});
                    table.find("li").css({"padding":"0","margin":"0"});
                    $('<input type="button" value="この内容をデータベースに追加">').appendTo(parent.find("div").eq(1)).on("click",function(e){
                        var dataClass = Datapiece.getClassByName(dataName);
                        var datapieces = spreadsheet.getData().map(function(v){
                            return new dataClass(v,{"overwrite":true});
                        });
                        _val.server.addData(datapieces).sendUpdateQueue();
                        mw.remove();
                    }).prop("disabled",dataName === "");
                    $('<input type="button" value="キャンセル">').appendTo(parent.find("div").eq(1)).on("click",function(e){
                        mw.remove();
                    });
                }});
                mw.setContentStyle({
                    "width":"100%",
                    "height":"100%"
                });
                mw.keepPosition();
            });
        },createShiftTableUser:function(){
            _val.server.loadData("user").then(function(users){
                var content = users.map(function(user){
                    return createShiftTableUser(user,start,end);
                });


            });
            function createShiftTableUser(user,start,end){
                var data = user.getShiftTableAsData(start,end);
                var _row = data.content.filter(function(obj){return obj.workIndex === 0});

                var row = _row.slice();
                    if(_row.length === 0){
                        for(var j=0,l=start.getDiff(end, "timeunit"); j<l; j++){
                            row[j] = {"start":start.copy().addTimeUnit(j),"workAssignId":"_vacancy"};
                        }
                    }else{
                        var insert;
                        for(var i=_row.length-1; i>=0; i--){
                            insert = [];
                            for(var j=0,l=_row[i].start.copy().addTimeUnit(_row[i].interval).getDiff(i===_row.length-1 ? end : _row[i+1].start, "timeunit"); j<l; j++){
                                insert[j] = {"start":_row[i].start.copy().addTimeUnit(_row[i].interval + j),"workAssignId":"_vacancy"};
                            }
                            row.splice(i+1,0,insert);
                        }
                        insert = [];
                        for(var j=0,l=start.getDiff(_row[0].start, "timeunit"); j<l; j++){
                            insert[j] = {"start":start.copy().addTimeUnit(j),"workAssignId":"_vacancy"};
                        }
                        row.splice(0,0,insert);
                    }
                    row = row.reduce(function(prev,curt){
                        return prev.concat(Array.isArray(curt) ? curt : [curt]);
                    });

                var timeScales = [];
                (function(){
                    //make header
                    var t;
                    for(var i=0,l=data.tableInterval; i<l; i++){
                        t = data.tableStartTime.copy().addTimeUnit(i);
                        if(i === 0 || t.getMinutes() === 0){
                            timeScales.push({"start":t});
                        }
                    }
                    var tableEnd = data.tableStartTime.copy().addTimeUnit(data.tableInterval);
                    timeScales = timeScales.map(function(obj,index){
                        if(obj.start.getMinutes() !== 0){
                            obj.interval = data.tableStartTime.getDiff(obj.start,"timeunit");
                        }else if(obj.start.getDiff(tableEnd,"minute") < 60){
                            obj.interval = obj.start.getDiff(tableEnd,"timeunit");
                        }else{
                            obj.interval = 60 / LocalDate.getTimeUnitAsConverted("minute");
                        }
                    });
                })();

                return {"row":row,"timeScale":timeScales};
            }
        
        }
    };
});
