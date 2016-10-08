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
                if(sign === "up"){
                    trigger.val(+trigger.val() + 1);
                }else if(sign === "down" && trigger.val() > 1){
                    trigger.val(+trigger.val() - 1);
                }
                _val.pageFun.editWorkList.changeButtonColor(trigger,trigger.val());
            });
            detailTable.on("change",'[name^="detail_interval"]',function(e){
                var trigger = $(e.currentTarget);
                var detailIndex = +trigger.attr("name").replace(/^detail_interval_/,"");
                var numberArray = that.getDetailNumber(detailIndex);
                if(+trigger.val() > numberArray.length){
                    while(numberArray.length !== +trigger.val()){
                        numberArray.push(1);
                    }
                }else if(+trigger.val() < numberArray.length){
                    numberArray.length = +trigger.val();
                }
                that.makeDetailNumberTable(detailIndex,numberArray);
            });            
            detailTable.on("change",'[name^="detail_start"]',function(e){
                var trigger = $(e.currentTarget);
                var detailIndex = +trigger.attr("name").replace(/^detail_start_(?:day|hour|minute)_/,"");
                var numberArray = that.getDetailNumber(detailIndex);
                that.makeDetailNumberTable(detailIndex,numberArray);
            });
            detailTable.on("click",'[name^="detail_remove"]',function(e){
                var trigger = $(e.currentTarget);
                var detailIndex = +trigger.attr("name").replace(/^detail_remove_/,"");
                var target = trigger.closest("tr");
                target.css({"display":"none"});
                trigger.val("done");
            });
            detailTable.on("change",'[name^="detail_start_hour"]',function(e){
                var trigger = $(e.currentTarget);
                if(+trigger.val() !== -1 && +trigger.val() !== 24)  return;
                var detailIndex = +trigger.attr("name").replace(/^detail_start_hour_/,"");
                var day = detailTable.find('[name="detail_start_day_' + detailIndex + '"]');
                if(+trigger.val() === -1){
                    if(+day.val() === _val.config.getWorkStartDay()){
                        trigger.val(0);
                    }else{
                        day.val(+day.val()-1);
                        trigger.val(23);
                    }
                }else{
                    if(+day.val() === _val.config.getWorkEndDay()){
                        trigger.val(23);
                    }else{
                        day.val(+day.val()+1);
                        trigger.val(0);
                    }
                }
            });
            detailTable.on("change",'[name^="detail_start_minute"]',function(e){
                var trigger = $(e.currentTarget);
                var unit = LocalDate.getTimeUnitAsConverted("minute");
                if(+trigger.val() !== -unit && +trigger.val() !== 60)  return;
                var detailIndex = +trigger.attr("name").replace(/^detail_start_minute_/,"");
                var hour = detailTable.find('[name="detail_start_hour_' + detailIndex + '"]');
                var day = detailTable.find('[name="detail_start_day_' + detailIndex + '"]');
                if(+trigger.val() === -unit){
                    if(+day.val() === _val.config.getWorkStartDay() && +hour.val() <= 0){
                        trigger.val(0);                        
                    }else{
                        hour.val(+hour.val()-1);
                        trigger.val(60-unit);
                    }
                }else{
                    if(+day.val() === _val.config.getWorkEndDay() && +hour.val() >= 23){
                        trigger.val(60-unit);
                    }else{
                        hour.val(+hour.val()+1);
                        trigger.val(0);
                    }
                }
                hour.trigger("change");
            });
        },updateWorkList:function(kind,_id){
            var workList;
            var setValue = {};
            if(kind === "add" || kind === "change"){
                formNameList.forEach(function(obj){
                    var el = form.find('[name="' + obj.name + '"]');
                    var key = obj.key === undefined ? obj.name : obj.key;
                    if(obj.key === "asAssined"){
                        setValue[key] = el.prop("checked");
                    }else{
                        setValue[key] = el.val();
                    }
                })
                setValue["@detail"] = [];
                var skip = detailTable.find('[name="detail_remove"]').filter('[val="done"]').map(function(i,el){return +$(el).attr("name").replace(/^detail_remove_/,"")}).get();
                for(var i=0,l=+detailTable.find('[name="detail_sectionNum"]').val();i<l;i++){
                    if(!inArray(skip,i)){
                        setValue["@detail"][i] = {"start":_val.pageFun.editWorkList.getDetailStart(i),"number":_val.pageFun.editWorkList.getDetailNumber(i)};
                    }
                }
                setValue["@detail"] = setValue["@detail"].filter(function(v){return v !== undefined});

                if(kind === "change"){
                    if(workListEditing === undefined){
                        alert("値を変更する人割が指定されていません\n下の「検索」から変更したい人割を選択し、フォームへ入力してください");
                        return;
                    }
                    setValue._id = workListEditing.getValue("_id");
                }
                workList = (new WorkList()).setValues(setValue);
                if(kind === "add"){
                    _val.server.addData(workList);
                }else{
                    _val.server.changeData(workList);
                }
            }else if(kind === "remove"){
                workList = new WorkList({"_id":_id});
                _val.server.removeData(workList);
            }
            _val.server.sendUpdateQueue().then(function(){
                _val.pageFun.editWorkList.searchWorkList();
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
                detailTable.find("tbody > tr").not(":last-child").remove();
                detailTable.find('[name="detail_sectionNum"]').val(0);
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
            var targetTable = detailTable.find('[name="detail_interval_' + detailIndex + '"]').closest("table");
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
                    td1 = tr1.children().eq(numIndex+1);
                    td2 = tr2.children().eq(numIndex);
                    time = startTime.copy().addTimeUnit(numIndex);
                    if(time.getMinutes() === 0 || numIndex === 0){
                        td1.text(time.getDifferentialHours(startTime.getDays()) + "時");
                    }else{
                        td1.remove();
                    }
                    _val.pageFun.editWorkList.changeButtonColor(
                        $('<input type="button" name="detail_number_' + detailIndex + '_' + numIndex + '" value="'+ num +'">').appendTo(td2),
                        num
                    );
                }
            })();

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
                '<input type="button" name="detail_remove_' + detailNum + '" value="remove">',
                '<input type="button" name="detail_addAllNumber_' + detailNum + '" value="all">',[
                    '<input type="number" name="detail_start_day_' + detailNum + '" value="' + detailObj.start.getDays() + '" max="' + _val.config.getWorkEndDay() + '" min="' + _val.config.getWorkStartDay() + '">日目',
                    '<input type="number" name="detail_start_hour_' + detailNum + '" value="' + detailObj.start.getHours() + '" max="24" min="-1">時',
                    '<input type="number" name="detail_start_minute_' + detailNum + '" value="' + detailObj.start.getMinutes() + '" max="60" min="-' + LocalDate.getTimeUnitAsConverted("minute") + '" step="' + LocalDate.getTimeUnitAsConverted("minute") +'">分'
                ].join(""),[
                    '<table><tbody><tr><td rowspan="2">',
                        '<input type="number" name="detail_interval_' + detailNum + '" value="' + detailObj.number.length + '" min="0">×' + LocalDate.getTimeUnitAsConverted("minute") + '分間',
                    '</td></tr><tr></tr></tbody></table>',
                ].join("")
            ].join("</td><td>") + "</td></tr>").insertBefore(targetRow);

            tr.find("td").css({"padding":0,"text-align":"center"});
            tr.find('[type="button"]').css({"min-width":"initial"});
            tr.find('[name^="detail_addAllNumber"]').css({"padding":"0 1em"});
            tr.find('[name^="detail_start"]').css({"width":"3em"}).closest("td").css({"white-space":"nowrap"});
            tr.find('[name^="detail_number"]').css({"width":"3em"}).closest("td").closest("td").css({"display":"inline-block","over-flow":"auto","width":detailTable.width() + "px"});
            tr.find('[name^="detail_interval"]').css({"width":"3em"}).closest("td").css({"white-space":"nowrap"});

            _val.pageFun.editWorkList.makeDetailNumberTable(detailNum,detailObj.number);
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
        },changeButtonColor:function(el,_num){
            var hue = [200,140,60,30];
            var lightness = [90,80,70,60,50];
            var num = (_num > 20 ? 20 : _num) - 1;
            var backgroundColor = "hsl(" + hue[(num-num%5)/5] + ", 100%, " + lightness[num%5] + "%)";
            var fontColor = "#000000";
            $(el).css({"background":backgroundColor,"color":fontColor,"text-decoration": _num%5 === 0 ? "underline" : ""});
        }
    };
});