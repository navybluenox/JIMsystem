$(function(){
    var pageFun;
    var editing;
    var form;
    var formNameList = [{"name":"workListId"},{"name":"userId"},{"name":"start"},{"name":"interval"},{"name":"notice"},{"name":"note"},{"name":"disabled"}];
    _val.pageFun.assignWork = {
        onload:function(){
            _val.server.loadData("user");
            _val.server.loadData("workList");
            _val.server.loadData("workAssign");
            _val.server.loadData("userGroup");
            _val.server.loadData("workGroup");
            form = $("#formAssignWork_edit");
            pageFun = _val.pageFun.assignWork;
            editing = new WorkAssign();
            editing.addEventListener("change",function(e){
                form.find('[name="editing"]').val(e.target.getValue("_id"));
            });

            form.find('[name="workListId_azusa"],[name="workListId_name"]').on("keyup focus",function(e){
                pageFun.searchWorkListId("workListId");
            });
            form.find('[name="userId_azusa"]').on("keyup focus",function(e){
                pageFun.searchUserId("userId");
            });
            form.find('[name="shiftTableWork_azusa"],[name="shiftTableWork_name"]').on("keyup focus",function(e){
                pageFun.searchWorkListId("shiftTableWork");
            });
            form.find('[name="shiftTableUser_azusa"]').on("keyup focus",function(e){
                pageFun.searchUserId("shiftTableUser");
            });
            (function(){
                var startDay = LocalDate.getWorkStartDay();
                var endDay = LocalDate.getWorkEndDay();
                var option,start,end;
                for(var day=startDay;day<=endDay;day++){
                    option = $("<option></option>");
                    start = LocalDate.getWorkTime(day,"start");
                    end = LocalDate.getWorkTime(day,"end");
                    option.text("" + day + "日目 " + start.toString({"hideDay":true,"userDiffHours":day}) + "から" + end.toString({"hideDay":true,"userDiffHours":day}) + "まで").val(day);

                    form.find('[name="shiftTableUser_day"]').append(option);
                }
            })();
            form.find('[name="shiftTableUser_day"]').on("change",function(e){
                pageFun.showShiftTableUser();
            });
            form.find('[name="start_day"],[name="end_day"]').attr({"min":_val.config.getWorkStartDay(),"max":_val.config.getWorkEndDay()});
            form.find('[name="start_minute"],[name="end_minute"]').attr({"min":-LocalDate.getTimeUnitAsConverted("minute"),"step":LocalDate.getTimeUnitAsConverted("minute")})
            form.find('[name="start_day"],[name="start_hour"],[name="start_minute"],[name="end_day"],[name="end_hour"],[name="end_minute"]').on("change",function(e){
                var kind = $(e.currentTarget).attr("name").replace(/^(start|end)_(?:day|hour|minute)$/,"$1");
                LocalDate.increaseDigit(form.find('[name="' + kind + '_day"]'),form.find('[name="' + kind + '_hour"]'),form.find('[name="' + kind + '_minute"]'));
                var start = new LocalDate({"day":+form.find('[name="start_day"]').val(),"hour":+form.find('[name="start_hour"]').val(),"minute":+form.find('[name="start_minute"]').val()});
                var end = new LocalDate({"day":+form.find('[name="end_day"]').val(),"hour":+form.find('[name="end_hour"]').val(),"minute":+form.find('[name="end_minute"]').val()});
                if(start.getTime() >= end.getTime()){
                    form.find('[name="interval"]').val(1);
                    end = start.copy().addTimeUnit(+form.find('[name="interval"]').val());
                    form.find('[name="end_day"]').val(end.getDays());
                    form.find('[name="end_hour"]').val(end.getHours());
                    form.find('[name="end_minute"]').val(end.getMinutes());
                }else{
                    form.find('[name="interval"]').val(start.getDiff(end,"timeunit"));
                }
                form.find('[name="shiftTableUser_day"]').val(start.getDays());
            });

            form.find('[name="interval"]').siblings("span").eq(0).text(LocalDate.getTimeUnitAsConverted("minute"));
            form.find('[name="interval"]').on("change",function(e){
                var minute = +$(e.currentTarget).val() * LocalDate.getTimeUnitAsConverted("minute");
                form.find('[name="interval"]').siblings("span").eq(1).text([
                    minute < 60 ? "" : "" + (minute - minute%60)/60 + "時間",
                    minute === 0 ? "" : "" + minute%60 + "分"
                ].join(""));
                var end = (new LocalDate({"day":+form.find('[name="start_day"]').val(),"hour":+form.find('[name="start_hour"]').val(),"minute":+form.find('[name="start_minute"]').val()})).addTimeUnit(+form.find('[name="interval"]').val());
                form.find('[name="end_day"]').val(end.getDays());
                form.find('[name="end_hour"]').val(end.getHours());
                form.find('[name="end_minute"]').val(end.getMinutes());
            });
            form.find('[name="memberOrder_useWorkGroup"]').on("click",function(e){
                var button = $(e.currentTarget);
                var target = $('[name="memberOrder"]');

                if(button.val()==="Yes"){
                    button.val("No");
                    target.attr("tabindex","2").prop("disabled",false).css("background","");
                }else{
                    button.val("Yes");
                    target.attr("tabindex","-1").prop("disabled",true).css("background","#E0E0E0");
                    pageFun.setMemberOrder();
                }
            });

            form.on("change",'input[type="button"],input[type="text"],input[type="checkbox"],input[type="number"],select',function(e){
                pageFun.getFormData();
                pageFun.showShiftTableUser();
                form.find(".extra").focus();
            });

            form.find('[name="shiftTableUser"]').siblings("div").on({"mouseenter":function(e){
                var target = $(e.currentTarget);
                var wrapper = $("<div></div>").css({"background":"#FFC21A","opacity":"0.5","z-index":"1"});
                target.children("span").wrap(wrapper);
            },"mouseleave":function(e){
                var target = $(e.currentTarget);
                if(target.children("div:not(.freezeOverlay)").length > 0){
                    target.find("div span").unwrap();
                }
            }},"td.shiftTableContent");

            form.find('[name="shiftTableUser"]').siblings("div").on("click","td.shiftTableContent",function(e){
                var target = $(e.currentTarget);
                var div = form.find('[name="shiftTableUser"]').siblings("div");
                var start,end;
                if(div.find("td.selectedCell").length === 1 && div.find("td.selectedCell").data("workIndex") === target.data("workIndex")){
                    //二回目のクリックで範囲選択
                    var targetAnother = div.find("td.selectedCell");
                    div.find("td.shiftTableContent").filter(function(index,_el){
                        var el = $(_el);
                        return (
                            el.data("workIndex") === target.data("workIndex") &&
                            !el.hasClass("selectedCell") &&
                            (el.data("start") - target.data("start"))*(el.data("start") - targetAnother.data("start")) <= 0
                        );
                    }).map(function(index,_el){
                        var el = $(_el);
                        var wrapper = $("<div></div>").css({"background":"#FFC21A","opacity":"0.5","z-index":"1"});
                        el.children("span").wrap(wrapper);
                        el.addClass("selectedCell");
                    });
                    div.find("td.selectedCell").children("div").addClass("freezeOverlay");
                }else{
                    //それ以外のクリックで1つ目のセルを選択
                    div.find("td.selectedCell").removeClass("selectedCell").find("div span").unwrap();

                    var target = $(e.currentTarget);
                    if(target.children("div").length === 1){
                        target.children("div").addClass("freezeOverlay");
                    }else{
                        var wrapper = $("<div></div>").css({"background":"#FFC21A","opacity":"0.5","z-index":"1"}).addClass("freezeOverlay");
                        target.children("span").wrap(wrapper);
                    }
                    target.addClass("selectedCell");

                    //TODO　いずれは右クリックメニューに移す
                    start = new LocalDate(target.data("start"));
                    end = new LocalDate({"day":form.find('[name="end_day"]').val(),"hour":form.find('[name="end_hour"]').val(),"minute":form.find('[name="end_minute"]').val()});
                    form.find('[name="start_day"]').val(start.getDays());
                    form.find('[name="start_hour"]').val(start.getHours());
                    form.find('[name="start_minute"]').val(start.getMinutes());
                    if(start.getDiff(end,"timeunit") <= 0){
                        end = start.copy().addTimeUnit(1);
                        form.find('[name="end_day"]').val(end.getDays());
                        form.find('[name="end_hour"]').val(end.getHours());
                        form.find('[name="end_minute"]').val(end.getMinutes());
                        form.find('[name="interval"]').val(1);
                    }else{
                        form.find('[name="interval"]').val(start.getDiff(end,"timeunit"));
                    }
                }
            });

            form.find('[name="shiftTableUser"]').siblings("div").on("contextmenu","td.selectedCell",function(e){
                var div = form.find('[name="shiftTableUser"]').siblings("div");
                var tds = div.find("td.selectedCell");
                var pointerX = e.screenX;
                var pointerY = e.screenY;

                var mw = new ModalWindow({"html":[
                    '<table><tbody>',
                    '<tr><div class="list">この時間に設定</div></tr>',
                    '<tr><div class="list">この時間に担当できる委員を表示</div></tr>',
                    '<tr><div class="list">この時間の未割り振り業務を表示</div></tr>',
                    '<tr><div class="list">この人割を編集</div></tr>',
                    '<tr><div class="list">この人割を削除</div></tr>',
                    '</tbody></table>'
                ].join(""),"callback":function(div,background,that){
                    background.css({"background":"#FFFFFF","opacity":"0"});
                    div.css({"border":"1px solid #000000"}).find().css({"padding":0,"margin":0});
                    div.find("div.list").css({
                        "text-align":"center",
                        "padding":"1ex 1.5em",
                        "background":"#FFFFFF",
                    });
                    div.on({"mouseenter":function(e){
                        $(e.currentTarget).css({"background":"#44AEEA"});
                    },"mouseleave":function(e){
                        $(e.currentTarget).css({"background":"#FFFFFF"});
                    }},"div.list")
                }});
                mw.setPosition(function(that){
                    var el = that.$el;
                    el.css({
                        "left":pointerX + "px",
                        "top":pointerY + "px"
                    })
                }).setBackgroundStyle({"background":"#FFFFFF","opacity":0});
                mw.keepPosition();
                
                return false;
            });


            form.find('[name="interval"]').trigger("change");
            form.find('[name="memberOrder_useWorkGroup"]').trigger("click").trigger("click");
        },onunload:function(){
        },updateWorkAssign:function(kind,_id){
            var setValue = {};
            if(kind === "add"){
                editing = pageFun.getFormData().copy(true);
                _val.server.addData(editing);
            }else if(kind === "change"){
                if(editing.getValue("_id") === undefined || editing.getValue("_id") === ""){
                    alert("値を変更する人割が指定されていません\n下の「検索」から変更したい人割を選択し、フォームへ入力してください");
                    return;
                }
                pageFun.getFormData();
                _val.server.changeData(editing);
            }
            if(kind === "add" || kind === "change"){
                if(kind === "change"){
                }
                if(kind === "add"){
                }else{
                }
            }else if(kind === "remove"){
                _val.server.removeData(new WorkAssign({"_id":_id}));
            }
            _val.server.sendUpdateQueue().then(function(){
                pageFun.searchWorkAssign();
                //TODO
                console.log("editing",editing);
            });
        },searchWorkAssign:function(sortFun){
            var result = $("#formAssignWork_search_result");
            var form_search = $("#formAssignWork_search_cond");

            result.children().remove();
            result.append("<h3>検索結果</h3>");

            var cond = {};
            ["name","user","leader","incharge"].forEach(function(name){
                cond[name] = form_search.find('[name="' + name + '"]').val();
            })
            var workAssigns = _val.server.getData("workAssign").filter(function(workAssign){
                var flag = true;
                if(cond.name !== ""){
                    var workList = workAssign.getDatapieceRelated("workListId","workList");
                    var reg_name = new RegExp(cond.name);
                    flag = flag && (reg_name.test(workList.getValue("name")) || reg_name.test(workList.getValue("nameShort")))
                }
                if(cond.user !== ""){
                    var user = workAssign.getDatapieceRelated("userId","user");
                    var reg_leader = new RegExp(cond.leader); 
                    flag = flag && (
                        reg_leader.test(user.getValue("azusaSendName")) ||
                        reg_leader.test(user.getValue("nameLast") + user.getValue("nameFirst")) ||
                        reg_leader.test(user.getValue("nameLastPhonetic") + user.getValue("nameFirstPhonetic"))
                    );
                }
                if(cond.leader !== ""){
                    var leader = workAssign.getDatapieceRelated("workListId","workList").getDatapieceRelated("leaderId","user");
                    var reg_leader = new RegExp(cond.leader); 
                    flag = flag && (
                        reg_leader.test(leader.getValue("azusaSendName")) ||
                        reg_leader.test(leader.getValue("nameLast") + leader.getValue("nameFirst")) ||
                        reg_leader.test(leader.getValue("nameLastPhonetic") + leader.getValue("nameFirstPhonetic"))
                    );
                }
                if(cond.incharge !== ""){
                    flag = flag && (new RegExp(cond.incharge)).test(workAssign.getDatapieceRelated("workListId","workList").getValue("leaderIncharge"));
                }
                return flag;
            });

            if(sortFun !== undefined && typeof sortFun === "function"){
                workAssigns =  sortFun(workAssigns);
            }else{
                workAssigns.sort(function(a,b){
                    var aSortId = a.getDatapieceRelated("userId","user").getValue("sortId");
                    var bSortId = a.getDatapieceRelated("userId","user").getValue("sortId");
                    if(aSortId === bSortId){
                        return a.getValue("start").getTime() - b.getValue("start").getTime();
                    }else{
                        return aSortId - bSortId;
                    }
                });
            }

            var fun_fillForm = function(workAssign,copy){
                formNameList.forEach(function(obj){
                    var el = form.find('[name="' + obj.name + '"]');
                    var key = obj.key === undefined ? obj.name : obj.key;
                    if(key === "disabled"){
                        el.val(workAssign.getValue(key) ? "Yes" : "No");
                    }else if(key === "start"){
                        var start = workAssign.getValue("start");
                        form.find('[name="start_day"]').val(start.getDays());
                        form.find('[name="start_hour"]').val(start.getHours());
                        form.find('[name="start_minute"]').val(start.getMinutes());
                    }else{
                        el.val(workAssign.getValue(key));
                    }
                });
                editing = workAssign.copy().addEventListener(editing.getEventListener());
                if(copy){
                    editing.setValue("_id","");
                }
                editing.triggerEvent("change");
                form.find('[name="shiftTableUser_day"]').val(workAssign.getValue("start").getDays());
                form.find('[name="workListId_name"],[name="shiftTableWork_name"]').val(workAssign.getDatapieceRelated("workListId","workList").getValue("name"));
                form.find('[name="userId_azusa"],[name="shiftTableUser_azusa"]').val(workAssign.getDatapieceRelated("userId","user").getValue("azusaSendName"));
                form.find('[name="workListId_name"],[name="shiftTableWork_name"],[name="userId_azusa"],[name="shiftTableUser_azusa"]').trigger("keyup");
                form.find('[name="shiftTableUser_searchResult"]').val(workAssign.getValue("userId"));
                form.find('[name="shiftTableWork_searchResult"]').val(workAssign.getValue("workListId"));
                form.find('[name="interval"]').trigger("change");
                form.find('[name="shiftTableUser_searchResult"],[name="shiftTableWork_searchResult"]').trigger("change");
            }

            var table = createTable(result,workAssigns,["edit","workList","user","time","notice"],function(cellObj){
                var workAssign = cellObj.rowData;
                if(cellObj.column === "edit"){
                    var buttons = $('<input type="button" value="これを編集"><input type="button" value="コピーして編集"><input type="button" value="削除">').appendTo(cellObj.el);
                    buttons.eq(0).on("click",function(e){fun_fillForm(workAssign,false);});
                    buttons.eq(1).on("click",function(e){fun_fillForm(workAssign,true);});
                    buttons.eq(2).on("click",function(e){pageFun.updateWorkAssign("remove",workAssign.getValue("_id"));});
                }else{
                    var str;
                    switch(cellObj.column){
                        case "workList":
                            str = workAssign.getDatapieceRelated("workListId","workList").getValue("name");
                            break;
                        case "user":
                            var user = workAssign.getDatapieceRelated("userId","user");
                            str = user.getValue("nameLast") + " " + user.getValue("nameFirst");
                            break;
                        case "time":
                            str = workAssign.getValue("start").toString() + "から" + workAssign.getValue("start").copy().addTimeUnit(workAssign.getValue("interval")).toString({hideDay:true}) + "まで";
                            break;
                        case "notice":
                            str = workAssign.getValue(cellObj.column);
                            break;
                    }
                    cellObj.el.text(str);
                }
            },{"header":["edit","人割名","従事者氏名","時間","注意事項"]});
            table.el.css({"margin":"3em"});
        },searchWorkListId:function(namePrefix){
            var workLists = _val.server.getData("workList",null,true);
            var result = form.find('[name="' + namePrefix + '_searchResult"]');
            var azusa = form.find('[name="' + namePrefix + '_azusa"]').val();
            var name = form.find('[name="' + namePrefix + '_name"]').val();
            result.children().remove();
            if(azusa !== ""){
                workLists = workLists.filter(function(workList){
                    var user = workList.getDatapieceRelated("leaderId","user");
                    return (new RegExp(azusa)).test(user.getValue("azusaSendName"));
                })
            }
            if(name !== ""){
                workLists = workLists.filter(function(workList){
                    var reg = new RegExp(name);
                    return reg.test(workList.getValue("name")) || reg.test(workList.getValue("nameShort"));
                })
            }
            var incharges = workLists.map(function(workList){return workList.getValue("leaderIncharge")}).filter(function(v,i,s){return i === s.indexOf(v)}).sort(function(a,b){return a.charCodeAt() - b.charCodeAt()});
            result.append(incharges.map(function(incharge){
                var _workLists = workLists.filter(function(workList){return workList.getValue("leaderIncharge") === incharge});
                _workLists = Datapiece.sort(_workLists,["nameShort"]);
                return [
                    '<optgroup label="' + incharge + '">',
                    _workLists.map(function(workList){
                        return '<option value="' + workList.getValue("_id") + '">' + workList.getValue("nameShort") + '</option>'
                    }).join(""),
                    '</optgroup>'
                ].join("")
            }));
            pageFun.setWorkListId(namePrefix);
        },setWorkListId:function(namePrefix){
            var id = form.find('[name="' + namePrefix + '_searchResult"]').val();
            var target = form.find('[name="' + namePrefix + '"]');
            target.val(id);
            pageFun.setMemberOrder();
        },searchUserId:function(namePrefix){
            var users = _val.server.getData("user");
            var result = form.find('[name="' + namePrefix + '_searchResult"]');
            var azusa = form.find('[name="' + namePrefix + '_azusa"]').val();
            result.children().remove()
            if(azusa !== ""){
                users = users.filter(function(user){
                    return (new RegExp(azusa)).test(user.getValue("azusaSendName"));
                });
            }
            users = Datapiece.sort(users,"sortId");
            result.append(users.map(function(user){
                return '<option value="' + user.getValue("_id") +  '">' + user.getValue("nameLast") + " " + user.getValue("nameFirst") + '</option>';
            }).join(""));
            pageFun.setUserId(namePrefix);
        },setUserId:function(namePrefix){
            var id = form.find('[name="' + namePrefix + '_searchResult"]').val();
            var target = form.find('[name="' + namePrefix + '"]');
            target.val(id);
            pageFun.setMemberOrder();
        },showShiftTableUser:function(){
            var target = form.find('[name="shiftTableUser"]').siblings("div");
            var user = _val.server.getDataById(form.find('[name="shiftTableUser_searchResult"]').val(),"user")[0];            
            if(user === undefined)  return;
            var day = +form.find('[name="shiftTableUser_day"]').val();
            var start = LocalDate.getWorkTime(day,"start");
            var end = LocalDate.getWorkTime(day,"end");
            pageFun.getFormData();

            var table = user.getShiftTableAsElement(start,end,{"mode":"table","extraWorkAssign":(form.find('[name="shiftTableUser_showFormWA"]').val()==="Yes" ? [editing] : [])});

            target.children().remove();
            target.append(table);
            var width = $(window).width()*0.5;
            target.css({"max-width":width,"overflow":"auto"})
        },setMemberOrder:function(){
            var workListId = form.find('[name="workListId"]').val();
            var userId = form.find('[name="userId"]').val();
            var userGroup = _val.server.getData("userGroup").find(function(userGroup){
                return (
                    userGroup.getValue("memberOrderWorkListId") === workListId &&
                    inArray(userGroup.getValue("member"),userId)
                );
            });
            $('[name="memberOrder"]').val(userGroup === undefined ? 0 : userGroup.getValue("memberOrderNumber"));
        },getFormData:function(){
            var setValue = {};
            formNameList.forEach(function(obj){
                var el = form.find('[name="' + obj.name + '"]');
                var key = obj.key === undefined ? obj.name : obj.key;
                if(key === "disabled"){
                    setValue[key] = (el.val() === "Yes");
                }else if(key === "start"){
                    setValue[key] = new LocalDate({"day":form.find('[name="start_day"]').val(),"hour":form.find('[name="start_hour"]').val(),"minute":form.find('[name="start_minute"]').val()});
                }else{
                    setValue[key] = el.val();
                }
            });
            editing.setValues(setValue);
            return editing;
        }
    };
});