$(() => {
    var pageFun;
    var editing;
    var form;
    var formNameList = [{"name":"sortId"},{"name":"azusaId"},{"name":"azusaSendName"},{"name":"cellphone"},{"name":"grade"},{"name":"nameLast"},{"name":"nameFirst"},{"name":"nameLastPhonetic"},{"name":"nameFirstPhonetic"},{"name":"inchargeId"},{"name":"isRojin"},{"name":"isAvailable"},{"name":"sheetConfig"}];
    var startDay,endDay;
    var isInvisible_value = function(value){return value ? "表示しない" : "表示する";}

    _val.pageFun.editUser = {
        onload:() => {
            startDay = _val.config.getWorkStartDay();
            endDay = _val.config.getWorkEndDay();
            _val.server.loadDataAll().then(() => {
                var users = _val.server.getData("user");
                $('#formEditUser_search_cond [name="grade"]').append(
                    '<option value="all">指定なし</option>' +
                    users.map(user => user.getValue("grade")).filter((v,i,s) => s.indexOf(v) === i).sort((a,b) => a-b)
                    .map(grade => '<option value="' + grade + '">' + grade + '</option>')
                )
            });

            pageFun = _val.pageFun.editUser;
            form = $("#formEditUser_edit");

            (() => {
                var table = form.find('[name="sheetConfig"]').siblings("table");
                for(var day = startDay;day <= endDay; day++){
                    table.append(['<tr><td>' + day + '日目</td><td>',
                        '<input type="button" name="day' + day +'_isInvisible" value="' + isInvisible_value(false) + '">',
                    '</td></tr>'].join(""))
                }
                table.find('[name$="isInvisible"]').on("click",e => {
                    var button = $(e.currentTarget);
                    if(button.val() === isInvisible_value(true)){
                        button.val(isInvisible_value(false));
                    }else{
                        button.val(isInvisible_value(true));
                    }
                });
            })();

        },onunload:() => {
        },updateUser:(kind,_id,setData) => {
            var user;
            var server = _val.server;
            if(kind === "add" || kind === "change"){
                user = pageFun.getFormData();
                if(kind === "change"){
                    if(editing === undefined){
                        alert("値を変更するユーザーが指定されていません\n下の「検索」から変更したい人割を選択し、フォームへ入力してください");
                        return;
                    }
                    user.setValues({"_id":editing.getValue("_id")});
                }
                if(kind === "add"){
                    server.addData(user);
                }else{
                    server.changeData(user);
                }
            }else if(kind === "remove"){
                user = server.getDataById(_id,"user")[0];
                server.removeData(user);
            }

            server.sendUpdateQueue().then(function(queue){
                var update_user = queue[0].value;
                var update_kind = queue[0].kind;
                var incharge = server.getData("incharge");

                var ids_form = pageFun.getInchargeId();
                var incharges_form = server.getDataById(ids_form.map(obj => obj.id),"incharge").map((incharge,i) => {
                    return {"value":incharge,"status":ids_form[i].status};
                });

                if(update_kind === "add"){
                    incharges_form = incharges_form.map(obj => {
                        if(obj.status !== "remove")  obj.status = "add";
                        return obj;
                    });
                }else if(update_kind === "remove"){
                    incharges_form = incharges_form.map(obj => {obj.status = "remove";return obj;});
                }

                incharges_form.forEach(obj => {
                    var incharge = obj.value;
                    var memberIds = incharge.getValue("member").filter(obj => obj.dataName === "user").map(obj => obj.id);
                    var userId = update_user.getValue("_id");
                    if(obj.status === "add"){
                        if(!inArray(memberIds,userId)){
                            incharge.setValues({"member":
                                incharge.getValue("member").concat({"dataName":"user","id":userId})
                            });
                            server.changeData(incharge);
                        }
                    }else if(obj.status === "remove"){
                        if(inArray(memberIds,userId)){
                            incharge.setValues({"member":
                                incharge.getValue("member").filter(obj => obj.dataName !== "user" || obj.id !== userId)
                            });
                            server.changeData(incharge);
                        }
                    }
                });

                return server.sendUpdateQueue().then(() => {
                    pageFun.searchUser();
                });
            });
        },searchUser:() => {
            var result = $("#formEditUser_search_result");
            var form_search = $("#formEditUser_search_cond");

            var users = _val.server.getData("user",undefined,true);
            var incharges = _val.server.getData("incharge");

            result.children().remove();

            var cond = {};
            ["azusa","name","grade","incharge"].forEach(name => {
                cond[name] = form_search.find('[name="' + name +'"]').val();
            });
            users = users.filter(user => {
                var flag = true;

                if(cond.azusa !== ""){
                    flag = flag && (new RegExp(cond.azusa)).test(user.getValue("azusaSendName"));
                }
                if(cond.name !== ""){
                    flag = flag && ["","Phonetic"].some(suffix => (new RegExp(cond.name)).test(user.getValue("nameLast" + suffix) + user.getValue("nameFirst" + suffix)));
                }
                if(cond.grade !== "all"){
                    flag = flag && cond.grade - user.getValue("grade") === 0;
                }
                if(cond.incharge !== ""){
                    flag = flag && incharges
                        .filter(incharge => inArray(user.getValue("inchargeId"),incharge.getValue("_id")))
                        .some(incharge => (new RegExp(cond.code)).test(incharge.getName()));
                }
                return flag;
            });
            var table = createTable(result,users,["edit","grade","name"],(cellObj) => {
                var user = cellObj.rowData;
                if(cellObj.column === "edit"){
                    var buttons = $('<input type="button" value="フォームに入力"><input type="button" value="削除">').appendTo(cellObj.el);
                    buttons.eq(0).on("click",e => {pageFun.fillForm(user);editing = user;});
                    buttons.eq(1).on("click",e => {pageFun.updateUser("remove",user.getValue("_id"));});
                }else if(cellObj.column === "grade"){
                    cellObj.el.text(user.getValue("grade"));
                }else if(cellObj.column === "name"){
                    cellObj.el.text(user.getName());
                }
            },{"header":["edit","学年","氏名"]});
            table.el.css({"margin":"3em"});
        },fillForm:(user) => {
            formNameList.forEach(obj => {
                var el = form.find('[name="' + obj.name + '"]');
                var key = obj.key === undefined ? obj.name : obj.key;
                if(key === "inchargeId"){
                    let divTrs = form.find('[name="inchargeId"]').siblings("div.div-table").children();
                    divTrs.not(divTrs.find('[name="inchargeId_add"]').closest("div.div-row")).remove();
                    _val.server.getDataById(user.getValue("inchargeId"),"incharge").forEach(incharge => {
                        pageFun.addInchargeRow(incharge,false);
                    });
                }else if(key === "sheetConfig"){
                    var table = form.find('[name="sheetConfig"]').siblings("table");
                    table.find('[name$="isInvisible"]').map((i,el) => {
                        el = $(el);
                        var day = +el.attr("name").replace(/^day(-?\d+)_isInvisible$/,"$1");
                        var configObj = user.getValue(key).find(obj => obj.day === day);
                        el.val(isInvisible_value(configObj.isInvisible));
                    });
                }else if(inArray(["isRojin","isAvailable"],key)){
                    el.val(user.getValue(key) ? "Yes" : "No");
                }else{
                    el.val(user.getValue(key));
                }
            });
        },getFormData:() => {
            var setValue = {};
            formNameList.forEach(function(obj){
                var el = form.find('[name="' + obj.name + '"]');
                var key = obj.key === undefined ? obj.name : obj.key;
                if(key === "inchargeId"){
                    var ids = pageFun.getInchargeId().filter(obj => obj.status !== "remove").sort((a,b) => a.index - b.index).map(obj => obj.id);
                    setValue[key] = ids;
                }else if(key === "sheetConfig"){
                    setValue[key] = [];
                    form.find('[name="sheetConfig"]').siblings("table").find('[name$="isInvisible"]').map((i,el) => {
                        el = $(el);
                        var day = +el.attr("name").replace(/^day(-?\d+)_isInvisible$/,"$1");
                        setValue[key].push({"day":day,"isInvisible":el.val() === isInvisible_value(true)});
                });
                setValue[key].sort((a,b) => a.day - b.day);
                }else if(inArray(["isRojin","isAvailable"],key)){
                    setValue[key] = (el.val() === "Yes");
                }else{
                    setValue[key] = el.val();
                }
            });
            return (new User()).setValues(setValue);
        },addInchargeRow:(incharge,isNew) => {
            isNew = isNew === undefined ? true : isNew;
            var table = form.find('[name="inchargeId"]').siblings("div.div-table");
            var divTr_last = table.find('[name="inchargeId_add"]').closest("div.div-row");

            var divTr = $('<div class="div-row"></div>').insertBefore(divTr_last);
            divTr.css({"display":"table-row"});
            var divCell1 = $('<div></div>').appendTo(divTr);
            var divCell2 = $('<div></div>').appendTo(divTr);
            divCell1.css({"display":"table-cell","white-space":"pre"});
            divCell2.css({"display":"table-cell","white-space":"pre"});
            divCell1.append([
                '<select name="inchargeId_nth"></select>',
                '<select name="inchargeId_division"></select>',
                '<select name="inchargeId_id"></select>'
            ].join(""));

            var select_nth = divCell1.find('[name="inchargeId_nth"]');
            var select_division = divCell1.find('[name="inchargeId_division"]');
            var select_id = divCell1.find('[name="inchargeId_id"]');

            select_nth.append(Incharge.getAllOfAllParents().map(incharge => {
                return '<option value="' + incharge.getValue("_id") + '">' + incharge.getName() + '</option>'
            })).on("change",e => {
                select_division.children().remove();
                select_division.append(
                    _val.server.getDataById(select_nth.val(),"incharge")[0]
                        .getMemberIncharges(true)
                        .filter(incharge => incharge.isDivision())
                        .map(incharge => '<option value="' + incharge.getValue("_id") + '">' + incharge.getValue("code") + '</option>')
                );
                select_division.trigger("change");
            });
            select_division.on("change",e => {
                select_id.children().remove();
                select_id.append(
                    _val.server.getDataById(select_division.val(),"incharge")[0]
                        .getMemberIncharges(false)
                        .map(incharge => '<option value="' + incharge.getValue("_id") + '">' + incharge.getValue("code") + '</option>')
                );
            });

            divCell2.append([
                '<input type="hidden" name="inchargeId_status">',
                '<input type="button" name="inchargeId_remove" value="REMOVE">',
                '<input type="button" name="inchargeId_top" value="TOP">',
                '<input type="button" name="inchargeId_up" value="↑">',
                '<input type="button" name="inchargeId_down" value="↓">',
                '<input type="button" name="inchargeId_bottom" value="BOTTOM">'
            ].join(""));
            divTr.find("input,select").css({"vertical-align":"bottom"});

            if(isNew)  divCell2.find('[name="inchargeId_status"]').val("add");
            
            divCell2.on("click",'[type="button"]',e => {
                var button = $(e.currentTarget);
                var kind = button.attr("name").replace(/^inchargeId_(.+)$/,"$1");

                var divTr = button.closest("div.div-row");
                var indexDiv = table.children("div").index(divTr);
                if(
                    (indexDiv === 0 && (kind === "top" || kind === "up")) ||
                    (indexDiv === table.children("div").length-1 && (kind === "bottom" || kind === "down"))
                ){
                    //一番上か一番下で動かせない
                    return null;
                }

                if(kind === "top" || kind === "bottom"){
                    let target = table.children("div").eq(kind === "top" ? 0 : -1);
                    if(kind === "top"){
                        target.before(divTr);
                    }else{
                        target.after(divTr);
                    }
                }else if(kind === "up" || kind === "down"){
                    let target = table.children("div").eq(kind === "up" ? indexDiv - 1 : indexDiv + 1);
                    if(kind === "up"){
                        target.before(divTr);
                    }else{
                        target.after(divTr);
                    }
                }else if(kind === "remove"){
                    divTr.find('[name="inchargeId_status"]').val("remove")
                    divTr.css({"display":"none"});
                }
            });

            if(incharge !== undefined){
                select_nth.val(incharge.getAllParent().getValue("_id")).trigger("change");
                select_division.val(incharge.getDivision().getValue("_id")).trigger("change");
                select_id.val(incharge.getValue("_id"));
            }else{
                select_nth.trigger("change");
            }
        },getInchargeId:() => {
            var table = form.find('[name="inchargeId"]').siblings("div.div-table");

            return table.find('[name="inchargeId_status"]').map((i,el) => {
                el = $(el);
                var status = el.val();
                var id = el.closest("div.div-row").find('[name="inchargeId_id"]').val();
                return {
                    "id":id,
                    "status":status,
                    "index":i
                };
            }).get();
        },getInchargeName:(incharge) => {
            return incharge.isEndChild() ? incharge.getName() : incharge.getName() + "(" + incharge.getValue("name") + ")";
        }
    };
});