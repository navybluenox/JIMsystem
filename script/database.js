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

var Datapiece = (function(){
    var data;
    var collInfo;
    var server = _val.server;
    return class Datapiece {
        constructor(datapieceObj,dataName){
            data = {};
            collInfo = server.getCollectionInfoByName(dataName);
            this.setValues(datapieceObj);
        }
        setValues(datapieceObj){
            if(datapieceObj !== undefined){
                Object.keys(datapieceObj).forEach(function(key){
                    this.setValue(key,datapieceObj[key]);
                });
            }
            return this;
        }
        setValue(colName,value){
            var colObj = collInfo.getValue("column").find(function(obj){return obj.name === colName});
            if(colObj === undefined){
                console.log("Attention : Collection:" + collInfo.getValue("name") + " does not have column:" + colName + ".");
                return null;
            }
            switch(colObj.type){
                case "number":
                    data[colName] = +value;
                    break;
                case "boolean":
                    data[colName] = !!value;
                    break;
                case "string":
                    data[colName] = "" + value;
                    break;
                default:
                    data[colName] = value;
            }
            return this;
        }
        //消すかも
        getValues(){
            return data;
        }
        getValue(colName){
            return data[colName];
        }
        static getData(dataName){
            if(dataName === undefined)  dataname = collInfo.getValue("name");
            return server.getData(dataName,true);
        }
    }
})();

class User extends Datapiece{
    constructor(datapieceObj){
        super(datapieceObj,"user");
    }
}

class CollectionInfo extends Datapiece{
    constructor(datapieceObj){
        super(datapieceObj,"collectionInfo");
    }
    getClass(){
        var classNamePairList = [
            {name:"collectionInfo",class:CollectionInfo},
            {name:"user",class:User}
        ];
        return classNamePairList.find(function(o){return o.name === this.getValue("name")},this).class;
    }
}


