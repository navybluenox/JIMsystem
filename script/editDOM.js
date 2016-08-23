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

function createTable(data,parent,level,callback,option){
    if(option === undefined)  option = {};
    if(typeof callback !== "function")  callback = function(obj){obj.el.textContent = obj.value};
    if(level === undefined)  level = 0;
    $(parent).append("<table class='tableLevel_'"+ level + "><thead></thead><tbody></tbody></table>");

    //make header
    var columnSample;
    var nowColIndex = 0;
    var nowLevel = 0;
    var headerPatternObj;
    var headerPattern = [];
    var colList = [];
    var tableSelector = "table.tableLevel_" + level + " ";

    if(option.columnSample === undefined){
        columnSample = editColumnSample(data);
    }else{
        columnSample = option.columnSample;
    }
    headerPatternObj = makeHeaderPattern_1(columnSample,-1);
    makeHeaderPattern_2(headerPatternObj.value);
    
    //create tags
    $(parent).find(tableSelector + "thead").append(headerPattern.map(function(arr){
        return "<tr>" + arr.map(function(obj){
            var r = "<th";
            if(obj.colSpan !== undefined) r += " colSpan = '" + obj.colSpan + "'";
            if(obj.rowSpan !== undefined) r += " rowSpan = '" + obj.rowSpan + "'";
            r += ">" + obj.key + "</th>";
            return r;
        }).join("") + "</tr>";
    }).join(""));

    $(parent).find(tableSelector + "tbody").append(
        (new Array(data.length+1)).join("<tr>" + (new Array(nowColIndex+1)).join("<td></td>") + "</tr>")
    );

    //run callback
    data.forEach(function(dp,rowIndex){
        var pJqObj = $(parent).find(tableSelector + "tbody tr").eq(rowIndex);

        colList.forEach(function(col,colIndex){
            var value = dp;
            col.find(function(key){
                value = value[key]
                return (value === undefined);
            });
            callback({rowData:dp,el:pJqObj.find("td").eq(colIndex)[0],value:value,key:col});
        })
    })

    //TODO
    //add header,footer,leftColumn,rightColumn
    //need callback,number(of rows/columns)

    if(option.leftColumn !== undefined){
        if(!Array.isArray(option.leftColumn.key))  option.leftColumn.key = [option.leftColumn.key];
        if(!Array.isArray(option.leftColumn.callback))  option.leftColumn.callback = [option.leftColumn.callback];
        var addedColumnNum = option.leftColumn.key.length;

        $(parent).find(tableSelector + "thead tr").eq(0).prepend((new Array(addedColumnNum+1)).join("<th rowSpan='" + headerPattern.length + "'></th>"));
        $(parent).find(tableSelector + "tbody tr").prepend((new Array(addedColumnNum+1)).join("<td></td>"));

        data.forEach(function(dp,rowIndex){
            for(var i=0; i<addedColumnNum; i++){
                $(parent).find(tableSelector + "thead tr").eq(0).find("th").eq(i).text(option.leftColumn.key[i]);
                option.leftColumn.callback[i]({
                    rowData:dp,
                    el:$(parent).find(tableSelector + "tbody tr").eq(rowIndex).find("td").eq(i)[0],
                    key:option.leftColumn.key[i]
                });
            }
        })
        headerPattern[0] = option.leftColumn.key.map(function(v){
            return {key:v,rowSpan:headerPattern.length};
        }).concat(headerPattern[0]);
        colList = option.leftColumn.key.map(function(v){
            return [v];
        }).concat(colList);
    }

    if(option.rightColumn !== undefined){
        if(!Array.isArray(option.rightColumn.key))  option.rightColumn.key = [option.rightColumn.key];
        if(!Array.isArray(option.rightColumn.callback))  option.rightColumn.callback = [option.rightColumn.callback];
        var addedColumnNum = option.rightColumn.key.length;

        $(parent).find(tableSelector + "thead tr").eq(0).append((new Array(addedColumnNum+1)).join("<th rowSpan='" + headerPattern.length + "'></th>"));
        $(parent).find(tableSelector + "tbody tr").append((new Array(addedColumnNum+1)).join("<td></td>"));

        data.forEach(function(dp,rowIndex){
            for(var i=0; i<addedColumnNum; i++){
                $(parent).find(tableSelector + "thead tr").eq(0).find("th").eq(-addedColumnNum+i).text(option.rightColumn.key[i]);
                option.rightColumn.callback[i]({
                    rowData:dp,
                    el:$(parent).find(tableSelector + "tbody tr").eq(rowIndex).find("td").eq(-addedColumnNum+i)[0],
                    key:option.rightColumn.key[i]
                });
            }
        });
        headerPattern[0] = headerPattern[0].concat(option.rightColumn.key.map(function(v){
            return {key:v,rowSpan:headerPattern.length};
        }));
        colList = colList.concat(option.rightColumn.key.map(function(v){
            return [v];
        }));
    }

    if(option.bottomRow !== undefined){
        if(!Array.isArray(option.bottomRow.key))  option.bottomRow.key = [option.bottomRow.key];
        if(!Array.isArray(option.bottomRow.callback))  option.bottomRow.callback = [option.bottomRow.callback];
        var addedRowNum = option.bottomRow.key.length;

        $(parent).find(tableSelector + "tbody").append((new Array(addedRowNum+1)).join("<tr></tr>"));

        option.bottomRow.createCell.forEach(function(flag,i){
            var thisRowJqo = $(parent).find(tableSelector + "tbody tr").eq(-addedRowNum+i);
            if(flag){
                thisRowJqo.append((new Array(colList.length+1)).join("<td></td>"));
                colList.forEach(function(col,colIndex){
                    option.bottomRow.callback[i]({
                        el:thisRowJqo.find("td").eq(colIndex)[0],
                        key:col
                    });
                });
            }else{
                option.bottomRow.callback[i]({
                    el:thisRowJqo[0],
                    colList:colList
                })
            }
        })

    }

    //TODO
    function editColumnSample(_d){
        var ret = {};
        _d.forEach(function(d){
            fun(ret,d);
        })

        function fun(r,d){
            var classOf_d = classof(d);
            switch(classOf_d){
                case "object":
                    if(r === undefined) r = {};
                    Object.keys(d).forEach(function(key){
                        var v;
                        if(d[key] !== undefined){
                            v = fun(r[key],d[key]);
                            if(r[key] === undefined)  r[key] = v;
                        }
                    });
                    break;
                case "array":
                    if(r === undefined) r = [];
                    d.forEach(function(dp,i){
                        var v;
                        if(dp !== undefined){
                            v = fun(r[i],dp);
                            if(r[i] === undefined)  r[i] = v;
                        }
                    });
                    break;
                case "date":
                case "localdate":
                case "number":
                case "string":
                case "boolean":
                    if(r === undefined){
                        r = classOf_d;
                    }else if(r !== "other" && r !== classOf_d){
                        r = "other";
                    }
                    break;
                default:
                    throw new Error();
            }
            return r;
        }
        
        return ret;
    }


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
            for(var i=obj.start; i<=obj.end; i++){
                if(colList[i] === undefined) colList[i] = [];
                colList[i][obj.level] = key;
            }
            if(obj.value !== undefined)  makeHeaderPattern_2(obj.value);
        });
    }



}
