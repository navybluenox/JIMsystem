var Server = (function(){
    var cache = {};
    var collectionInfoFileId;
    //This is collectionInfo.json
    return class Server {
        constructor(){
            var that = this;
            this._version = {};
            this._updated = {};
            this._pendingQueue = [];
            this._updatingQueue = [];
            this._updating = false;
            this._loading = [];
            this._loaded = false;
            this._ready = false;
            this._eventHandler = {
                ready:[]
            };
            //delete!!!
            if(Object.keys(cache).length === 0){
                runServerFun("Script.loadDataFromDrive",[collectionInfoFileId,"data"])
                .then(function(v){
                    //TODO
                    //value v is invalid (datafile is not incomplete)
                    var collInfo_CollectionInfo = v.find(function(collObj){return collObj.name === "collectionInfo"});
                    cache.collectionInfo = v.map(function(collObj){
                        return new CollectionInfo(collObj,{init:true,init_data:collInfo_CollectionInfo});
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
        loadData(collInfo,option,reload){
            var that = this;
            //collInfo:CollectionInfo型かdataName(String型)を要求
            if(!(collInfo instanceof CollectionInfo)){
                collInfo = this.getCollectionInfoByName(collInfo);
                if(collInfo === undefined){
                    console.log("Error : An argument of fun:loadData is not an instance of CollectionInfo");
                    console.log(collInfo);
                    la.remove();
                    throw new Error();
                }
            }
            if(option === undefined || classof(option) === "object"){
                option = {overwrite:true};
            }else{
                option.overwrite = true;
            }
            if(reload === undefined)  reload = false;

            //reloadフラグがfalseで強制リロードでない&既にロードされている　→　自動でスキップ
            if(!reload && this.isLoadedData(collInfo.getValue("name")))  return Promise.resolve(this.getData(collInfo.getValue("name")));

            console.log("loadData : " + collInfo.getValue("name"));
            var la = new LoadingAlert();
            var that = this;
            var loadingId = makeRandomStr();
            this._loading.push({id:loadingId,coll:collInfo});
            return runServerFun("Script.loadDataFromDrive",[collInfo.getValue("fileId"),"all"])
            .then(function(v){
                var dataName = collInfo.getValue("name");
                var thisClass = collInfo.getClass();
                cache[dataName] = v.data.map(function(dataObj){
                    return new thisClass(dataObj,option);
                });
                that._updated[dataName] = (v.updated === "" || v.updated === undefined ? null : new Date(v.updated));
                that._version[dataName] = +v.version;
                that._loading = that._loading.filter(function(obj){return obj.id !== loadingId});
                console.log(cache[dataName]);
                la.remove();
                return that.getData(dataName);
            })
            .catch(function(e){
                that._loading = that._loading.filter(function(obj){return obj.id !== loadingId});
                console.log(e);
                la.remove();
            });
        }
        reloadData(collInfo,option){
            return this.loadData(collInfo,option,true);
        }
        loadDataAll(){
            var that = this;
            return Promise.all(cache.collectionInfo.map(function(collInfo){
                return that.loadData(collInfo);
            }));
        }
        reloadDataAll(){
            var that = this;
            return Promise.all(Object.keys(cache).map(function(dataName){
                return that.getCollectionInfoByName(dataName)
            }).map(function(collInfo){
                return that.reloadData(collInfo);
            }));
        }
        getData(dataName,newCopy,preventSkip){
            if(newCopy === undefined || newCopy === null)  newCopy = true;
            if(cache[dataName] === undefined)  return [];
            if(preventSkip === undefined || preventSkip === null)  preventSkip = false;
            var result;
            if(newCopy){
                result = cache[dataName].slice();
            }else{
                result = cache[dataName];
            }
            if(!preventSkip){
                //原則として無視するデータをdataNameごとに指定
                switch(dataName){
                    case "user":
                        result = result.filter(function(datapiece){return datapiece.getValue("isAvailable")});
                        break;
                    case "workAssign":
                        result = result.filter(function(datapiece){return !datapiece.getValue("disabled")});
                        break;
                    default:
                        break;
                }
            }
            return result;
        }
        getDataById(ids,dataName,newCopy){
            if(!Array.isArray(ids))  ids = [ids];
            return this.getData(dataName,newCopy).filter(function(data){
                return inArray(ids,data.getValue("_id"));
            });
        }
        getCollectionInfoByName(dataName){
            return this.getData("collectionInfo").find(function(collInfo){
                return collInfo.getValue("name") === dataName;
            }) || (new CollectionInfo());
        }
        getVersion(dataName){
            return this._version[dataName];
        }
        getUpdatedTime(dataName){
            return this._updated[dataName];
        }
        sendUpdateQueue(){
            if(!checkAuthorization("Server.prototype.sendUpdateQueue")){
                this._pendingQueue = [];
                return Promise.resolve();
            };

            //TODO
            //ここはそのうち消す
            if(!confirm([
                "データを上書きします",
                "よろしいですか？",
                "（誤爆しなくなったら消します）"
            ].join("\n"))){
                this._pendingQueue = [];
                return Promise.resolve();
            }
            
            var that = this;
            var nowTime;
            var la = new LoadingAlert();
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
                            queue.value.setValues({"updated":nowTime});
                            return queue;
                        case "add":
                            queue.value
                                .setValues({"created":nowTime})
                                .setValues({"updated":nowTime})
                                .setNewId(true)
                                .setDefaultValue();
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
                    that._version[dataName]++;
                    that._updated[dataName] = new Date(nowTime.getTime());
                    return runServerFun("Script.updateDatabase",[that.getCollectionInfoByName(dataName).getValue("fileId"),queueForSend[dataName],nowTime.toISOString(),{"version":that.getVersion(dataName),"updated":that.getUpdatedTime(dataName).toISOString()}]);
                }));
            })
            .then(function(){
                var queue,data,dataName,dataIndex,dataId;
                var queueList = that._updatingQueue.slice().reverse();
                while(queueList.length > 0){
                    queue = queueList.pop();
                    dataName = queue.value.getDataName();
                    data = that.getData(dataName,false,true);
                    switch(queue.kind){
                        case "change":
                            dataId = queue.value.getValue("_id");
                            data.find(function(dp){
                                return dp.getValue("_id") === dataId;
                            }).setValues(queue.value.getValues(),{overwrite:true});
                            break;
                        case "add":
                            data.push(queue.value);
                            break;
                        case "remove":
                            dataId = queue.value.getValue("_id");
                            dataIndex = data.findIndex(function(dp){
                                return dp.getValue("_id") === dataId;
                            });
                            data[dataIndex].setValue("_id","");
                            data.splice(dataIndex,1);
                            break;
                    }
                }
            })
            .then(function(){
                that._updatingQueue = [];
                if(that._pendingQueue.length > 0){
                    return that.sendUpdateQueue();
                }
            }).then(function(){
                that._updating = false;
                la.remove();
                console.log("update finished!!");
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
            return this;
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
            return this;
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
            return this;
        }
        static initialize(settings){
            if(settings === undefined || typeof settings !== "object" || settings === null)  return;
            collectionInfoFileId = collectionInfoFileId || settings.collectionInfoFileId;
        }
        static handlePropertiesService(value,type,doKind){
            if(value === undefined || type === undefined || doKind === undefined)  return;
            switch(doKind){
                case "set":
                    if(classof(value) !== "object")  return;
                    break;
                case "get":
                case "delete":
                    if(value === null){
                        value = [];
                    }else if(typeof value === "string"){
                        value = [value];
                    }else if(!Array.isArray(value)){
                        return;
                    }
                    break;
            }
            return runServerFun("Script.handlePropertiesService",[value,type,doKind]);
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

var LoadingAlert = (function(){
    var img = $('<img src="https://jimsystem-a5629.firebaseapp.com/resource/gif-load.gif" alt="now updating...">');
    var las = [];
    return class LoadingAlert{
        constructor(){
            var that = this;
            this._div = $("<div></div>").appendTo($("#modalWindow"));
            this._div.append(img);
            this._div.css("display","none")
            setStyle();
            setPosition();
            this._div.fadeIn("slow");
            var dr = new DelayRun(function(){
                setPosition();
                setStyle();
            });
            var timer;
            $(window).on("resize.loadingAlert",function(){
                dr.runLater();
            })
            las.push(this);
            function setPosition(){
                var margin = 20;
                that._div.css({
                    "right":"" + margin + "px",
                    "top":"" + ($(window).height() - that._div.outerWidth() - margin) + "px"
                })
            }
            function setStyle(){
                that._div.css({
                    "z-index":2,
                    "position":"fixed",
                    "border":"2px solid #FFFFFF",
                    "border-radius":"10px",
                    "margin":"0",
                    "padding":"2px",
                    "background":"#FFFFFF"
                })
            }
        }
        static removeAll(){
            las.forEach(function(la){
                la.remove();
            });
            las.length = 0;
        }
        remove(){
            var that = this;
            this._div.fadeOut("normal",function(){
                that._div.remove();
            });
        }
    }
})();


