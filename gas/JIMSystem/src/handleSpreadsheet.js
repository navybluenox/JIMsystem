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
        },createShiftTableUser:function(version){
            _val.server.loadData("user").then(function(users){
                var leftOffsetContent = 4;
                var topOffsetContent = 3;
                var timeInfoList = [];
                var startTrigger = false;
                var promise = new Promise(function(resolve){
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
                    var mergeSetting = [];
                    var start = timeInfo.start;
                    var end = timeInfo.end;
                    var sheetName = timeInfo.sheetName;
                    var contentColumnNum = start.getDiff(end,"timeunit");

                    //TODO makeTableHeader

                    var makeHeader = function(rowIndex){
                        var header = [];
                        var template = {"background":"#AAAAAA","fontWeight":"bold","border":{"left":"dashed","top":"solid","bottom":"solid"}};
                        header.push($.extend(true,{},template,{"text":"学年","left":"solid"}));
                        header.push($.extend(true,{},template,{"text":"氏名","left":"solid"}));
                        header.push($.extend(true,{},template,{"text":"配送名","left":"solid"}));
                        header.push($.extend(true,{},template,{"text":"担当","left":"solid"}));
                        var time = start.copy();
                        var obj;
                        var headerOffset = header.length;
                        for(var i=0; i<contentColumnNum; i++){
                            obj = {};
                            if(time.getMinutes() === 0 || i === 0){
                                obj.text = "" + time.getDifferentialHours(start) + "時-";
                                obj = $.extend(true,obj,{"border":{"left":"solid"}});
                                if(i === 0){
                                    mergeSetting.push({"top":rowIndex,"left":leftOffsetContent + i,"height":1,"width":(60 - time.getMinutes()) / LocalDate.getTimeUnitAsConverted("minute")});
                                }else if(time.getDiff(end,"minute") < 60){
                                    mergeSetting.push({"top":rowIndex,"left":leftOffsetContent + i,"height":1,"width":time.getDiff(end,"timeunit")});
                                }else{
                                    mergeSetting.push({"top":rowIndex,"left":leftOffsetContent + i,"height":1,"width":60 / LocalDate.getTimeUnitAsConverted("minute")});                                    
                                }
                            }
                            header.push($.extend(true,{},template,obj));                            
                            time.addTimeUnit(1);
                        }
                        header.push($.extend(true,{},template,{"text":"氏名","left":"solid","right":"solid"}));
                        return header;
                    };


                    //TODO
                    var indexOfHeader = users.filter(function(user){
                        return (
                            ["CAP","ZAI","SSK","VIS","PRO","CRE","SYS"].some(function(incharge){return inArray(user.getValue("incharge"),incharge)}) ||
                            ["みーと","あぜがみ"].some(function(azusaSendName){return inArray(user.getValue("azusaSendName"),azusaSendName)})                        
                        )
                    }).map(function(user){
                        return users.findIndex(function(u){return u.getValue("_id") === user.getValue("_id")});
                    }).sort(function(a,b){return a-b});
                    var groupUsers = [];
                    (function(){
                        for(var i=0,l=indexOfHeader.length; i<l; i++){
                            groupUsers.push({"index":indexOfHeader[i],"user":users.slice().splice(indexOfHeader[i],i === l-1 ? l : indexOfHeader[i+1] - indexOfHeader[i])});
                        }
                    })();
                    groupUsers.forEach(function(obj){
                        var users = obj.user;
                        var groupIndex = obj.index;
                        table.push(makeHeader(topOffsetContent + groupIndex));
                        users.forEach(function(user,rowIndex){
                            var ret = user.getShiftTableAsSpreadsheetSetting(start,end,rowIndex + topOffsetContent + groupIndex + 1,leftOffsetContent);
                            mergeSetting = mergeSetting.concat(ret.merge);
                            var template = {"border":{"left":"solid","top":"solid","bottom":"solid"}};
                            var preContent = [];
                            var sufContent = [];
                            preContent.push($.extend(true,{},template,{"text":user.getValue("grade")}));
                            preContent.push($.extend(true,{},template,{"text":user.getValue("nameLast") + " " + user.getValue("nameFirst")}));
                            preContent.push($.extend(true,{},template,{"text":user.getValue("azusaSendName")}));
                            preContent.push($.extend(true,{},template,{"text":user.getValue("inchargeCode").join("/")}));
                            sufContent.push($.extend(true,{},template,{"text":user.getValue("nameLast") + " " + user.getValue("nameFirst"),"right":"solid"}));
                            table.push((preContent.concat(ret.content)).concat(sufContent));
                        });
                    });
                });
            });

        
        }
    };
});
