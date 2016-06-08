//  ---About This---
/*
名前

依存ファイル
driveFileId.js
include.js
base.js
baseClient.js
baseServer.js

このファイルについて

定義一覧
    Database()クラス
        説明
            GoogleDriveに保存されている各種データをまとめるクラスです
            それぞれのデータベースから生成されたデータオブジェクトのクラスは、このクラスを継承します
        データの形式について
            生データはdataキーとcolumnキーで構成される
            rawData = {
                data:[datapiece1, datapiece2, ... ],
                version:Date.ISOString
            }
        引数
        プロパティ
            cache
                GoogleDriveからダウンロードしたデータ
            pendingQueue
                更新待ちのデータの配列
                queueObj = {type:"updateType", dataName:"name1", contents:datapieces}
                    type
                        add
                            データを追加
                        change
                            データを変更
                        remove
                            データを削除
            updatingQueue
                更新中のデータの配列
            updating
                更新中か否か
                更新中であれば開始時間がDateで入っている
                更新中で無ければ、nullが入っている
            loading
        静的メソッド
            getDatabaseInfo()
                説明
                    データ名（dataName）と対応する情報のリストを返します
                    Databaseクラスの子のクラスの全てが含まれます
                        //手打ちが必要
        メソッド
            loadData(dataName)
            loadDataAll()
            reloadData(dataName)
                説明
                    データをGoogleDriveからリロードして、キャッシュを新しくします
                    //キャッシュをリフレッシュする際には、ポインタの保存のために.setValue()を使用する
            getData(dataName,newCopy)
                説明
                    GoogleDriveからデータをダウンロードして、データに対応したクラスのインスタンスを返します
                引数
                    dataName
                        ロードするデータ名
                    newCopy
                        常にキャッシュからはロードせず、クラスを作成しなおします
                        省略可。省略した場合、キャッシュにあるインスタンスのポインタのコピーとなる
            getDataById(ids,newCopy)
                説明
                    this.curtDataから、IDリスト（ids）に合致するもののみ返します
                引数
                    ids
                        指定するidの配列
                        文字列を代入すると、一つだけ返します。
                        省略もしくは、nullを代入すると、全てのデータを返します
                    newCopy
                        常にキャッシュからはロードせず、クラスを作成しなおします
            getVersion(dataName)
                説明
                    versionデータをDate型で返します
            //以下はデータの変更関係のメソッド
            runUpdate()
                説明
                    this.pooledQueueにあるキューを元にデータを更新します
                    更新中は実行されません
                    更新後、またthis.pooledQueueにキューが残っていれば更新します
            changeData(datapieces)
                説明
                    既存のデータを更新します
                    変更するデータのキーのみ記入することも可能
                引数
                    datapieces
                        変更する新しいデータ
                            idキーは必須
                        Datapieceクラスを継承するデータごとのクラスを用いる
                            一つのみであればインスタンスを直接代入、複数であればインスタンスの配列を代入
            addData(datapieces)
                説明
                    新規にデータを作成します
                    基本的にデータの全てを設定する必要があります
                引数
                    datapieces
                        ※詳細はchangeメソッドと同様
            removeData(datapieces)
                説明
                    新規にデータを作成します
                    基本的にデータの全てを設定する必要があります
                引数
                    datapieces
                        idのみが設定されてれば良い
                        ※詳細はchangeメソッドと同様


    Datapiece(dataName,datapieceObj)クラス
        説明
            各種データの一つのデータを格納するクラスです
            Databaseクラスがデータ全体、Datapieceクラスがデータ一つ分
            それぞれのデータベースのデータ一つひとつを表すクラスは、このクラスを継承します
        引数
            dataName
            datapieceObj
                インスタンスのデータの元となるオブジェクト
                    細かい定義は継承先のクラスで行う
        プロパティ
            data
                格納されているデータ
            dataName
                このデータの由来となるデータの名称
        メソッド
            setValues(datapieceObj)
            setValue(columnName,value)
            getValues()
                説明
                    this.dataを返します
            getValue(columnName)
            getDatabaseInfo()

    loadDataFromDrive(fileIdStr,mode)
        説明
            GoogleDriveからJSON形式で保存されたデータを取得します
        引数
            fileIdStr
                GoogleDriveのファイルID（ファイルを開いた時に、URLに記載されている一部のランダムな文字列のこと）
            mode
                返り値のデータの指定
                    all
                        rawDataを返す
                    raw
                        rawData（JSON文字列）を返す
                    data
                        データ本体を返す
                    column
                        カラムデータを返す
                    version
                        データの更新日時を返す
                省略可。省略した場合、allとなる
*/

function loadDataFromDrive(fileIdStr, mode) {
    var result;
    if (mode == null) mode = "all";
    var raw = loadFileFromDrive(fileIdStr);
    var rawData = JSON.parse(raw);

    switch (mode) {
        case "all":
            result = rawData;
            break;
        case "raw":
            result = raw;
            break;
        case "data":
            result = rawData.data;
            break;
        case "version":
            result = rawData.version;
            break;
    }
    return result;
}

class Database{
    constructor(){
        this.cache = {};
        this.pendingQueue = [];
        this.updatingQueue = [];
        this.updating = false;
        this.loading = [];
    }
    static getDatabaseInfo(dataName){
        var list =  [
            {dataName:"name1", classObj:class1, fileId:"fileId1", column:[
                {name:"cName1", type:"cType1", defaultValue:""}
            ]}
        ];
        if(typeof dataName == "string"){
            return list.find(function(v){return v.dataName == dataName});
        }else{
            return list;
        }
    }
    loadData(dataName){
        var dbInfo = Database.getDatabaseInfo(dataName);
        if(dbInfo == null)  return null;
        //TODO this.loadingにpush
        branchProcessOnSide(function(){
            //client
            //JSON形式でサーバーから送信してもらうためrawモード
            google.script.run.withSuccessHandler(function(v){
                this.cache[dataName] = JSON.parse(v);
                this.cache[dataName].data = this.cache[dataName].data.map(function(obj){
                    return dbInfo.classObj(obj);
                });
            }).loadDataFromDrive(dbInfo.fileId,"raw");
        },function(){
            //server
            this.cache[dataName] = loadDataFromDrive(dbInfo.fileId);
            this.cache[dataName].data = this.cache[dataName].data.map(function(obj){
                return dbInfo.classObj(obj);
            });
        })
    }
    loadDataAll(){
        return Database.getDatabaseInfo().map(function(info){return this.loadData(info.dataName)});
    }
    reloadData(dataName){

    }
    getData(dataName,newCopy){
    }
    getDataById(ids,newCopy){

    }
    getVersion(dataName){

    }
    runUpdate(){

    }
    changeData(datapieces){
        if(!Array.isArray(datapieces))  datapieces = [datapieces];
        //undefinedなキーはそのまま（skip）
    }
    addData(datapieces){
        if(!Array.isArray(datapieces))  datapieces = [datapieces];

    }
    removeData(datapieces){
        if(!Array.isArray(datapieces))  datapieces = [datapieces];

    }
}

class Datapiece{
    constructor(dataName,datapieceObj){
        this.dataName = dataName;
        this.data = {};
        this.getColumns().forEach(function(column){
            if(typeof datapieceObj[column.name] != "undefined"){
                this.data[column] = datapieceObj[column];
            }else if(typeof column.defaultValue != null){
                this.data[column] = column.defaultValue;
            }
        });
    }
    setValues(datapieceObj){
        this.getDatabaseInfo().column.forEach(function(column){
            if(typeof datapieceObj[column.name] != "undefined"){
                this.data[column] = datapieceObj[column];
            }
        });
        return this;
    }
    setValue(columnName,value){
        if(this.getDatabaseInfo().column.map(function(v){return v.name}).inArray(columnName)){
            this.data[columnName] = value;
        }
        return this;
    }
    getValues(){
        return this.data;
    }
    getValue(columnName){
        return this.data[columnName];
    }
    getDatabaseInfo(){
        return Database.getDatabaseInfo(this.dataName);
    }
}

class User extends Datapiece{
    constructor(datapieceObj){
        super("user",datapieceObj);
    }
}

