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

class DrivefileId {
    constructor(){
        this.data = {
            test: "#0123456789abcdef"
        };
        this.script = {
            base: "",
            baseClient: "",
            baseServer: "",
            DrivefileId: "",
            editDatabase: "",
            include: ""
        };
        this.config = "";
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
}

const _fileId = new DrivefileId();
