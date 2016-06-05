//  ---About This---
/*
名前

依存ファイル
driveFileId.js
include.js
baseClient.js
baseServer.js
htmlService.js

このファイルについて

定義一覧
    Databaseクラス
        説明
            GoogleDriveに保存されている各種データをまとめるクラスです
            それぞれのデータベースから生成されたデータオブジェクトのクラスは、このクラスを継承します
        データの形式について
            生データはdataキーとcolumnキーで構成される
            rawData = {
                data:[datapiece1, datapiece2, ... ],
                column:[{name:columnName1,type:columnType1}, ... ],
                version:Date.ISOString
            }
        プロパティ
            dataName
                データ名
            dataFileId
                データのあるファイルのID
            rawData
                ロードした元データがJSON形式の文字列で入っている
            curtData
                更新を含む現在のデータがObject型で入っている
            loadVersion
                ロードした時点でのversionをDateで返す
            pooledQueue
                更新待ちのデータの配列
                queueObj = {type:"###", content:obj(not user-definedClass)}
                    type
                        create
                            データを追加
                        change
                            データを変更
                        delete
                            データを削除
            updatingQueue
                更新中のデータの配列
            updating
                更新中か否か
                更新中であれば開始時間がDateで入っている
                更新中で無ければ、空文字列が入っている
        メソッド
            toJSONData()
                説明
                    this.curtDataをJSON形式の文字列にして返します
            getValues(deepcopy)
                説明
                    this.curtDataを返します
                引数
                    deepcopy
                        trueなら、deep-copyで返します
                        省略可。省略した場合、false（shallow-copy）となる
            reloadData()
                説明
                    データをGoogleDriveからリロードして、this.rawDataを更新します
            //以下はデータの変更関係のメソッド
            runUpdate()
                説明
                    this.pooledQueueにあるキューを元にデータを更新します
                    更新中は実行されません
                    更新後、またthis.pooledQueueにキューが残っていれば更新します
            change([user-definedClass1, ...])
                説明
                
    
    Datapieceクラス
        説明
            各種データの一つのデータを格納するクラスです
            Databaseクラスがデータ全体、Datapieceクラスがデータ一つ分
            それぞれのデータベースのデータ一つひとつを表すクラスは、このクラスを継承します
        プロパティ
            data
                格納されているデータ
            dataName
                このデータの由来となるデータの名称
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
    
    loadDataFromDrive
        説明
            GoogleDriveからJSON形式で保存されたデータを取得します
        引数
            fileIdStr
                GoogleDriveのファイルID（ファイルを開いた時に、URLに記載されている一部のランダムな文字列のこと）
            mode
                返り値のデータの指定
                    all
                        rawDataを返す
                    data
                        データ本体を返す
                    column
                        カラムデータを返す
                    version
                        データの更新日時を返す
                省略可。省略した場合、dataとなる
*/

function loadDataFromDrive(fileIdStr,mode){
    var result;
    if(mode == null)  mode = "data";
    
    var rawData = JSON.parse(loadFileFromDrive(fileIdStr));
    
    switch(mode){
        case "all":
            result = rawData;
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

var Database = function(){
    
}

Database.prototype.toJSONData = function(){
    
}

var Datapiece = function(){
    this.data = {};
    this.dataName = "";
}

