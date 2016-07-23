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
            $("#pass").bind("keydown",function(e){
                if(e.keyCode === 13) _val.pageFun.login.sendPass();
            });
            createModalWindow(ObjToTag({tag:"p",textContent:"loading ... "}).el,function(tag,mvConfig){
                (new Promise(function(resolve){
                    var s = setInterval(function(){
                        if(_val && _val.server && _val.server instanceof Server && _val.server.isReady()){
                            clearInterval(s);
                            resolve();
                            return;
                        }
                    },100);
                })).then(function(){
                    removeModalWindow(mvConfig);
                });
            },true);
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
                    removeAllChildren(document.documentElement).innerHTML = innerHtml;
                }
            });
        },
        loadData:function(){
            
        }
    }
    _val.pageFun.login.onload();
});