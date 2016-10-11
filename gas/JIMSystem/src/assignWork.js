$(function(){
    var workAssignEditing;
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
            form.find('[name="workListId_azusa"],[name="workListId_name"]').on("keyup focus",function(e){
                _val.pageFun.assignWork.searchWorkListId("workListId");
            });
            form.find('[name="userId_azusa"]').on("keyup focus",function(e){
                _val.pageFun.assignWork.searchUserId("userId");
            });
            form.find('[name="shiftTableWork_azusa"],[name="shiftTableWork_name"]').on("keyup focus",function(e){
                _val.pageFun.assignWork.searchWorkListId("shiftTableWork");
            });
            form.find('[name="shiftTableUser_azusa"]').on("keyup focus",function(e){
                _val.pageFun.assignWork.searchUserId("shiftTableUser");
            });
            form.find('[name="start_day"]').attr({"min":_val.config.getWorkStartDay(),"max":_val.config.getWorkEndDay()});
            form.find('[name="start_hour"]').on("change",function(e){
                LocalDate.increaseDigit(form.find('[name="start_day"]'),form.find('[name="start_hour"]'),form.find('[name="start_minute"]'));
            });
            form.find('[name="start_minute"]').attr({"min":-LocalDate.getTimeUnitAsConverted("minute"),"step":LocalDate.getTimeUnitAsConverted("minute")}).on("change",function(e){
                LocalDate.increaseDigit(form.find('[name="start_day"]'),form.find('[name="start_hour"]'),form.find('[name="start_minute"]'));
            });
            form.find('[name="interval"]').siblings("span").eq(0).text(LocalDate.getTimeUnitAsConverted("minute"));
            form.find('[name="interval"]').on("change",function(e){
                var minute = +$(e.currentTarget).val() * LocalDate.getTimeUnitAsConverted("minute");
                form.find('[name="interval"]').siblings("span").eq(1).text([
                    minute < 60 ? "" : "" + (minute - minute%60)/60 + "時間",
                    minute === 0 ? "" : "" + minute%60 + "分"
                ].join(""));
            });
            form.find('[name="interval"]').trigger("change");
        },onunload:function(){

        },updateWorkAssign:function(kind,_id){
            var workAssign;
            var setValue = {};
            if(kind === "add" || kind === "change"){
                formNameList.forEach(function(obj){
                    var el = form.find('[name="' + obj.name + '"]');
                    var key = obj.key === undefined ? obj.name : obj.key;
                    if(key === "disabled"){
                        setValue[key] = el.prop("checked");
                    }else if(key === "start"){
                        setValue[key] = new LocalDate({"day":form.find('[name="start_day"]').val(),"hour":form.find('[name="start_hour"]').val(),"minute":form.find('[name="start_minute"]').val()});
                    }else{
                        setValue[key] = el.val();
                    }
                })
                if(kind === "change"){
                    if(workAssignEditing === undefined){
                        alert("値を変更する人割が指定されていません\n下の「検索」から変更したい人割を選択し、フォームへ入力してください");
                        return;
                    }
                    setValue._id = workAssignEditing.getValue("_id");
                }
                workAssign = (new WorkAssign()).setValues(setValue);
                if(kind === "add"){
                    _val.server.addData(workAssign);
                }else{
                    _val.server.changeData(workAssign);
                }
            }else if(kind === "remove"){
                workAssign = new WorkAssign({"_id":_id});
                _val.server.removeData(workAssign);
            }
            _val.server.sendUpdateQueue().then(function(){
                _val.pageFun.assignWork.searchWorkAssign();
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

            var fun_fillForm = function(workAssign){
                formNameList.forEach(function(obj){
                    var el = form.find('[name="' + obj.name + '"]');
                    var key = obj.key === undefined ? obj.name : obj.key;
                    if(key === "disabled"){
                        el.prop("checked",workAssign.getValue(key));
                    }else if(key === "start"){
                        form.find('[name="start_day"]').val(workAssign.getValue(key).getDays());
                        form.find('[name="start_hour"]').val(workAssign.getValue(key).getHours());
                        form.find('[name="start_minute"]').val(workAssign.getValue(key).getMinutes());
                    }else{
                        el.val(workAssign.getValue(key));
                    }
                });
                form.find('[name="workListId_name"]').val(workAssign.getDatapieceRelated("workListId","workList").getValue("name"));
                form.find('[name="userId_azusa"]').val(workAssign.getDatapieceRelated("userId","user").getValue("azusaSendName"));
            }

            var table = createTable(result,workAssigns,["edit","workList","user","time","notice"],function(cellObj){
                var workAssign = cellObj.rowData;
                if(cellObj.column === "edit"){
                    var buttons = $('<input type="button" value="フォームに入力"><input type="button" value="削除">').appendTo(cellObj.el);
                    buttons.eq(0).on("click",function(e){fun_fillForm(workAssign);workAssignEditing = workAssign;});
                    buttons.eq(1).on("click",function(e){_val.pageFun.assignWork.updateWorkAssign("remove",workAssign.getValue("_id"));});
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
                            str = workAssign.getValue("start").toString() + "から" + workAssign.getValue("start").addTimeUnit(workAssign.getValue("interval")).toString({hideDay:true}) + "まで";
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
            var workLists = _val.server.getData("workList");
            var result = form.find('[name="' + namePrefix + '_searchResult"]');
            var azusa = form.find('[name="' + namePrefix + '_azusa"]').val();
            var name = form.find('[name="' + namePrefix + '_name"]').val();
            result.children().remove()
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
            _val.pageFun.assignWork.setWorkListId(namePrefix);
        },setWorkListId:function(namePrefix){
            var id = form.find('[name="' + namePrefix + '_searchResult"]').val();
            var target = form.find('[name="' + namePrefix + '"]');
            target.val(id);
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
            _val.pageFun.assignWork.setUserId(namePrefix);
        },setUserId:function(namePrefix){
            var id = form.find('[name="' + namePrefix + '_searchResult"]').val();
            var target = form.find('[name="' + namePrefix + '"]');
            target.val(id);
        }
    };
});{}