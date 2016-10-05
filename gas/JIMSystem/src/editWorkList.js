$(function(){
    var workListEditing;
    var form;
    var formNameList = [{"name":"name"},{"name":"nameShort"},{"name":"leaderId"},{"name":"leaderIncharge"},{"name":"description"},{"name":"condition"},{"name":"caption"},{"name":"note"},{"name":"asAssined"}];
    _val.pageFun.editWorkList = {
        onload:function(){
            _val.server.loadData("user");
            _val.server.loadData("workList");
            form = $("#formEditWorkList_edit");
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
                _val.server.removeData(workList);
            }
            _val.server.sendUpdateQueue();
        },searchWorkList(sortFun){
            var result = $("#formEditWorkList_search_result");
            var form_search = $("#formEditWorkList_search_cond");
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
                return !flag;
            });

            if(sortFun !== undefined && typeof sortFun === "function"){
                workLists =  sortFun(workLists);
            }

            var fun_fillForm = function(workList){
                formNameList.forEach(function(obj){
                    var el = form.find('[name="' + obj.name + '"]');
                    el.val(workList.getValue(obj.key === undefined ? obj.name : obj.key));
                })
                //TODO set detail
            }

            var table = createTable(result,workLists,["edit","leaderIncharge","leaderId","name","caption"],function(cellObj){
                var workList = cellObj.rowData;
                if(cellObj.column === "edit"){
                    var buttons = $('<input type="button" value="フォームに入力"><input type="button" value="削除">').appendTo(cellObj.el);
                    buttons.eq(0).on("click",function(e){fun_fillForm(workList)});
                    buttons.eq(1).on("click",function(e){_val.pageFun.editWorkList.updateWorkList("remove",workList.getValue("_id"))});
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
        }
    };
});