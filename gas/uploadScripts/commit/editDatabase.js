//eval(DriveApp.getFileById("0B88bKUOZP4-AMzZJdGdvbkZPSU0").getBlob().getDataAsString("UTF-8"));

//var ss = SpreadsheetApp.openById(_fileId.spreadsheet.editDatabase);

var database;

function onOpen(){
    database = new Datebase();
    database.loadDataAll();
}

function loadDatabase(dataName){
    var sheet = ss.getSheetByName(dataName);
    var data = database.getData(dataName);
    var columns = database.getColumn(dataName);
    sheet = clearValuesOfSheet(ss,sheet);
    setValuesInRange(
        [columns.map(function(v){return v.name}),columns.map(function(v){return v.type})],
        columns.map(function(v){return v.name}),
        sheet.getRange(1,1)
    );
    setValuesInRange(
        data,
        columns.map(function(v){return v.name}),
        sheet.getRange(3,1)
    );
}

function loadAllDatabase(){
    Database.getDatabaseInfo()
    .map(function(info){return info.dataName})
    .filter(function(dataName){return !["workDetail"].inArray(dataName)})
    .forEach(function(dataName){
        loadDatabase(dataName);
    })
}
