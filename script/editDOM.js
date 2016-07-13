//  ---About This---
/*
名前
    htmlService.js

依存ファイル
    include.js

このファイルについて
    Googleの提供しているHTMLServiceというWebアプリを作成するためのサービスで使用します
    主に、clinentサイドとserverサイドの橋渡しになる関数や、
    ページ遷移・セッション管理などのウェブアプリの基幹となる関数が入っています

定義一覧
    */

function getHtmlFromServer(pageName){
    return runServerFun("getHtmlFromServer",[pageName]);
}

function movePage(pageName,insertTag){
    return getHtmlFromServer(pageName)
    .then(function(v){
        if(insertTag !== undefined){
            insertTag.innerHTML = v;
        }
        return v;
    }).then(function(v){
        if(_tmp.pageFun && _tmp.pageFun[pageName] && _tmp.pageFun[pageName].onload){
            _tmp.pageFun[pageName].onload();
        }
    })
}


function removeAllChildren(node){
    while(node.firstChild){
        node.removeChild(node.firstChild);
    }
    return node;
}
function ObjToTag(obj,parent){
    if(typeof obj != "object" || obj == null || Object.keys(obj).length === 0) return;
    var result = {};
    var el = document.createElement(obj.tag);
    Object.keys(obj).forEach(function(key){
        if(key == "tag" || key == "child" ) return;
        if(key == "fun"){
            obj[key].apply(el);
            return;
        }
        el[key] = obj[key];
    });
    if(parent != null){
        parent.appendChild(el);
    }
    result = {tag:obj.tag,el:el};
    if(obj.child != null){
        result.child = [];
        obj.child.forEach(function(key){
            var r = ObjToTag(key,el);
            if(typeof r != "undefined"){
                result.child.push(r);
            }
        });
    }
    return result;
}






