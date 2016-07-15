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

_tmp.pageFun.login = {
    onload:function(){
        $("#pass").bind("keydown",function(e){
            if(e.keyCode === 13) _tmp.pageFun.login.sendPass();
        });
    },
    sendPass:function(){
        var pass = $("#pass").val();
        runServerFun("this_checkPass",[pass,"main"])
        .then(function(innerHtml){
            if(innerHtml === null){
                var el = document.createElement("p");
                el.textContent = "パスワードが間違っています";
                document.getElementById("passdiv").appendChild(el);
            }else{
                _tmp.pageFun.login.loadData();
                removeAllChildren(document.documentElement).innerHTML = innerHtml;
            }
        });
    },
    loadData:function(){
        
    }
}


_tmp.pageFun.login.onload();
