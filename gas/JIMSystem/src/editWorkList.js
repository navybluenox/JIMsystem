$(function(){
    var workListEditing;
    var form;
    var formNameList = [{"name":"name"},{"name":"nameShort"},{"name":"leaderId"},{"name":"leaderIncharge"},{"name":"description"},{"name":"condition"},{"name":"caption"},{"name":"note"},{"name":"asAssined"}];
    var detailTable;
    _val.pageFun.editWorkList = {
        onload:function(){
            _val.server.loadData("user");
            _val.server.loadData("workList");
            form = $("#formEditWorkList_edit");
            detailTable = form.find('[name="detail"]').siblings("table");
            _val.pageFun.editWorkList.makeDetailTable();
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
                _val.server.removeData(workList).then(function(){
                    _val.pageFun.editWorkList.searchWorkList();
                });
            }
            _val.server.sendUpdateQueue();
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
                //TODO set detail
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
                            str = _val.server.getDataById(workList.getValue("leaderId"),"user")[0].getValue("azusaSendName");
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
        },makeDetailTable:function(){
            //set events
            detailTable.on("click",'[name^="detail_addAllNumber"]',function(e){
                var trigger = $(e.currentTarget);
                var target = detailTable.find('[name^=detail_number_' + trigger.attr("name").replace(/^detail_addAllNumber_$/,"") + '_]');
                target.trigger("click");
            })
            detailTable.on("click",'[name^="detail_number"]',function(e){
                var trigger = $(e.currentTarget);
                var sign = detailTable.find('[name="detail_increment"]').val();
                if(sign === "+"){
                    trigger.val(trigger.val() + 1);
                }else if(sign === "-" && trigger.val() > 1){
                    trigger.val(trigger.val() - 1);
                }
            });
            detailTable.on("click",'[name^="detail_extendInterval"]',function(e,param){
                var trigger = $(e.currentTarget);
                if(param === undefined){
                    param = {};
                    param.detailIndex = +trigger.attr("name").replace(/^detail_extendInterval_/,"");
                    param.start = _val.pageFun.editWorkList.getDetailStart(param.detailIndex);
                    param.interval = detailTable.find('[name="detail_interval_' + param.detailIndex + '"]').val();
                    param.num = 1;
                }



                //TODO


            });
            detailTable.on("click",'[name^="detail_shortenInterval"]',function(e,param){
            });

            
            //生成時に1回、detail_start変更時に実行
            function makeDetailNumberTableHeader(detailIndex){
                //TODO
            }

        },addSection:function(detailObj){
            if(detailObj === undefined)  detailObj = {"start":new LocalDate(),"interval":0,"number":[]};
            var targetRow = detailTable.find('[name="detail_addSection"]').closest("tr");
            var detailNum = detailTable.children("tbody").children("tr").length - 1;
            var tr = $("<tr><td>" + [
                '<input type="checkbox" name="detail_remove_' + detailNum + '">',
                '<input type="button" name="detail_addAllNumber_' + detailNum + '" value="all">',[
                    '<input type="number" name="detail_start_day_' + detailNum + '" value="0" max="' + _val.config.getWorkEndDay() + '" min="' + _val.config.getWorkStartDay() + '">日目',
                    '<input type="number" name="detail_start_hour_' + detailNum + '" value="0" max="23" min="0">時',
                    '<input type="number" name="detail_start_minute_' + detailNum + '" value="0" max="59" min="0" step="' + LocalDate.getTimeUnitAsConverted("minute") +'">分'
                ].join(""),[
                    '<table><tbody><tr></tr><tr><td rowspan="2">',
                        '<input type="button" name="detail_extendInterval_' + detailNum + '" value="延長">',
                        '<input type="button" name="detail_shortenInterval_' + detailNum + '" value="短縮">',
                    '</td></tr></tbody></table>',
                    '<input type="hidden" name="detail_interval_' + detailNum + '" value="' + 0 + '">'
                ].join("")
            ].join("</td><td>") + "</td></tr>").insertBefore(targetRow);

            //TODO set css of numberTable here


            tr.find("td").css({"padding":0,"text-align":"center"});
            tr.find('[type="button"]').css({"min-width":"initial"});
            tr.find('[name^="detail_addAllNumber"]').css({"padding":"0 1em"});
            tr.find('[name^="detail_start"]').css({"width":"3em"});
            tr.find('[name^="detail_number"]').css({"width":"3em"});



        },getDetailStart:function(detailIndex){
            var fun = function(key){return detailTable.find('[name="detail_start_' + key + '_' + detailIndex + '"]');}
            return new LocalDate({
                "day":fun("day"),
                "hour":fun("hour"),
                "minute":fun("minute")
            });
        },getDetailNumber:function(detailIndex){
            var ret = [];
            var target = detailTable.find('[name="detail_number_' + detailIndex + '"]');
            target.map(function(i,_el){
                var el = $(_el);
                var index = +el.attr("name").replace(/^detail_number_(?:\d+)_/,"");
                ret[index] = el.val();
            });
            return ret;
        }
    };
});