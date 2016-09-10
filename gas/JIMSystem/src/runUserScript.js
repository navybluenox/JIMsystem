$(function(){
    _val.pageFun.runUserScript = {
        onload:function(){
            $("#formRunUserScript textarea").on("keydown",function(e){
                if(e.ctrlKey && e.keyCode === 13){
                    _val.pageFun.runUserScript.runScript();
                }
            })
        },
        runScript:function(){
            var form = $("#formRunUserScript");
            var content = form.find("textarea").val();
            eval(content);
        }
    };
});