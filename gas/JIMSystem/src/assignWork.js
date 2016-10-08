$(function(){
    var workAssignEditing;
    var form;
    var formNameList = [{"name":"workListId"},{"name":"userId"},{"name":"start"},{"name":"interval"},{"name":"notice"},{"name":"note"},{"name":"disabled"}];
    _val.pageFun.assignWork = {
        onload:function(){
            form = $("#formAssignWork_edit");
            form.find('[name="start_day"]').attr({"min":_val.config.getWorkStartDay(),"max":_val.config.getWorkEndDay()});
            form.find('[name="start_hour"]').on("change",function(e){
                LocalDate.increaseDigit(form.find('[name="start_day"]'),form.find('[name="start_hour"]'),form.find('[name="start_minute"]'));
            });
            form.find('[name="start_minute"]').attr({"min":-LocalDate.getTimeUnitAsConverted("minute"),"step":LocalDate.getTimeUnitAsConverted("minute")}).on("change",function(e){
                LocalDate.increaseDigit(form.find('[name="start_day"]'),form.find('[name="start_hour"]'),form.find('[name="start_minute"]'));
            });
        },onunload:function(){

        },updateWorkAssign:function(kind,_id){
            var workAssign;
            var setValue = {};
            if(kind === "add" || kind === "change"){
                formNameList.forEach(function(obj){
                    var el = form.find('[name="' + obj.name + '"]');
                    var key = obj.key === undefined ? obj.name : obj.key;
                    if(obj.key === "disabled"){
                        setValue[key] = el.prop("checked");
                    }else if(obj.key === "start"){
                        setValue[key] = new LocalDate({"day":form.find('[name="start_day"]'),"hour":form.find('[name="start_hour"]'),"minute":form.find('[name="start_minute"]')});
                    }else{
                        setValue[key] = el.val();
                    }
                })
                //TODO コピペしただけ
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

        }
    };
});