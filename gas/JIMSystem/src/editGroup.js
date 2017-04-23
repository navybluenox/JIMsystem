$(function(){
    var pageFun;
    var form;
    var formNameList = [{"name":"name"},{"name":"member"},{"name":"isColorGroup"},{"name":"backgroundColor"},{"name":"fontColor"},{"name":"isUnitGroup","only":"workGroup"},{"name":"isMemberOrderGroup","only":"userGroup"},{"name":"memberOrderWorkListId","only":"userGroup"},{"name":"memberOrderNumber","only":"userGroup"}];
    var editing;
    var getCollName = function(){return $("#editGroup_kind").val()};
    _val.pageFun.editGroup = {
        onload:function(){
            _val.server.loadData("user");
            _val.server.loadData("workList");
            _val.server.loadData("userGroup");
            _val.server.loadData("workGroup");
            pageFun = _val.pageFun.editGroup;
            form = $("#formEditGroup");
            form.find('[name="memberOrderWorkListId_azusa"],[name="memberOrderWorkListId_name"]').on("keyup focus",function(e){
                pageFun.searchWorkListId("memberOrderWorkListId");
            });
            form.find('[name="member_order"]').siblings("table").on("click",'[name^="member_order_"][type="button"]',e => {
                //TODO debugge
                var button = $(e.currentTarget);
                var targetTr = button.closest("tr");
                var targetValue = targetTr.find('[name^="member_order_value_"]');
                var tbody = targetTr.closest("tbody");
                var trs = tbody.find("tr");
                var memberNum = +form.find('[name="member_order"]').val();

                var indexTr = +targetValue.val();
                var type = button.attr("name").replace(/^member_order_([^_]+)_.+$/,"$1");
                var workListId = button.attr("name").replace(/^member_order_[^_]+_(.+)$/,"$1");

                if(
                    (indexTr === 0 && (type === "top" || type === "up")) ||
                    (indexTr === memberNum-1 && (type === "bottom" || type === "down"))
                ){
                    //一番上か一番下で動かせない
                    return null;
                }

                if(type === "top" || type === "bottom"){
                    let moveTr = trs.filter((i,el) => {
                        var index = +$(el).closest("tr").find('[name^="member_order_value_"]').val();
                        return (type === "top" ? indexTr - index : index - indexTr) > 0
                    });
                    let moveValue = moveTr.find('[name^="member_order_value_"]');
                    if(type === "top"){
                        trs.filter((i,el) => +$(el).closest("tr").find('[name^="member_order_value_"]').val() === 0).before(targetTr);
                    }else{
                        trs.filter((i,el) => +$(el).closest("tr").find('[name^="member_order_value_"]').val() === memberNum-1).after(targetTr);
                    }
                    moveValue.map((i,el) => {
                        el = $(el);
                        el.val(+el.val() + (type === "top" ? 1 : -1));
                    });
                    targetValue.val(type === "top" ? 0 : memberNum-1);
                }else{
                    //"up" "down"
                    let moveTr = trs.filter((i,el) => {
                        var index = +$(el).closest("tr").find('[name^="member_order_value_"]').val();
                        return index === indexTr + (type === "up" ? -1 : 1);
                    });
                    let moveValue = moveTr.find('[name^="member_order_value_"]');
                    if(type === "up"){
                        moveTr.before(targetTr);
                    }else{
                        moveTr.after(targetTr);
                    }
                    moveValue.val(+moveValue.val() + (type === "up" ? 1 : -1));
                    targetValue.val(+targetValue.val() + (type === "up" ? -1 : 1));
                }
            });

        },onunload:function(){   
        },updateGroup:function(kind,_id){
            var group;
            var setValue = {};
            var GroupClass = Datapiece.getClassByName(getCollName());
            if(kind === "add" || kind === "change"){
                formNameList.filter(function(list){return list.only === undefined || list.only === getCollName();}).forEach(function(obj){
                    var el = form.find('[name="' + obj.name + '"]');
                    var key = obj.key === undefined ? obj.name : obj.key;
                    if(inArray(["isColorGroup","isMemberOrderGroup","isUnitGroup"],key)){
                        setValue[key] = (el.val() === "Yes");
                    }else if(key === "member"){
                        let values = form.find('[name="member_selected"] option').map((i,el) => $(el).attr("value")).get();
                        let orderValues = form.find('[name="member_order"]').siblings("table").find('[name^=member_order_value_]').map((i,el) => {
                            el = $(el);
                            return {"id":el.attr("name").replace(/^member_order_value_/,""),"order":el.val()};
                        }).get();
                        setValue[key] = el.val().sort((a,b) => orderValues.find(obj => a === obj.id).order - orderValues.find(obj => b === obj.id).order);
                    }else if(key === "backgroundColor" || key === "fontColor"){
                        setValue[key] = /^#[0-9A-Fa-f]{6}$/.test(el.val()) ? el.val().toUpperCase() : "";                        
                    }else{
                        setValue[key] = el.val();
                    }
                })
                if(kind === "change"){
                    if(editing === undefined){
                        alert("値を変更するグループが指定されていません\n下の「検索」から変更したい人割を選択し、フォームへ入力してください");
                        return;
                    }
                    setValue._id = editing.getValue("_id");
                }
                group = (new GroupClass()).setValues(setValue);
                if(kind === "add"){
                    _val.server.addData(group);
                }else{
                    _val.server.changeData(group);
                }
            }else if(kind === "remove"){
                group = new GroupClass({"_id":_id});
                _val.server.removeData(group);
            }
            _val.server.sendUpdateQueue().then(function(){
                pageFun.searchGroup();
            });

        },searchGroup:function(sortFun){
            var result = $("#formEditGroup_search_result");
            var form_search = $("#formEditGroup_search_cond");

            if(getCollName() === ""){
                alert("検索するグループを選択してください。");
                $("#editGroup_kind").focus();
                return;
            }

            result.children().remove();
            result.append("<h3>検索結果</h3>");

            var cond = {};
            ["groupName","isColorGroup","isMemberOrderGroup"].forEach(function(name){
                cond[name] = form_search.find('[name="' + name + '"]').val();
            })
            var groups = _val.server.getData(getCollName(),null,true).filter(function(group){
                var flag = true;
                if(cond.groupName !== ""){
                    flag = flag && (new RegExp(cond.groupName)).test(group.getValue("name"));
                }
                if(cond.isColorGroup !== ""){
                    flag = flag && ((cond.isColorGroup === "Yes") === group.getValue("isColorGroup"));
                }
                if(cond.isMemberOrderGroup !== ""){
                    flag = flag && ((cond.isMemberOrderGroup === "Yes") === group.getValue("isMemberOrderGroup"));
                }
                return flag;
            });

            if(sortFun !== undefined && typeof sortFun === "function"){
                groups =  sortFun(groups);
            }else{
                groups = Datapiece.sort(groups,["isColorGroup","name"]);
            }

            var fun_fillForm = function(group){
                formNameList.filter(function(list){return list.only === undefined || list.only === getCollName();}).forEach(function(obj){
                    var el = form.find('[name="' + obj.name + '"]');
                    var key = obj.key === undefined ? obj.name : obj.key;
                    if(key === "isColorGroup" || key === "isMemberOrderGroup"){
                        el.val(group.getValue(key) ? "Yes" : "No");
                    }else if(key === "member"){
                        pageFun.setMemberList();
                        var el = form.find('[name="member_list"]').find(group.getValue("member").map(function(m){
                            return '[value="' + m + '"]'
                        }).join(","));
                        el.attr("selected","selected");
                        form.find('[name="member_add"]').trigger("click");
                    }else{
                        el.val(group.getValue(key));
                    }
                });
                //TODO
                pageFun.showMemberOrderTable(group.getValue("member"));
            }

            var table = createTable(result,groups,["edit","name","isColorGroup","isMemberOrderGroup"],function(cellObj){
                var group = cellObj.rowData;
                if(cellObj.column === "edit"){
                    var buttons = $('<input type="button" value="フォームに入力"><input type="button" value="削除">').appendTo(cellObj.el);
                    buttons.eq(0).on("click",function(e){fun_fillForm(group);editing = group;pageFun.setColorSample();});
                    buttons.eq(1).on("click",function(e){pageFun.updateGroup("remove",group.getValue("_id"));});
                }else{
                    var str;
                    switch(cellObj.column){
                        case "name":
                            str = group.getValue("name");
                            break;
                        case "isColorGroup":
                        case "isMemberOrderGroup":
                        case "isUnitGroup":
                            str = (group.getValue(cellObj.column) ? "Yes" : "No");
                            break;
                    }
                    cellObj.el.text(str);
                }
            },{"header":["edit","グループ名","カラーグループ","メンバーオーダーグループ"]});
            table.el.css({"margin":"3em"});
        },onSelectKindChanged:function(){
            var kind = getCollName();
            pageFun.setMemberList();
            pageFun.searchGroup();
            pageFun.clearEditing();
            form.find(".userGroupOnly,.workGroupOnly").css("display","none");
            form.find("." + kind + "Only").css("display","");
            pageFun.showMemberOrderTable();
        },setNamePrefix:function(prefix){
            var target = form.find('[name="name"]');
            if(!(new RegExp("^" + prefix)).test(target.val())){
                target.val(prefix + target.val());
            }
        },setMemberList:function(){
            var target_list = form.find('[name="member_list"]');
            var target_selected = form.find('[name="member_selected"]');
            target_list.children().remove();
            target_selected.children().remove();
            var dataName;
            if(getCollName() === "userGroup"){
                dataName = "user";
            }else if(getCollName() === "workGroup"){
                dataName = "workList";
            }
            var data = _val.server.getData(dataName);

            target_list.append(Datapiece.sort(data,(dataName === "user" ? ["sortId"] : (dataName === "workList" ? ["leaderIncharge","nameShort"] : []))).map(function(dp){
                if(dataName === "user"){
                    return '<option value="' + dp.getValue("_id") + '">' + dp.getValue("nameLast") + " " + dp.getValue("nameFirst") + '</option>';
                }else if(dataName === "workList"){
                    return '<option value="' + dp.getValue("_id") + '">' + dp.getValue("nameShort") + '</option>';
                }
            }).join(""));
            target_list.attr("size",Math.min(data.length,20)).find("option").css({"text-align":"left"});
            target_selected.attr("size",2).find("option").css({"text-align":"left"});
        },moveMember:function(type){
            var target_list = form.find('[name="member_list"]');
            var target_selected = form.find('[name="member_selected"]');
            var move;

            if(type === "add"){
                move = target_list.find("option:selected");
                target_selected.append(move);
            }else if(type === "remove"){
                move = target_selected.find("option:selected");
                target_list.append(move);                
            }
            target_list.attr("size",Math.min(target_list.find("option").length,20));
            target_selected.attr("size",Math.min(target_selected.find("option").length,20));
            pageFun.showMemberOrderTable();
        },showMemberOrderTable:function(ids){
            var tbody = form.find('[name="member_order"]').siblings("table").find("tbody");
            if(ids === undefined){
                let memberIds_set = tbody.find('[name^="member_order_value_"]').map((i,el) => {
                    return {"id":+$(el).attr("name").replace(/^member_order_value_/,""),"order":+$(el).val()}
                }).get().sort((a,b) => a.order - b.order).map(v => v.id);

                tbody.children().remove();

                let memberIds_selected = form.find('[name="member_selected"] option').map((i,el) => $(el).attr("value")).get();
                memberIds_selected = memberIds_selected === null ? [] : memberIds_selected;
                memberIds_selected.sort((a,b) => {
                    var aOrder = memberIds_set.findIndex(memberId => a === memberId);
                    var bOrder = memberIds_set.findIndex(memberId => b === memberId);
                    aOrder = (aOrder === -1 ? memberIds_selected.length : aOrder);
                    bOrder = (bOrder === -1 ? memberIds_selected.length : bOrder);
                    return aOrder - bOrder;
                });
                ids = memberIds_selected;
            }
            form.find('[name="member_order"]').val(ids.length);
            tbody.append("<tr>" + ids.map((memberId,index) => {
                var datapiece = _val.server.getDataById(memberId,(getCollName() === "workGroup" ? "workList" : "user"))[0];
                return ["<td>" + [
                    datapiece.getName(),
                    [
                        //TODO text => hidden, disabled clear
                        '<input type="text" disabled name="member_order_value_' + datapiece.getValue("_id") + '" value="' + index + '">',
                        '<input type="button" name="member_order_top_' + datapiece.getValue("_id") + '" value="TOP">',
                        '<input type="button" name="member_order_up_' + datapiece.getValue("_id") + '" value="↑">',
                        '<input type="button" name="member_order_down_' + datapiece.getValue("_id") + '" value="↓">',
                        '<input type="button" name="member_order_bottom_' + datapiece.getValue("_id") + '" value="BOTTOM">'
                    ].join("")
                ].join("</td><td>") + "</td>"];
            }).join("</tr><tr>") + "</tr>");
            tbody.find("tr").css({"white-space":"pre"});
            tbody.find('input[type="button"]').css({"min-width":"36px"});

        },setColorSample:function(){
            var target = form.find('[name="backgroundColor"]').closest("tr").children("td").eq(2);
            target.css({"background":form.find('[name="backgroundColor"]').val(),"color":form.find('[name="fontColor"]').val()});
        },clearEditing:function(){
            editing = undefined;
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
            pageFun.setWorkListId(namePrefix);
        },setWorkListId:function(namePrefix){
            var id = form.find('[name="' + namePrefix + '_searchResult"]').val();
            var target = form.find('[name="' + namePrefix + '"]');
            target.val(id);
        },convertColor:function(type){
            var el = {},value = {};
            var max,min;
            ["r","g","b","h","s","l"].forEach(function(key){
                el[key] = form.find('[name="color_sample_' + key +'"]');
                el["range_"+key] = form.find('[name="color_sample_' + key +'_range"]');
                value[key] = 0;
            });
            if(type === "rgb"){
                ["r","g","b"].forEach(function(key){
                    value[key] = +el[key].val();
                });
                max = Math.max(value.r,value.g,value.b);
                min = Math.min(value.r,value.g,value.b);
                if(max === min){
                    value.h = 0;
                }else if(value.r === max){
                    value.h = Math.round(60 * (value.g - value.b) / (max - min));
                }else if(value.g === max){
                    value.h = Math.round(60 * (value.b - value.r) / (max - min) + 120);
                }else if(value.b === max){
                    value.h = Math.round(60 * (value.r - value.g) / (max - min) + 240);
                }
                while(value.h < 0){
                    value.h += 360;
                }
                value.h = value.h % 360;
                var cnt = (max + min)/2;
                if(max === min){
                    value.s = 0;
                }else if(cnt < 128){
                    value.s = Math.round(100 * (max - min)/(max + min));
                }else{
                    value.s = Math.round(100 * (max - min)/(510 - max - min));
                }
                value.l = Math.round(100*cnt/255);

            }else if(type === "hsl"){
                ["h","s","l"].forEach(function(key){
                    value[key] = +el[key].val();
                });
                if(value.l<50){
                    max = Math.round(2.55*value.l*(1 + value.s/100));
                    min = Math.round(2.55*value.l*(1 - value.s/100));
                }else{
                    max = Math.round(2.55*(value.l*(1 - value.s/100) + value.s));
                    min = Math.round(2.55*(value.l*(1 + value.s/100) - value.s));
                }
                if(value.h < 60*1){
                    value.r = max;
                    value.g = Math.round((value.h/60)*(max-min) + min);
                    value.b = min;
                }else if(value.h < 60*2){
                    value.r = Math.round(((120-value.h)/60)*(max-min) + min);
                    value.g = max;
                    value.b = min;
                }else if(value.h < 60*3){
                    value.r = min;
                    value.g = max;
                    value.b = Math.round(((value.h-120)/60)*(max-min) + min);
                }else if(value.h < 60*4){
                    value.r = min;
                    value.g = Math.round(((240-value.h)/60)*(max-min) + min);
                    value.b = max;
                }else if(value.h < 60*5){
                    value.r = Math.round(((value.h-240)/60)*(max-min) + min);
                    value.g = min;
                    value.b = max;
                }else{
                    value.r = max;
                    value.g = min;
                    value.b = Math.round(((360-value.h)/60)*(max-min) + min);
                }
            }
            ["r","g","b","h","s","l"].forEach(function(key){
                el[key].val(value[key]);
                el["range_"+key].val(value[key]);
            });
            var r16,g16,b16;
            r16 = (+el.r.val()).toString(16);
            g16 = (+el.g.val()).toString(16);
            b16 = (+el.b.val()).toString(16);
            if(r16.length === 1) r16 = "0" + r16;
            if(g16.length === 1) g16 = "0" + g16;
            if(b16.length === 1) b16 = "0" + b16;
            form.find('[name="color_code"]').val("#" + r16 + g16 + b16);
            form.find('[name="color_sample"]').parent().css("background",form.find('[name="color_code"]').val());
        }
    };
});