$(function(){
    var pageFun;
    _val.pageFun.setting = {
        onload:function(){
            _val.server.loadDataAll();
            pageFun = _val.pageFun.setting;
        },onunload:function(){
        }
    };
});