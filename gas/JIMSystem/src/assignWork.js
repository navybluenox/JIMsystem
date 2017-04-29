$(function(){
    var pageFun;
    var editing;
    var form;
    var formNameList = [{"name":"workListId"},{"name":"userId"},{"name":"start"},{"name":"interval"},{"name":"notice"},{"name":"note"},{"name":"memberOrder"},{"name":"disabled"}];
    var limitRowNum = 50;
    _val.pageFun.assignWork = {
        onload:function(){
            _val.server.loadDataAll();
            form = $("#formAssignWork_edit");
            pageFun = _val.pageFun.assignWork;
            editing = new WorkAssign();
            editing.addEventListener("changed",function(e){
                form.find('[name="editing"]').val(e.target.getValue("_id"));
            });

            form.find('[name="userId_azusa"]').on("keyup focus",function(e){
                pageFun.searchUserId("userId");
            });
            form.find('[name="shiftTableUser_azusa"]').on("keyup focus",function(e){
                pageFun.searchUserId("shiftTableUser");
            });
            form.find('[name="workListId_azusa"],[name="workListId_name"]').on("keyup focus",function(e){
                pageFun.searchWorkListId("workListId");
            });
            form.find('[name="shiftTableWork_azusa"],[name="shiftTableWork_name"]').on("keyup focus",function(e){
                pageFun.searchWorkListId("shiftTableWork");
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
                pageFun.showIntervalTime();
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

            var dr = new DelayRun(function(){
                pageFun.getFormData();
                pageFun.showShiftTableUser();
                pageFun.showShiftTableWork();
                //TODO scroll
            });
            form.on("input",'input[type="text"],input[type="checkbox"],input[type="number"],select',function(e){
                dr.runLater();
            }).on("click",'input[type="button"]',function(e){
                dr.runLater();
            });
            

            form.find('[name="shiftTableUser"],[name="shiftTableWork"]').siblings("div").on({"mouseenter":function(e){
                var target = $(e.currentTarget);
                if(target.find("div.overlay").length === 0){
                    var wrapper = $("<div></div>").css({"z-index":"1"}).addClass("overlay");
                    target.children("div").wrap(wrapper);
                }
                target.find("div.overlay").css({"background":"rgba(255,194,26,0.5)"});
            },"mouseleave":function(e){
                var target = $(e.currentTarget);
                target.find("div.overlay").css({"background":"rgba(255,255,255,0)"});
                target.find("div.overlay:not(.freezeOverlay) > div").unwrap();
            }},"td.shiftTableContent");

            form.find('[name="shiftTableUser"],[name="shiftTableWork"]').siblings("div").on("click","td.shiftTableContent,td.requireNum,td.diffNum",function(e){
                var parentDiv = $(e.delegateTarget);
                var target = $(e.currentTarget);
                var targetAnother = parentDiv.find("td.selectedCell");
                var start,end;
                if(targetAnother.length === 1){
                    //二回目のクリックで範囲選択
                    if(target.hasClass("shiftTableContent") && (targetAnother.data("workIndex") === target.data("workIndex"))){
                        parentDiv.find("td.shiftTableContent").filter(function(index,_el){
                            var el = $(_el);
                            return (
                                el.data("workIndex") === target.data("workIndex") &&
                                (el.data("start") - target.data("start"))*(el.data("start") - targetAnother.data("start")) <= 0
                            );
                        }).addClass("selectedCell");
                    }else if(
                        !target.hasClass("shiftTableContent") &&
                        !targetAnother.hasClass("shiftTableContent") && (
                            (target.hasClass("requireNum") && targetAnother.hasClass("requireNum")) ||
                            (target.hasClass("diffNum") && targetAnother.hasClass("diffNum"))
                        )
                    ){
                        parentDiv.find([
                            "td",
                            target.hasClass("requireNum") ? ".requireNum" : "",
                            target.hasClass("diffNum") ? ".diffNum" : ""
                        ].join("")).filter(function(index,_el){
                            var el = $(_el);
                            return (el.data("time") - target.data("time"))*(el.data("time") - targetAnother.data("time")) <= 0;
                        }).addClass("selectedCell");                        
                    }else{
                        //それ以外のクリックで1つ目のセルを選択
                        targetAnother.removeClass("selectedCell").find("div.overlay > div").unwrap();
                        target.children("div").wrap($("<div></div>").css({"z-index":"1"}).addClass("overlay"));
                        target.addClass("selectedCell");
                    }
                    parentDiv.find("td.selectedCell > div").not(".overlay").wrap($("<div></div>").css({"z-index":"1"}).addClass("overlay"));

                }else{
                    //それ以外のクリックで1つ目のセルを選択
                    targetAnother.removeClass("selectedCell").find("div.overlay > div").unwrap();
                    target.children("div").wrap($("<div></div>").css({"z-index":"1"}).addClass("overlay"));
                    target.addClass("selectedCell");
                }

                parentDiv.find("td.selectedCell > div.overlay").addClass("freezeOverlay").css({"background":"rgba(255,255,255,0)","border":"2px solid #FF9E1F","border-left-width":"0","border-right-width":"0"});
                parentDiv.find("td.selectedCell > div.overlay").last().css("border-right-width","2px");
                parentDiv.find("td.selectedCell > div.overlay").first().css("border-left-width","2px");
            });

            form.find('[name="shiftTableUser"],[name="shiftTableWork"]').siblings("div").on("contextmenu","td.selectedCell.shiftTableContent",function(e){
                var div = $(e.delegateTarget);
                var tableKind = div.siblings("input").attr("name").replace(/^shiftTable/,"").toLowerCase();
                tableKind = (tableKind === "work" ? "workList" : tableKind);
                var selectedCells = div.find("td.selectedCell");
                var workAssigns = selectedCells.filter(".hasWork").map(function(i,el){
                    return _val.server.getDataById($(el).data("workassignid"),"workAssign")[0];
                }).get();

                var start,end;
                selectedCells.map(function(i,_el){
                    var el = $(_el);
                    var start_el = new LocalDate(el.data("start"));
                    var end_el = start_el.copy().addTimeUnit(el.data("interval"));
                    if(start === undefined || start.getTime() > start_el.getTime())  start = start_el;
                    if(end === undefined || end.getTime() < end_el.getTime())  end = end_el;
                });

                var cm = new ContextMenu(e,[
                    {"key":"setTimeOfForm","text":"この時間をフォームに設定"},
                    {"key":"setWorkAssign","text":"この時間に人割を入れる  （+Ctrl(⌘)キー：全候補）"},
                    {"key":"","text":""},
                    {"key":"changeWorkList","text":"この人割を他の人割に変える  （+Ctrl(⌘)キー：全候補）"},
                    {"key":"changeUser","text":"この人割を他の委員に変える  （+Ctrl(⌘)キー：全候補）"},
                    {"key":"deleteWorkAssign","text":"この人割を削除する"},
                    {"key":"setInfoOfForm","text":"この委員の人割を表示・設定する"},
                    {"key":"","text":""},
                    {"key":"deselect","text":"選択を解除"},
                ],{
                    "setTimeOfForm":function(e){
                        form.find('[name="start_day"]').val(start.getDays());
                        form.find('[name="start_hour"]').val(start.getHours());
                        form.find('[name="start_minute"]').val(start.getMinutes());
                        form.find('[name="end_day"]').val(end.getDays());
                        form.find('[name="end_hour"]').val(end.getHours());
                        form.find('[name="end_minute"]').val(end.getMinutes());
                        form.find('[name="interval"]').val(start.getDiff(end,"timeunit"));
                        if(tableKind === "user"){
                            form.find('[name="userId"]').val(form.find('[name="shiftTableUser_searchResult"]').val());
                        }else{
                            form.find('[name="workListId"]').val(form.find('[name="shiftTableWork_searchResult"]').val());
                        }
                        pageFun.showIntervalTime();
                        cm.remove();
                    },
                    "setWorkAssign":setWorkAssign,
                    "changeWorkList":changeWorkList,
                    "changeUser":changeUser,
                    "setInfoOfForm":function(e){
                        if(workAssigns.length === 0){
                            alert("選択範囲に新規追加でない人割がありません。");
                            return;
                        }else if(workAssigns.length > 1){
                            alert("選択範囲に複数の人割があります。\n一つのみ選択してください。");
                            return;                        
                        }
                        var workAssign = workAssigns[0];
                        pageFun.fillForm(workAssign);
                        cm.remove();
                    },
                    "deleteWorkAssign":function(e){
                        if(workAssigns.length === 0){
                            alert("選択範囲に新規追加でない人割がありません。");
                            return;
                        }
                        _val.server.removeData(workAssigns).sendUpdateQueue().then(function(){
                            pageFun.reshowShiftTable();
                        });
                        cm.remove();
                    },
                    "deselect":function(e){
                        selectedCells.removeClass("selectedCell").find("div div").unwrap();
                        cm.remove();
                    }
                });

                function setWorkAssign(e,userObj,listAll){
                    listAll = (listAll === undefined ? !!(e.ctrlKey && !e.metaKey) || (!e.ctrlKey && e.metaKey) : listAll);
                    var cm1 = new ContextMenu(
                        e,[{"text":"候補","value":""}].concat((
                            tableKind === "user" ?
                            (listAll ? WorkList.getAtInterval(start,end) : WorkList.getNotAssignedAtInterval(start,end)) :
                            (listAll ? _val.server.getData("user") : User.getFreeUsers(start,end))
                        ).map(function(datapiece){
                            return (
                                tableKind === "user" ? {
                                    "text":datapiece.getValue("nameShort"),
                                    "value":datapiece.getValue("_id")                                    
                                } : {
                                    "text":datapiece.getValue("nameLast") + " " + datapiece.getValue("nameFirst"),
                                    "value":datapiece.getValue("_id")
                                }
                            );
                        })),function(e){
                            var id = e.data.value;
                            if(id === "")  return;
                            update(id);
                            cm1.remove();
                        },{
                            "maxHeight":"400px"
                        }
                    );
                    cm1.getContent().find("li").css({"padding":"0 1em"});
                    cm.remove();
                    function update(id){
                        var workListId,userId;
                        if(tableKind === "user"){
                            workListId = id;
                            userId = form.find('[name="shiftTableUser_searchResult"]').val();
                        }else if(tableKind === "workList"){
                            userId = id;
                            workListId = form.find('[name="shiftTableWork_searchResult"]').val();
                        }
                        var workAssign = new WorkAssign({
                            "workListId":workListId,
                            "userId":userId,
                            "start":start,
                            "disabled":false
                        }).setValue("end",end);
                        pageFun.fillForm(workAssign);
                        pageFun.updateWorkAssign("add",null,workAssign);
                        cm1.remove();
                    }
                }
                function changeWorkList(e,userObj,listAll){
                    listAll = (listAll === undefined ? !!(e.ctrlKey && !e.metaKey) || (!e.ctrlKey && e.metaKey) : listAll);
                    if(workAssigns.length === 0){
                        alert("選択範囲に新規追加でない人割がありません。");
                        return;
                    }else if(workAssigns.length > 1){
                        alert("選択範囲に複数の人割があります。\n一つのみ選択してください。");
                        return;                        
                    }
                    var workAssign = workAssigns[0];
                    var cm1 = new ContextMenu(
                        e,[{"text":"候補","value":""}].concat(
                            (listAll ? WorkList.getAtInterval(workAssign.getValue("start"),workAssign.getValue("end")) : WorkList.getNotAssignedAtInterval(workAssign.getValue("start"),workAssign.getValue("end"))
                        ).map(function(workList){
                            return {
                                "text":workList.getValue("nameShort"),
                                "value":workList.getValue("_id")
                            };
                        })),function(e){
                            var workListId = e.data.value;
                            if(workListId === "")  return;
                            var _workAssign = workAssign.copy().setValue("workListId",workListId)
                            pageFun.fillForm(_workAssign);
                            pageFun.updateWorkAssign("change",null,_workAssign);
                            cm1.remove();
                        },{
                            "maxHeight":"400px"
                        }
                    );
                    cm1.getContent().find("li").css({"padding":"0 1em"});
                    cm.remove();
                }
                function changeUser(e,userObj,listAll){
                    listAll = (listAll === undefined ? !!(e.ctrlKey && !e.metaKey) || (!e.ctrlKey && e.metaKey) : listAll);
                    if(workAssigns.length === 0){
                        alert("選択範囲に新規追加でない人割がありません。");
                        return;
                    }else if(workAssigns.length > 1){
                        alert("選択範囲に複数の人割があります。\n一つのみ選択してください。");
                        return;                        
                    }
                    var workAssign = workAssigns[0];
                    var cm1 = new ContextMenu(
                        e,[{"text":"候補","value":""}].concat(
                            (listAll ? _val.server.getData("user") : User.getFreeUsers(workAssign.getValue("start"),workAssign.getValue("end"))
                        ).map(function(user){
                            return {
                                "text":user.getValue("nameLast") + " " + user.getValue("nameFirst"),
                                "value":user.getValue("_id")
                            };
                        })),function(e){
                            var userId = e.data.value;
                            if(userId === "")  return;
                            pageFun.fillForm(workAssign.copy().setValue("userId",userId));
                            pageFun.updateWorkAssign("change",null,workAssign);
                            cm1.remove();

                        },{
                            "maxHeight":"400px"
                        }
                    );
                    cm1.getContent().find("li").css({"padding":"0 1em"});
                    cm.remove();
                }

                return false;
            });

            form.find('[name="shiftTableUser"],[name="shiftTableWork"]').siblings("div").on("contextmenu","td.selectedCell.requireNum,td.selectedCell.diffNum",function(e){
                var div = $(e.delegateTarget);
                var time = new LocalDate($(e.currentTarget).data("time"));
                var tableKind = div.siblings("input").attr("name").replace(/^shiftTable/,"").toLowerCase();
                tableKind = (tableKind === "work" ? "workList" : tableKind);
                var selectedCells = div.find("td.selectedCell");
                var workList = _val.server.getDataById(form.find('[name="shiftTableWork_searchResult"]').val(),"workList")[0];
                var sectionNum = +form.find('[name="shiftTableWork_section"]').val();
                var start,end;
                selectedCells.map(function(i,_el){
                    var el = $(_el);
                    var t = new LocalDate(el.data("time"));
                    if(start === undefined || start.getTime() > t.getTime())  start = t;
                    if(end === undefined || end.getTime() < t.getTime())  end = t;
                });
                end = end.copy().addTimeUnit(1);
                var index = workList.getValue("@detail")[sectionNum].start.getDiff(start,"timeunit");

                var cm = new ContextMenu(e,[
                    {"key":"setTimeOfForm","text":"この時間をフォームに設定"},
                    {"key":"setWorkAssign","text":"この時間に人割を入れる"},
                    {"key":"","text":""},
                    {"key":"changeWorkListNum","text":"この時間の要求人数を増やす／減らす"},
                    {"key":"changeWorkListAsAssinged","text":"この人割を割り振り済みにする／未割り振りにする"},
                    {"key":"","text":""},
                    {"key":"deselect","text":"選択を解除"}
                ],{
                    "setTimeOfForm":function(e){
                        form.find('[name="start_day"]').val(start.getDays());
                        form.find('[name="start_hour"]').val(start.getHours());
                        form.find('[name="start_minute"]').val(start.getMinutes());
                        form.find('[name="end_day"]').val(end.getDays());
                        form.find('[name="end_hour"]').val(end.getHours());
                        form.find('[name="end_minute"]').val(end.getMinutes());
                        form.find('[name="interval"]').val(start.getDiff(end,"timeunit"));
                        form.find('[name="workListId"]').val(workList.getValue("_id"));
                        pageFun.showIntervalTime();
                        cm.remove();
                    },"setWorkAssign":function(e){
                        var cm1 = new ContextMenu(
                            e,[{"text":"候補","value":""}].concat(User.getFreeUsers(start,end).map(function(user){
                                return {
                                    "text":user.getValue("nameLast") + " " + user.getValue("nameFirst"),
                                    "value":user.getValue("_id")
                                };
                            })),function(e){
                                var userId = e.data.value;
                                if(userId === "")  return;
                                var workAssign = new WorkAssign({
                                    "workListId":workList.getValue("_id"),
                                    "userId":userId,
                                    "start":start,
                                    "disabled":false
                                }).setValue("end",end);
                                pageFun.fillForm(workAssign);
                                pageFun.updateWorkAssign("add",null,workAssign);
                                cm1.remove();
                            },{
                                "maxHeight":"400px"
                            }
                        );
                        cm1.getContent().find("li").css({"padding":"0 1em"});
                        cm.remove();
                    },"changeWorkListNum":function(e){
                        var cm1 = new ContextMenu(e,[
                            {"text":"","value":""},
                            {"text":"+1","value":1},{"text":"+2","value":2},{"text":"+3","value":3},{"text":"+4","value":4},{"text":"+5","value":5},
                            {"text":"","value":""},
                            {"text":"-1","value":-1},{"text":"-2","value":-2},{"text":"-3","value":-3},{"text":"-4","value":-4},{"text":"-5","value":-5},
                            {"text":"","value":""},
                            {"text":"0にする","value":0}
                        ],function(e){
                            var value = e.data.value;
                            if(value === "")  return;
                            var sections = workList.getValue("@detail");
                            for(var i=index,l=index+start.getDiff(end,"timeunit");i<l;i++){
                                if(value === 0){
                                    sections[sectionNum].number[i] = 0;
                                }else{
                                    sections[sectionNum].number[i] += +value;
                                    if(sections[sectionNum].number[i] < 0)  sections[sectionNum].number[i] = 0;
                                }
                            }
                            _val.server.changeData(workList.copy().setValue("@detail",sections)).sendUpdateQueue().then(function(){
                                pageFun.reshowShiftTable();
                            });
                            cm1.remove();
                        },{"maxHeight":"400px"});
                        cm.remove();
                    },"changeWorkListAsAssinged":function(e){
                        _val.server.changeData(workList.copy().setValue("asAssigned",!workList.getValue("asAssigned"))).sendUpdateQueue().then(function(){
                            pageFun.reshowShiftTable();
                        });
                        cm.remove();
                    },"deselect":function(e){
                        selectedCells.removeClass("selectedCell").find("div div").unwrap();
                        cm.remove();
                    }
                });
                return false;
            });
            

            pageFun.showIntervalTime();
            pageFun.setMemberOrder();
        },onunload:function(){
        },updateWorkAssign:function(kind,_id,setData){
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
            }else if(kind === "remove"){
                _val.server.removeData(new WorkAssign({"_id":_id}));
            }
            return _val.server.sendUpdateQueue().then(function(){
                pageFun.reshowShiftTable(setData);
            });
        },searchWorkAssign:function(sortFun){
            var result = $("#formAssignWork_search_result");
            var form_search = $("#formAssignWork_search_cond");
            var showNum = +form_search.find('[name="showNumber"]').val();
            var pageNum = +form_search.find('[name="page"]').val();

            result.children().remove();
            result.append("<h3>検索結果</h3>");

            var cond = {};
            ["name","user","leader","incharge"].forEach(function(name){
                cond[name] = form_search.find('[name="' + name + '"]').val();
            });
            var workAssigns = _val.server.getData("workAssign").filter(function(workAssign){
                var flag = true;
                if(cond.name !== ""){
                    var workList = workAssign.getDatapieceRelated("workListId","workList");
                    var reg_name = new RegExp(cond.name);
                    flag = flag && (reg_name.test(workList.getValue("name")) || reg_name.test(workList.getValue("nameShort")))
                }
                if(cond.user !== ""){
                    var user = workAssign.getDatapieceRelated("userId","user");
                    var reg_user = new RegExp(cond.user);
                    flag = flag && (
                        reg_user.test(user.getValue("azusaSendName")) ||
                        reg_user.test(user.getValue("nameLast") + user.getValue("nameFirst")) ||
                        reg_user.test(user.getValue("nameLastPhonetic") + user.getValue("nameFirstPhonetic"))
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

            var workAssignNum = workAssigns.length;

            if(showNum !== 0){
                //workAssigns = workAssigns.splice(pageNum*showNum,showNum);
                result.append('<div>検索結果：' + workAssignNum + '件中　<span id="formAssignWork_search_result_start">' + (pageNum*showNum+1) + '</span>件目から<span id="formAssignWork_search_result_end">' + Math.min((pageNum+1)*showNum,workAssignNum) + '</span>件目まで</div>');
                var prev = $('<input type="button" value="前ページ"></input>').on("click",function(e){
                    var page = form_search.find('[name="page"]');
                    page.val(+page.val() <= 0 ? 0 : +page.val() - 1);
                    //pageFun.searchWorkAssign();
                    hideRows();
                });
                var next = $('<input type="button" value="次ページ"></input>').on("click",function(e){
                    var page = form_search.find('[name="page"]');
                    page.val(+page.val() >= (workAssignNum - workAssignNum%showNum)/showNum ? 0 : +page.val() + 1);
                    //pageFun.searchWorkAssign();
                    hideRows();
                });
                result.append(prev).append(next);
            }


            var table = createTable(result,workAssigns,["edit","workList","user","time","notice"],function(cellObj){
                var workAssign = cellObj.rowData;
                if(cellObj.column === "edit"){
                    var buttons = $('<input type="button" value="これを編集"><input type="button" value="コピーして編集"><input type="button" value="削除">').appendTo(cellObj.el);
                    buttons.eq(0).on("click",function(e){pageFun.fillForm(workAssign,false);});
                    buttons.eq(1).on("click",function(e){pageFun.fillForm(workAssign,true);});
                    buttons.eq(2).on("click",function(e){pageFun.updateWorkAssign("remove",workAssign.getValue("_id"));});
                    $(cellObj.el).parent().data({"index":cellObj.index});
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
                            str = workAssign.getValue("start").toString() + "から" + workAssign.getValue("end").toString({hideDay:true}) + "まで";
                            break;
                        case "notice":
                            str = workAssign.getValue(cellObj.column);
                            break;
                    }
                    cellObj.el.text(str);
                }
            },{"header":["edit","人割名","従事者氏名","時間","注意事項"]});
            hideRows();
            table.el.css({"margin":"3em"});
            function hideRows(){
                pageNum = +form_search.find('[name="page"]').val();
                showNum = +form_search.find('[name="showNumber"]').val();
                var start = pageNum*showNum;
                var num = showNum;
                table.el.find("tr").css({"display":"none"}).filter((index,el) => {
                    var index = $(el).data("index");
                    return index >= start && index < start + num; 
                }).css({"display":""});
                result.find("#formAssignWork_search_result_start").text(pageNum*showNum+1);
                result.find("#formAssignWork_search_result_end").text(Math.min((pageNum+1)*showNum,workAssignNum));
            }
        },fillForm:function(workAssign,copy){
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
                pageFun.setMemberOrder();
            }
            editing.triggerEvent("change");
            form.find('[name="shiftTableUser_day"]').val(workAssign.getValue("start").getDays());
            form.find('[name="workListId_name"],[name="shiftTableWork_name"]').val(workAssign.getDatapieceRelated("workListId","workList").getValue("name"));
            form.find('[name="userId_azusa"],[name="shiftTableUser_azusa"]').val(workAssign.getDatapieceRelated("userId","user").getValue("azusaSendName"));
            pageFun.searchUserId("userId",true);
            pageFun.searchUserId("shiftTableUser",true);
            pageFun.searchWorkListId("workListId",true);
            pageFun.searchWorkListId("shiftTableWork",true);

            form.find('[name="shiftTableUser_searchResult"]').val(workAssign.getValue("userId"));
            form.find('[name="shiftTableWork_searchResult"]').val(workAssign.getValue("workListId"));
            pageFun.setWorkListSection();
            if(workAssign.getWorkListSectionNumber() === -1){
                alert(["Attention!!","この人割の業務は削除されているかIDが変更になっています"].join("\n"))
            }else{
                form.find('[name="shiftTableWork_section"]').val(workAssign.getWorkListSectionNumber());
            }

            pageFun.showIntervalTime();
            pageFun.showShiftTableUser();
            pageFun.showShiftTableWork();        
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
        },searchWorkListId:function(namePrefix,avoidSettingForm){
            if(avoidSettingForm === undefined)  avoidSettingForm = false;
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
            if(!avoidSettingForm){
                pageFun.setWorkListId(namePrefix);
            }
            pageFun.setWorkListSection();
        },setWorkListId:function(namePrefix){
            var id = form.find('[name="' + namePrefix + '_searchResult"]').val();
            var target = form.find('[name="' + namePrefix + '"]');
            target.val(id);
            pageFun.setMemberOrder();
        },searchUserId:function(namePrefix,avoidSettingForm){
            if(avoidSettingForm === undefined)  avoidSettingForm = false;
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
            if(!avoidSettingForm){
                pageFun.setUserId(namePrefix);
            }
        },setUserId:function(namePrefix){
            var id = form.find('[name="' + namePrefix + '_searchResult"]').val();
            var target = form.find('[name="' + namePrefix + '"]');
            target.val(id);
            pageFun.setMemberOrder();
        },showIntervalTime:function(){
            var el = form.find('[name="interval"]');
            var minute = +$(el).val() * LocalDate.getTimeUnitAsConverted("minute");
            el.siblings("span").eq(1).text([
                minute < 60 ? "" : "" + (minute - minute%60)/60 + "時間",
                minute === 0 ? "" : "" + minute%60 + "分"
            ].join(""));
            var end = (new LocalDate({"day":+form.find('[name="start_day"]').val(),"hour":+form.find('[name="start_hour"]').val(),"minute":+form.find('[name="start_minute"]').val()})).addTimeUnit(+form.find('[name="interval"]').val());
            form.find('[name="end_day"]').val(end.getDays());
            form.find('[name="end_hour"]').val(end.getHours());
            form.find('[name="end_minute"]').val(end.getMinutes());            
        },showShiftTableUser:function(){
            return Promise.resolve().then(function(){
                var target = form.find('[name="shiftTableUser"]').siblings("div");
                var user = _val.server.getDataById(form.find('[name="shiftTableUser_searchResult"]').val(),"user")[0];            
                if(user === undefined)  return;
                var day = +form.find('[name="shiftTableUser_day"]').val();
                var start = LocalDate.getWorkTime(day,"start");
                var end = LocalDate.getWorkTime(day,"end");

                pageFun.getFormData();
                var table = user.getShiftTableAsElement(start,end,{"mode":"table","extraWorkAssign":(form.find('[name="shiftTableUser_showFormWA"]').val()==="Yes" ? [editing] : []),"insertRowAtNoWorkAssigned":true});

                target.children().remove();
                target.append(table);
                var width = $(window).width()*0.5;
                target.css({"max-width":width,"overflow":"auto"});
                pageFun.showInformation();
            });
        },showShiftTableWork:function(preventShow){
            preventShow = (preventShow === undefined ? true : preventShow);

            return Promise.resolve().then(function(){
                var target = form.find('[name="shiftTableWork"]').siblings("div");
                var workList = _val.server.getDataById(form.find('[name="shiftTableWork_searchResult"]').val(),"workList")[0];
                if(workList === undefined)  return;
                var sectionNum = +form.find('[name="shiftTableWork_section"]').val();
                var detail = workList.getValue("@detail")[sectionNum];
                var start = detail.start.copy();
                var end = start.copy().addTimeUnit(detail.number.length);
                pageFun.getFormData();
                if(preventShow && limitRowNum < workList.getValue("@detail").reduce((prev,curt)=>prev.concat(curt.number),[]).reduce((prev,curt)=>Math.max(prev,curt),0)){
                    target.children().remove();
                    target.append($('<input type="button" value="人割表を表示する\n※重くなるので注意">').on("click",e => {
                        pageFun.showShiftTableWork(false);
                    }));
                }else{
                    var table = workList.getShiftTableAsElement(start,end,{"mode":"table","extraWorkAssign":(form.find('[name="shiftTableWork_showFormWA"]').val()==="Yes" ? [editing] : [])});

                    target.children().remove();
                    target.append(table);
                    var width = $(window).width()*0.5;
                    target.css({"max-width":width,"overflow":"auto"});
                }
                pageFun.showInformation();
            });
        },showInformation:function(){
            var target = form.find('[name="infomation"]').siblings("div");
            target.children().remove();
            var table = $('<table><tbody></tbody></table>').appendTo(target).filter("table"),
                tbody = table.find("tbody");
            var workList = _val.server.getDataById(form.find('[name="shiftTableWork_searchResult"]').val(),"workList")[0];
            workList = workList || new WorkList({"note":"","condition":""});
            //メモ書き・条件を表示する
            $("<tr>" + [
                "<td>" + [
                    "条件",
                    workList.getValue("condition")
                ].join("</td><td>") + "</td>",
                "<td>" + [
                    "メモ",
                    workList.getValue("note")
                ].join("</td><td>") + "</td>"
            ].join("</tr><tr>") + "</tr>").appendTo(tbody).filter("td")//.css();

            table.css({
                "border-collapse":"collapse",
                "border-spacing":"0"
            });

            tbody.find("td").css({
                "white-space":"pre-line",
                "padding":"0.5ex 1em",
                "margin":"0",
                "border":"1px #000000 solid"
            });

        },reshowShiftTable:function(setData){
            //pageFun.searchWorkAssign();
            pageFun.setWorkListSection();
            if(setData !== undefined){
                form.find('[name="shiftTableWork_section"]').val(setData.getWorkListSectionNumber());
            }
            pageFun.showShiftTableUser();
            pageFun.showShiftTableWork();
        },setWorkListSection:function(){
            var target = form.find('[name="shiftTableWork_section"]');
            var workList = _val.server.getDataById(form.find('[name="shiftTableWork_searchResult"]').val(),"workList")[0];

            target.children().remove();

            if(workList !== undefined){
                var details = workList.getValue("@detail");
                details.forEach(function(detail,detailIndex){
                    var start = detail.start;
                    target.append([
                        '<option value="' + detailIndex + '">',
                        start.getDays() + "日目 ",
                        start.toString({"hideDay":true}) + "から",
                        start.copy().addTimeUnit(detail.number.length).toString({"hideDay":true,"userDiffHours":start}) + "まで",
                        '</option>'
                    ].join(""));
                });
            }

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

        }
    };
});