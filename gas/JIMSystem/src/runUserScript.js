$(function(){
    var pageFun;
    _val.pageFun.runUserScript = {
        onload:function(){
            _val.server.loadDataAll();
            pageFun = _val.pageFun.runUserScript;
            var textarea = $("#formRunUserScript textarea");
            textarea.on("keydown",function(e){
                if(e.ctrlKey && e.keyCode === 13){
                    pageFun.runScript();
                }
                if(e.ctrlKey && e.shiftKey && e.keyCode === 83){
                    localStorage.setItem("userScript",textarea.val());
                    var el = $("<p>保存しました</p>").appendTo($("#formRunUserScript"));
                    setTimeout(function(){
                        el.remove();
                    },3000)
                }
            })
            var script = localStorage.getItem("userScript");
            if(script !== null){
                textarea.val(script);
            }

            var dr = new DelayRun(function(){
                localStorage.setItem("userScript",textarea.val());
            },200);
            textarea.on("change",function(){
                dr.runLater();
            })
        },
        runScript:function(){
            if(!checkAuthorization("_val.pageFun.runUserScript.runScript")) return;
            var form = $("#formRunUserScript");
            var content = form.find("textarea").val();
            var div = $("#formRunUserScript_div");
            var server = _val.server;
            eval(content);
        }
    };
});