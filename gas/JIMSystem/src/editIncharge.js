$(() => {
    var pageFun;
    var editing;
    var form;
    var formNameList = [{"name":"workListId"}];
    _val.pageFun.editIncharge = {
        onload:function(){
            _val.server.loadDataAll();
            pageFun = _val.pageFun.editIncharge;
        },onunload:function(){
        }
    };
});