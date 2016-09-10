$(function(){
    _val.pageFun.runUserScript = {
        onload:function(){

        },
        runScript:function(){
            var form = $("#formRunUserScript");
            var content = form.find("textarea").text();
            eval(content);
        }
    };
});