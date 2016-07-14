"use strict";

//  ---About This---
/*
名前
    include.js

依存ファイル
    driveFileId.js

このファイルについて
    GAS側でよく使用される関数を、他のファイルから取得するのをまとめています
    include関数の引数を設定すると、個別にincludeする関数を設定できます

定義一覧
    _status変数
        JIMシステムで用いる様々な状態を格納している変数です
    _status.whichSide
        スクリプトが動作しているのが、クライアント側なのかサーバー側なのかについての設定です
            client
                クライアントJavascriptモード
            server
                サーバーJavascriptモード（GAS）
        省略可。省略した場合、window.console.log関数を実行して決めます（失敗したらserver-side）

    _config変数
        JIMシステムで用いる様々な設定を格納している変数です
        ./config.jsonからロードしています

    _fileId変数
        DrivefileIdのインスタンス

    geval(evaluateStr)
        説明
            eval関数を間接的に呼び出すためのダミー関数です
            eval関数とは、evaluateStrがグローバルスコープとして解釈される点で異なります
                //evalのそのままだと、evalが実行されたローカルスコープで解釈される
            みだりに使用しないこと。意図しない関数が定義されるなど、汚染を起こしかねない

    include(configInclude)
        説明
        引数
            configInclude
                GoogleDriveに保存されているスクリプトファイルで、ダウンロードするファイルを指定します
                引数なしで実行すると、予め指定されたファイルがincludeされます
                    configInclude.enable
                        ダウンロードするファイルを追加します
                        GoogleDriveのファイルIDの文字列で指定します
                            DriveFileIdクラスも使用可能
                            複数設定する場合は、配列で指定
                        ファイル名は拡張子まで記入すること
                        省略可。省略した場合、デフォルトから追加しない
                    configInclude.disable
                        ダウンロードするファイルをデフォルトから削除します
                        省略可。省略した場合、デフォルトから削除しない
                    configInclude.disableDefault
                        このファイルで設定されているデフォルトを無効にする
                            "driveFileId.js"は無効にされない
                        省略可。省略した場合、無効にしない
                    configInclude.downloadFrom
                        ダウンロード先を選択できます
                        //未実装

    loadFileFromDrive(fileIdStr,charEnc)
        説明
            GoogleDriveからテキストファイルをダウンロードして、文字列として返します
        引数
            fileIdStr
                GoogleDriveのファイルID（ファイルを開いた時に、URLに記載されている一部のランダムな文字列のこと）
                String型で記入
            charEnc
                テキストファイルの文字コード
                省略可。省略した場合、UTF-8となる
*/

//include.jsが読み込まれると実行される部分　ここから
//汎用的なオブジェクトなどはここで作成

var geval = eval;

//_statusを設定
try {
    _status;
} catch (e) {
    _status = {};
}
_status.whichSide = "server";

geval(loadFileFromDrive("0B88bKUOZP4-AYTZJTTZkVG5DX2s"));
var _fileId = new DrivefileId();
var _config = JSON.parse(loadFileFromDrive(_fileId.config));

//_configを設定

//include.jsが読み込まれると実行される部分　ここまで

function include(configInclude) {
    if (configInclude == null) configInclude = {};
    var includeFileIds = [];
    if (!configInclude.disableDefault) {
        //デフォルトでロードするファイルID
        includeFileIds = includeFileIds.concat([_fileId.script.base, _fileId.script.database, _fileId.script.spreadsheet]);
    }
    if (configInclude.enable) {
        if (typeof configInclude.enable == "string") configInclude.enable = [configInclude.enable];
        includeFileIds = includeFileIds.concat(configInclude.enable);
    }
    if (configInclude.disable) {
        if (typeof configInclude.disable == "string") configInclude.disable = [configInclude.disable];
        includeFileIds = includeFileIds.filter(function (id) {
            return configInclude.disable.indexOf(id) == -1;
        });
    }
    includeFileIds = includeFileIds.filter(function (v, i, s) {
        return s.indexOf(v) === i;
    });
    includeFileIds.forEach(function (fileId) {
        geval(loadFileFromDrive(fileId));
    });
}

function loadFileFromDrive(fileIdStr, charEnc) {
    if (charEnc == null) charEnc = "UTF-8";
    return DriveApp.getFileById(fileIdStr).getBlob().getDataAsString(charEnc);
}