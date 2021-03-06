$(function(){
    var pageFun;
    var formAddData,formCreateShiftTable;
    _val.pageFun.handleSpreadsheet = {
        onload:function(){
            _val.server.loadDataAll().then(() => {
                var workLists = _val.server.getData("workList");
                formCreateShiftTable.find('[name="createShiftTableWork_incharge"]')
                    .append('<option value="all">全て</option>')
                    .append(
                        Incharge.getInchargesInOrder(undefined,true)
                            .filter(incharge => incharge.isEndChild() || incharge.isDivision())
                            .filter(incharge => incharge.isDivision() || workLists.find(workList => workList.getValue("leaderInchargeId") === incharge.getValue("_id")) !== undefined)
                            .map(incharge => {
                                return (
                                    incharge.isDivision() ?
                                    '<optgroup label="' + incharge.getValue("code") + '"></optgroup>' :
                                    '<option value="' + incharge.getValue("_id") + '">' + incharge.getValue("code") + '</option>'
                                )
                            })
                            .join("")
                    );
                formCreateShiftTable.find('[name="createShiftTablePlace_group"]')
                    .append('<option value="all">全て</option>')
                    .append(
                        _val.server.getData("workGroup",undefined,undefined,true)
                            .filter(workGroup => workGroup.getValue("isUnitGroup"))
                            .map(workGroup => '<option value="' + workGroup.getValue("_id") +'">' + workGroup.getName().replace(/^u_/,"") + '</option>')
                            .join("")
                    )
            });
            pageFun = _val.pageFun.handleSpreadsheet;
            formAddData = $("#formAddToDatabase");
            formCreateShiftTable = $("#formCreateShiftTable");

            formAddData.find('[name="dataName"]').append(
                ['<option value=""></option>'].concat(Datapiece.sort(_val.server.getData("collectionInfo"),"name").map(function(collInfo){
                    var name = collInfo.getValue("name");
                    return '<option value="' + name + '">' + name + '</option>';
                }))
            );

            (() => {
                var sheetNameList = [];
                for(var day=_val.config.getWorkStartDay(),e=_val.config.getWorkEndDay(); day<=e; day++){
                    sheetNameList.push(day);
                }
                formCreateShiftTable.find('[name="createShiftTableUser_day"],[name="createShiftTablePlace_day"]')
                    .append('<option value="all">全て</option>')
                    .append(sheetNameList.map(function(day){
                        return '<option value="' + day + '">' + day + "日目" + '</option>';
                    }));
            })();

            formAddData.find('[name="open"]').on("click",e => {
                var spreadsheet = new Spreadsheet("editDatabase");
                spreadsheet.openSpreadsheet();
            });
            formCreateShiftTable.find('[name^="open_spreadsheet"]').on("click",e => {
                var type = $(e.currentTarget).attr("name").replace(/^open_spreadsheet_(.+)$/,"$1");
                var spreadsheetName = {"work":"shiftTableWork","user":"shiftTableUser","place":"shiftTablePlace"}[type];
                var spreadsheet = new Spreadsheet(spreadsheetName);
                spreadsheet.openSpreadsheet();
            });
            formCreateShiftTable.find('[name="open_pdf"]').on("click",e => {
                showOuterPage([
                    "https://drive.google.com/drive/folders/",
                    _val.server.getData("fileInfo").find(function(fileInfo){
                        return fileInfo.getValue("fileType") === "folder" && fileInfo.getValue("name") === "export";
                    }).getValue("fileId")
                ].join(""));
            });

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
        },removeAllSheets:function(spreadsheetName){
            var spreadsheet = new Spreadsheet(spreadsheetName);
            spreadsheet.removeSheet(null);            
        },createShiftTableUser:function(){
            var users = {
                "現役と老人":null,
                "現役のみ":_val.server.getData("user",undefined,undefined,true).filter(user => !user.getValue("isRojin")),
                "老人のみ":_val.server.getData("user",undefined,undefined,true).filter(user => user.getValue("isRojin"))
            }[formCreateShiftTable.find('[name="createShiftTableUser_rojin"]').val()];
            return createShiftTableUser(users,{
                "spreadsheetName":"shiftTableUser",
                "day":formCreateShiftTable.find('[name="createShiftTableUser_day"]').val()
            });
        },createShiftTableWork:function(){
            var inchargeId_selected = formCreateShiftTable.find('[name="createShiftTableWork_incharge"]').val();
            var workLists = _val.server.getData("workList",undefined,undefined,true);
            var sheetSettings = (
                inchargeId_selected !== "all" ?
                _val.server.getDataById(inchargeId_selected,"incharge") :
                Incharge.getInchargesInOrder()
            ).map(incharge => {
                return {
                    "sheetName":[incharge.getValue("code"),incharge.getValue("name")].join(" "),
                    "workLists":workLists
                        .filter(workList => workList.getValue("leaderInchargeId") === incharge.getValue("_id"))
                        .sort((a,b) => a.getValue("name").charCodeAt() - b.getValue("name").charCodeAt())
                };
            })
            .filter(obj => obj.workLists.length !== 0);
            return createShiftTableWork(sheetSettings,{"spreadsheetName":"shiftTableWork"});
        },createShiftTablePlace:function(){
            var workGroupId_selected = formCreateShiftTable.find('[name="createShiftTablePlace_group"]').val();
            var workLists = _val.server.getData("workList",undefined,undefined,true);
            var sheetSettings = (
                workGroupId_selected !== "all" ?
                _val.server.getDataById(workGroupId_selected,"workGroup") :
                _val.server.getData("workGroup",undefined,undefined,true)
                    .filter(workGroup => workGroup.getValue("isUnitGroup"))
            ).map(workGroup => {
                return {
                    "sheetName":workGroup.getName().replace(/^u_/,""),
                    "workLists":_val.server.getDataById(workGroup.getValue("member"),"workList")
                };
            })
            .filter(obj => obj.workLists.length !== 0);
            return createShiftTableWork(sheetSettings,{
                "spreadsheetName":"shiftTablePlace",
                "day":formCreateShiftTable.find('[name="createShiftTablePlace_day"]').val()
            });
        },createPdfOfShiftTable:function(type){
            var la = new LoadingAlert();
            var sheetNameList = [];
            var startTrigger = false;
            var spreadsheetName = {"work":"shiftTableWork","user":"shiftTableUser","place":"shiftTablePlace"}[type];
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

            if(type === "work"){
                let workLists = _val.server.getData("workList");
                sheetNameList = Incharge.getInchargesInOrder()
                    .filter(incharge => workLists.find(workList => workList.getValue("leaderInchargeId") === incharge.getValue("_id")) !== undefined)
                    .map(incharge => incharge.getValue("code"));
           }else if(type === "user"){
                for(let day=_val.config.getWorkStartDay(),e=_val.config.getWorkEndDay(); day<=e; day++){
                    sheetNameList.push("day" + day);
                }
            }else if(type === "place"){
                //TODO
            }

            promiseChain = promiseChain.then(function(){
                Promise.all(sheetNameList.map(function(sheetName){
                    var spreadsheet = new Spreadsheet(spreadsheetName,sheetName,[]);
                    return spreadsheet.exportPdfToDrive(folder.getValue("fileId"),{"size":"A4"});
                }));
            }).then(() => {
                la.remove();
            });
            startTrigger = true;
        }
    };
});
