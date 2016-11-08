$(function(){
    var pageFun;
    var form,formWorkColorGroup,formUserColorGroup,formNotAvailableUser;
    _val.pageFun.showNotAssigned = {
        onload:function(){
            _val.server.loadData("user");
            _val.server.loadData("workList");
            _val.server.loadData("workAssign");
            _val.server.loadData("userGroup");
            _val.server.loadData("workGroup");
            pageFun = _val.pageFun.showNotAssigned;
            form = $("#formWorkList");
            formWorkColorGroup = $("#formWorkColorGroup");
            formUserColorGroup = $("#formUserColorGroup");
            formNotAvailableUser = $("#formNotAvailableUser");

            $("#formWorkList_result").on({"mouseenter":function(e){
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

            $("#formWorkList_result").on("click","td.shiftTableContent,td.requireNum,td.diffNum",function(e){
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

            $("#formWorkList_result").on("contextmenu","td.selectedCell.shiftTableContent",function(e){
                var div = $(e.delegateTarget);
                var div_td3 = $(e.currentTarget).closest("div");
                var tableKind = div.siblings("input").attr("name").replace(/^shiftTable/,"").toLowerCase();
                tableKind = (tableKind === "work" ? "workList" : tableKind);
                var selectedCells = div.find("td.selectedCell");
                var workList = _val.server.getDataById(div_td3.data("worklistid"),"workList")[0];
                var sectionNum = +div_td3.data("worklistSectionindex");
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
                    {"key":"setWorkAssign","text":"この時間に人割を入れる"},
                    {"key":"","text":""},
                    {"key":"changeWorkList","text":"この人割を他の人割に変える"},
                    {"key":"changeUser","text":"この人割を他の委員に変える"},
                    {"key":"deleteWorkAssign","text":"この人割を削除する"},
                    {"key":"","text":""},
                    {"key":"deselect","text":"選択を解除"}
                ],{
                    "setWorkAssign":function(e){
                        var cm1 = new ContextMenu(
                            e,[{"text":"候補","value":""}].concat((
                                tableKind === "user" ?
                                WorkList.getNotAssignedAtInterval(start,end) :
                                User.getFreeUsers(start,end)                            
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
                                if(e.data.value === "")  return;
                                var workAssign = new WorkAssign({
                                    "workListId":workList.getValue("_id"),
                                    "userId":e.data.value,
                                    "start":start,
                                    "disabled":false
                                }).setValue("end",end);
                                pageFun.updateWorkAssign("add",workAssign).then(function(){
                                    div_td3.children().remove();
                                    div_td3.append(pageFun.reshowWorkList(workList,sectionNum));
                                });
                                cm1.remove();
                            },{
                                "maxHeight":"400px"
                            }
                        );
                        cm1.getContent().find("li").css({"padding":"0 1em"});
                        cm.remove();

                    },"changeWorkList":function(e){
                        if(workAssigns.length === 0){
                            alert("選択範囲に新規追加でない人割がありません。");
                            return;
                        }else if(workAssigns.length > 1){
                            alert("選択範囲に複数の人割があります。\n一つのみ選択してください。");
                            return;                        
                        }
                        var workAssign = workAssigns[0];
                        var cm1 = new ContextMenu(
                            e,[{"text":"候補","value":""}].concat(WorkList.getNotAssignedAtInterval(workAssign.getValue("start"),workAssign.getValue("end")).map(function(workList){
                                return {
                                    "text":workList.getValue("nameShort"),
                                    "value":workList.getValue("_id")
                                };
                            })),function(e){
                                var workListId = e.data.value;
                                if(workListId === "")  return;
                                pageFun.updateWorkAssign("change",workAssign.setValue("workListId",workListId)).then(function(){
                                    div_td3.children().remove();
                                    div_td3.append(pageFun.reshowWorkList(workList,sectionNum));
                                });
                                cm1.remove();
                            },{
                                "maxHeight":"400px"
                            }
                        );
                        cm1.getContent().find("li").css({"padding":"0 1em"});
                        cm.remove();
                    },"changeUser":function(e){
                        if(workAssigns.length === 0){
                            alert("選択範囲に新規追加でない人割がありません。");
                            return;
                        }else if(workAssigns.length > 1){
                            alert("選択範囲に複数の人割があります。\n一つのみ選択してください。");
                            return;                        
                        }
                        var workAssign = workAssigns[0];
                        var cm1 = new ContextMenu(
                            e,[{"text":"候補","value":""}].concat(User.getFreeUsers(workAssign.getValue("start"),workAssign.getValue("end")).map(function(user){
                                return {
                                    "text":user.getValue("nameLast") + " " + user.getValue("nameFirst"),
                                    "value":user.getValue("_id")
                                };
                            })),function(e){
                                var userId = e.data.value;
                                if(userId === "")  return;
                                pageFun.updateWorkAssign("change",workAssign.setValue("userId",userId)).then(function(){
                                    div_td3.children().remove();
                                    div_td3.append(pageFun.reshowWorkList(workList,sectionNum));
                                });
                                cm1.remove();

                            },{
                                "maxHeight":"400px"
                            }
                        );
                        cm1.getContent().find("li").css({"padding":"0 1em"});
                        cm.remove();
                    },"deleteWorkAssign":function(e){
                        if(workAssigns.length === 0){
                            alert("選択範囲に新規追加でない人割がありません。");
                            return;
                        }
                        pageFun.updateWorkAssign("remove",workAssigns).then(function(){
                            div_td3.children().remove();
                            div_td3.append(pageFun.reshowWorkList(workList,sectionNum));
                        });
                        cm.remove();
                    },"deselect":function(e){
                        selectedCells.removeClass("selectedCell").find("div div").unwrap();
                        cm.remove();
                    }
                });
                return false;
            });

            $("#formWorkList_result").on("contextmenu","td.selectedCell.requireNum,td.selectedCell.diffNum",function(e){
                var div = $(e.delegateTarget);
                var div_td3 = $(e.currentTarget).closest("div");
                var time = new LocalDate($(e.currentTarget).data("time"));
                var tableKind = div.siblings("input").attr("name").replace(/^shiftTable/,"").toLowerCase();
                tableKind = (tableKind === "work" ? "workList" : tableKind);
                var selectedCells = div.find("td.selectedCell");
                var workList = _val.server.getDataById(div_td3.data("worklistid"),"workList")[0];
                var sectionNum = +div_td3.data("worklistSectionindex");
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
                    {"key":"setWorkAssign","text":"この時間に人割を入れる"},
                    {"key":"","text":""},
                    {"key":"changeWorkListNum","text":"この時間の要求人数を増やす／減らす"},
                    {"key":"changeWorkListAsAssinged","text":"この人割を割り振り済みにする／未割り振りにする"},
                    {"key":"","text":""},
                    {"key":"deselect","text":"選択を解除"}
                ],{
                    "setWorkAssign":function(e){
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
                                pageFun.updateWorkAssign("add",workAssign).then(function(){
                                    div_td3.children().remove();
                                    div_td3.append(pageFun.reshowWorkList(workList,sectionNum));
                                });
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
                                div_td3.children().remove();
                                div_td3.append(pageFun.reshowWorkList(workList,sectionNum));
                            });
                            cm1.remove();
                        },{"maxHeight":"400px"});
                        cm.remove();
                    },"changeWorkListAsAssinged":function(e){
                        _val.server.changeData(workList.copy().setValue("asAssigned",!workList.getValue("asAssigned"))).sendUpdateQueue().then(function(){
                            div_td3.children().remove();
                            div_td3.append(pageFun.reshowWorkList(workList,sectionNum));
                        });
                        cm.remove();
                    },"deselect":function(e){
                        selectedCells.removeClass("selectedCell").find("div div").unwrap();
                        cm.remove();
                    }
                });
                return false;
            });


        },onunload:function(){
        },showWorkList:function(){
            var result = $("#formWorkList_result");
            result.children().remove();

            result.append('<table class="tableform"><tbody></tbody></table>');

            WorkList.getNotAssigned().forEach(function(obj){
                var workList = obj.workList;
                var detail = workList.getValue("@detail");
                var indexes = obj.index;
                var trs = $(indexes.map(function(index,i){
                    return '<tr>' + repeatString('<td></td>',(i === 0 ? 3 : 2)) + '</tr>';
                }).join("")).appendTo(result.find("table.tableform > tbody"));
                trs.eq(0).children("td:first-child").text(workList.getValue("name")).attr("rowSpan",indexes.length);
                indexes.forEach(function(index,i){
                    var td = trs.eq(i).children("td:last-child");
                    td.prev("td").text(detail[index].start.toString());
                    var start = detail[index].start;
                    var end = start.copy().addTimeUnit(detail[index].number.length);
                    var div = $("<div></div>").css({"overflow":"auto","max-width":$(window).width()*0.5}).appendTo(td);
                    div.data({"worklistid":workList.getValue("_id"),"worklistSectionindex":index});
                    $('<input type="button" value="人割を表示する">').appendTo(div).on("click",function(){
                        div.children().remove();
                        div.append(workList.getShiftTableAsElement(start,end));
                    });
                });
            });
            result.find("table.tableform > tbody > tr > td:first-child").css("background","transparent");
        },reshowWorkList:function(workList,index){
            var section = workList.getValue("@detail")[index];
            var start = section.start;
            var end = start.copy().addTimeUnit(section.number.length);
            return workList.getShiftTableAsElement(start,end);
        },updateWorkAssign:function(kind,setData){
            var setValue = {};
            if(kind === "add"){
                _val.server.addData(setData);
            }else if(kind === "change"){
                _val.server.changeData(setData);
            }else if(kind === "remove"){
                _val.server.removeData(setData);
            }
            return _val.server.sendUpdateQueue();
        },showColorGroupList:function(kind){
            // kind = ["user"/"work"]
            var dataNameGroup = (kind === "user" ? "userGroup" : (kind === "work" ? "workGroup" : ""));
            var dataNameData = (kind === "work" ? "workList" : kind);
            var groups = _val.server.getData(dataNameGroup).filter(function(group){return group.getValue("isColorGroup")});
            var assignedDatapieceIds = groups.map(function(group){return group.getValue("member")}).reduce(function(prev,curt){return prev.concat(curt)},[]).filter(function(v,i,s){return i === s.indexOf(v)});
            var datapieces = _val.server.getData(dataNameData).filter(function(datapiece){return !inArray(assignedDatapieceIds,datapiece.getValue("_id"))});

            var thisForm = (kind === "user" ? formUserColorGroup : (kind === "work" ? formWorkColorGroup : null));
            var result = (kind === "user" ? $("#formUserColorGroup_result") : (kind === "work" ? $("#formWorkColorGroup_result") : null));

            result.children().remove();
            result.append('<table class="tableform"><tbody></tbody></table>');
            var tbody = result.find("table.tableform tbody");

            datapieces.forEach(function(datapiece){
                var tr = $('<tr><td></td><td><input type="button" value="グループを割り当てる"></td><td>グループを選択：<select></select></td></tr>').appendTo(tbody);
                var td0 = tr.children("td").eq(0);
                var button = tr.children("td").eq(1).children("input");
                var select = tr.children("td").eq(2).children("select");
                var text = (kind === "user" ? datapiece.getValue("nameLast") + " " + datapiece.getValue("nameFirst") : (kind === "work" ? datapiece.getValue("name") : ""));
                td0.text(text);
                select.append('<option value=""></option>');
                groups.forEach(function(group){
                    select.append('<option value="' + group.getValue("_id") + '">' + group.getValue("name") + '</option>')
                });
                button.on("click",function(e){
                    var group = groups.find(function(group){return group.getValue("_id") === select.val()}).copy();
                    if(group === undefined)  return;
                    var member = group.getValue("member").slice();
                    member.push(datapiece.getValue("_id"));
                    group.setValues({"member":member});
                    _val.server.changeData(group).sendUpdateQueue().then(function(){
                        tr.css("display","none");
                    });
                });
            });
            
        },showNotAvailableUser:function(){
            var result = $("#formNotAvailableUser_result");
            var userIds = _val.server.getData("user",null,true).filter(function(user){
                return !user.getValue("isAvailable");
            }).map(function(user){
                return user.getValue("_id");
            });
            var workAssigns = _val.server.getData("workAssign").filter(function(workAssign){
                return inArray(userIds,workAssign.getValue("userId"));
            });

            result.children().remove();
            result.append('<table class="tableform"><thead><tr><th>名前</th><th>人割名</th><th>時間</th><th></th></tr></thead><tbody></tbody></table>');
            var tbody = result.find("table.tableform tbody");

            workAssigns.forEach(function(workAssign){
                var user = workAssign.getDatapieceRelated("userId","user");
                var tr = $('<tr><td>' + [
                    user.getValue("@name"),
                    workAssign.getValue("name"),
                    workAssign.getValue("start").toString() + "から" + workAssign.getValue("end") + "まで",
                    '<input type="button" value="削除" name="delete">'
                ].join("</td><td>") + '</td></tr>');
                tbody.append(tr);
                var button = tr.find('input[name="delete"]');
                button.on("click",function(e){
                    _val.server.removeData(workAssign).sendUpdateQueue();
                });
            });
        },deleteNotAvailableUserWA:function(){
            var userIds = _val.server.getData("user",null,true).filter(function(user){
                return !user.getValue("isAvailable");
            }).map(function(user){
                return user.getValue("_id");
            });
            var workAssigns = _val.server.getData("workAssign").filter(function(workAssign){
                return inArray(userIds,workAssign.getValue("userId"));
            });
            _val.server.removeData(workAssigns).sendUpdateQueue();            
        }
    };
});
