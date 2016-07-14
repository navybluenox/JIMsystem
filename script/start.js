//  ---About This---
/*
名前
    start.js

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

//start.jsが読み込まれると実行される部分　ここから
//汎用的なオブジェクトなどはここで作成

    var geval = eval;
    var _val = {};
    var _tmp = {
        pageFun:{}
    };
    _val.status = {whichSide:"client"};
    _val.server = new Server();
    _val.server.loadDataByName("config")
    .then(function(v){
        _val.config = v;
    });

//start.jsが読み込まれると実行される部分　ここまで