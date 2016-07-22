"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//  ---About This---
/*
名前
server.js

このファイルについて
クライアントJSからサーバーへアクセスする関数群をまとめたServerクラスを定義しています

定義一覧
    Server()クラス
        説明
        引数
*/

var Server = function () {
    var cache = {};
    //TODO  Get this info from config.json
    //This is collectionInfo.json
    var colTableFileId = "0B88bKUOZP4-AalctMlZ4MDE0eG8";
    return function () {
        function Server() {
            _classCallCheck(this, Server);

            var that = this;
            this._pendingQueue = [];
            this._updatingQueue = [];
            this._updating = false;
            this._loading = [];
            this._loaded = false;
            this._ready = false;
            this._eventHandler = {
                ready: []
            };
            //delete!! リリース前に必ず消す
            this._cache = cache;
            //delete!!!
            runServerFun("Script.loadDataFromDrive", [colTableFileId, "all"]).then(function (v) {
                //TODO
                //value v is invalid (datafile is not incomplete)
                var collInfo_of_collectionInfoColl = v.find(function (collObj) {
                    return collObj.name === "collectionInfo";
                });
                cache.collectionInfo = v.map(function (collObj) {
                    return new CollectionInfo(collObj, { init: true, init_data: collInfo_of_collectionInfoColl });
                });
                that._loaded = true;
                that._ready = true;
                that._eventHandler.ready.reverse();
                var fun;
                var i = 0;
                while ((fun = that._eventHandler.ready.pop()) !== undefined && i < 5) {
                    try {
                        fun(that);
                    } catch (e) {
                        that._eventHandler.ready.unshift(fun);
                        i++;
                    }
                }
                console.log(that);
            }).catch(function (e) {
                console.log(e);
            });
        }

        _createClass(Server, [{
            key: "onReady",
            value: function onReady(handler) {
                if (this._ready) {
                    handler(this);
                } else {
                    this._eventHandler.ready.push(handler);
                }
                return this;
            }
        }, {
            key: "isLoaded",
            value: function isLoaded() {
                return this._loaded;
            }
        }, {
            key: "isReady",
            value: function isReady() {
                return this._ready;
            }
        }, {
            key: "loadData",
            value: function loadData(collInfo) {
                if (!(collInfo instanceof CollectionInfo)) {
                    console.log("Error : An argument of fun:loadData is not an instance of CollectionInfo");
                    console.log(collInfo);
                    throw new Error();
                }
                var that = this;
                var loadingId = makeRandomStr();
                this._loading.push({ id: loadingId, coll: collInfo });
                return runServerFun("Script.loadDataFromDrive", collInfo.getValue("fileId")).then(function (v) {
                    var collName = collInfo.getValue("name");
                    cache[collName] = [];
                    var c = cache[collName];
                    var thisClass = collInfo.getClass();
                    cache[collName] = v.map(function (dataObj) {
                        return new thisClass(dataObj);
                    });
                    that._loading = that._loading.filter(function (obj) {
                        return obj.id !== loadingId;
                    });
                    return cache[collName];
                }).catch(function (e) {
                    that._loading = that._loading.filter(function (obj) {
                        return obj.id !== loadingId;
                    });
                    console.log(e);
                });
            }
        }, {
            key: "loadDataByName",
            value: function loadDataByName(dataName) {
                return this.loadData(this.getCollectionInfoByName(dataName));
            }
        }, {
            key: "loadDataAll",
            value: function loadDataAll() {
                return Promise.all(cache.collectionInfo.map(function (collInfo) {
                    return this.loadData(collInfo);
                }));
            }
        }, {
            key: "reloadData",
            value: function reloadData(collInfos) {
                if (!Array.isArray(collInfos)) collInfos = [collInfos];
                return Promise.all(collInfos.map(function (collInfo) {
                    return this.loadData(collInfo);
                }));
            }
        }, {
            key: "getData",
            value: function getData(dataName, newCopy) {
                if (newCopy === undefined) newCopy = true;
                if (cache[dataName] === undefined) return [];
                if (newCopy) {
                    return Array.prototype.slice(cache[dataName]);
                } else {
                    return cache[dataName];
                }
            }
        }, {
            key: "getDataById",
            value: function getDataById(ids, dataName, newCopy) {
                if (!Array.isArray(ids)) ids = [ids];
                return this.getData(dataName, newCopy).filter(function (data) {
                    return inArray(ids, data);
                });
            }
        }, {
            key: "getCollectionInfoByName",
            value: function getCollectionInfoByName(dataName) {
                return cache.collectionInfo.find(function (collInfo) {
                    return collInfo.getValue("name") === dataName;
                });
            }
        }, {
            key: "getVersion",
            value: function getVersion(dataName) {
                return this.getCollectionInfoByName(dataName).version;
            }
        }, {
            key: "sendUpdateQueue",
            value: function sendUpdateQueue() {}
        }, {
            key: "changeData",
            value: function changeData(datapieces) {
                if (!Array.isArray(datapieces)) datapieces = [datapieces];
                //undefinedなキーはそのまま（skip）
            }
        }, {
            key: "addData",
            value: function addData(datapieces) {
                if (!Array.isArray(datapieces)) datapieces = [datapieces];
            }
        }, {
            key: "removeData",
            value: function removeData(datapieces) {
                if (!Array.isArray(datapieces)) datapieces = [datapieces];
            }
        }]);

        return Server;
    }();
}();

function runServerFun(funName, _arguments, userObj) {
    return new Promise(function (resolve, reject) {
        google.script.run.withSuccessHandler(function (v, o) {
            try {
                resolve(JSON.parse(v), o);
            } catch (e) {
                resolve(v, o);
            }
        }).withFailureHandler(function (e, o) {
            reject(e, o);
        }).withUserObject(userObj).loadfun(funName, _arguments);
    });
}