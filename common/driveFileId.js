//  ---About This---
/*
名前
    driveFileId.js

このファイルについて
    GoogleDriveにあるファイルのfileIdなどのID群をまとめて管理しています
    DriveFileIdクラスを定義し、ファイルの種類ごとにidを直に書いています
    なお、このファイルをincludeすると、自動で「fileId」という名前でDriveFileIdのインスタンス

定義一覧
    DriveFileIdクラス
        //TODO
        DriveFileId.data
            JIMシステムで使用するデータ群です。
            ファイル名は「__.json」
        DriveFileId.script
            JIMシステムで使用するスクリプト群です。
            クライアントjavascript、GASの両方を含みます。
            ファイル名は「__.js」
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
