//  ---About This---
/*
名前
config.js

このファイルについて
JIMシステムの基本設定をもつ「config.json」を扱うためのConfigクラスを定義しています

定義一覧
    Config()クラス
        説明
        引数
*/


var Config = (function(){
    var rawdata;
    return (
        class Config {
            constructor(){
                this._loaded = false;
            }
            isLoaded(){
                return this._loaded;
            }
            loadData(){
                
            }
        }
    )
})();
