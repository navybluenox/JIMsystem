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


var Server = (function(){
    var cache = {};
    var colTableFileId = "0B88bKUOZP4-AalctMlZ4MDE0eG8";
    return class Server {
        constructor(){
            this._pendingQueue = [];
            this._updatingQueue = [];
            this._updating = false;
            this._loading = [];
            runServerFun("loadDataFromDrive",[colTableFileId,"raw"])
            .then(function(v){
                cache.collectionInfo = v.map(function(collObj){
                    return new CollectionInfo(collObj);
                });
            }).catch(function(e){
                console.log(e);
            });
        }
        isLoaded(){
            return this._loaded;
        }
        loadData(collInfo){
            if(!collInfo instanceof CollectionInfo){
                console.log("Error : An argument of fun:loadData is not an instance of CollectionInfo");
                console.log(collInfo);
                throw new Error();
            }
            return runServerFun("loadDataFromDrive",[collInfo.fileId,"raw"])
            .then(function(v){
                cache[collInfo.name] = [];
                var c = cache[collInfo.name];
                var thisClass = collInfo.getClass();
                cache[collInfo.name] = v.map(function(dataObj){
                    return new thisClass(dataObj);
                });
                return cache[collInfo.name];
            })
            .catch(function(e){
                console.log(e);
            });
        }
        loadDataAll(){
            return Promise.all(cache.collectionInfo.map(function(collInfo){
                return this.loadData(collInfo);
            }));
        }
        reloadData(collInfos){
            if(!Array.isArray(collInfos))  collInfos = [collInfos];
            return Promise.all(collInfos.map(function(collInfo){
                return this.loadData(collInfo);
            }));
        }
        getData(collName,newCopy){
            if(newCopy === undefined)  newCopy = false;
            if(cache[collName] === undefined)  return [];
            if(newCopy){
                return Array.prototype.slice(cache[collName]);
            }else{
                return cache[collName];
            }
        }
        getDataById(ids,collName,newCopy){
            if(!Array.isArray(ids))  ids = [ids];
            return this.getData(collName,newCopy).filter(function(data){
                return ids.inArray(data);
            });
        }
        getVersion(collName){
            return cache.collectionInfo.filter(function(collInfo){
                return collInfo.name === collName;
            })[0].version;
        }
        sendUpdateQueue(){

        }
        changeData(datapieces){
            if(!Array.isArray(datapieces))  datapieces = [datapieces];
            //undefinedなキーはそのまま（skip）
        }
        addData(datapieces){
            if(!Array.isArray(datapieces))  datapieces = [datapieces];

        }
        removeData(datapieces){
            if(!Array.isArray(datapieces))  datapieces = [datapieces];

        }
    };
    function runServerFun(funName,_arguments,userObj){
        return new Promise(function (resolve,reject){
            google.script.run
            .withSuccessHandler(function(e,o){
                reject(e,o);
            })
            .withFailureHandler(function(v,o){
                try{
                    resolve(JSON.parse(v),o);
                }catch(e){
                    resolve(v,o);
                }
            })
            .withUserObject(userObj)
            .loadfun(funName,_arguments);
        });
    }
})();


