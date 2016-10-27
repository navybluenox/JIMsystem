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
                return spreadsheet.writeSheetMapData(
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
        },createShiftTableUser:function(version){
            version = 0;
            _val.server.loadData("user").then(function(users){
                var nowTime = new Date();
                var leftOffset = 4;
                var rightOffset = 1;
                var topOffset = 3;
                var dayCellWidth = 10;
                var timeInfoList = [];
                var startTrigger = false;
                var promiseChain = new Promise(function(resolve){
                    var si = setInterval(function(){
                        if(startTrigger){
                            clearInterval(si);
                            resolve();
                        }
                    },100);
                });

                (function(){
                    var obj;
                    for(var day=_val.config.getWorkStartDay(),e=_val.config.getWorkEndDay(); day<=e; day++){
                        obj = _val.config.getWorkTime(day);
                        obj.sheetName = "day" + day;
                        timeInfoList.push(obj);
                    }
                })();

                timeInfoList.forEach(function(timeInfo){
                    var table = [];
                    var spreadsheet = new Spreadsheet("shiftTableUser",timeinfo.sheetName,table);
                    var mergeSetting = [];
                    var borderSetting = [];
                    var start = timeInfo.start;
                    var end = timeInfo.end;
                    var sheetName = timeInfo.sheetName;
                    var contentWidth = start.getDiff(end,"timeunit");
                    var widthAll = leftOffset + contentWidth + rightOffset;

                    //TODO
                    var indexOfHeader = users.filter(function(user){
                        return (
                            ["CAP","ZAI","SSK","VIS","PRO","CRE","SYS"].some(function(incharge){return inArray(user.getValue("incharge"),incharge)}) ||
                            ["みーと","あぜがみ"].some(function(azusaSendName){return inArray(user.getValue("azusaSendName"),azusaSendName)})                        
                        )
                    }).map(function(user){
                        return users.findIndex(function(u){return u.getValue("_id") === user.getValue("_id")});
                    }).sort(function(a,b){return a-b});

                    var heightAll = topOffset + users.length + indexOfHeader.length;

                    //set border
                    borderSetting.push({"range":{"top":0,"left":0,"height":heightAll,"width":widthAll},"border":{"style":"solid","top":true,"bottom":true,"left":true,"right":true,"vertical":true,"horizontal":true}});
                    borderSetting.push({"range":{"top":topOffset,"left":leftOffset,"height":users.length + indexOfHeader.length,"width":contentWidth},"border":{"style":"dashed","vertical":true}});

                    //TODO makeTableHeader
                    (function(){
                        var workGroups = _val.server.getData("workGroup").filter(function(workGroup){return workGroup.getValue("isColorGroup")});
                        var workGroup,workGroupName;
                        if(contentWidth < workGroups.length + dayCellWidth + 2){
                            workGroups.length = 0;
                        }
                        for(var rowIndex=0; rowIndex<3; rowIndex++){
                            var row = [];
                            for(var cellIndex=0,l=leftOffset + contentWidth + 1; cellIndex<l; cellIndex++){
                                if(rowIndex === 0 && cellIndex === 0){
                                    row.push({"text":_val.config.getValue("content.kind") + _val.config.getValue("content.nth") + "当日人割","fontWeight":"bold"});
                                    mergeSetting.push({"range":{"top":0,"left":0,"height":1,"width":widthAll}});
                                    borderSetting.push({"range":{"top":0,"left":0,"height":1,"width":widthAll},"border":{"top":false,"right":false,"left":false}});
                                }else if(rowIndex === 1 && cellIndex === 0){
                                    row.push({"text":"白枠は本部待機です。","fontWeight":"bold"});
                                    mergeSetting.push({"range":{"top":rowIndex,"left":cellIndex,"width":leftOffset,"height":2}});
                                }else if(rowIndex >= 1 && cellIndex >= leftOffset && cellIndex < leftOffset + workGroups.length){
                                    workGroup = workGroups[cellIndex - leftOffset];
                                    if(rowIndex === 1){
                                        row.push({"text":workGroup.getValue("name").replace(/^c_/,""),"background":workGroup.getValue("backgroundColor"),"fontColor":workGroup.getValue("fontColor")});
                                    }else{
                                        row.push({"background":workGroup.getValue("backgroundColor")});
                                    }
                                }else if(rowIndex === 1 && cellIndex === leftOffset + workGroups.length){
                                    row.push({"text":start.toString({"hideHour":true,"hideMinute":true}) + ":" + dateToValue(start.getAsDateClass()).str2,"background":"#E4E4E4","fontWeight":"bold"});
                                    mergeSetting.push({"range":{"top":rowIndex,"left":cellIndex,"width":dayCellWidth,"height":2}});
                                }else if(rowIndex === 1 && cellIndex === leftOffset + workGroups.length + dayCellWidth){
                                    var nowTimeString = dateToValue(nowTime);
                                    row.push({"text":"ver." + version + " : " + nowTimeString.month + "月" + nowTimeString.day + "日" + nowTimeString.hour + "時" + nowTimeString.minute + "分更新","fontWeight":"bold"});
                                    mergeSetting.push({"range":{"top":rowIndex,"left":cellIndex,"width":widthAll -leftOffset - workGroup.length - dayCellWidth,"height":2}});
                                }else{
                                    row.push({});
                                }
                            }
                            table.push(row);
                        }
                    })();


                    var makeHeader = function(rowIndex){
                        var header = [];
                        var template = {"background":"#AAAAAA","fontWeight":"bold"};
                        header.push($.extend(true,{},template,{"text":"学年","left":"solid"}));
                        header.push($.extend(true,{},template,{"text":"氏名","left":"solid"}));
                        header.push($.extend(true,{},template,{"text":"配送名","left":"solid"}));
                        header.push($.extend(true,{},template,{"text":"担当","left":"solid"}));
                        var time = start.copy();
                        var obj;
                        var headerOffset = header.length;
                        for(var i=0; i<contentWidth; i++){
                            obj = {};
                            if(time.getMinutes() === 0 || i === 0){
                                obj.text = "" + time.getDifferentialHours(start) + "時-";
                                if(i === 0){
                                    mergeSetting.push({"range":{"top":rowIndex,"left":leftOffset + i,"height":1,"width":(60 - time.getMinutes()) / LocalDate.getTimeUnitAsConverted("minute")}});
                                }else if(time.getDiff(end,"minute") < 60){
                                    mergeSetting.push({"range":{"top":rowIndex,"left":leftOffset + i,"height":1,"width":time.getDiff(end,"timeunit")}});
                                }else{
                                    mergeSetting.push({"range":{"top":rowIndex,"left":leftOffset + i,"height":1,"width":60 / LocalDate.getTimeUnitAsConverted("minute")}});                                    
                                }
                            }
                            header.push($.extend(true,{},template,obj));                            
                            time.addTimeUnit(1);
                        }
                        header.push($.extend(true,{},template,{"text":"氏名"}));
                        return header;
                    };



                    var groupUsers = [];
                    (function(){
                        for(var i=0,l=indexOfHeader.length; i<l; i++){
                            groupUsers.push({"index":indexOfHeader[i],"user":users.slice().splice(indexOfHeader[i],i === l-1 ? l : indexOfHeader[i+1] - indexOfHeader[i])});
                        }
                    })();
                    groupUsers.forEach(function(obj){
                        var users = obj.user;
                        var groupIndex = obj.index;
                        table.push(makeHeader(topOffset + groupIndex));
                        users.forEach(function(user,rowIndex){
                            var ret = user.getShiftTableAsSpreadsheetSetting(start,end,rowIndex + topOffset + groupIndex + 1,leftOffset);
                            mergeSetting = mergeSetting.concat(ret.merge);
                            borderSetting = borderSetting.concat(ret.border);
                            var preContent = [];
                            var sufContent = [];
                            preContent.push({"text":user.getValue("grade")});
                            preContent.push({"text":user.getValue("nameLast") + " " + user.getValue("nameFirst")});
                            preContent.push({"text":user.getValue("azusaSendName")});
                            preContent.push({"text":user.getValue("inchargeCode").join("/")});
                            sufContent.push({"text":user.getValue("nameLast") + " " + user.getValue("nameFirst")});
                            table.push((preContent.concat(ret.content)).concat(sufContent));
                        });
                    });

                    promiseChain = promiseChain.then(function(){
                        spreadsheet.writeSheetData(table,100);
                    }).then(function(){
                        spreadsheet.setBorderCell(borderSetting);
                    }).then(function(){
                        spreadsheet.setMergeCell(mergeSetting);
                    });

                });
                promiseChain.then(function(){
                    console.log("finished updating shiftTableUser completely!!")
                }).catch(function(e){
                    console.log("Error!!");
                    console.log(e);
                    throw new Error(e);
                });
                startTrigger = true;
            });

        
        }
    };
});
