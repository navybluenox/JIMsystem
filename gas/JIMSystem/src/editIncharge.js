$(() => {
    var pageFun;
    var editing;
    var form;
    var formNameList = [{"name":"name"},{"name":"code"},{"name":"parentIncharge"},{"name":"member"},{"name":"relevantIncharge"},{"name":"isInvisible"},{"name":"isAllParent"}];
    _val.pageFun.editIncharge = {
        onload:() => {
            _val.server.loadDataAll().then(() => {
                form.find('[name$="_cond_nth"]').append(
                    '<option value="">指定なし</option>' +
                    Incharge.getAllOfAllParents()
                        .map(incharge => '<option value="' + incharge.getValue("_id") +'">' + incharge.getName() + '</option>')
                        .join("")
                );
                var form_search_cond = $("#formEditIncharge_search_cond");
                form_search_cond.find('[name="nth"]').append(
                    Incharge.getAllOfAllParents().map(incharge => '<option value="' + incharge.getValue("_id") + '">' + incharge.getName() + '</option>').join("")
                ).on("change",e => {
                    var division = form_search_cond.find('[name="division"]');
                    division.children().remove();
                    var incharge = _val.server.getDataById(form_search_cond.find('[name="nth"]').val(),"incharge")[0];
                    division.append(
                        '<option value="all">指定なし</option>' +
                        Incharge.getInchargesInOrder(incharge.getName())
                            .filter(incharge => incharge.isDivision())
                            .map(incharge => '<option value="' + incharge.getValue("_id") + '">' + incharge.getValue("code") + '</option>').join("")
                    )
                    pageFun.searchIncharge();
                }).trigger("change");
            });
            pageFun = _val.pageFun.editIncharge;
            form = $("#formEditIncharge_edit");
            
            form.find(".memberForIncharge,.memberForUser").css({"display":"none"});

            form.find('[name="member_kind"]').on("change",e => {
                var select = $(e.currentTarget);
                form.find(".memberForIncharge,.memberForUser").css({"display":"none"});
                if(select.val() === "user"){
                    form.find(".memberForUser").css({"display":""});                    
                    pageFun.searchInchargeForForm("member",pageFun.getMemberSelected("member"));
                }else{
                    form.find(".memberForIncharge").css({"display":""});
                    pageFun.searchInchargeForForm("member",pageFun.getMemberSelected("member"));
                }
            });

        },onunload:() => {
        },updateIncharge:(kind,_id,setData) => {
            var incharge;
            if(kind === "add" || kind === "change"){
                incharge = pageFun.getFormData();
                if(kind === "change"){
                    if(editing === undefined){
                        alert("値を変更するグループが指定されていません\n下の「検索」から変更したい人割を選択し、フォームへ入力してください");
                        return;
                    }
                    incharge.setValues({"_id":editing.getValue("_id")});
                }
                if(kind === "add"){
                    _val.server.addData(incharge);
                }else{
                    _val.server.changeData(incharge);
                }
            }else if(kind === "remove"){
                incharge = new Incharge({"_id":_id});
                _val.server.removeData(incharge);
            }
            _val.server.sendUpdateQueue().then(function(){
                pageFun.searchIncharge();
            });
        },searchIncharge:() => {
            var result = $("#formEditIncharge_search_result");
            var form_search = $("#formEditIncharge_search_cond");

            var incharges = Incharge.getAllOfAllParents()
                .map(incharge => Incharge.getInchargesInOrder(incharge.getName()))
                .reduce((prev,curt) => prev.concat(curt),[]);

            result.children().remove();

            var cond = {};
            ["name","nth","division","code"].forEach(name => {
                cond[name] = form_search.find('[name="' + name +'"]').val();
            });
            incharges = incharges.filter(incharge => {
                var flag = true;

                if(cond.name !== ""){
                    flag = flag && (new RegExp(cond.name)).test(incharge.getValue("name"));
                }
                if(cond.nth !== "all"){
                    let allParent = incharge.getAllParent();
                    flag = flag && allParent.getValue("_id") === cond.nth;
                }
                if(cond.division !== "all"){
                    let division = incharge.getDivision();
                    flag = flag && division !== null && division.getValue("_id") === cond.division;
                }
                if(cond.code !== ""){
                    flag = flag && (new RegExp(cond.code)).test(incharge.getValue("code"));
                }
                return flag;
            });

            var table = createTable(result,incharges,["edit","code","name"],(cellObj) => {
                var incharge = cellObj.rowData;
                if(cellObj.column === "edit"){
                    var buttons = $('<input type="button" value="フォームに入力"><input type="button" value="削除">').appendTo(cellObj.el);
                    buttons.eq(0).on("click",e => {pageFun.fillForm(incharge);editing = incharge;});
                    buttons.eq(1).on("click",e => {pageFun.updateIncharge("remove",incharge.getValue("_id"));});
                }else if(cellObj.column === "code"){
                    cellObj.el.text(incharge.getName());
                }else if(cellObj.column === "name"){
                    cellObj.el.text(incharge.getValue("name"));
                }
            },{"header":["edit","略称","担当名"]});
            table.el.css({"margin":"3em"});


        },fillForm:(incharge) => {
            form.find('[name="member_kind"]').val(incharge.isEndChild() ? "user" : "incharge");
            pageFun.searchInchargeForForm("member",incharge.getValue("member").map(obj => obj.id));
            pageFun.searchInchargeForForm("relevantIncharge",incharge.getValue("relevantIncharge"));
            pageFun.searchInchargeForForm("parentIncharge");
            form.find('[name="editing"]').val(incharge.getValue("_id"));
            formNameList.forEach(obj => {
                var el = form.find('[name="' + obj.name + '"]');
                var key = obj.key === undefined ? obj.name : obj.key;
                if(key === "member"){
                    pageFun.setMemberSelected(key,incharge.getValue(key).map(obj => obj.id));
                }else if(key === "relevantIncharge"){
                    pageFun.setMemberSelected(key,incharge.getValue(key));
                }else if(inArray(["isInvisible","isAllParent"],key)){
                    el.val(incharge.getValue(key) ? "Yes" : "No");
                }else{
                    el.val(incharge.getValue(key));
                }
            });
        },getFormData:() => {
            var setValue = {};
            formNameList.forEach(function(obj){
                var el = form.find('[name="' + obj.name + '"]');
                var key = obj.key === undefined ? obj.name : obj.key;
                if(key === "member"){
                    var ids = pageFun.getMemberSelected(key);
                    var kind = form.find('[name="' + key + '_kind"]').val();
                    setValue[key] = ids.map(id => {return {"id":id,"dataName":kind}});
                }else if(key === "relevantIncharge"){
                    setValue[key] = pageFun.getMemberSelected(key);
                }else if(inArray(["isInvisible","isAllParent"],key)){
                    setValue[key] = (el.val() === "Yes");
                }else{
                    setValue[key] = el.val();
                }
            });
            return (new Incharge()).setValues(setValue);
        },searchInchargeForForm:(nameAttr,skipIds) => {
            skipIds = skipIds === undefined ? [] : skipIds;
            var result = form.find('[name="' + nameAttr + '"]'),
                isMultiple = false;
            if(result.length === 0){
                result = form.find('[name="' + nameAttr + '_list"]');
                isMultiple = true;
            }

            result.children().remove();

            var condEl = {};
            ["nth","division","code","name"].forEach(key => condEl[key] = form.find('[name="' + nameAttr + '_cond_' + key +'"]'));
            var incharges = (
                condEl.nth.val() === "" ?
                Incharge.getAllOfAllParents().map(inch => inch.getMemberIncharges(true)).reduce((prev,curt) => prev.concat(curt),[]) :
                _val.server.getDataById(condEl.nth.val(),"incharge")[0].getMemberIncharges(true)
            ).filter(incharge => {
                if(inArray(skipIds,incharge.getValue("_id")))  return false;
                return Object.keys(condEl).every(key => {
                    var value = condEl[key].val();
                    if(value === "" || value === null) return true;
                    switch(key){
                        case "nth":
                            return incharge.getAllParent().getValue("_id") === value;
                            break;
                        case "division":
                            return incharge.isAllParent() ? false : incharge.getDivision().getValue("_id") === value;
                            break;
                        case "code":
                        case "name":
                            return (new RegExp(value)).test(incharge.getValue(key));
                            break;
                    }
                });
            });

            incharges.forEach(incharge => {
                if(incharge.isAllParent() || incharge.isDivision()){
                    result.append('<optgroup label="' + incharge.getName() +'"></optgroup>')
                }
                result.append('<option value="' + incharge.getValue("_id") +'">' + pageFun.getInchargeName(incharge) +'</option>');
            });

            if(isMultiple){
                result.attr("size",Math.min(result.find("option,optgroup").length,20)).find("option,optgroup").css({"text-align":"left"});
            }

        },searchDivisionForForm:(nameAttr) => {
            var nth = form.find('[name="' + nameAttr + '_cond_nth"]');
            var division = form.find('[name="' + nameAttr + '_cond_division"]');
            var _incharge = _val.server.getData("incharge");
            var nthValue = nth.val();

            division.children().remove();
            division.append('<option value="">指定なし</option>');
            if(nthValue !== ""){
                _incharge.find(incharge => nthValue === incharge.getValue("_id")).getValue("member").forEach(obj => {
                    var _inch = _incharge.find(inch => inch.getValue("_id") === obj.id);
                    division.append('<option value="' + _inch.getValue("_id") + '">' + _inch.getValue("code") +'</option>');
                });
            }
        },searchUserForFrom:(nameAttr,skipIds) => {
            //TODO
        },setMemberSelected:(nameAttr,ids) => {
            var divBody = form.find('[name="' + nameAttr + '_selected"]').siblings("div");
            divBody.children().remove();

            var kind_el = form.find('[name="' + nameAttr + '_kind"]');

            var kind = kind_el.length === 0 ? "incharge" : kind_el.val();

            var datapieces = _val.server.getData(kind);
            ids.filter((v,i,s) => s.indexOf(v) === i).forEach(id => {
                var divTr = $("<div class='div-row'></div>");
                var datapiece = datapieces.find(inch => inch.getValue("_id") === id);
                divBody.append(divTr.css({"display":"table-row"}).data("id",id));
                var divCell = $("<div>" + (kind === "incharge" ? pageFun.getInchargeName(datapiece) : datapiece.getName()) +"</div><div></div>").appendTo(divTr).css({"display":"table-cell"}).eq(1);
                divCell.append('<input type="hidden" name="id" value="' + datapiece.getValue("_id") + '"><input type="button" name="top" value="TOP"><input type="button" name="up" value="↑"><input type="button" name="down" value="↓"><input type="button" name="bottom" value="BOTTOM"><input type="button" name="remove" value="REMOVE">');
                divTr.css({"white-space":"pre"});
            });

            divBody.on("click",'input[type="button"]',e => {
                var button = $(e.currentTarget);
                var divTr = button.closest("div.div-row");
                var kind = button.attr("name");
                var indexDiv = divBody.children("div").index(divTr);

                if(
                    (indexDiv === 0 && (kind === "top" || kind === "up")) ||
                    (indexDiv === divBody.children("div").length-1 && (kind === "bottom" || kind === "down"))
                ){
                    //一番上か一番下で動かせない
                    return null;
                }

                if(kind === "top" || kind === "bottom"){
                    let target = divBody.children("div").eq(kind === "top" ? 0 : -1);
                    if(kind === "top"){
                        target.before(divTr);
                    }else{
                        target.after(divTr);
                    }
                }else if(kind === "up" || kind === "down"){
                    let target = (kind === "up" ? divTr.prev() : divTr.next());
                    if(kind === "up"){
                        target.before(divTr);
                    }else{
                        target.after(divTr);
                    }
                }else if(kind === "remove"){
                    divTr.remove();
                }
            });
        },getMemberSelected:(nameAttr) => {
            //divの表からデータを取得
            var divBody = form.find('[name="' + nameAttr + '_selected"]').siblings("div");

            var divTr = divBody.children("div");

            return divTr.map((i,el) => $(el).data("id")).get();
        },getInchargeName:(incharge) => {
            return incharge.isEndChild() ? incharge.getName() : incharge.getName() + "(" + incharge.getValue("name") + ")";
        },moveMember:(nameAttr,type) => {
            var target_list = form.find('[name="' + nameAttr + '_list"]');
            var target_selected = form.find('[name="' + nameAttr + '_selected"]').siblings("div");
            var incharges = _val.server.getData("incharge");

            if(type === "add"){
                let selectedIds = target_list.val();
                selectedIds = selectedIds === null ? [] : selectedIds;

                let incharges_list = target_list.find("option").map((i,el) => {
                    return $(el).attr("value");
                }).get().filter(id => !inArray(selectedIds,id)).map(id => incharges.find(inch => inch.getValue("_id") === id));

                let ids_selected = pageFun.getMemberSelected(nameAttr);

                target_list.children().remove()

                let result = form.find('[name="' + nameAttr + '"]'),
                    isMultiple = false;
                if(result.length === 0){
                    result = form.find('[name="' + nameAttr + '_list"]');
                    isMultiple = true;
                }

                incharges_list.forEach(incharge => {
                    if(incharge.isAllParent() || incharge.isDivision()){
                        result.append('<optgroup label="' + incharge.getName() +'"></optgroup>')
                    }
                    result.append('<option value="' + incharge.getValue("_id") +'">' + pageFun.getInchargeName(incharge) +'</option>');
                });

                pageFun.setMemberSelected(nameAttr,ids_selected.concat(selectedIds));
            }
        }
    };
});