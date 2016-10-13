$(function(){
    var form;
    var formNameList = [{"name":"name"},{"name":"member"},{"name":"isColorGroup"},{"name":"backgroundColor"},{"name":"fontColor"}];
    var editing;
    var getCollName = function(){return $("#editGroup_kind").val()};
    _val.pageFun.editGroup = {
        onload:function(){
            form = $("#formEditGroup");
        },onunload:function(){
        
        },updateGroup:function(kind,_id){
            var group;
            var setValue = {};
            var GroupClass = Datapiece.getClassByName(getCollName());
            if(kind === "add" || kind === "change"){
                formNameList.forEach(function(obj){
                    var el = form.find('[name="' + obj.name + '"]');
                    var key = obj.key === undefined ? obj.name : obj.key;
                    if(key === "isColorGroup"){
                        setValue[key] = el.prop("checked");
                    }else if(key === "member"){
                        //TODO
                        setValue[key] = [];
                    }else{
                        setValue[key] = el.val();
                    }
                })
                if(kind === "change"){
                    if(editing === undefined){
                        alert("値を変更する人割が指定されていません\n下の「検索」から変更したい人割を選択し、フォームへ入力してください");
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
                _val.pageFun.editGroup.searchGroup();
            });

        },searchGroup:function(sortFun){
            var result = $("#formEditGroup_search_result");
            var form_search = $("#formEditGroup_search_cond");

            result.children().remove();
            result.append("<h3>検索結果</h3>");

            var cond = {};
            ["groupName","isColorGroup"].forEach(function(name){
                cond[name] = form_search.find('[name="' + name + '"]').val();
            })
            var groups = _val.server.getData(getCollName()).filter(function(group){
                var flag = true;
                if(cond.groupName !== ""){
                    flag = flag && (new RegExp(cond.groupName)).test(group.getValue("name"));
                }
                if(cond.isColorGroup !== ""){
                    flag = flag && ((cond.isColorGroup === "y") === group.getValue("isColorGroup"));
                }
                return flag;
            });

            if(sortFun !== undefined && typeof sortFun === "function"){
                groups =  sortFun(groups);
            }else{
                groups = Datapiece.sort(groups,["isColorGroup","name"]);
            }

            var fun_fillForm = function(group){
                formNameList.forEach(function(obj){
                    var el = form.find('[name="' + obj.name + '"]');
                    var key = obj.key === undefined ? obj.name : obj.key;
                    if(key === "isColorGroup"){
                        el.prop("checked",group.getValue(key));
                    }else if(key === "member"){
                        //TODO
                    }else{
                        el.val(group.getValue(key));
                    }
                });
            }

            var table = createTable(result,groups,["edit","name","isColorGroup"],function(cellObj){
                var group = cellObj.rowData;
                if(cellObj.column === "edit"){
                    var buttons = $('<input type="button" value="フォームに入力"><input type="button" value="削除">').appendTo(cellObj.el);
                    buttons.eq(0).on("click",function(e){fun_fillForm(group);editing = group;});
                    buttons.eq(1).on("click",function(e){_val.pageFun.editGroup.updateGroup("remove",group.getValue("_id"));});
                }else{
                    var str;
                    switch(cellObj.column){
                        case "name":
                            str = cellObj.value;
                            break;
                        case "isColorGroup":
                            str = (cellObj.value ? "Yes" : "No");
                            break;
                    }
                    cellObj.el.text(str);
                }
            },{"header":["edit","グループ名","カラーグループ"]});
            table.el.css({"margin":"3em"});
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