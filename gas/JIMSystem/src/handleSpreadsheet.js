$(function(){
    var pageFun;
    var formAddData,formCreateShiftTable;
    _val.pageFun.handleSpreadsheet = {
        onload:function(){
            _val.server.loadDataAll();
            pageFun = _val.pageFun.handleSpreadsheet;
            formAddData = $("#formAddToDatabase");
            formCreateShiftTable = $("#formCreateShiftTable");

            formAddData.find('[name="dataName"]').append(
                ['<option value=""></option>'].concat(Datapiece.sort(_val.server.getData("collectionInfo"),"name").map(function(collInfo){
                    var name = collInfo.getValue("name");
                    return '<option value="' + name + '">' + name + '</option>';
                }))
            );

            (function(){
                var sheetNameList = [];
                for(var day=_val.config.getWorkStartDay(),e=_val.config.getWorkEndDay(); day<=e; day++){
                    sheetNameList.push("day" + day);
                }
                formCreateShiftTable.find('[name="downloadShiftTableUser_sheetName"]').append(sheetNameList.map(function(sheetName){
                    return '<option value="' + sheetName + '">' + sheetName + '</option>';
                }))
            })();
        },onunload:function(){
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
            });
        },readSpreadsheet:function(spreadsheetName,sheetName){
            var spreadsheet = new Spreadsheet(spreadsheetName,sheetName);
            var dataName = formAddData.find('[name="dataName"]').val();
            var columnType = _val.server.getCollectionInfoByName(dataName).getValue("column");

            if(dataName === ""){
                alert("データベース名が指定されていません。")
                formAddData.find('[name="dataName"]').focus();
                return;
            }
            
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
                    var data = spreadsheet.getData();
                    var mode = formAddData.find('[name="readType"]').val();
                    if(mode === "change"){
                        var ids = _val.server.getData(dataName,null,true).map(function(d){return d.getValue("_id")});
                        data = data.filter(function(d){
                            return inArray(ids,d._id);
                        });
                    }
                    var table = createTable(parent.find("div").eq(0),data,column,function(cellObj){
                        switch(classof(cellObj.value)){
                            case "array":
                                cellObj.el.append("<ol></ol>");
                                cellObj.el.children("ol").append(cellObj.value.map(function(val,index){
                                    if(val === null) return;
                                    return '<li>' + index + '. ' + castIntoString(val,true) + '</li>';
                                }).join(""));
                                break;
                            default:
                                cellObj.el.text(castIntoString(cellObj.value,true));
                                break;
                        }
                    }).el;
                    parent.find("div").eq(0).css({"overflow":"auto","height":"85%"});
                    parent.find("div").eq(1).css({"background":"#eeeeee","padding":"1em"});
                    table.find("td").css({"padding":"0","font-size":"0.9em"});
                    table.find("td:last-child").css({"padding-left":"0.5em"});
                    table.find("ol").css({"list-style":"none","padding":"0","margin":"0"});
                    table.find("li").css({"padding":"0","margin":"0"});
                    $('<input type="button" value="' + (mode === "add" ? "この内容をデータベースに追加" : "この内容でデータベースを変更") + '">').appendTo(parent.find("div").eq(1)).on("click",function(e){
                        var dataClass = Datapiece.getClassByName(dataName);
                        var datapieces = data.map(function(v){
                            return new dataClass(v,{"overwrite":true});
                        });
                        if(mode === "change"){
                            _val.server.changeData(datapieces);
                        }else if(mode === "add"){
                            _val.server.addData(datapieces);
                        }
                        _val.server.sendUpdateQueue();
                        mw.remove();
                    }).prop("disabled",inArray(["","collectionInfo","systemConfig"],dataName));
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
        },clearSpreadsheet:function(spreadsheetName,sheetName){
            var spreadsheet = new Spreadsheet(spreadsheetName,sheetName);
            spreadsheet.clearSheetData();
        },createShiftTableUser:function(){
            var version;
            var version_propertyKey = "shiftTableUser_version_" + _val.config.getValue("content.kind") + _val.config.getValue("content.nth");
            return Promise.all([
                _val.server.loadData("user"),
                _val.server.loadData("workGroup"),
                _val.server.loadData("workList"),
                _val.server.loadData("workAssign"),
                Server.handlePropertiesService(version_propertyKey,"script","get").then(function(v){version = (v[version_propertyKey] === undefined ? 0 : +v[version_propertyKey]);})
            ]).then(function(){
                var _users = Datapiece.sort(_val.server.getData("user"),"sortId");
                var nowTime = new Date();
                var leftOffset = 4;
                var rightOffset = 1;
                var topOffset = 3;
                var dayCellWidth = 10;
                var defaultCellTemplate = {"fontSize":11,"alignHori":"center","alignVer":"middle","fontFamily":"ＭＳ Ｐゴシック"};
                var setDefaultCellSetting = function(setting){return $.extend({},defaultCellTemplate,setting)};
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
                    var spreadsheet = new Spreadsheet("shiftTableUser",timeInfo.sheetName,table);
                    var mergeSetting = [];
                    var borderSetting = [];
                    var sizeSetting = [];
                    var start = timeInfo.start;
                    var end = timeInfo.end;
                    var sheetName = timeInfo.sheetName;
                    var contentWidth = start.getDiff(end,"timeunit");
                    var widthAll = leftOffset + contentWidth + rightOffset;

                    //日付ごとにユーザーを除外したい場合はここで行う
                    var users = _users.filter(function(user){return true});

                    //TODO
                    var indexOfHeader = users.filter(function(user){
                        return (
                            ["CAP","ZAI","SSK","VIS","PRO","CRE","SYS"].some(function(incharge){return inArray(user.getValue("inchargeCode"),incharge)}) ||
                            ["みーと","あぜがみ"].some(function(azusaSendName){return user.getValue("azusaSendName") === azusaSendName})                        
                        )
                    }).map(function(user){
                        return users.findIndex(function(u){return u.getValue("_id") === user.getValue("_id")});
                    }).sort(function(a,b){return a-b});

                    var heightAll = topOffset + users.length + indexOfHeader.length;

                    //set border
                    borderSetting.push({"range":{"top":0,"left":0,"height":heightAll,"width":widthAll},"border":{"style":"solid","top":true,"bottom":true,"left":true,"right":true,"vertical":true,"horizontal":true}});
                    borderSetting.push({"range":{"top":topOffset,"left":leftOffset,"height":users.length + indexOfHeader.length,"width":contentWidth},"border":{"style":"dashed","vertical":true}});
                    //set cellSize
                    sizeSetting.push({"type":"width","index":0,"value":45});
                    sizeSetting.push({"type":"width","index":1,"value":105});
                    sizeSetting.push({"type":"width","index":2,"value":105});
                    sizeSetting.push({"type":"width","index":3,"value":135});
                    (function(){
                        for(var i=leftOffset; i<leftOffset+contentWidth; i++){
                            sizeSetting.push({"type":"width","index":i,"value":45});                            
                        }
                    })();
                    sizeSetting.push({"type":"width","index":widthAll-1,"value":105});

                    //1,2行目
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
                                    row.push({});
                                    mergeSetting.push({"range":{"top":rowIndex,"left":cellIndex,"height":1,"width":leftOffset}});
                                    borderSetting.push({"range":{"top":rowIndex,"left":cellIndex,"height":1,"width":widthAll},"border":{"top":false,"right":false,"left":false,"vertical":false}});
                                    
                                }else if(rowIndex === 0 && cellIndex === leftOffset){
                                    row.push(setDefaultCellSetting({"text":_val.config.getValue("content.kind") + _val.config.getValue("content.nth") + "当日人割","fontWeight":"bold","fontSize":16}));
                                    mergeSetting.push({"range":{"top":rowIndex,"left":cellIndex,"height":1,"width":widthAll - leftOffset}});
                                }else if(rowIndex === 1 && cellIndex === 0){
                                    row.push(setDefaultCellSetting({"text":"白枠は本部待機です。","fontWeight":"bold","fontSize":16}));
                                    mergeSetting.push({"range":{"top":rowIndex,"left":cellIndex,"width":leftOffset,"height":2}});
                                }else if(rowIndex >= 1 && cellIndex >= leftOffset && cellIndex < leftOffset + workGroups.length){
                                    workGroup = workGroups[cellIndex - leftOffset];
                                    if(rowIndex === 1){
                                        row.push(setDefaultCellSetting({"text":workGroup.getValue("name").replace(/^c_/,""),"background":workGroup.getValue("backgroundColor"),"fontColor":workGroup.getValue("fontColor")}));
                                    }else{
                                        row.push(setDefaultCellSetting({"background":workGroup.getValue("backgroundColor")}));
                                    }
                                }else if(rowIndex === 1 && cellIndex === leftOffset + workGroups.length){
                                    row.push(setDefaultCellSetting({"text":start.toString({"hideHour":true,"hideMinute":true}) + ":" + dateToValue(start.getAsDateClass()).str2,"background":"#E4E4E4","fontWeight":"bold","fontSize":16}));
                                    mergeSetting.push({"range":{"top":rowIndex,"left":cellIndex,"width":dayCellWidth,"height":2}});
                                }else if(rowIndex === 1 && cellIndex === leftOffset + workGroups.length + dayCellWidth){
                                    var nowTimeString = dateToValue(nowTime);
                                    row.push(setDefaultCellSetting({"text":"ver." + version + " : " + nowTimeString.month + "月" + nowTimeString.date + "日" + nowTimeString.hour + "時" + nowTimeString.minute + "分更新","fontWeight":"bold","fontSize":16}));
                                    mergeSetting.push({"range":{"top":rowIndex,"left":cellIndex,"width":widthAll -leftOffset - workGroups.length - dayCellWidth,"height":2}});
                                }else{
                                    row.push({});
                                }
                            }
                            table.push(row);
                        }
                    })();

                    //3行目以降の準備
                    var makeHeader = function(rowIndex){
                        var header = [];
                        var template = setDefaultCellSetting({"background":"#AAAAAA","fontWeight":"bold","alignHori":"left"});
                        header.push($.extend({},template,{"text":"学年","left":"solid","alignHori":"center"}));
                        header.push($.extend({},template,{"text":"氏名","left":"solid","alignHori":"center"}));
                        header.push($.extend({},template,{"text":"配送名","left":"solid","alignHori":"center"}));
                        header.push($.extend({},template,{"text":"担当","left":"solid","alignHori":"center"}));
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
                            header.push($.extend({},template,obj));                            
                            time.addTimeUnit(1);
                        }
                        header.push($.extend(true,{},template,{"text":"氏名"}));
                        return header;
                    };

                    var groupUsers = [];
                    (function(){
                        for(var i=0,l=indexOfHeader.length; i<l; i++){
                            groupUsers.push({"index":indexOfHeader[i],"user":users.slice().splice(indexOfHeader[i],i === l-1 ? users.length : indexOfHeader[i+1] - indexOfHeader[i])});
                        }
                    })();

                    //3行目以降
                    groupUsers.forEach(function(obj,groupIndex){
                        var users = obj.user;
                        var offset = obj.index + groupIndex + topOffset;
                        table.push(makeHeader(offset));
                        borderSetting.push({"range":{"top":offset,"left":leftOffset,"height":1,"width":contentWidth},"border":{"vertical":true,"style":"solid"}})

                        users.forEach(function(user,rowIndex){
                            var ret = user.getShiftTableAsSpreadsheetSetting(start,end,offset + rowIndex + 1,leftOffset);
                            mergeSetting = mergeSetting.concat(ret.merge);
                            borderSetting = borderSetting.concat(ret.border);
                            ret.content = ret.content.map(function(cell){return setDefaultCellSetting(cell);});
                            var preContent = [];
                            var sufContent = [];
                            preContent.push(setDefaultCellSetting({"alignHori":"left","text":user.getValue("grade")}));
                            preContent.push(setDefaultCellSetting({"alignHori":"left","text":user.getValue("nameLast") + " " + user.getValue("nameFirst")}));
                            preContent.push(setDefaultCellSetting({"alignHori":"left","text":user.getValue("azusaSendName")}));
                            preContent.push(setDefaultCellSetting({"alignHori":"left","text":(
                                user.getValue("isRojin") ? user.getValue("oldIncharge").filter(function(v){return v.display}).map(function(v){return "" + v.nth + v.code}).join("/") : user.getValue("inchargeCode").join("/")
                            )}));
                            sufContent.push(setDefaultCellSetting({"alignHori":"left","text":user.getValue("nameLast") + " " + user.getValue("nameFirst")}));
                            table.push((preContent.concat(ret.content)).concat(sufContent));
                        });
                    });

                    promiseChain = promiseChain.then(function(){
                        return Promise.all([
                            spreadsheet.writeSheetData(table,["text","fontColor","fontWeight","fontFamily","background","fontSize","alignHori","alignVer"],100),
                            spreadsheet.setBorderCell(borderSetting),
                            spreadsheet.setCellSize(sizeSetting)
                        ]).then(function(){
                            return spreadsheet.setMergeCell(mergeSetting);
                        }).then(function(){
                            return spreadsheet.setFreezeCell({"row":topOffset + 1,"column":leftOffset})
                        });
                    });

                });
                promiseChain = promiseChain.then(function(){
                    console.log("finished updating shiftTableUser completely!!");
                    return Server.handlePropertiesService({[version_propertyKey]:version+1},"script","set",{"skip":true});
                }).catch(function(e){
                    console.log("Error!!");
                    console.log(e);
                    throw new Error(e);
                });
                startTrigger = true;
                return promiseChain;
            });
        },createPdfOfShiftTableUser:function(){
            var sheetNameList = [];
            var startTrigger = false;
            var promiseChain = new Promise(function(resolve){
                var si = setInterval(function(){
                    if(startTrigger){
                        clearInterval(si);
                        resolve();
                    }
                },100);
            });
            var folder = _val.server.getData("fileInfo").find(function(fileInfo){
                return fileInfo.getValue("fileType") === "folder" && fileInfo.getValue("name") === "export";
            });

            (function(){
                for(var day=_val.config.getWorkStartDay(),e=_val.config.getWorkEndDay(); day<=e; day++){
                    sheetNameList.push("day" + day);
                }
            })();

            promiseChain = promiseChain.then(function(){
                Promise.all(sheetNameList.map(function(sheetName){
                    var spreadsheet = new Spreadsheet("shiftTableUser",sheetName,[]);
                    return spreadsheet.exportPdfToDrive(folder.getValue("fileId"),{"size":"A4"});
                }));
            });
            startTrigger = true;
        }
    };
});
