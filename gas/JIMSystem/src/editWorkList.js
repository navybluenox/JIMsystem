$(function(){
    var pageFun;
    var form;
    var formNameList = [{"name":"name"},{"name":"nameShort"},{"name":"leaderId"},{"name":"leaderInchargeId"},{"name":"description"},{"name":"condition"},{"name":"caption"},{"name":"note"},{"name":"asAssigned"}];
    var editing;
    var detailTable;
    var detailNumberTableWidthLimit;
    _val.pageFun.editWorkList = {
        onload:function(){
            _val.server.loadData("incharge").then(() => {
                return Promise.all([
                    _val.server.loadData("user"),
                    _val.server.loadData("workList")
                ]);
            });
            pageFun = _val.pageFun.editWorkList;
            form = $("#formEditWorkList_edit");
            detailTable = form.find('table.workList_detail_table');
            //set events
            $(window).on("resize.detailNumberTableWidthLimit",function(e){
                dr_window.runLater(e);
            })
            var dr_window = new DelayRun(function(e){
                var sectionNum = +detailTable.find('[name="detail_sectionNum"]').val();
                var numberArray;
                detailNumberTableWidthLimit = $(window).width() * 0.4;
                for(var i=0,l=sectionNum;i<l;i++){
                    if(detailTable.find('[name="detail_remove_' + i + '"]').val() !== "done"){
                        pageFun.makeDetailNumberTable(i,pageFun.getDetailNumber(i));
                    }
                }
            });
            detailTable.on("click",'[name^="detail_addAllNumber"]',function(e){
                var trigger = $(e.currentTarget);
                var target = detailTable.find('[name^=detail_number_' + trigger.attr("name").replace(/^detail_addAllNumber_/,"") + ']');
                target.trigger("click");
            });
            detailTable.on("click",'[name^="detail_number"]',function(e){
                var trigger = $(e.currentTarget);
                var sign = detailTable.find('[name="detail_increment"]').val();
                var diff = +detailTable.find('[name="detail_increment_diff"]').val();
                if(sign === "up"){
                    trigger.val(+trigger.val() + diff);
                }else if(sign === "down" && trigger.val() > 0){
                    trigger.val(+trigger.val() - diff < 0 ? 0 : +trigger.val() - diff);
                }
                pageFun.changeButtonColor(trigger,trigger.val());
            });
            detailTable.on("change",'[name^="detail_interval"]',function(e){
                dr_interval.runLater(e);
            });
            var dr_interval = new DelayRun(function(e){
                var trigger = $(e.currentTarget);
                var detailIndex = +trigger.attr("name").replace(/^detail_interval_/,"");
                var numberArray = pageFun.getDetailNumber(detailIndex);
                if(+trigger.val() > numberArray.length){
                    while(numberArray.length !== +trigger.val()){
                        numberArray.push(1);
                    }
                }else if(+trigger.val() < numberArray.length){
                    numberArray.length = +trigger.val();
                }
                pageFun.makeDetailNumberTable(detailIndex,numberArray);
            });
            detailTable.on("change",'[name^="detail_start"]',function(e){
                dr_start.runLater(e);
            });
            var dr_start = new DelayRun(function(e){
                var trigger = $(e.currentTarget);
                var detailIndex = +trigger.attr("name").replace(/^detail_start_(?:day|hour|minute)_/,"");
                var numberArray = pageFun.getDetailNumber(detailIndex);
                var hour = detailTable.find('[name="detail_start_hour_' + detailIndex + '"]');
                var day = detailTable.find('[name="detail_start_day_' + detailIndex + '"]');
                var minute = detailTable.find('[name="detail_start_minute_' + detailIndex + '"]');
                LocalDate.increaseDigit(day,hour,minute);
                pageFun.makeDetailNumberTable(detailIndex,numberArray);
            });
            detailTable.on("click",'[name^="detail_remove"]',function(e){
                var trigger = $(e.currentTarget);
                var detailIndex = +trigger.attr("name").replace(/^detail_remove_/,"");
                var target = trigger.closest("tr");
                target.css({"display":"none"});
                trigger.val("done");
            });
        },onunload:function(){
            $(window).off("resize.detailNumberTableWidthLimit");
        },updateWorkList:function(kind,_id){
            var workList;
            var setValue = {};
            if(kind === "add" || kind === "change"){
                formNameList.forEach(function(obj){
                    var el = form.find('[name="' + obj.name + '"]');
                    var key = obj.key === undefined ? obj.name : obj.key;
                    if(obj.key === "asAssined"){
                        setValue[key] = (el.val() === "Yes");
                    }else{
                        setValue[key] = el.val();
                    }
                });
                setValue["@detail"] = [];
                var skip = detailTable.find('[name^="detail_remove"]').filter((i,el) => $(el).val() === "done").map(function(i,el){return +$(el).attr("name").replace(/^detail_remove_/,"")}).get();
                for(var i=0,l=+detailTable.find('[name="detail_sectionNum"]').val();i<l;i++){
                    if(!inArray(skip,i)){
                        setValue["@detail"].push({"start":pageFun.getDetailStart(i),"number":pageFun.getDetailNumber(i)});
                    }
                }
                setValue["@detail"] = setValue["@detail"].filter(function(v){return v !== undefined}).sort(function(a,b){return a.start.getTime() - b.start.getTime()});

                if(kind === "change"){
                    if(editing === undefined){
                        alert("値を変更する人割が指定されていません\n下の「検索」から変更したい人割を選択し、フォームへ入力してください");
                        return;
                    }
                    setValue._id = editing.getValue("_id");
                }
                workList = (new WorkList()).setValues(setValue);
                if(kind === "add"){
                    _val.server.addData(workList);
                }else{
                    _val.server.changeData(workList);
                }
            }else if(kind === "remove"){
                workList = _val.server.getDataById(_id,"workList")[0];
                _val.server.removeData(workList);
                if(confirm([
                    "この業務に割り振られている人割も全て消去しますか？"
                ].join("\n"))){
                    _val.server.removeData(_val.server.getData("workAssign").filter(workAssign => workAssign.getValue("workListId") === workList.getValue("_id")));
                }
            }
            _val.server.sendUpdateQueue().then(function(){
                pageFun.searchWorkList();
            });
        },searchWorkList:function(sortFun){
            var result = $("#formEditWorkList_search_result");
            var form_search = $("#formEditWorkList_search_cond");

            result.children().remove();
            result.append("<h3>検索結果</h3>");

            var cond = {};
            ["name","leader","incharge"].forEach(function(name){
                cond[name] = form_search.find('[name="' + name + '"]').val();
            })
            var workLists = _val.server.getData("workList",null,true).filter(function(workList){
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
                        if(user !== undefined){
                            var reg_leader = new RegExp(cond.leader); 
                            flag = flag && (
                                reg_leader.test(user.getValue("azusaSendName")) ||
                                reg_leader.test(user.getValue("nameLast") + user.getValue("nameFirst")) ||
                                reg_leader.test(user.getValue("nameLastPhonetic") + user.getValue("nameFirstPhonetic"))
                            );
                        }
                }
                return flag;
            });

            if(sortFun !== undefined && typeof sortFun === "function"){
                workLists =  sortFun(workLists);
            }

            var fun_fillForm = function(workList){
                formNameList.forEach(function(obj){
                    var el = form.find('[name="' + obj.name + '"]');
                    var key = obj.key === undefined ? obj.name : obj.key;
                    if(obj.key === "asAssined"){
                        el.val(workList.getValue(key) ? "Yes" : "No");
                    }else{
                        el.val(workList.getValue(key));
                    }
                });
                detailTable.find("tbody > tr").not(":last-child").remove();
                detailTable.find('[name="detail_sectionNum"]').val(0);
                workList.getValue("@detail").forEach(function(detailObj){
                    pageFun.addSection(detailObj);
                })
                form.find('[name="searchId"]').val(workList.getDatapieceRelated("leaderId","user").getValue("azusaSendName"));
            }

            var table = createTable(result,workLists,["edit","leaderIncharge","leaderId","name","caption"],function(cellObj){
                var workList = cellObj.rowData;
                if(cellObj.column === "edit"){
                    var buttons = $('<input type="button" value="フォームに入力"><input type="button" value="削除">').appendTo(cellObj.el);
                    buttons.eq(0).on("click",function(e){fun_fillForm(workList);editing = workList;});
                    buttons.eq(1).on("click",function(e){pageFun.updateWorkList("remove",workList.getValue("_id"));});
                }else{
                    var str;
                    switch(cellObj.column){
                        case "leaderIncharge":
                            str = workList.getDatapieceRelated("leaderInchargeId","incharge").getValue("code");
                        case "name":
                        case "caption":
                            str = workList.getValue(cellObj.column);
                            break;
                        case "leaderId":
                            var user = _val.server.getDataById(workList.getValue("leaderId"),"user")[0];
                            str = user === undefined ? "" : user.getValue("azusaSendName");
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
                target.val(
                    users.findIndex(user => user.getValue("azusaSendName") === value) === -1 ?
                    users.map(function(user){return user.getValue("_id") + "(" + user.getValue("azusaSendName") + ")"}).join(",") :
                    users[0].getValue("_id")
                );
            }
            pageFun.searchInchrageByUserId();
            pageFun.setInchrage();
        },searchInchrageByUserId:function(){
            var target = form.find('[name="searchIncharge"]');
            var value = form.find('[name="leaderId"]').val();
            var user = _val.server.getDataById(value,"user")[0];
            if(user === undefined) return;
            target.children().remove();
            target.append(
                user.getIncharge().map(function(incharge){return '<option value="' + incharge.getValue("_id") + '">'+ incharge.getValue("code") + "</option>"}).join("")
            );
            target.prop("selectedIndex",0);
        },setInchrage:function(){
            var target = form.find('[name="leaderInchargeId"]');
            var value = form.find('[name="searchIncharge"]').val();
            target.val(value);
        },makeDetailNumberTable:function(detailIndex,numberArray){
            var targetTable = detailTable.find('[name="detail_interval_' + detailIndex + '"]').closest("tr").find("table");
            var tr1 = targetTable.find("tbody > tr").eq(0);
            var tr2 = targetTable.find("tbody > tr").eq(1);
            var startTime = pageFun.getDetailStart(detailIndex);
            var unitNum = numberArray.length;

            tr1.children().remove();
            tr2.children().remove();
            tr1.append(repeatString("<td></td>",unitNum));
            tr2.append(repeatString("<td></td>",unitNum));

            (function(){
                var a = numberArray.slice();
                var num,td1,td2,time,numIndex;
                while((num = a.pop()) !== undefined){
                    numIndex = a.length;
                    td1 = tr1.children().eq(numIndex);
                    td2 = tr2.children().eq(numIndex);
                    time = startTime.copy().addTimeUnit(numIndex);
                    if(time.getMinutes() === 0 || numIndex === 0){
                        td1.text(time.getDifferentialHours(startTime.getDays()) + "時");
                    }else{
                        td1.remove();
                    }
                    pageFun.changeButtonColor(
                        $('<input type="button" name="detail_number_' + detailIndex + '_' + numIndex + '" value="'+ num +'">').appendTo(td2),
                        num
                    );
                }
            })();

            var td1s = tr1.children();
            var td2s = tr2.children();
            var spanInterval = detailTable.find('[name="detail_interval_' + detailIndex + '"]').siblings("span");
            var spanEnd = detailTable.find('[name="detail_start_day_' + detailIndex + '"]').siblings("span");
            var timeUnitsPerHour = 60/LocalDate.getTimeUnitAsConverted("minute");
            var endTime = startTime.copy().addTimeUnit(unitNum);

            td1s.attr("colspan",timeUnitsPerHour);
            td1s.first().attr("colspan",timeUnitsPerHour*(60 - startTime.getMinutes())/60);
            if(endTime.getMinutes() !== 0){
                td1s.last().attr("colspan",timeUnitsPerHour*endTime.getMinutes()/60);
            }
            spanInterval.text([
                unitNum < timeUnitsPerHour ? "" : "" + (unitNum - unitNum%timeUnitsPerHour)/timeUnitsPerHour + "時間",
                unitNum%timeUnitsPerHour === 0 ? "" : "" + ((unitNum%timeUnitsPerHour) * LocalDate.getTimeUnitAsConverted("minute")) + "分"
            ].join(""));
            spanEnd.text("終了時間：" + endTime.getDifferentialHours(startTime) + "時" + endTime.getMinutes() + "分");

            targetTable.closest("td").css({"width":detailNumberTableWidthLimit + "px"});
            targetTable.css({"border":"1px #000000 solid","border-collapse":"collapse"});
            targetTable.find("td").css({"padding":"0","border":"1px #000000 solid"});
            td1s.css({"text-align":"left"});
            td1s.filter(":nth-child(2n)").css({"background":"#7FFFD4"});
            td1s.filter(":nth-child(2n+1)").css({"background":"#66CDAA"});
            td2s.find('[name^="detail_number"]').css({"padding":"0 0.6em","min-width":"initial"});
            td2s.css({"border-left-style":"dashed","border-right-style":"dashed"});
            td2s.filter(":nth-child(" + timeUnitsPerHour + "n)").css({"border-right-style":"solid"});
            td2s.filter(":first").css({"border-left-style":"solid"});

        },addSection:function(detailObj){
            if(detailObj === undefined)  detailObj = {"start":new LocalDate(),"number":[]};
            var targetRow = detailTable.find('[name="detail_addSection"]').closest("tr");
            var detailNum = detailTable.children("tbody").children("tr").length - 1;
            var tr = $("<tr><td>" + [
                '<input type="button" name="detail_remove_' + detailNum + '" value="remove">',
                '<input type="button" name="detail_addAllNumber_' + detailNum + '" value="all">',[
                    [
                        '<input type="number" name="detail_start_day_' + detailNum + '" value="' + detailObj.start.getDays() + '" max="' + _val.config.getWorkEndDay() + '" min="' + _val.config.getWorkStartDay() + '">日目',
                        '<input type="number" name="detail_start_hour_' + detailNum + '" value="' + detailObj.start.getHours() + '" max="24" min="-1">時',
                        '<input type="number" name="detail_start_minute_' + detailNum + '" value="' + detailObj.start.getMinutes() + '" max="60" min="-' + LocalDate.getTimeUnitAsConverted("minute") + '" step="' + LocalDate.getTimeUnitAsConverted("minute") +'">分'
                    ].join(""),
                    '<span></span>'
                ].join("\n"),[
                    '<input type="number" name="detail_interval_' + detailNum + '" value="' + detailObj.number.length + '" min="0">×' + LocalDate.getTimeUnitAsConverted("minute") + '分間',
                    '<span></span>'
                ].join("\n"),
                '<table><tbody><tr></tr><tr></tr></tbody></table>'
            ].join("</td><td>") + "</td></tr>").insertBefore(targetRow);

            if(detailNumberTableWidthLimit === undefined){
                detailNumberTableWidthLimit = $(window).width() * 0.4;
            }
            tr.find("td").css({"padding":0,"text-align":"center"});
            tr.find("table").closest("td").css({"display":"inline-block","overflow":"auto"});
            tr.find('[type="button"]').css({"min-width":"initial"});
            tr.find('[name^="detail_addAllNumber"]').css({"padding":"0 1em"});
            tr.find('[name^="detail_start"]').css({"width":"3em"}).closest("td").css({"white-space":"pre"});
            tr.find('[name^="detail_number"]').css({"width":"3em"});
            tr.find('[name^="detail_interval"]').css({"width":"3em"}).closest("td").css({"white-space":"pre"});

            pageFun.makeDetailNumberTable(detailNum,detailObj.number);
            detailTable.find('[name="detail_sectionNum"]').val(+detailTable.find('[name="detail_sectionNum"]').val() + 1);

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
        },changeButtonColor:function(el,num){
            $(el).css({"background":WorkList.getBackgroundColorByNumber(num),"color":"#000000","text-decoration": num%5 === 0 ? "underline" : ""});
        }
    };
});