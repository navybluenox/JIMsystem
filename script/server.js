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
            var loadingId = makeRandomStr();
            this._loading.push({id:loadingId,coll:collInfo});
            return runServerFun("loadDataFromDrive",[collInfo.fileId,"raw"])
            .then(function(v){
                cache[collInfo.name] = [];
                var c = cache[collInfo.name];
                var thisClass = collInfo.getClass();
                cache[collInfo.name] = v.map(function(dataObj){
                    return new thisClass(dataObj);
                });
                this._loading = this._loading.filter(function(obj){return obj.id !== loadingId});
                return cache[collInfo.name];
            })
            .catch(function(e){
                this._loading = this._loading.filter(function(obj){return obj.id !== loadingId});
                console.log(e);
            });
        }
        loadDataByName(dataName){
            return this.loadData(this.getCollectionInfoByName(dataName));
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
        getData(dataName,newCopy){
            if(newCopy === undefined)  newCopy = true;
            if(cache[dataName] === undefined)  return [];
            if(newCopy){
                return Array.prototype.slice(cache[dataName]);
            }else{
                return cache[dataName];
            }
        }
        getDataById(ids,dataName,newCopy){
            if(!Array.isArray(ids))  ids = [ids];
            return this.getData(dataName,newCopy).filter(function(data){
                return ids.inArray(data);
            });
        }
        getCollectionInfoByName(dataName){
            return cache.collectionInfo.find(function(collInfo){
                return collInfo.name === dataName;
            });
        }
        getVersion(dataName){
            return this.getCollectionInfoByName(dataName).version;
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
})();

function runServerFun(funName,_arguments,userObj){
    return new Promise(function (resolve,reject){
        google.script.run
        .withSuccessHandler(function(v,o){
            try{
                resolve(JSON.parse(v),o);
            }catch(e){
                resolve(v,o);
            }
        })
        .withFailureHandler(function(e,o){
            reject(e,o);
        })
        .withUserObject(userObj)
        .loadfun(funName,_arguments);
    });
}

