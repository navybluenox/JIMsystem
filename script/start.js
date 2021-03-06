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

    var _val = {
        pageFun:{},
        authorization:true
    };
    var _tmp = {};
    $(function(){
        var modeName;
        runServerFun("Script.handlePropertiesService",[["mode","defaultMode","systemConfig_fileId"],"script","get"]).then(function(obj){
            modeName = obj.mode;
            return runServerFun("Script.loadDataFromDrive",[obj.systemConfig_fileId,"data"]).then(function(configs){
                var index = configs.findIndex(function(config){return config.modeName === obj.mode});
                if(index === -1){
                    console.log("Attention : \"" + modeName + "\" is invalid. This system run as the defalut mode.");
                    modeName = obj.defaultMode;
                    return configs.find(function(config){return config.modeName === obj.defaultMode}).content.base.fileId_fileInfo;
                }else{
                    return configs[index].content.base.fileId_fileInfo;
                }
            });
        }).then(function(fileId_fileInfo){
            console.log("run mode : " + modeName);
            Server.initialize({"fileId_fileInfo":fileId_fileInfo});
            _val.onMovePage = [];
            _val.server = new Server();
            Datapiece.initialize({"server":_val.server});
            Spreadsheet.initialize({"server":_val.server});
            initialize_shifttable({"server":_val.server});
            _val.server.onReady(function(that){
                _val.server.loadData("systemConfig")
                .then(function(v){
                    _val.config = v.find(function(v1){
                        return v1.getValue("modeName") === modeName;
                    });
                    if(_val.config === undefined){
                        throw new Error("configデータが不正です。設定したモードに対応するconfigデータがありません。");
                    }
                    var key_systemUpdated = "updated_" + _val.config.getValue("modeName");
                    return Server.handlePropertiesService(key_systemUpdated,"script","get").then(v => {
                        _val.systemUpdated = new Date(v[key_systemUpdated]);
                    })
                }).then(() => {
                    Server.initialize({"config":_val.config,"systemUpdated":_val.systemUpdated});
                    Datapiece.initialize({"config":_val.config});
                    LocalDate.initialize({"config":_val.config});
                    initialize_shifttable({"config":_val.config});
                    console.log("_val",_val);
                });
            })
        });
    });
