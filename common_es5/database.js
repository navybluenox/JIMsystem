"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
            column
                データのカラム情報が入っている
            version
                ロードした時点でのversionがDate型で入っている
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
        静的メソッド
            getChildList()
                説明
                    データベース名（dataName）と対応するクラス（className）のペアのリストを返します
                    Databaseクラスの子のクラスの全てが含まれます
                        //手打ちが必要
            getData(dataName)
                説明
                    GoogleDriveからデータをダウンロードして、データに対応したクラスのインスタンスを返します
                引数
                    dataName
                        ロードするデータ名
        メソッド
            getJSON()
                説明
                    this.curtDataをJSON形式の文字列にして返します
            getRawJSON()
                説明
                    this.curtDataをJSON形式の文字列にして返します
            getValues(deepcopy)
                説明
                    this.curtDataを返します
                引数
                    deepcopy
                        trueなら、deep-copyで返します
                        省略可。省略した場合、false（shallow-copy）となる
            getValueById(ids,deepcopy)
                説明
                    this.curtDataから、IDリスト（ids）に合致するもののみ返します
                引数
                    ids
                        指定するidの配列
                        文字列を代入すると、一つだけ返します。
                    deepcopy
                        trueなら、deep-copyで返します
                        省略可。省略した場合、false（shallow-copy）となる
            getRawValues()
                説明
                    this.rawDataをJSON.parseして返します
            getColumns()
                説明
                    columnデータを返します
            getVersion()
                説明
                    versionデータを返します
            reloadData()
                説明
                    データをGoogleDriveからリロードして、this.rawDataを更新します
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


    Datapieceクラス
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

function loadDataFromDrive(fileIdStr, mode) {
    var result;
    if (mode == null) mode = "data";

    var rawData = JSON.parse(loadFileFromDrive(fileIdStr));

    switch (mode) {
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

var Database = function () {
    function Database(fileId) {
        _classCallCheck(this, Database);

        this.dataName = "";
        this.dataFileId = "";
        this.rawData = "";
        this.curtData = [];
        this.column = [];
        this.version = null;
        this.pooledQueue = [];
        this.updatingQueue = [];
        this.updating = false;
    }

    _createClass(Database, [{
        key: "getJSON",
        value: function getJSON() {
            return JSON.stringify(this.curtData);
        }
    }, {
        key: "getRawJSON",
        value: function getRawJSON() {
            return this.rawData;
        }
    }, {
        key: "getValues",
        value: function getValues(deepcopy) {
            if (deepcopy) {
                return JSON.parse(JSON.stringify(this.curtData));
            } else {
                return this.curtData;
            }
        }
    }, {
        key: "getValueById",
        value: function getValueById(ids, deepcopy) {
            if (typeof ids == "string") ids = [ids];
            return this.getValues(deepcopy).filter(function (datapiece) {
                return ids.inArray(datapiece.id);
            });
        }
    }, {
        key: "getRawValues",
        value: function getRawValues() {
            return JSON.parse(this.rawData);
        }
    }, {
        key: "getColumns",
        value: function getColumns() {
            return this.column;
        }
    }, {
        key: "getVersion",
        value: function getVersion() {
            return this.version;
        }
    }, {
        key: "reloadDate",
        value: function reloadDate() {
            this.rawData = loadFileFromDrive(this.dataFileId);
            return this;
        }
    }, {
        key: "runUpdate",
        value: function runUpdate() {}
    }, {
        key: "change",
        value: function change(datapieces) {
            if (!Array.isArray(datapieces)) datapieces = [datapieces];
            //this.curtDataは即時更新
            //undefinedなキーはそのまま（skip）
        }
    }, {
        key: "add",
        value: function add(datapieces) {
            if (!Array.isArray(datapieces)) datapieces = [datapieces];
        }
    }, {
        key: "remove",
        value: function remove(datapieces) {
            if (!Array.isArray(datapieces)) datapieces = [datapieces];
        }
    }], [{
        key: "getChildList",
        value: function getChildList() {
            return [{ dataName: "name1", className: class1 }];
        }
    }, {
        key: "getData",
        value: function getData(dataName) {
            return new Database.getChildList().filter(function (obj) {
                return obj.dataName == dataName;
            })[0].className();
        }
    }]);

    return Database;
}();

var Datapiece = function Datapiece(datapieceObj, disableCheck) {
    this.data = {};
    this.dataName = "";
};