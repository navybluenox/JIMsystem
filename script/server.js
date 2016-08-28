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
    //TODO  Get this info from config.json
    //This is collectionInfo.json
    return class Server {
        constructor(){
            var that = this;
            this._pendingQueue = [];
            this._updatingQueue = [];
            this._updating = false;
            this._loading = [];
            this._loaded = false;
            this._ready = false;
            this._eventHandler = {
                ready:[]
            };
            //delete!! リリース前に必ず消す
            this._cache = cache;
            //delete!!!
            if(Object.keys(cache).length === 0){
                runServerFun("Script.loadDataFromDrive",[_val.baseConfig.collectionInfoFileId,"data"])
                .then(function(v){
                    //TODO
                    //value v is invalid (datafile is not incomplete)
                    var collInfo_of_collectionInfoColl = v.find(function(collObj){return collObj.name === "collectionInfo"});
                    cache.collectionInfo = v.map(function(collObj){
                        return new CollectionInfo(collObj,{init:true,init_data:collInfo_of_collectionInfoColl});
                    });
                    that._loaded = true;
                    that._ready = true;
                    that._eventHandler.ready.reverse();
                    var fun;
                    var i=0;
                    while((fun = that._eventHandler.ready.pop()) !== undefined && i<5){
                        try{
                            fun(that);
                        }catch(e){
                            that._eventHandler.ready.unshift(fun);
                            i++;
                        }
                    }
                    console.log(that);
                }).catch(function(e){
                    console.log(e);
                });
            }else{
                that._loaded = true;
                that._ready = true;
            }
            return this;
        }
        onReady(handler){
            if(this._ready){
                handler(this);
            }else{
                this._eventHandler.ready.push(handler);
            }
            return this;
        }
        isLoaded(){
            return this._loaded;
        }
        isReady(){
            return this._ready;
        }
        isLoadedData(dataName){
            return cache[dataName] !== undefined;
        }
        loadData(collInfo,option){
            if(!(collInfo instanceof CollectionInfo)){
                console.log("Error : An argument of fun:loadData is not an instance of CollectionInfo");
                console.log(collInfo);
                throw new Error();
            }
            console.log("loadData : " + collInfo.getValue("name"));
            if(option === undefined || classof(option) === "object"){
                option = {overwrite:true};
            }else{
                option.overwrite = true;
            }
            var that = this;
            var loadingId = makeRandomStr();
            this._loading.push({id:loadingId,coll:collInfo});
            return runServerFun("Script.loadDataFromDrive",[collInfo.getValue("fileId"),"data"])
            .then(function(v){
                var collName = collInfo.getValue("name");
                cache[collName] = [];
                var c = cache[collName];
                var thisClass = collInfo.getClass();
                cache[collName] = v.map(function(dataObj){
                    return new thisClass(dataObj,option);
                });
                that._loading = that._loading.filter(function(obj){return obj.id !== loadingId});
                console.log(cache[collName]);
                return cache[collName];
            })
            .catch(function(e){
                that._loading = that._loading.filter(function(obj){return obj.id !== loadingId});
                console.log(e);
            });
        }
        loadDataByName(dataName,option){
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
                return cache[dataName].slice();
            }else{
                return cache[dataName];
            }
        }
        getDataById(ids,dataName,newCopy){
            if(!Array.isArray(ids))  ids = [ids];
            return this.getData(dataName,newCopy).filter(function(data){
                return inArray(ids,data);
            });
        }
        getCollectionInfoByName(dataName){
            return cache.collectionInfo.find(function(collInfo){
                return collInfo.getValue("name") === dataName;
            });
        }
        getVersion(dataName){
            return this.getCollectionInfoByName(dataName).version;
        }
        sendUpdateQueue(){
            var that = this;
            var nowTime;
            return (new Promise(function(resolve,reject){
                var si = setInterval(function(){
                    if(!that._updating){
                        clearInterval(si);
                        resolve();
                    }
                },100)
            })).then(function(){
                that._updating = true;
                nowTime = new Date();
                that._updatingQueue = that._pendingQueue.slice();
                that._pendingQueue = [];

                var queueForSend = {};
                that._updatingQueue = that._updatingQueue.map(function(queue){
                    switch(queue.kind){
                        case "change":
                            queue.value.setValue("updated",nowTime);
                            return queue;
                        case "add":
                            queue.value
                                .setValue("created",nowTime)
                                .setValue("updated",nowTime)
                                .setNewId();
                            return queue;
                        case "remove":
                            return queue;
                    }
                });
                that._updatingQueue.forEach(function(queue){
                    var dataName = queue.value.getDataName();
                    if(queueForSend[dataName] === undefined){
                        queueForSend[dataName] = [];
                    }
                    queueForSend[dataName].push(queue);
                });
                //GAS（サーバー側）へ引数を渡す時、普通は自動でJSON.stringify()を実行するが、何故かDate型のJSON.stringifyに失敗するので、手元で整理
                queueForSend = JSON.parse(JSON.stringify(queueForSend));
                return Promise.all(Object.keys(queueForSend).map(function(dataName){
                    return runServerFun("Script.updateDatabase",[that.getCollectionInfoByName(dataName).getValue("fileId"),queueForSend[dataName]]);
                }));
            })
            .then(function(){
                var queue,data,dataName,dataIndex,dataId;
                var queueList = that._updatingQueue.slice().reverse();
                while(queueList.length > 0){
                    queue = queueList.pop();
                    dataName = queue.getDataName();
                    data = that.getData(dataName,false);
                    switch(queue.kind){
                        case "change":
                            dataId = queue.value.getValue("_id");
                            data.find(function(dp){
                                return dp.getValue("_id") === dataId;
                            }).setValues(queue.value,{overwrite:true});
                            break;
                        case "add":
                            data.push(new (Database.getClassByName(dataName))(queue.value));
                            break;
                        case "remove":
                            dataId = queue.value.getValue("_id");
                            dataIndex = data.findIndex(function(dp){
                                return dp.getValue("_id") === dataId;
                            });
                            data.splice(dataIndex,1) = null;
                            break;
                    }
                }
            })
            .then(function(){
                that._updating = false;
                that._pendingQueue = [];                    
            });
        }
        changeData(datapieces){
            if(!Array.isArray(datapieces))  datapieces = [datapieces];
            var that = this;
            //undefinedなキーはそのまま（skip）
            datapieces.forEach(function(datapiece){
                that._pendingQueue.push({
                    "kind":"change",
                    "value":datapiece
                });
            });
        }
        addData(datapieces){
            if(!Array.isArray(datapieces))  datapieces = [datapieces];
            var that = this;
            datapieces.forEach(function(datapiece){
                that._pendingQueue.push({
                    "kind":"add",
                    "value":datapiece
                });
            });
        }
        removeData(datapieces){
            if(!Array.isArray(datapieces))  datapieces = [datapieces];
            var that = this;
            datapieces.forEach(function(datapiece){
                that._pendingQueue.push({
                    "kind":"remove",
                    "value":datapiece
                });
            });
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


