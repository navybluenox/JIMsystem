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

function getPageFromServer(pageName){
    return runServerFun("getPage",[pageName]);
}

function movePage(pageName,insertTag){
    if(typeof insertTag === "string"){
        switch(insertTag){
            case "content":
                insertTag = document.getElementById("content");
                break;
        }
    }
    return getPageFromServer(pageName)
    .then(function(v){
        if(insertTag !== undefined){
            insertTag.innerHTML = v;
        }
        return v;
    }).then(function(v){
        if(_val.pageFun && _val.pageFun[pageName] && _val.pageFun[pageName].onload){
            _val.pageFun[pageName].onload();
        }
    });
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

function createModalWindow(html,callback,disableRemoveMWByClick){
    var parent = document.getElementById("modalWindow");
    var modalContent = document.createElement("div");
    modalContent.className = "modalContent";
    
    setStyleModalContent();
    parent.appendChild(modalContent);
    modalContent.appendChild(html);
    var modalOverlay = document.createElement("div");
    var configObj = {
        parent:parent,
        modalContent:modalContent,
        modalOverlay:modalOverlay
    };
    $(modalOverlay).css({
        "z-index":"1",
        display:"none",
        position:"fixed",
        top:"0",
        left:"0",
        width:"100%",
        height:"120%",
    	"background-color":"rgba(0,0,0,0.75)"
    });
    $("body").append(modalOverlay);
    $(modalOverlay).fadeIn("fast");

    centeringModal();
    $(modalContent).fadeIn("slow");
    
    if(typeof callback == "function"){
        callback(html,configObj,modalOverlay);
    }
    if(disableRemoveMWByClick !== true){
        $(modalOverlay).unbind().click(function(){
            removeModalWindow(configObj);
        });
    }
    var timer = false;
    $(window).resize(function(){
        if(timer !== false) clearTimeout(timer);
        timer = setTimeout(function(){
            centeringModal();
            setStyleModalContent();
            $(modalContent).css("display","");
        },200);
    })
    return configObj;

    function centeringModal(){
        $(modalContent).css({
            left:(($(window).width() - $(modalContent).outerWidth())/2) + "px",
            top:(($(window).height() - $(modalContent).outerHeight())/2)*(2/3) + "px"
        });
    }
    function setStyleModalContent(){
        $(modalContent).css({
            width:"60%",
            margin:"0",
            padding:"1ex 1em",
            border:"2px solid #aaa",
            background:"#fff",
            position:"fixed",
            display:"none",
            "z-index":"2"
        });
    }
}

function removeModalWindow(configObj){
    $(configObj.modalOverlay).remove();
    removeAllChildren(configObj.parent);
}



