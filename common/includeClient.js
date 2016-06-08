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

*/

//include.jsが読み込まれると実行される部分　ここから
//汎用的なオブジェクトなどはここで作成

    var geval = eval;

    //_statusを設定
    try{
        _status;
    }catch(e){
        _status = {};
    }

    if(_status.whichSide == null){
        try{
            console.log("All the scripts work as client-side");
            _status.whichSide = "client";
        }catch(e){
            Logger.log("All the scripts work as server-side")
            _status.whichSide = "server";
        }
    }

    var _fileId,_config;
    if(_status.whichSide == "server"){
        //driveFileId.jsのファイルIDのみ直書きが必要
        geval(loadFileFromDrive("##fileId of driveFileId.js##"));
        _fileId = new DrivefileId();
        _config = JSON.parse(loadFileFromDrive(_fileId.config));
    }else if(_status.whichSide == "client"){
        _fileId = new DrivefileId();
        google.script.run.withSuccessHandler(function(v){
            _config = JSON.parse(v);
        }).loadFileFromDrive(_fileId.config);
    }


    //_configを設定


//include.jsが読み込まれると実行される部分　ここまで
