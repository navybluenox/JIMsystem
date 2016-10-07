$(function(){
    var workListEditing;
    var form;
    var formNameList = [{"name":"name"},{"name":"nameShort"},{"name":"leaderId"},{"name":"leaderIncharge"},{"name":"description"},{"name":"condition"},{"name":"caption"},{"name":"note"},{"name":"asAssined"}];
    var detailTable;
    _val.pageFun.editWorkList = {
        onload:function(){
            var that =  _val.pageFun.editWorkList;
            _val.server.loadData("user");
            _val.server.loadData("workList");
            form = $("#formEditWorkList_edit");
            detailTable = form.find('table.workList_detail_table');
            //set events
            detailTable.on("click",'[name^="detail_addAllNumber"]',function(e){
                var trigger = $(e.currentTarget);
                var target = detailTable.find('[name^=detail_number_' + trigger.attr("name").replace(/^detail_addAllNumber_/,"") + ']');
                target.trigger("click");
            });
            detailTable.on("click",'[name^="detail_number"]',function(e){
                var trigger = $(e.currentTarget);
                var sign = detailTable.find('[name="detail_increment"]').val();
                if(sign === "+"){
                    trigger.val(+trigger.val() + 1);
                }else if(sign === "-" && trigger.val() > 1){
                    trigger.val(+trigger.val() - 1);
                }
            });
            detailTable.on("click",'[name^="detail_extendInterval"]',function(e){
                var trigger = $(e.currentTarget);
                var detailIndex = +trigger.attr("name").replace(/^detail_extendInterval_/,"");
                var numberArray = that.getDetailNumber(detailIndex);
                numberArray.push(1);
                that.makeDetailNumberTable(detailIndex,numberArray);
            });
            detailTable.on("click",'[name^="detail_shortenInterval"]',function(e){
                var trigger = $(e.currentTarget);
                var detailIndex = +trigger.attr("name").replace(/^detail_shortenInterval_/,"");
                var numberArray = that.getDetailNumber(detailIndex);
                if(numberArray.length === 0) return;
                numberArray.length = numberArray.length - 1;
                that.makeDetailNumberTable(detailIndex,numberArray);
            });
            detailTable.on("change",'[name^="detail_start"]',function(e){
                var trigger = $(e.currentTarget);
                var detailIndex = +trigger.attr("name").replace(/^detail_start_(?:day|hour|minute)_/,"");
                var numberArray = that.getDetailNumber(detailIndex);
                that.makeDetailNumberTable(detailIndex,numberArray);
            });
            
        },updateWorkList:function(kind,_id){
            var workList;
            var setValue = {};
            if(kind === "add" || kind === "change"){
                formNameList.forEach(function(obj){
                    var el = form.find('[name="' + obj.name + '"]');
                    setValue[obj.key === undefined ? obj.name : obj.key] = el.val();
                })
                //TODO set detail

                if(kind === "change"){
                    if(workListEditing === undefined){
                        alert("値を変更する人割が指定されていません\n下の「検索」から変更したい人割を選択し、フォームへ入力してください");
                        return;
                    }
                    setValue._id = workListEditing.getValue("_id");
                }
                workList = new WorkList(setValue);
                if(kind === "add"){
                    _val.server.addData(workList);
                }else{
                    _val.server.changeData(workList);
                }
            }else if(kind === "remove"){
                workList = new WorkList({"_id":_id});
                _val.server.removeData(workList).then(function(){
                    _val.pageFun.editWorkList.searchWorkList();
                });
            }
            _val.server.sendUpdateQueue();
        },searchWorkList:function(sortFun){
            var result = $("#formEditWorkList_search_result");
            var form_search = $("#formEditWorkList_search_cond");

            result.children().remove();
            result.append("<h3>検索結果</h3>");

            var cond = {};
            ["name","leader","incharge"].forEach(function(name){
                cond[name] = form_search.find('[name="' + name + '"]').val();
            })
            var workLists = _val.server.getData("workList").filter(function(workList){
                var flag = true;
                if(cond.name !== ""){
                    var reg_name = new RegExp(cond.name);
                    flag = flag && (reg_name.test(workList.getValue("name")) || reg_name.test(workList.getValue("nameShort")))
                }
                if(cond.incharge !== ""){
                    flag = flag && (new RegExp(cond.incharge)).test(workList.getValue("leaderIncharge"));
                }
                if(cond.leader !== ""){
                    var user = _val.server.getDataById(workList.getValue("leaderId"),"user")[0];
                    var reg_leader = new RegExp(cond.leader); 
                    flag = flag && (
                        reg_leader.test(user.getValue("azusaSendName")) ||
                        reg_leader.test(user.getValue("nameLast") + user.getValue("nameFirst")) ||
                        reg_leader.test(user.getValue("nameLastPhonetic") + user.getValue("nameFirstPhonetic"))
                    );
                }
                return flag;
            });

            if(sortFun !== undefined && typeof sortFun === "function"){
                workLists =  sortFun(workLists);
            }

            var fun_fillForm = function(workList){
                formNameList.forEach(function(obj){
                    var el = form.find('[name="' + obj.name + '"]');
                    el.val(workList.getValue(obj.key === undefined ? obj.name : obj.key));
                })
                workList.getValue("@detail").forEach(function(detailObj){
                    _val.pageFun.editWorkList.addSection(detailObj);
                })
            }

            var table = createTable(result,workLists,["edit","leaderIncharge","leaderId","name","caption"],function(cellObj){
                var workList = cellObj.rowData;
                if(cellObj.column === "edit"){
                    var buttons = $('<input type="button" value="フォームに入力"><input type="button" value="削除">').appendTo(cellObj.el);
                    buttons.eq(0).on("click",function(e){fun_fillForm(workList);workListEditing = workList;});
                    buttons.eq(1).on("click",function(e){_val.pageFun.editWorkList.updateWorkList("remove",workList.getValue("_id"));});
                }else{
                    var str;
                    switch(cellObj.column){
                        case "leaderIncharge":
                        case "name":
                        case "caption":
                            str = workList.getValue(cellObj.column);
                            break;
                        case "leaderId":
                            str = _val.server.getDataById(workList.getValue("leaderId"),"user")[0].getValue("azusaSendName");
                            break;
                    }
                    cellObj.el.text(str);
                }
            },{"header":["edit","担当","統括配送名","人割名","業務説明文"]});
            table.el.css({"margin":"3em"});

        },searchUserIdByAzusa:function(){
            var target = form.find('[name="leaderId"]');
            var value = form.find('[name="searchId"]').val();
            var reg = new RegExp(value);
            var users = _val.server.getData("user").filter(function(user){return reg.test(user.getValue("azusaSendName"))});
            if(users.length < 2){
                target.val(users.map(function(user){return user.getValue("_id")}).join(""));
            }else{
                target.val(users.map(function(user){return user.getValue("_id") + "(" + user.getValue("azusaSendName") + ")"}).join(","));
            }
            _val.pageFun.editWorkList.searchInchrageByUserId();
        },searchInchrageByUserId:function(){
            var target = form.find('[name="searchIncharge"]');
            var value = form.find('[name="leaderId"]').val();
            var user = _val.server.getDataById(value,"user")[0];
            if(user === undefined) return;
            target.children().remove();
            target.append(
                user.getValue("inchargeCode").map(function(incharge){return '<option value="' + incharge + '">'+ incharge + "</option>"}).join("")
            );
            target.prop("selectedIndex",0);
        },setInchrage:function(){
            var target = form.find('[name="leaderIncharge"]');
            var value = form.find('[name="searchIncharge"]').val();
            target.val(value);
        },makeDetailNumberTable:function(detailIndex,numberArray){
            var targetTable = detailTable.find('[name="detail_interval_' + detailIndex + '"]').siblings("table");
            var tr1 = targetTable.find("tbody > tr").eq(0);
            var tr2 = targetTable.find("tbody > tr").eq(1);
            var startTime = _val.pageFun.editWorkList.getDetailStart(detailIndex);

            tr1.children().not(":first-child").remove();
            tr2.children().remove();
            tr1.append(repeatString("<td></td>",numberArray.length));
            tr2.append(repeatString("<td></td>",numberArray.length));

            (function(){
                var a = numberArray.slice();
                var num,td1,td2,time,numIndex;
                while((num = a.pop()) !== undefined){
                    numIndex = a.length;
                    td1 = tr1.children().eq(numIndex);
                    td2 = tr2.children().eq(numIndex);
                    time = startTime.copy().addTimeUnit(numIndex);
                    if(time.getMinutes() === 0 || numberArray.length === 1){
                        td1.text(time.getDifferentialHours(startTime.getDays()));
                    }else{
                        td1.remove();
                    }
                    td2.append('<input type="button" name="detail_number_' + detailIndex + '_' + numIndex + '" value="'+ num +'">');
                }
            })();

            detailTable.find('[name="detail_interval_' + detailIndex + '"]').val(numberArray);

            var td1s = tr1.children().not(":first-child");
            var td2s = tr2.children();
            var timeUnitsPerHour = 60/LocalDate.getTimeUnitAsConverted("minute");
            var endTime = startTime.copy().addTimeUnit(numberArray.length);

            td1s.attr("colspan",timeUnitsPerHour);
            td1s.first().attr("colspan",timeUnitsPerHour*(60 - startTime.getMinutes())/60);
            if(endTime.getMinutes() !== 0){
                td1s.last().attr("colspan",timeUnitsPerHour*endTime.getMinutes()/60);
            }

            targetTable.css({"border":"1px #000000 solid","border-collapse":"collapse"});
            targetTable.find("td").css({"padding":"0","border":"1px #000000 solid"});
            td1s.css({"text-align":"left"});
            td1s.filter(":nth-child(2n)").css({"background":"#7FFFD4"});
            td1s.filter(":nth-child(2n+1)").css({"background":"#66CDAA"});
            td2s.find('[name^="detail_number"]').css({"padding":"0 1em","min-width":"initial"});
            td2s.not(":nth-child(" + timeUnitsPerHour + "n)").css({"border-left-style":"dashed"});

        },addSection:function(detailObj){
            if(detailObj === undefined)  detailObj = {"start":new LocalDate(),"number":[]};
            var targetRow = detailTable.find('[name="detail_addSection"]').closest("tr");
            var detailNum = detailTable.children("tbody").children("tr").length - 1;
            var tr = $("<tr><td>" + [
                '<input type="checkbox" name="detail_remove_' + detailNum + '">',
                '<input type="button" name="detail_addAllNumber_' + detailNum + '" value="all">',[
                    '<input type="number" name="detail_start_day_' + detailNum + '" value="' + detailObj.start.getDays() + '" max="' + _val.config.getWorkEndDay() + '" min="' + _val.config.getWorkStartDay() + '">日目',
                    '<input type="number" name="detail_start_hour_' + detailNum + '" value="' + detailObj.start.getHours() + '" max="23" min="0">時',
                    '<input type="number" name="detail_start_minute_' + detailNum + '" value="' + detailObj.start.getMinutes() + '" max="59" min="0" step="' + LocalDate.getTimeUnitAsConverted("minute") +'">分'
                ].join(""),[
                    '<table><tbody><tr><td rowspan="2">',
                        '<input type="button" name="detail_extendInterval_' + detailNum + '" value="延長">',
                        '<input type="button" name="detail_shortenInterval_' + detailNum + '" value="短縮">',
                    '</td></tr><tr></tr></tbody></table>',
                    '<input type="hidden" name="detail_interval_' + detailNum + '" value="' + detailObj.number.length + '">'
                ].join("")
            ].join("</td><td>") + "</td></tr>").insertBefore(targetRow);

            //TODO set css of numberTable here
            tr.find("td").css({"padding":0,"text-align":"center"});
            tr.find('[type="button"]').css({"min-width":"initial"});
            tr.find('[name^="detail_addAllNumber"]').css({"padding":"0 1em"});
            tr.find('[name^="detail_start"]').css({"width":"3em"});
            tr.find('[name^="detail_number"]').css({"width":"3em"});

            _val.pageFun.editWorkList.makeDetailNumberTable(detailNum,detailObj.number);


        },getDetailStart:function(detailIndex){
            var fun = function(key){return detailTable.find('[name="detail_start_' + key + '_' + detailIndex + '"]').val();}
            return new LocalDate({
                "day":fun("day"),
                "hour":fun("hour"),
                "minute":fun("minute")
            });
        },getDetailNumber:function(detailIndex){
            var ret = [];
            var target = detailTable.find('[name^="detail_number_' + detailIndex + '"]');
            target.map(function(i,_el){
                var el = $(_el);
                var index = +el.attr("name").replace(/^detail_number_(?:\d+)_/,"");
                ret[index] = +el.val();
            });
            return ret;
        }
    };
});