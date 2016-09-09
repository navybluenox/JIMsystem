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

class ModalWindow{
    constructor(option){
        var that = this;
        if(option === undefined)  option = {};
        [
            {key:"html",value:""},
            {key:"callback",value:function(){}},
            {key:"disableClickBackground",value:false},
            {key:"parent",value:document.getElementById("modalWindow")},
            //{key:"",value:""},
        ].forEach(function(obj){
            if(option[obj.key] === undefined){
                option[obj.key] = obj.value;
            }
        })
        this.$parent = $(option.parent);
        this.$el = $('<div class="mw-content"></div>').css("display","none").appendTo(this.$parent);
        this.$background = $('<div class="mw-background"></div>').css("display","none").appendTo($("body"));
        this.$el.append($(option.html));

        this.contentStyle = {
            width:"60%",
            margin:"0",
            padding:"1ex 1em",
            border:"2px solid #aaa",
            background:"#fff",
            position:"fixed",
            display:"none",
            "z-index":"2"
        };
        this.backgroundStyle = {
            "z-index":"1",
            "position":"fixed",
            "top":"0",
            "left":"0",
            "width":"100%",
            "height":"120%",
            "background-color":"rgba(0,0,0,0.75)"
        };
        this.positionFun = function(){
            var $window = $(window);
            this.$el.css({
                left:(($window.width() - this.$el.outerWidth())/2) + "px",
                top:(($window.height() - this.$el.outerHeight())/2)*(2/3) + "px"
            });
        }

        this.applyContentStyle();

        this.applyBackgroundStyle();
        this.$background.fadeIn("fast");
        this.keepPosition();
        this.$el.fadeIn("slow");

        if(!option.disableClickBackground){
            this.$background.off("click").on("click",function(e){
                that.removeWindow()
            })
        }

        if(typeof option.callback === "function"){
            option.callback(this.$el,this.$background)
        }

        var timer = false;
        $(window).on("resize.modalWindow",function(){
            if(timer !== false) clearTimeout(timer);
            timer = setTimeout(function(){
                that.keepPosition();
                that.applyContentStyle();
                that.$el.css("display","");
            },200);
        })
        return this;
    }
    removeWindow(){
        this.$background.remove();
        this.$el.remove();
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
        this.positionFun();
        return this;
    }
    setContentStyle(cssObj){
        var that = this;
        Object.keys(cssObj).forEach(function(key){
            that.contentStyle[key] = cssObj[key];
        });
        return this;
    }
    setBackgroundStyle(cssObj){
        var that = this;
        Object.keys(cssObj).forEach(function(key){
            that.backgroundStyle[key] = cssObj[key];
        });
        return this;
    }
    setPosition(fun){
        if(typeof fun === "function"){
            this.positionFun = cssObj;
        }
        return this;
    }
}

function createTable(parent,data,columns,callback,option){
    if(callback === undefined)  callback = function(cellObj){cellObj.$el.css({"text-align":"center"}).text(cellObj.value)};
    if(option === undefined)  option = {};

    [
            {key:"tableLevel",value:0}
    ].forEach(function(obj){
        if(option[obj.key] === undefined){
            option[obj.key] = obj.value;
        }
    })

    var $table = $(parent)
        .append("<table><thead></thead><tbody></tbody></table>")
        .children("table")
        .data("table-level",option.tableLevel);

    $table.children("thead").append("<tr>" + repeatString("<th></th>",columns.length) + "</tr>");
    $table.children("tbody").append(repeatString("<tr>" + repeatString("<td></td>",columns.length) + "</tr>",data.length));

    var $ths = $table.children("thead").children("tr").children("th");
    $ths.css({"padding":"0 10px","text-align":"center"});

    columns.forEach(function(column,columnIndex){
        var $th = $ths.eq(columnIndex);
        $th.text(column);
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
                "$el":$cell,
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
            "padding":"0.3ex 0.3em","background":"inherit",
            "border-style":"solid","border-color":"#000000","border-width":"0 0.3px"
        });
        $table.children("thead").children("tr").css({"background":"#BDDBF9"});
        $table.children("tbody").children("tr:nth-child(2n+1)").css({"background":"#F9F9F9"});
        $table.children("tbody").children("tr:nth-child(2n)").css({"background":"#E2E2E2"});
    }

    setTableStyle();

    return {"$table":$table,"styleFun":setTableStyle};
}

