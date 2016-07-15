"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//  ---About This---
/*
名前
    DrivefileId.js

依存ファイル
    なし

このファイルについて
    GoogleDriveにあるファイルの_fileIdなどのID群をまとめて管理しています
    DrivefileIdクラスを定義し、ファイルの種類ごとにidを直に書いています
    なお、このファイルをincludeすると、自動で「_fileId」という名前でDrivefileIdのインスタンスが作成されます

定義一覧
    DrivefileIdクラス
        DrivefileId.data
            JIMシステムで使用するデータ群です。
            ファイル名は「__.json」
        DrivefileId.script
            JIMシステムで使用するスクリプト群です。
            クライアントjavascript、GASの両方を含みます。
            ファイル名は「__.js」
        DrivefileId.gas
            JIMシステムで使用するapp script群です。
                ウェブアプリの本体を作成しているプロジェクトファイル
        DrivefileId.spreadsheet
            GoogleDriveに保存されているスプレッドシート群です。
        DrivefileId.documemt
            GoogleDriveに保存されているドキュメント群です。
        DrivefileId.form
            GoogleDriveに保存されているGoogleフォーム群です。
        DrivefileId.apikey
            このGoogleアカウントで使用しているAPIキーです。
            URLFetch,URLShortenedなどで使用します
    _fileId変数
        instance of DrivefileId
*/

var DrivefileId = function DrivefileId() {
    _classCallCheck(this, DrivefileId);

    this.database = {
        user: "0B88bKUOZP4-AVHpNNXdDZVV2YzA",
        userGroup: "0B88bKUOZP4-AQ01mUnoyTmZIUUk",
        workSpec: "0B88bKUOZP4-AUHR5T1AwWkdVTXc",
        workDetail: "0B88bKUOZP4-AVE9PcGYtbm00SDA",
        workGroup: "0B88bKUOZP4-ARFFxdGRCeEJlQnc"
    };
    this.script = {
        base: "0B88bKUOZP4-AMXAybWM1TTJ5eVk",
        drivefileId: "0B88bKUOZP4-AYTZJTTZkVG5DX2s",
        database: "0B88bKUOZP4-AV1dIazdGaWJNZU0",
        include: "0B88bKUOZP4-AMzZJdGdvbkZPSU0",
        spreadsheet: "0B88bKUOZP4-AcGtrdjhia1Y5OWs"
    };
    this.config = "0B88bKUOZP4-AdUw1WEJWVkkwTzA";
    this.gas = {
        jimsystem: "13MjautTiWxSccdWEVsBl0yra6qncERgaSItg8xXGkS7E1zxFso2COzkD",
        uploadScript: "1vj5zpa9zJsEtrgE5hZAUYSCJlxFIOQMO42oenoMQVH1RvuQyZmqcM87U"
    };
    this.spreadsheet = {
        editDatabase: "1ipZi1rAJ6IyxqrFrvXiDJkYbFa5DDjXweonBblcOLpI"
    };
    this.document = {};
    this.form = {};
    this.apikey = {
        main: "AIzaSyBGpG_KNJ4zyZtefN_x_r0KdlxdCmBu7cQ"
    };
};