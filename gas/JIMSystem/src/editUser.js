$(() => {
    var pageFun;
    var editing;
    var form;
    var formNameList = [{"name":"workListId"}];
    _val.pageFun.editUser = {
        onload:function(){
            _val.server.loadDataAll();
            pageFun = _val.pageFun.editUser;
        },onunload:function(){
        }
    };
});