$(function(){
    _val.pageFun.main = {
        onload:function(){
            google.script.history.setChangeHandler(function (e) {
                movePage(e.location.hash,"content",{state:e.state,parameters:e.location.parameters});
            });
            new LocalDate();
        },
        openSearchWindow:function(){
            var sw = new ModalWindow({"html":[
                '<div style="max-width:20%;">',
                    '<div>データ名：<select name="collName"></select></div>',
                    '<div>カラム名：<select name="column"></select></div>',
                    '<div>検索ワード<input type="text" name="keyword"></div>',
                    '<div><input type="button" name="search" value="検索"></div>',
                    '<div><input type="button" name="cancel" value="終了"></div>',
                '</div>',
                '<div name="resultField" style="max-width:30%;"></div>',
                '<div name="dataField" style="min-width:50%;"></div>'
            ].join("")});
            sw.setContentStyle({
                "width":"80%",
                "height":"80%",
                "overflow":"auto"
            });
            sw.keepPosition();

            var el = sw.$el;
            el.children("div").css({"height":"100%","float":"left","overflow":"auto","padding":"0 1em","box-sizing":"border-box"});
            el.children("div").eq(0).children("div").css({"margin":"1ex 0"});

            el.find('[name="collName"]').append([
                '<option value="" selected></option>',
                _val.server.getData("collectionInfo").map(function(collObj){
                    return collObj.getValue("name");
                }).filter(function(dataName){
                    return !inArray(["shiftTableUser","shiftTableWork","workNotAssigned","systemConfig","collectionInfo"],dataName);
                }).sort(function(a,b){
                    return a.charCodeAt() - b.charCodeAt();
                }).map(function(dataName){
                    return '<option value="' + dataName + '">' + dataName + '</option>';
                }).join("")
            ].join("")).on("change",function(e){
                var dataName = $(e.target).val();
                var el_column = el.find('[name="column"]');
                el_column.children().remove();
                el_column.append('<option value="" selected></option>');

                _val.server.loadData(dataName).then(function(){
                    el_column.append(
                        Object.keys(_val.server.getCollectionInfoByName(dataName).getValue("column")).map(function(column){
                            return '<option value="' + column + '">' + column + '</option>';
                        })
                    )
                })
            });

            el.find('[name="column"]').on("change",function(e){
                el.find('[name="search"]').trigger("click");
            });

            var dr = new DelayRun(function(){
                //TODO incremental search
                el.find('[name="search"]').trigger("click");
            });
            el.find('[name="keyword"]').on("keydown",function(e){
                if(e.keyCode === 13){
                    el.find('[name="search"]').trigger("click");
                }
            }).on("keyup",function(e){
                dr.runLater();
            })

            el.find('[name="cancel"]').on("click",function(e){
                sw.remove();
            });            

            el.find('[name="search"]').on("click",function(){
                var dataName = el.find('[name="collName"]').val();
                var column = el.find('[name="column"]').val();
                var type = _val.server.getCollectionInfoByName(dataName).getValue("column." + column);
                if(typeof type !== "string")  type = classof(type);
                var keyword = el.find('[name="keyword"]').val();
                var data;
                var result = el.find('[name="resultField"]');
                _val.server.loadData(dataName).then(function(){
                    data = _val.server.getData(dataName).filter(function(dp){
                        var value = dp.getValue(column);
                        switch(type){
                            case "string":
                            case "number":
                            case "boolean":
                            case "null":
                                return (new RegExp(keyword)).test("" + value);
                            case "date":
                                return (new Date(keyword)).getTime() === value.getTime();
                            case "localdate":
                                return (new LocalDate(keyword)).getTime() === value.getTime();
                            default:
                                return;
                        }
                    }).sort(function(a,b){
                        var valueA = a.getValue(column);
                        var valueB = b.getValue(column);
                        switch(type){
                            case "string":
                                return valueA.charCodeAt() - valueB.charCodeAt();
                            case "number":
                                return valueA - valueB;
                            case "boolean":
                                return valueB - valueA;
                            case "date":
                                return valueA.getTime() - valueB.getTime();
                            case "localdate":
                                return valueA.getTime() - valueB.getTime();
                            case "null":
                            default:
                                return 0;
                        }
                    }).map(function(v){return v.getValues(v)});
                    el.find('[name="resultField"]').children().remove();
                    createTable(el.find('[name="resultField"]'),data,["_id",column],function(cellObj){
                        if(cellObj.column === "_id"){
                            $('<a herf="#">' + cellObj.value + "</a>").appendTo(cellObj.$el).on("mouseover",function(e){
                                showData(cellObj.value);
                            }).on("click",function(e){
                                showData(cellObj.value);
                            })
                        }else if(cellObj.column === column){
                            cellObj.$el.text(cellObj.value);
                        }else if(cellObj.column === "button"){
                            $('<input type="button" value="show→">').appendTo(cellObj.$el).on("click",function(e){
                                showData(cellObj.value);
                            })
                        }
                    });
                    function showData(_id){
                        var parent = el.find('[name="dataField"]');
                        parent.children().remove();
                        var targetData = _val.server.getDataById(_id,dataName)[0];
                        var columnObj = _val.server.getCollectionInfoByName(dataName).getValue("column");
                        var table = $("<table><tbody></tbody></table>").appendTo(parent);
                        table.find("tbody").append(repeatString("<tr><td></td><td></td></tr>",Object.keys(columnObj).length));
                        table.find("td").css({"padding":"0","font-size":"0.9em"});
                        table.find("td:last-child").css({"padding-left":"0.5em"});
                        
                        Object.keys(columnObj).forEach(function(key,keyIndex){
                            var tr = table.find("tbody tr").eq(keyIndex);
                            tr.find("td").eq(0).text(key);
                            var td = tr.find("td").eq(1);
                            var v = targetData.getValue(key);
                            if(Array.isArray(v)){
                                var ol = $("<ol>" + repeatString("<li></li>",v.length) + "</ol>").appendTo(td);
                                ol.css({"list-style":"none","padding":"0","margin":"0"});
                                ol.find("li").css({"padding":"0","margin":"0"});
                                v.forEach(function(val,valIndex){
                                    var li = ol.find("li").eq(valIndex);
                                    li.append("" + valIndex + ". " + '<span class="datavalue">' + castIntoString(val) + "</span>");
                                });
                            }else{
                                td.append('<span class="datavalue">' + castIntoString(v) + "</span>");
                            }
                        });
                        table.find("span.datavalue").css({"text-decoration":"underline","color":"#1155cc"}).get().forEach(function(el){
                            var cl = new Clipboard(el,{target:function(){return el}});
                            cl.on("success",function(e){
                                var el1 = $("<span>    Copied!!</span>").appendTo($(el).parent());
                                setInterval(function(){
                                    el1.fadeOut("normal",function(){el1.remove();})
                                },3000);
                            });
                        });
                    }
                })
            })
        }
    };
});