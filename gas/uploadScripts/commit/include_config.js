<script>
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var Config = function () {
    var rawdata;
    return function () {
        function Config() {
            _classCallCheck(this, Config);

            this._loaded = false;
        }

        _createClass(Config, [{
            key: "isLoaded",
            value: function isLoaded() {
                return this._loaded;
            }
        }, {
            key: "loadData",
            value: function loadData() {}
        }]);

        return Config;
    }();
}();
</script>
