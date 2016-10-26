$(function(){
    var pageFun;
    var formAddData;
    _val.pageFun.handleSpreadsheet = {
        onload:function(){
            _val.server.loadData("fileInfo");
            pageFun = _val.pageFun.handleSpreadsheet;
            formAddData = $("#formAddToDatabase");

            formAddData.find('[name="dataName"]').append(
                ['<option value=""></option>'].concat(Datapiece.sort(_val.server.getData("collectionInfo"),"name").map(function(collInfo){
                    var name = collInfo.getValue("name");
                    return '<option value="' + name + '">' + name + '</option>';
                }))
            )
        },onunload:function(){
            pageFun = _val.pageFun.handleSpreadsheet;
            formAddData = $("#formAddToDatabase");
        },writeSpreadsheet:function(spreadsheetName,sheetName,contentConfig){
            var dataName = formAddData.find('[name="dataName"]').val();
            _val.server.loadData(dataName).then(function(datapieces){
                var content;
                if(contentConfig === "all"){
                    content = datapieces.map(function(datapiece){return datapiece.getValues()});
                }else if(contentConfig === "column"){
                    content = [];
                }
                var spreadsheet = new Spreadsheet(spreadsheetName,sheetName,content);
                var collInfo = _val.server.getCollectionInfoByName(dataName);
                return spreadsheet.writeSheetData(
                    collInfo.getValue("column"),
                    collInfo.getValue("columnOrder"),
                    100,
                    ["text"],
                    function(value,key,rowIndex,columnIndex){
                        return {"text":value};
                    }
                );
            }).then(function(){
                //formAddData.find('[name="dataName"],[name="writeAll"],[name="writeColumn"]').prop("disabled",true);
            });
        },readSpreadsheet:function(spreadsheetName,sheetName){
            var spreadsheet = new Spreadsheet(spreadsheetName,sheetName);
            var dataName = formAddData.find('[name="dataName"]').val();
            var column = _val.server.getCollectionInfoByName(dataName).getValue("column");

            spreadsheet.readSheetData(column).then(function(){
                console.log(spreadsheet._data);
            });
        }
    };
});