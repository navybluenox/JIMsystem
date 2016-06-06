//  ---About This---
/*
名前
    driveFileId.js

依存ファイル
    なし

このファイルについて
    GoogleDriveにあるファイルのfileIdなどのID群をまとめて管理しています
    DriveFileIdクラスを定義し、ファイルの種類ごとにidを直に書いています
    なお、このファイルをincludeすると、自動で「fileId」という名前でDriveFileIdのインスタンスが作成されます

定義一覧
    DriveFileIdクラス
        DriveFileId.data
            JIMシステムで使用するデータ群です。
            ファイル名は「__.json」
        DriveFileId.script
            JIMシステムで使用するスクリプト群です。
            クライアントjavascript、GASの両方を含みます。
            ファイル名は「__.js」
        DriveFileId.gas
            JIMシステムで使用するapp script群です。
                ウェブアプリの本体を作成しているプロジェクトファイル
        DriveFileId.spreadsheet
            GoogleDriveに保存されているスプレッドシート群です。
        DriveFileId.documemt
            GoogleDriveに保存されているドキュメント群です。
        DriveFileId.form
            GoogleDriveに保存されているGoogleフォーム群です。
        DriveFileId.apikey
            このGoogleアカウントで使用しているAPIキーです。
            URLFetch,URLShortenedなどで使用します
    fileId変数
        instance of DriveFileId
*/

var DriveFileId = function () {
    this.data = {
        test: "#0123456789abcdef"
    };
    this.script = {
        base: "",
        baseClient: "",
        baseServer: "",
        driveFileId: "",
        editDatabase: "",
        include: ""
    };
    this.gas = {
        jims: "13MjautTiWxSccdWEVsBl0yra6qncERgaSItg8xXGkS7E1zxFso2COzkD"
    };
    this.spreadsheet = {

    };
    this.document = {

    };
    this.form = {

    };
    this.apikey = {
        main: "AIzaSyBGpG_KNJ4zyZtefN_x_r0KdlxdCmBu7cQ"
    }
}

const fileId = new DriveFileId();
