$(function(){
    _val.pageFun.main = {
        onload:function(){

        },
        openSearchWindow:function(){
            var sw = new ModalWindow({"html":[
                '<table><tbody>',
                '<tr><td><select name="collName"></select></td><td rowSpan="4" name="resultField"></td><td rowSpan="4" name="dataField"></td></tr>',
                '<tr><td><select name="column"></select></td></tr>',
                '<tr><td><input type="text" name="keyword"></td></tr>',
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
                    promise = _val.server.loadDataByName(dataName);
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

            el.find('[name="cancel"]').on("click",function(e){
                sw.remove();
            });

            el.find('[name="search"]').on("click",function(){
                var dataName = el.find('[name="collName"]').val();
                var column = el.find('[name="column"]').val();
                var keyword = el.find('[name="column"]').val();
                var data;
                var result = el.find('[name="resultField"]');
                (!_val.server.isLoadedData(dataName) ? _val.server.loadDataByName(dataName) : Promise.resolve()).then(function(){
                    data = _val.server.getData(dataName).filter(function(dp){
                        var value = dp.getValue(column);
                        switch(classof(value)){
                            case "string":
                            case "number":
                            case "number":
                            case "null":
                                return (new RegExp(keyword)).test("" + value);
                            case "date":
                                return (new Date(keyword)).getTime() === value.getTime();
                            case "localdate":
                                return (new LocalDate(keyword)).getLocalTime() === value.getLocalTime();
                            default:
                                return;
                        }
                    });
                    //TODO create table under [name="resultField"]
                    //show _id and value(column's data')
                    //add click(or mouseover) event on _id(tag a? or button?)
                    console.log(data);
                })
            })




        }
    };
});