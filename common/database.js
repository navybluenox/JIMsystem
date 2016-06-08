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
            databaseList
                全データベースについてのリスト
            cache
                GoogleDriveからダウンロードしたデータ
            pooledQueue
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
        静的メソッド
            getDatabaseInfo()
                説明
                    データ名（dataName）と対応するクラス（dataName）のペアのリストを返します
                    Databaseクラスの子のクラスの全てが含まれます
                        //手打ちが必要
        メソッド
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
            getColumns(dataName)
                説明
                    columnデータを返します
            getVersion(dataName)
                説明
                    versionデータをDate型で返します
            reloadData()
                説明
                    データをGoogleDriveからリロードして、キャッシュを新しくします
                    //キャッシュをリフレッシュする際には、ポインタの保存のために.setValue()を使用する
            //以下はデータの変更関係のメソッド
            runUpdate()
                説明
                    this.pooledQueueにあるキューを元にデータを更新します
                    更新中は実行されません
                    更新後、またthis.pooledQueueにキューが残っていれば更新します
            change(datapieces)
                説明
                    既存のデータを更新します
                    変更するデータのキーのみ記入することも可能
                引数
                    datapieces
                        変更する新しいデータ
                            idキーは必須
                        Datapieceクラスを継承するデータごとのクラスを用いる
                            一つのみであればインスタンスを直接代入、複数であればインスタンスの配列を代入
            add(datapieces)
                説明
                    新規にデータを作成します
                    基本的にデータの全てを設定する必要があります
                引数
                    datapieces
                        ※詳細はchangeメソッドと同様
            remove(datapieces)
                説明
                    新規にデータを作成します
                    基本的にデータの全てを設定する必要があります
                引数
                    datapieces
                        idのみが設定されてれば良い
                        ※詳細はchangeメソッドと同様


    Datapiece(datapieceObj,disableCheck)クラス
        説明
            各種データの一つのデータを格納するクラスです
            Databaseクラスがデータ全体、Datapieceクラスがデータ一つ分
            それぞれのデータベースのデータ一つひとつを表すクラスは、このクラスを継承します
        引数
            datapieceObj
                インスタンスのデータの元となるオブジェクト
                    細かい定義は継承先のクラスで行う
            disableCheck
                必要なカラムが存在するかのチェックを無効にします
                Database.change()や.delete()などで使用します
                //それ以外ではtrueにしないほうが良い
                省略可。省略した場合、false（チェックする）となる
        プロパティ
            data
                格納されているデータ
            dataName
                このデータの由来となるデータの名称
        静的メソッド
            //TODO
            getDataInfo()

        メソッド
            toJSONData()
                説明
                    this.dataをJSON形式の文字列にして返します
            getValue(deepcopy)
                説明
                    this.dataを返します
                引数
                    deepcopy
                        trueなら、deep-copyで返します
                        省略可。省略した場合、false（shallow-copy）となる

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
        case "column":
            result = rawData.column;
            break;
        case "version":
            result = rawData.version;
            break;
    }
    return result;
}

class Database{
    constructor(){
        this.

    }
    constructor(dataName,fileId){
        if(dataName != null){
            this.dataName = dataName;
            if(fileId != null){
                this.fileId = fileId;
            }else{
                this.fileId = Database.getChildList.find(function(v){return v.dataName == dataName}).fileId;
            }
            if(this.fileId != null){
                //サーバーからデータをダウンロード
                this.rawData = loadDataFromDrive(this.fileId,"raw");
                this.curtData = JSON.parse(this.rawData);
                this.column = this.curtData.column;
                this.version = new Date(this.curtData.version);
            }
        }else{
            this.dataName = "";
            this.fileId = "";
            this.rawData = "";
            this.curtData = [];
            this.column = [];
            this.version = null;
        }
        this.pooledQueue = [];
        this.updatingQueue = [];
        this.updating = false;
    }
    static getChildList(){
        return [
            {dataName:"name1",classObj:class1,fileId:"fileId1"}
        ]
    }
    static getChildInfoByName(dataName){
        return Database.getChildList().find(function(obj){return obj.dataName==dataName});
    }
    static getDatabase(dataName){
        return new Database.getChildInfoByName(dataName).classObj();
    }
    getJSON(){
        return JSON.stringify(this.curtData);
    }
    getRawJSON(){
        return this.rawData;
    }
    getValues(deepcopy){
        if(deepcopy){
            return JSON.parse(JSON.stringify(this.curtData))
        }else{
            return this.curtData;
        }
    }
    getValueById(ids,deepcopy){
        if(typeof ids == "string")  ids = [ids];
        return this.getValues(deepcopy).filter(function(datapiece){return ids.inArray(datapiece.id)});
    }
    getRawValues(){
        return JSON.parse(this.rawData);
    }
    getColumns(){
        return this.column;
    }
    getVersion(){
        return this.version;
    }
    reloadDate(){
        this.rawData = loadFileFromDrive(this.dataFileId);
        return this;
    }
    runUpdate(){

    }
    change(datapieces){
        if(!Array.isArray(datapieces))  datapieces = [datapieces];
        //this.curtDataは即時更新
        //undefinedなキーはそのまま（skip）
    }
    add(datapieces){
        if(!Array.isArray(datapieces))  datapieces = [datapieces];

    }
    remove(datapieces){
        if(!Array.isArray(datapieces))  datapieces = [datapieces];

    }
}

class Datapiece{
    constructor(datapieceObj, columnList, disableCheck){
        this.data = datapieceObj;
        this.dataName = {};
        if(disableCheck){
            if(needColumns == null)  needColumns = [];
            //TODO
            needColumns = needColumns.concat(["id"]);
            var noColumnList = needColumns

        }
    }
    static getChildList(){
        return [
            {dataName:"name1",classObj:class1,}
        ]
    }
    static getChildInfoByName(dataName){
        return Datapiece.getChildList().find(function(obj){return obj.dataName==dataName});
    }
}



