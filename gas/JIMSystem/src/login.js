//  ---About This---
/*
名前
    login.js
このファイルについて

定義一覧
    ○○
        説明
        引数
*/

$(function(){
    _val.pageFun.login = {
        onload:function(){
            $(window).on("error",function(e){
                console.log("Uncaught Error!");
                console.log("eventObject",e.originalEvent);
                console.log("errorObject",e.originalEvent.error);
                alert(["予期せぬエラーが発生しました。","再現性がある場合、管理者まで報告してください。","//ブラウザのログにエラーの詳細がのっているから、PCの画面を見せてくれたほうが助かる",
                [
                    "Message:" + e.originalEvent.message,
                    "Line:" + e.originalEvent.lineno,
                    "Column:" + e.originalEvent.colno,
                    "filename:" + e.originalEvent.filename
                ].join("\n")].join("\n"));
            });
            $("#pass").on("keydown",function(e){
                if(e.keyCode === 13) _val.pageFun.login.sendPass();
            });
            var mw = new ModalWindow({"html":"<p>loading ... </p>","disableClickBackground":true});
            mw.$el.find("p").css({"text-align":"center"});
            mw.setContentStyle({"font-size":"2em","font-weight":"bold","width":"auto"});
            new Promise(function(resolve){
                var s = setInterval(function(){
                    if(_val && _val.server && _val.server instanceof Server && _val.server.isReady()){
                        clearInterval(s);
                        resolve();
                        return;
                    }
                },100);
            }).then(function(){
                mw.remove();
            });
        },
        sendPass:function(){
            var pass = $("#pass").val();
            runServerFun("checkPass",[pass,"main"])
            .then(function(innerHtml){
                if(innerHtml === null){
                    var el = document.createElement("p");
                    el.textContent = "パスワードが間違っています";
                    document.getElementById("passdiv").appendChild(el);
                }else{
                    _val.pageFun.login.loadData();
                    $(document.documentElement).children().remove();
                    document.documentElement.innerHTML = innerHtml;
                }
            });
        },
        loadData:function(){
            
        }
    }
    _val.pageFun.login.onload();
});