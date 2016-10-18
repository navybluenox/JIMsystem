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

function movePage(pageName,insertTag,option){
    //pageFunが変わる場合にはここを書き換える
    var pageFun = _val.pageFun;
    google.script.url.getLocation(function(location){
        var prevPageName = location.hash;
        if(prevPageName && pageFun && pageFun[prevPageName] && pageFun[prevPageName].onunload){
            pageFun[prevPageName].onunload();
        }
    })

    if(typeof insertTag === "string"){
        switch(insertTag){
            case "content":
                insertTag = document.getElementById("content");
                break;
        }
    }
    if(option === undefined)  option = {};
    if(option.state === undefined)  option.state = {};
    if(option.parameters === undefined)  option.parameters = {};
    return getPageFromServer(pageName)
    .then(function(v){
        if(insertTag !== undefined){
            insertTag.innerHTML = v;
        }
        return v;
    }).then(function(v){
        //after change page
        //set handler here
        google.script.history.push(option.state,option.parameters,pageName);
        if(pageFun && pageFun[pageName] && pageFun[pageName].onload){
            pageFun[pageName].onload();
        }
    });
}

class ModalWindow{
    constructor(option){
        var that = this;
        if(option === undefined)  option = {};
        [
            {key:"html",value:""},
            {key:"callback",value:function(){}},
            {key:"disableClickBackground",value:false},
            {key:"fadeInSpeed",value:"slow"},
            {key:"parent",value:document.getElementById("modalWindow")}
        ].forEach(function(obj){
            if(option[obj.key] === undefined){
                option[obj.key] = obj.value;
            }
        })
        this.$parent = $(option.parent);
        this.$el = $('<div class="mw-content"></div>').css("display","none").appendTo(this.$parent);
        this.$background = $('<div class="mw-background"></div>').css("display","none").appendTo($("body"));
        this.$el.append($(option.html));
        this.positionLeft = 1/2;
        this.positionTop = 1/2;
        this.onResize = function(){};

        this.$el.css("display","none");

        this.contentStyle = {
            "width":"60%",
            "margin":"0",
            "padding":"1ex 1em",
            "border":"2px solid #aaa",
            "background":"#fff",
            "position":"fixed",
            "z-index":"2"
        };
        this.backgroundStyle = {
            "z-index":"1",
            "position":"fixed",
            "top":"0",
            "left":"0",
            "width":"100%",
            "height":"120%",
            "opacity":"0.75",
            "background":"#000000"
        };
        this.positionFun = function(){
            var $window = $(window);
            that.$el.css({
                left:($window.width()*that.positionLeft - that.$el.outerWidth()/2) + "px",
                top:($window.height()*that.positionTop - that.$el.outerHeight()/2) + "px"
            });
        }

        this.applyContentStyle();

        this.applyBackgroundStyle();
        this.$background.fadeIn("fast");
        this.keepPosition();
        if(option.fadeInSpeed === "notime"){
            this.$el.show();
        }else{
            this.$el.fadeIn(option.fadeInSpeed);
        }

        if(!option.disableClickBackground){
            this.$background.off("click").on("click",function(e){
                that.remove()
            })
        }

        if(typeof option.callback === "function"){
            option.callback(this.$el,this.$background);
        }

        var dr = new DelayRun(function(){
            that.keepPosition();
            that.applyContentStyle();
            that.onResize(that);
        });
        $(window).on("resize.modalWindow",function(){
            dr.runLater();
        })
        return this;
    }
    remove(){
        this.$background.remove();
        this.$el.remove();
        $(window).off("resize.modalWindow");
        return null;
    }
    fadeOut(){
        var that = this;
        this.$background.fadeOut("normal",function(){that.$background.remove()});
        this.$el.fadeOut("normal",function(){that.$el.remove()});
        $(window).off("resize.modalWindow");
        return null;
    }
    createHtml(){
        this.$el.children().remove();
    }
    applyContentStyle(){
        this.$el.css(this.contentStyle);
        return this;
    }
    applyBackgroundStyle(){
        this.$background.css(this.backgroundStyle);
        return this;
    }
    keepPosition(){
        this.positionFun(this);
        return this;
    }
    setContentStyle(cssObj){
        var that = this;
        Object.keys(cssObj).forEach(function(key){
            that.contentStyle[key] = cssObj[key];
        });
        this.applyContentStyle();
        this.keepPosition();
        return this;
    }
    setBackgroundStyle(cssObj){
        var that = this;
        Object.keys(cssObj).forEach(function(key){
            that.backgroundStyle[key] = cssObj[key];
        });
        this.applyBackgroundStyle();
        return this;
    }
    setPosition(fun){
        if(typeof fun === "function"){
            this.positionFun = fun;
        }
        return this;
    }
    setHandlerOnResize(fun){
        if(typeof fun === "function"){
            this.onResize = fun;
        }
        return this;        
    }
    getContent(){
        return this.$el;
    }
    getBackground(){
        return this.$background;
    }
}

function createTable(parent,data,columns,callback,option){
    if(callback === undefined)  callback = function(cellObj){cellObj.$el.text(cellObj.value)};
    if(option === undefined)  option = {};
    if(!(parent instanceof $)) parent = $(parent);

    [
            {key:"tableLevel",value:0},
            {key:"header",value:columns}
    ].forEach(function(obj){
        if(option[obj.key] === undefined){
            option[obj.key] = obj.value;
        }
    })

    var $table = parent
        .append("<table><thead></thead><tbody></tbody></table>")
        .children("table")
        .data("table-level",option.tableLevel);

    $table.children("thead").append("<tr>" + repeatString("<th></th>",columns.length) + "</tr>");
    $table.children("tbody").append(repeatString("<tr>" + repeatString("<td></td>",columns.length) + "</tr>",data.length));

    var $ths = $table.children("thead").children("tr").children("th");

    option.header.forEach(function(headerName,index){
        var $th = $ths.eq(index);
        $th.text(headerName);
    })

    var $rows = $table.children("tbody").children("tr");
    data.forEach(function(value,rowIndex){
        var $row = $rows.eq(rowIndex);
        columns.forEach(function(column,columnIndex){
            var v = value;
            var $cell = $row.children("td").eq(columnIndex);
            var columnList = column.split(".");
            columnList.forEach(function(c){
                v = v[c];
            })
            callback({
                "$el":$cell,    //前方互換性
                "el":$cell,
                "value":v,
                "column":column,
                "rowData":value
            });
        })
    })

    function setTableStyle(){
        //セルの中央揃え
        $table.children("tbody").children("tr").children("td").css({"text-align":"center"}).children().css({"margin":"0 auto"});
        $table.children("tbody,thead").children("tr").children("td,th").css({
            "padding":"0.3ex 0.3em","background":"inherit","text-align":"center",
            "border-style":"solid","border-color":"#000000","border-width":"0 0 0 0.3px"
        });
        $table.children("tbody,thead").children("tr").children("td:last-child,th:last-child").css({
            "border-width":"0 0.3px 0 0.3px"
        });
        $table.children("thead").children("tr").css({"background":"#BDDBF9"});
        $table.children("tbody").children("tr:nth-child(2n+1)").css({"background":"#F9F9F9"});
        $table.children("tbody").children("tr:nth-child(2n)").css({"background":"#E2E2E2"});
    }

    setTableStyle();

    return {"$table":$table,"el":$table,"styleFun":setTableStyle};
}

var ContextMenu = (function(){
    //ContextMenu pluginを参考に作成
    //http://www.trendskitchens.co.nz/jquery/contextmenu/    
    return class ContextMenu extends ModalWindow{
        constructor(position,items,bindings,option){
            if(position.x === undefined && position.y === undefined){
                position = {"x":position.pageX,"y":position.pageY};
            }
            items = items.map(function(item){
                if(typeof item === "string"){
                    return {"text":item}
                }else{
                    return item
                }
            });
            option = option || {};
            option.fadeInSpeed = option.fadeInSpeed || "notime";
            option.html = option.html || [
                "<ul>",
                items.map(function(item){return "<li>" + item.text + "</li>"}).join(""),
                "</ul>"
            ].join("");
            option.maxHeight = option.maxHeight || "";
            option.overflow = option.overflow || "auto";

            super(option);

            var that = this;
            this.getContent().find("ul").css({"background":"#EFEFEF","border":"1px solid #999999","listStyle":"none","padding":"2px","margin":"0"})
            this.getContent().find("li").css({
                "min-width":"20em",
                "text-align":"left",
                "padding":"5px 1em",
                "background":"#FFFFFF",
                "display":"block",
                "cursor":"default",
                "background":"transparent",
                "border-bottom":"1px solid #999999"
            }).hover(function(e){
                $(e.currentTarget).css({"background":"#44AEEA"});
            },function(e){
                $(e.currentTarget).css({"background":"transparent"});
            });
            this.setPosition(function(that){
                var el = that.$el;
                el.css({
                    "left":position.x + "px",
                    "top":position.y + "px"
                })
            })
            this.setBackgroundStyle({"background":"transparent"}).setContentStyle({
                "position":"absolute","padding":"0","border":"","width":"",
                "max-height":option.maxHeight,"overflow":option.overflow
            });
            this.keepPosition();

            if(Array.isArray(bindings)){
                bindings.forEach(function(binding,index){
                    if(!binding)  return;
                    that.getContent().find("li").eq(index).on("click",{"index":index,"text":items[index].text,"value":items[index].value},binding);
                });
            }else if(typeof bindings === "function"){
                for(var index=0,l=items.length; index<l; index++){
                    that.getContent().find("li").eq(index).on("click",{"index":index,"text":items[index].text,"value":items[index].value},bindings);
                }
            }

        }
    }
})();
