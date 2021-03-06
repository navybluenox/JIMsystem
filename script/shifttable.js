var initialize_shifttable,createShiftTableUser,createShiftTableWork;
(() => {

    var server,config;

    initialize_shifttable = obj => {
        if(server === undefined)  server = obj.server;
        if(config === undefined)  config = obj.config;
    }

    createShiftTableUser = (_users,option) => {
        _users = _users === undefined || _users === null ? server.getData("user",undefined,undefined,true) : _users;
        option = option === undefined ? {} : $.extend({"day":"all"},option);
        if(option.spreadsheetName === undefined)  throw new Error("2nd argument has no name of spreadsheet createShiftTableUser@shifttable,js");

        var la = new LoadingAlert();
        var version;
        var version_propertyKey =  option.spreadsheetName + "_version_" + _val.config.getValue("content.kind") + _val.config.getValue("content.nth");
        Server.handlePropertiesService(version_propertyKey,"script","get")
        .then(function(v){version = (v[version_propertyKey] === undefined ? 0 : +v[version_propertyKey]);})
        .then(function(){
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
                    obj.day = day;
                    timeInfoList.push(obj);
                }
            })();

            if(option.day !== "all"){
                timeInfoList = [timeInfoList.find(obj => obj.day - option.day === 0)];
            }

            timeInfoList.forEach(function(timeInfo){
                var table = [];
                var spreadsheet = new Spreadsheet(option.spreadsheetName,timeInfo.sheetName,table);
                var mergeSetting = [];
                var borderSetting = [];
                var sizeSetting = [];
                var start = timeInfo.start;
                var end = timeInfo.end;
                var sheetName = timeInfo.sheetName;
                var contentWidth = start.getDiff(end,"timeunit");
                var widthAll = leftOffset + contentWidth + rightOffset;

                var users = _users.filter(user => {
                    var value = user.getValue("sheetConfig").find(obj => obj.day === timeInfo.day);
                    return value === undefined || !value.isInvisible;
                });
                var gradeList = users.map(user => user.getValue("grade")).filter((v,i,s) => s.indexOf(v) === i);

                var users_rojinHeader = gradeList
                    .map(grade => users.find(user => user.getValue("isRojin") && user.getValue("grade") === grade))
                    .filter(user => user !== undefined)
                    .filter(user => inArray(_val.config.getValue("content.shiftTable.insertHeader.grade"),user.getValue("grade")));
                var indexOfHeader = users.filter(function(user){
                    return (
                        _val.config.getValue("content.shiftTable.insertHeader.leaderCode").some(function(incharge){return inArray(user.getValue("inchargeCode"),incharge)}) ||
                        users_rojinHeader.findIndex(user_r => user_r.getValue("_id") === user.getValue("_id")) !== -1
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
                    var workGroups = _val.server.getData("workGroup")
                        .filter(workGroup => workGroup.getValue("isColorGroup") && workGroup.getValue("colorGroupOrder") > 0)
                        .sort((a,b) => a.getValue("colorGroupOrder") - b.getValue("colorGroupOrder"));
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
                        var ret = user.getShiftTableAsSpreadsheetSetting(start,end,offset + rowIndex + 1,leftOffset)[0];
                        mergeSetting = mergeSetting.concat(ret.merge);
                        borderSetting = borderSetting.concat(ret.border);
                        ret.content = ret.content.map(function(cell){return setDefaultCellSetting(cell);});
                        var preContent = [];
                        var sufContent = [];
                        preContent.push(setDefaultCellSetting({"alignHori":"left","text":user.getValue("grade")}));
                        preContent.push(setDefaultCellSetting({"alignHori":"left","text":user.getValue("nameLast") + " " + user.getValue("nameFirst")}));
                        preContent.push(setDefaultCellSetting({"alignHori":"left","text":user.getValue("azusaSendName")}));
                        preContent.push(setDefaultCellSetting({"alignHori":"left","text":(
                            user.getInchargeForDisplay().map(incharge => incharge.isPresentTerm() ? incharge.getValue("code") : incharge.getName()).join("/")
                        )}));
                        sufContent.push(setDefaultCellSetting({"alignHori":"left","text":user.getValue("nameLast") + " " + user.getValue("nameFirst")}));
                        table.push((preContent.concat(ret.content)).concat(sufContent));
                    });
                });

                promiseChain = promiseChain.then(function(){
                    return spreadsheet.writeSheetData(table,["text","fontColor","fontWeight","fontFamily","background","fontSize","alignHori","alignVer"],100);
                }).then(function(){
                    return spreadsheet.setCellSize(sizeSetting);
                }).then(function(){
                    return spreadsheet.setBorderCell(borderSetting);
                }).then(function(){
                    return spreadsheet.setMergeCell(mergeSetting);
                }).then(function(){
                    return spreadsheet.setFreezeCell({"row":topOffset + 1,"column":leftOffset})
                });

            });
            promiseChain = promiseChain.then(function(){
                console.log("finished updating " + option.spreadsheetName + " completely!!");
                la.remove()
                return Server.handlePropertiesService({[version_propertyKey]:version+1},"script","set",{"skip":true});
            }).catch(function(e){
                la.remove();
                console.log("Error!!");
                console.log(e);
                throw new Error(e);
            });
            startTrigger = true;
            return promiseChain;
        });
    }

    createShiftTableWork = (sheetSettings,option) => {
        sheetSettings = sheetSettings === undefined ? [] : sheetSettings;
        option = option === undefined ? {} : $.extend({"day":"all"},option);
        if(option.spreadsheetName === undefined)  throw new Error("2nd argument has no name of spreadsheet createShiftTableWork@shifttable,js");

        var la = new LoadingAlert();
        var version;
        var version_propertyKey = option.spreadsheetName + "_version_" + _val.config.getValue("content.kind") + _val.config.getValue("content.nth");
        const constValue = {
            "sheet":{"header":1,"leftMargin":0},
            "workList":{"header":1,"leftMargin":2},
            "detail":{"header":2,"leftMargin":1}
        };
        return Server.handlePropertiesService(version_propertyKey,"script","get").then(function(v){version = (v[version_propertyKey] === undefined ? 0 : +v[version_propertyKey]);})
        .then(function(){
            var nowTime = new Date();
            var leftOffset = constValue.leftOffset;
            var topOffset = 1;
            var defaultCellTemplate = {"fontSize":11,"alignHori":"center","alignVer":"middle","fontFamily":"ＭＳ Ｐゴシック"};
            var setDefaultCellSetting = function(setting){return $.extend({},defaultCellTemplate,setting)};
            var startTrigger = false;
            var promiseChain = new Promise(function(resolve){
                var si = setInterval(function(){
                    if(startTrigger){
                        clearInterval(si);
                        resolve();
                    }
                },100);
            });

            sheetSettings = sheetSettings.map(sheetObj => {
                var rowIndex = 0;
                var result_sheet = {
                    "sheetName":sheetObj.sheetName,
                    "offset":{"top":rowIndex,"left":0},
                    "size":{"height":0,"width":0}
                };
                rowIndex += constValue.sheet.header;
                result_sheet.workLists = sheetObj.workLists
                    .filter(workList => {
                        return option.day === "all" || workList.getShiftTableAsData(config.getWorkTime(option.day).start,config.getWorkTime(option.day).end).workNum !== 0;
                        //TODO option.dayによるfilter
                        //value === "all" ||  number - value === 0　で評価
                        //return true;
                    })
                    .map(workList => {
                    var result_workList = {
                        "datapiece":workList,
                        "offset":{"top":rowIndex,"left":constValue.sheet.leftMargin},
                        "size":{"height":0,"width":0}
                    };
                    rowIndex += constValue.workList.header;
                    result_workList.details = workList.getNumberDetails()
                        .map(detail => {
                            if(option.day === "all")  return detail;

                            var workTime = config.getWorkTime(option.day);
                            if(detail.end > workTime.start && detail.start < workTime.end){
                                let detail_result = $.extend({},detail);
                                if(detail.start < workTime.start){
                                    detail_result.start = workTime.start;
                                    detail_result.number.splice(0,detail.start.getDiff(workTime.start,"timeunit"));
                                }
                                if(detail.end > workTime.end){
                                    detail_result.end = workTime.end;
                                    detail_result.number.splice(-workTime.end.getDiff(detail.end,"timeunit"),detail_result.number.length);
                                }
                                return detail_result;
                            }else{
                                return null;
                            }
                            //TODO option.dayによるfilter
                            //value === "all" ||  number - value === 0　で評価
                            //return true;
                        })
                        .filter(v => v !== null)
                        .map((detail,index) => {
                        var result_detail =  {
                            "index":index,
                            "value":detail,
                            "offset":{"top":rowIndex,"left":constValue.sheet.leftMargin + constValue.workList.leftMargin},
                            "size":{"height":constValue.detail.header + detail.number.reduce((prev,curt) => Math.max(prev,curt),0),"width":constValue.detail.leftMargin + detail.number.length},
                            "start":detail.start,
                            "end":detail.end
                        };
                        result_workList.size.height += result_detail.size.height;
                        result_workList.size.width = Math.max(
                            result_detail.size.width + constValue.workList.leftMargin,
                            result_workList.size.width
                        );
                        rowIndex += result_detail.size.height;
                        return result_detail;
                    });
                    result_workList.size.height += constValue.workList.header;
                    result_sheet.size.height += result_workList.size.height;
                    result_sheet.size.width = Math.max(
                        result_workList.size.width + constValue.sheet.leftMargin,
                        result_sheet.size.width
                    );
                    return result_workList;
                });
                result_sheet.size.height += constValue.sheet.header;
                return result_sheet;
            }).filter(sheetObj => {
                if(sheetObj.workLists.length === 0){
                    promiseChain = promiseChain.then(() => {
                        return (new Spreadsheet(option.spreadsheetName,sheetObj.sheetName)).clearSheetData();
                    });
                }
                return sheetObj.workLists.length !== 0;
            });

            promiseChain = promiseChain.then(() => {
                return (new Spreadsheet(option.spreadsheetName)).insertNewSheets(sheetSettings.map(obj => obj.sheetName));
            });

            sheetSettings.forEach(function(sheetObj){
                var table = [];
                var mergeSetting = [];
                var borderSetting = [];
                var sizeSetting = [];

                //set cellSize
                forEachColumn(sheetObj,y => {
                    var size;
                    switch(y){
                        case 0:
                            size = 45;
                        case 1:
                            size = 45;
                        default:
                            size = 45;
                    }
                    sizeSetting.push({"type":"width","index":y,"value":size});
                })
                forEachMatrix(sheetObj,(x,y,i,j) => {
                    if(j === 0) table[x] = [];
                    table[x][y] = setDefaultCellSetting({});
                });

                //sheetごとのヘッダー
                var nowTimeString = dateToValue(nowTime);
                table[0][0] = setDefaultCellSetting({"text":"ver." + version + " : " + nowTimeString.month + "月" + nowTimeString.date + "日" + nowTimeString.hour + "時" + nowTimeString.minute + "分更新","fontWeight":"bold","fontSize":16,"alignHori":"left"});
                borderSetting.push({
                    "range":{"top":0 ,"left":0,"height":1,"width":sheetObj.size.width},
                    "border":{"style":"solid","top":true,"bottom":true,"left":true,"right":true}
                });
                mergeSetting.push({"range":{"top":0,"left":0,"height":1,"width":sheetObj.size.width}});

                sheetObj.workLists.forEach(workListObj => {
                    //workListごとのヘッダー
                    //set border
                    borderSetting.push({
                        "range":{"top":workListObj.offset.top + constValue.workList.header ,"left":workListObj.offset.left,"height":workListObj.size.height - constValue.workList.header,"width":1},
                        "border":{"style":"solid","top":true,"bottom":true,"left":true,"right":true,"vertical":true,"horizontal":true}
                    });
                    mergeSetting.push({
                        "range":{"top":workListObj.offset.top + constValue.workList.header,"left":workListObj.offset.left,"height":workListObj.size.height - constValue.workList.header,"width":1}
                    });

                    //set content
                    forEachRow(workListObj,(x,i) => {
                        table[x][0] = setDefaultCellSetting(i === constValue.workList.header ? {"text":workListObj.datapiece.getName(),"wrap":true} : {});
                        table[x][1] = {};
                    });

                    workListObj.details.forEach(detailObj => {
                        //border
                        ////header
                        borderSetting.push({
                            "range":{"top":detailObj.offset.top,"left":detailObj.offset.left,"height":1,"width":detailObj.size.width},
                            "border":{"style":"solid","top":true,"bottom":true,"left":true,"right":true,"vertical":true,"horizontal":true}
                        });
                        borderSetting.push({
                            "range":{"top":detailObj.offset.top + 1,"left":detailObj.offset.left + constValue.detail.leftMargin,"height":1,"width":detailObj.size.width - constValue.detail.leftMargin},
                            "border":{"style":"solid","top":true,"bottom":true,"left":true,"right":true,"vertical":true,"horizontal":true}
                        });
                        ////content
                        borderSetting.push({
                            "range":{"top":detailObj.offset.top + constValue.detail.header,"left":detailObj.offset.left + constValue.detail.leftMargin,"height":detailObj.size.height - constValue.detail.header,"width":detailObj.size.width - constValue.detail.leftMargin},
                            "border":{"style":"solid","top":true,"bottom":true,"left":true,"right":true,"vertical":true,"horizontal":true}
                        });
                        borderSetting.push({
                            "range":{"top":detailObj.offset.top + constValue.detail.header,"left":detailObj.offset.left + constValue.detail.leftMargin,"height":detailObj.size.height - constValue.detail.header,"width":detailObj.size.width - constValue.detail.leftMargin},
                            "border":{"style":"dashed","vertical":true}
                        });
                        borderSetting.push({
                            "range":{"top":detailObj.offset.top + constValue.detail.header,"left":detailObj.offset.left + constValue.detail.leftMargin,"height":detailObj.size.height - constValue.detail.header,"width":detailObj.size.width - constValue.detail.leftMargin},
                            "border":{"style":"solid","bottom":true}
                        });
                        mergeSetting.push({"range":{"top":detailObj.offset.top,"left":detailObj.offset.left,"height":1,"width":detailObj.size.width}});
                        //header
                        var timeBarColor = 0;
                        forEachColumn(detailObj,(y,j) => {
                            var time = detailObj.start.copy().addTimeUnit(j - constValue.detail.leftMargin);
                            var row0 = detailObj.offset.top + 0;
                            var row1 = detailObj.offset.top + 1;
                            if(j === 0){
                                table[row0][y] = setDefaultCellSetting({
                                    "text":detailObj.start.toString() + "から" + detailObj.end.toString({"userDiffHours":detailObj.start}) + "まで",
                                    "background":"#FFD166",
                                    "alignHori":"left"
                                });
                                table[row1][y] = setDefaultCellSetting({});
                            }else{
                            table[row0][y] = setDefaultCellSetting({});
                                if(time.getMinutes() === 0){
                                    table[row1][y] = setDefaultCellSetting({
                                        "text":time.getDifferentialHours(detailObj.start) + "時-",
                                        "background":timeBarColor%2 === 0 ? "#7FFFD4" : "#66CDAA",
                                        "alignHori":"left"
                                    });
                                    timeBarColor++;
                                    mergeSetting.push({"range":{"top":row1,"left":y,"height":1,"width":Math.min(
                                        LocalDate.getTimeUnitPerUnit("hour"),
                                        time.getDiff(detailObj.end,"timeunit")
                                    )}});
                                }else if(j === constValue.detail.leftMargin){
                                    table[row1][y] = setDefaultCellSetting({
                                        "text":"",
                                        "background":timeBarColor%2 === 0 ? "#7FFFD4" : "#66CDAA",
                                        "alignHori":"left"
                                    });
                                    timeBarColor++;
                                    mergeSetting.push({"range":{"top":row1,"left":y,"height":1,"width":(60 - time.getMinutes()) / LocalDate.getTimeUnitAsConverted("minute")}});
                                }else{
                                    table[row1][y] = setDefaultCellSetting({});
                                }
                            }
                        });
                        //content
                        var topOffset_contentTable = detailObj.offset.top + constValue.detail.header;
                        var leftOffset_contentTable = detailObj.offset.left + constValue.detail.leftMargin;
                        var detailSetting = workListObj.datapiece.getShiftTableAsSpreadsheetSetting(option.day === "all" ? detailObj.index : detailObj.value ,topOffset_contentTable,leftOffset_contentTable);
                        borderSetting = borderSetting.concat(detailSetting.map(obj => obj.border).reduce((curt,prev) => prev.concat(curt),[]));
                        mergeSetting = mergeSetting.concat(detailSetting.map(obj => obj.merge).reduce((curt,prev) => prev.concat(curt),[]));
                        forEachMatrix(detailObj,(x,y,i,j) => {
                            if(i < constValue.detail.header || j < constValue.detail.leftMargin || i - constValue.detail.header >= detailSetting.length)  return;
                            table[x][y] = detailSetting[i - constValue.detail.header].content[j - constValue.detail.leftMargin];
                        });
                    });
                });

                var spreadsheet = new Spreadsheet(option.spreadsheetName,sheetObj.sheetName,table);
                promiseChain = promiseChain.then(() => {
                    return spreadsheet.writeSheetData(table,["text","fontColor","fontWeight","fontFamily","background","fontSize","alignHori","alignVer","wrap"],100)
                }).then(() => {
                    return spreadsheet.setCellSize(sizeSetting);
                }).then(() => {
                    return spreadsheet.setBorderCell(borderSetting);
                }).then(() => {
                    return spreadsheet.setMergeCell(mergeSetting);
                });

                function forEachMatrix(setting,callback){
                    forEachRow(setting,(x,i) => {
                        forEachColumn(setting,(y,j) => {
                            callback(x,y,i,j);
                        })
                    })
                }
                function forEachRow(setting,callback){
                    for(var i=0;i<setting.size.height;i++){
                        var x = setting.offset.top + i;
                        callback(x,i);
                    }
                }
                function forEachColumn(setting,callback){
                    for(var j=0;j<setting.size.width;j++){
                        var y = setting.offset.left + j;
                        callback(y,j);
                    }                        
                }
            });
            promiseChain = promiseChain.then(function(){
                console.log("finished updating " + option.spreadsheetName + " completely!!");
                la.remove()
                return Server.handlePropertiesService({[version_propertyKey]:version+1},"script","set",{"skip":true});
            }).catch(function(e){
                la.remove();
                console.log("Error!!");
                console.log(e);
                throw new Error(e);
            });
            startTrigger = true;
            return promiseChain;
        });

    }

})();