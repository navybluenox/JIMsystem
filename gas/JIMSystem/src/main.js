$(function(){
    _val.pageFun.main = {
        onload:function(){
            google.script.history.setChangeHandler(function (e) {
                movePage(e.location.hash,"content",{state:e.state,parameters:e.location.parameters});
            });
        },
        openSearchWindow:function(){
            var sw = new ModalWindow({"html":[
                '<table><tbody>',
                '<tr><td>データ名：<select name="collName"></select></td><td rowSpan="4" name="resultField"></td><td rowSpan="4" name="dataField"></td></tr>',
                '<tr><td>カラム名：<select name="column"></select></td></tr>',
                '<tr><td>検索ワード<input type="text" name="keyword"></td></tr>',
                '<tr><td><input type="button" name="search" value="検索"></td></tr>',
                '<tr><td><input type="button" name="cancel" value="終了"></td></tr>',
                '</table></tbody>'
            ].join("")});
            sw.setContentStyle({
                "width":"80%",
                "height":"80%"
            });
            sw.keepPosition();

            var el = sw.$el;
            el.find("td").css({"border-bottom-width":"0","padding":"0.5ex 0"});
            el.find('[name="resultField"]').css({"overflow":"auto","width":"30%"});
            el.find('[name="dataField"]').css({"overflow":"auto","width":"50%"});

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

                var promise;
                if(!_val.server.isLoadedData(dataName)){
                    promise = _val.server.loadData(dataName);
                }else{
                    promise = Promise.resolve();
                }

                promise.then(function(){
                    el_column.append(
                        Object.keys(_val.server.getCollectionInfoByName(dataName).getValue("column")).map(function(column){
                            return '<option value="' + column + '">' + column + '</option>';
                        })
                    )
                })
            });

            var timer_keyword;
            el.find('[name="keyword"]').on("keydown",function(e){
                if(e.keyCode === 13){
                    el.find('[name="search"]');
                }
            }).on("change",function(e){
                if(timer_keyword !== undefined)  clearTimeout(timer_keyword);
                timer_keyword = setTimeout(function(){
                    //TODO incremental search
                },100);
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
                (!_val.server.isLoadedData(dataName) ? _val.server.loadData(dataName) : Promise.resolve()).then(function(){
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
                                return (new LocalDate(keyword)).getLocalTime() === value.getLocalTime();
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
                                return valueA.getLocalTime() - valueB.getLocalTime();
                            case "null":
                            default:
                                return 0;
                        }
                    }).map(function(v){return v.getValues(v)});
                    //TODO create table under [name="resultField"]
                    //show _id and value(column's data')
                    //add click(or mouseover) event on _id(tag a? or button?)
                    createTable(el.find('[name="resultField"]'),data,["button","_id",column],function(cellObj){
                        if(cellObj.column === "_id"){
                            $('<a herf="#">' + cellObj.value + "</a>").appendTo(cellObj.el).on("mouseover",function(e){
                                showData(cellObj.value);
                            }).on("click",function(e){
                                showData(cellObj.value);
                            })
                        }else if(cellObj.column === column){
                            cellObj.$el.text(cellObj.value);
                        }else if(cellObj.column === "button"){
                            $('<input type="button" value="show→">').appendTo(cellObj.el).on("click",function(e){
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
                        
                        Object.keys(columnObj).forEach(function(key,keyIndex){
                            var tr = table.find("tbody tr").eq(keyIndex);
                            tr.find("td").eq(0).text(key);
                            var td = tr.find("td").eq(1);
                            //TODO!!
                        });
                    }
                    console.log(data);
                })
            })




        }
    };
});