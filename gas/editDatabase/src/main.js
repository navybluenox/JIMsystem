function myFunction() {
  
}

var database;

function onopen(){
    database = new Datebase();
    database.loadDataAll();
}

function loadDatabase(dataName){
    var data = database.getData(dataName);
    //TODO　各sheetに反映
}

function loadAllDatabase(){
    var dataNames = Database.getDatabaseInfo().map(function(v){return v.dataName});
    dataNames.forEach(function(dataName){
        loadDatabase(dataName);
    })
}
