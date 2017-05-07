$(() => {
    var pageFun;
    var editing;
    var form;
    var formNameList = [{"name":"sortId"},{"name":"azusaId"},{"name":"azusaSendName"},{"name":"cellphone"},{"name":"grade"},{"name":"nameLast"},{"name":"nameFirst"},{"name":"nameLastPhonetic"},{"name":"nameFirstPhonetic"},{"name":"inchargeId"},{"name":"isRojin"},{"name":"isAvailable"},{"name":"sheetConfig"}];
    _val.pageFun.editUser = {
        onload:() => {
            _val.server.loadDataAll().then(() => {
                var users = _val.server.getData("user");
                $('#formEditIncharge_search_cond [name="grade"]').append(
                    '<option value="all">指定なし</option>' +
                    users.map(user => user.getValue("grade")).filter((v,i,s) => s.indexOf(v) === i).sort((a,b) => a-b)
                    .map(grade => '<option value="' + grade + '">' + grade + '</option>')
                )
            });
            pageFun = _val.pageFun.editUser;
            form = $("#formEditUser_edit");
        },onunload:() => {
        },updateUser:(kind,_id,setData) => {
            var user;
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
                    _val.server.addData(user);
                }else{
                    _val.server.changeData(user);
                }
            }else if(kind === "remove"){
                user = _val.server.getDataById(_id,"user")[0];
                _val.server.removeData(user);
            }
            _val.server.sendUpdateQueue().then(function(){
                pageFun.searchUser();
            });

        },searchUser:() => {
            var result = $("#formEditUser_search_result");
            var form_search = $("#formEditUser_search_cond");

            var users = _val.server.getData("user");
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
                    flag = flag && cond.grade - user.getValue(grade) === 0;
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
                    buttons.eq(1).on("click",e => {pageFun.updateuser("remove",user.getValue("_id"));});
                }else if(cellObj.column === "grade"){
                    cellObj.el.text(user.getValue("grade"));
                }else if(cellObj.column === "name"){
                    cellObj.el.text(user.getName());
                }
            },{"header":["edit","略称","担当名"]});
            table.el.css({"margin":"3em"});
        },fillForm:(user) => {
            formNameList.forEach(obj => {
                var el = form.find('[name="' + obj.name + '"]');
                var key = obj.key === undefined ? obj.name : obj.key;
                if(key === "inchargeId"){
                    form.find('[name="inchargeId"]').sibling("div.div-table").children().remove();
                    _val.server.getDataById(user.getValue("inchargeId"),"incharge").forEach(incharge => {
                        pageFun.addInchargeRow(incharge);
                    });
                }else if(key === "sheetConfig"){

                }else if(inArray(["isRojin","isAvailable"],key)){
                    el.val(user.getValue(key) ? "Yes" : "No");
                }else{
                    el.val(user.getValue(key));
                }
            });
        },getFormData:() => {
            //TODO
        },addInchargeRow:(incharge) => {
            var table = form.find('[name="inchargeId"]').sibling("div.div-table");
            var divTr_last = table.find('[name="inchargeId_add"]').closest("div.div-tr");

            var divTr = $('<div class="div-row"></div>').insertBefore(divTr_last);
            divTr.css({"display":"table-row"});
            var divCell1 = $('<div></div>').appendTo(divTr);
            var divCell2 = $('<div></div>').appendTo(divTr);
            divCell1.css({"display":"table-cell"});
            divCell2.css({"display":"table-cell"});
            divCell1.append([
                '<select name="inchargeId_nth"></select>',
                '<select name="inchargeId_division"></select>',
                '<select name="inchargeId_id"></select>'
            ].join(""));
            divCell1.append([
                '<input type="hidden" name="inchargeId_status">',
                '<input type="button" name="inchargeId_remove" value="REMOVE">',
                '<input type="button" name="inchargeId_top" value="TOP">',
                '<input type="button" name="inchargeId_up" value="↑">',
                '<input type="button" name="inchargeId_down" value="↓">',
                '<input type="button" name="inchargeId_bottom" value="BOTTOM">'
            ].join(""));

            if(incharge !== undefined){

            }
        }
    };
});