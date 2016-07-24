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

function createTable(data,parent,callback,option){
    if(option === undefined)  option = {};
    if(typeof callback !== "function")  callback = function(){};
    $(parent).append("<table><thead></thead><tbody></tbody></table>");

    var _data = data.map(function(v){
        if(v instanceof Datapiece){
            return v.getValues();
        }else{
            return v;
        }
    })

    //make header
    var columnSample = (option.columnSample === undefined ? _data[0] : option.columnSample);
    var nowColIndex = 0;
    var nowLevel = 0;
    var headerPatternObj;
    var headerPattern = [];

    headerPatternObj = makeHeaderPattern_1(columnSample,-1);
    makeHeaderPattern_2(headerPatternObj.value);
    
    $(parent).find("table thead").append(headerPattern.map(function(arr){
        return "<tr>" + arr.map(function(obj){
            var r = "<th";
            if(obj.colSpan !== undefined) r += " colSpan = '" + obj.colSpan + "'";
            if(obj.rowSpan !== undefined) r += " rowSpan = '" + obj.rowSpan + "'";
            r += ">" + obj.key + "</th>";
            return r;
        }).join("") + "</tr>";
    }).join(""));

    $(parent).find("table tbody").append(
        (new Array(_data.length+1)).join("<tr>" + (new Array(nowColIndex+1)).join("<td></td>") + "</tr>")
    );

    _data.forEach(function(dp,index){
        var pJqObj = $(parent).find("table tbody tr").eq(index);
        fun(headerPatternObj,dp,[]);

        function fun(hpo,dpo,keyArray){
            var jqObj;
            var text;
            if(hpo.value === undefined){
                jqObj = pJqObj.children("td").eq(hpo.start);
                if(dpo instanceof Date){
                    text = dateToValue(dpo).str;
                }else if(dpo instanceof LocalDate){
                    text = dateToValue(dpo.getAsDate()).str;
                }else{
                    text = dpo;
                }
                jqObj.text(text);
                callback({datapiece:data[index],el:jqObj[0],value:dpo,key:keyArray});
            }else{
                Object.keys(hpo.value).forEach(function(key){
                    var arr = keyArray.slice();
                    arr.push(key);
                    fun(hpo.value[key],dpo[key],arr);
                })
            }
        }
    })


    function makeHeaderPattern_1(colSamObj,level){
        var result;
        if(level > nowLevel)  nowLevel = level;
        switch(classof(colSamObj)){
            case "object":
                result = {value:{},start:-1,end:-1,level:level};
                level++;
                Object.keys(colSamObj).forEach(function(key){
                    result.value[key] = makeHeaderPattern_1(colSamObj[key],level);
                    if(result.start == -1 || result.start > result.value[key].start)  result.start = result.value[key].start;
                    if(result.end == -1 || result.end < result.value[key].end)  result.end = result.value[key].end;                  
                });
                break;
            case "array":
                result = {value:{},start:-1,end:-1,level:level};
                level++;
                colSamObj.forEach(function(v,key){
                    result.value[key] = makeHeaderPattern_1(v,level);
                    if(result.start == -1 || result.start > result.value[key].start)  result.start = result.value[key].start;
                    if(result.end == -1 || result.end < result.value[key].end)  result.end = result.value[key].end;                  
                })
                break;
            case "date":
            case "localdate":
            case "number":
            case "string":
            case "boolean":
                result = {start:nowColIndex,end:nowColIndex,level:level};
                nowColIndex++;
                break;
            default:
                throw new Error();
        }
        return result;
    }

    function makeHeaderPattern_2(headParObj){
        Object.keys(headParObj)
        .sort(function(a,b){
            return headParObj[a].start - headParObj[b].start;
        })
        .forEach(function(key){
            var obj = headParObj[key];
            var r = {key:key};
            if(headerPattern[obj.level] === undefined)  headerPattern[obj.level] = [];
            if(obj.level !== nowLevel && obj.value === undefined)  r.rowSpan = nowLevel - obj.level + 1;
            if(obj.start !== obj.end)  r.colSpan = obj.end - obj.start + 1;
            headerPattern[obj.level].push(r);
            if(obj.value !== undefined)  makeHeaderPattern_2(obj.value);
        });
    }



}
