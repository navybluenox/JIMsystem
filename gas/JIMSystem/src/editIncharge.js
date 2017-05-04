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
            });
            pageFun = _val.pageFun.editIncharge;
            form = $("#formEditIncharge_edit");
            
            form.find(".memberForIncharge,.memberForUser").css({"display":"none"});

        },onunload:() => {
        },updateIncharge:(kind,_id,setData) => {

        },searchIncharge:() => {

        },fillForm:(incharge) => {

        },getFormData:() => {

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
                    if(value === "") return true;
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
        },searchUserForFrom:(nameAttr) => {
        },setMemberSelected:(nameAttr,ids) => {
            var divBody = form.find('[name="' + nameAttr + '_selected"]').siblings("div");
            divBody.children().remove();

            var incharges = _val.server.getData("incharge");

            ids.filter((v,i,s) => s.indexOf(v) === i).forEach(id => {
                var divTr = $("<div class='div-row'></div>");
                var incharge = incharges.find(inch => inch.getValue("_id") === id);
                divBody.append(divTr.css({"display":"table-row"}).data("inchargeid",id));
                var divCell = $("<div>" + pageFun.getInchargeName(incharge) +"</div><div></div>").appendTo(divTr).css({"display":"table-cell"}).eq(1);
                divCell.append('<input type="hidden" name="id" value="' + incharge.getValue("_id") + '"><input type="button" name="top" value="TOP"><input type="button" name="up" value="↑"><input type="button" name="down" value="↓"><input type="button" name="bottom" value="BOTTOM"><input type="button" name="remove" value="REMOVE">');
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
        },getInchargeIdSelected:(nameAttr) => {
            //divの表からデータを取得
            var divBody = form.find('[name="' + nameAttr + '_selected"]').siblings("div");

            var divTr = divBody.children("div");

            return divTr.map((i,el) => $(el).data("inchargeid")).get();
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

                let ids_selected = pageFun.getInchargeIdSelected(nameAttr);

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