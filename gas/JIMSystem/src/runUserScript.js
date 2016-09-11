$(function(){
    _val.pageFun.runUserScript = {
        onload:function(){
            var textarea = $("#formRunUserScript textarea");
            textarea.on("keydown",function(e){
                if(e.ctrlKey && e.keyCode === 13){
                    _val.pageFun.runUserScript.runScript();
                }
            })
            var script = localStorage.getItem("userScript");
            if(script !== null){
                textarea.val(script);
            }

            var timer;
            textarea.on("change",function(){
                if(timer !== undefined) clearTimeout(timer);
                timer = setTimeout(function(){
                    localStorage.setItem("userScript",textarea.val());
                },200);
            })
        },
        runScript:function(){
            var form = $("#formRunUserScript");
            var content = form.find("textarea").val();
            eval(content);
        }
    };
});