var Spreadsheet = (function(){
    var server;
    return class Spreadsheet{
        constructor(fileName,sheetName,data){
            this._fileInfo = Spreadsheet.getServer().getData("fileInfo").find(function(fileInfo){return fileInfo.getValue("name") === fileName});
            this._sheetName = sheetName;
            this._data = data.slice();
        }
        copy(newSheetName){
            return new Spreadsheet(this.getFileName(), newSheetName ? newSheetName : this.getSheetName(), $.extend(true,{},this.getData()));
        }
        getData(){
            return this._data;
        }
        getFileInfo(){
            return this._fileInfo;
        }
        getFileName(){
            return this.getFileInfo().getValues("name");
        }
        getSheetName(){
            return this._sheetName;
        }

        readSheetData(columnType){
            var that = this;
            var la = new LoadingAlert();
            return runServerFun("Script.readSheetValuesFromClient",[this.getFileInfo().getValue("fileId"),this.getSheetName()]).then(function(v){
                that._data = Spreadsheet.convertDataFromArrayToHash(v,columnType);
                console.log("Reading data of spreadsheet from server successes!");
                la.remove();
            });
        }
        writeSheetData(columnType,columnOrder,numRowsPerRequest,settings,callback,optionOfWriteSheet){
            if(this.hasData()){
                console.log("This spreadsheet does not have data");
                return this;
            }
            numRowsPerRequest = (numRowsPerRequest === 0 || numRowsPerRequest === undefined ? this.getData().length + 1 : numRowsPerRequest);
            var that = this;
            settings = settings || ["text"];
            if(typeof callback !== "function")  callback = function(value,key,rowIndex,columnIndex){return {"text":value};};
            optionOfWriteSheet = optionOfWriteSheet || {};

            var la = new LoadingAlert();
            var contents = Spreadsheet.convertDataFromHashToArray(this.getData(),columnType,columnOrder);
            var keys = contents[0].slice();

            contents = contents.map(function(row,rowIndex){
                return row.map(function(cell,cellIndex){
                    return callback(cell,keys[cellIndex],rowIndex,cellIndex);
                })
            });

            var sendData = {};

            settings.forEach(function(setting){
                sendData[setting] = contents.map(function(row){
                    return row.map(function(cell){
                        if(cell[setting] === undefined)  cell[setting] = null;
                        return cell[setting];
                    });
                });
            });

            var startTrigger = false;
            var promiseChain = new Promise(function(resolve){
                var si = setInterval(function(){
                    if(startTrigger){
                        clearInterval(si);
                        resolve();
                    }
                },50);
            });
            var fileId = this.getFileInfo().getValue("fileId");
            var sheetName = this.getSheetName();
            var index = 0;

            promiseChain = promiseChain.then(function(){
                return runServerFun("Script.clearSheetFromClient",[fileId,sheetName]);
            });
            for(var i=0,l=contents.length; i<l; i+=numRowsPerRequest){
                promiseChain = promiseChain.then(function(){
                    var _sendData = {};
                    settings.forEach(function(setting){
                        _sendData[setting] = sendData[setting].splice(0,numRowsPerRequest);
                    });
                    var p = runServerFun("Script.writeSheetValuesFromClient",[fileId,sheetName,_sendData,$.extend(optionOfWriteSheet,{"top":index})]);
                    index += numRowsPerRequest;
                    return p;
                });
            }
            promiseChain = promiseChain.then(function(v){
                console.log("Writeing data on spreadsheet successes!");
                la.remove();
                return {"key":keys,"content":contents};
            });
            startTrigger = true;
            return promiseChain;
            
        }
        /*_writeSheetData(columnType,columnOrder,numRowsPerRequest,textOnly){
            if(this.hasData()){
                console.log("This spreadsheet does not have data");
                return this;
            }
            numRowsPerRequest = (numRowsPerRequest === 0 || numRowsPerRequest === undefined ? this.getData().length + 1 : numRowsPerRequest);
            textOnly = (textOnly === undefined ? true : textOnly);
            var that = this;
            var la = new LoadingAlert();
            var sendData = Spreadsheet.convertDataFromHashToArray(this.getData(),columnType,columnOrder);

            var startTrigger = false;
            var promiseChain = new Promise(function(resolve){
                var si = setInterval(function(){
                    if(startTrigger){
                        clearInterval(si);
                        resolve();
                    }
                },50);
            });
            var fileId = this.getFileInfo().getValue("fileId");
            var sheetName = this.getSheetName();
            var index = 0;

            promiseChain = promiseChain.then(function(){
                return runServerFun("Script.clearSheetFromClient",[fileId,sheetName]);
            });
            for(var i=0,l=sendData.length; i<l; i+=numRowsPerRequest){
                promiseChain = promiseChain.then(function(){
                    var p = runServerFun("Script._writeSheetValuesFromClient",[fileId,sheetName,sendData.splice(0,numRowsPerRequest),index,textOnly]);
                    index += numRowsPerRequest;
                    return p;
                });
            }
            promiseChain = promiseChain.then(function(v){
                console.log("Writeing data on spreadsheet successes!");
                la.remove();
            });
            startTrigger = true;
            return promiseChain;
        }*/
        hasData(){
            return this._data === undefined;
        }
        static initialize(settings){
            if(settings === undefined || typeof settings !== "object" || settings === null)  return;
            server = server || settings.server;
        }
        static getServer(){
            return server;
        }
        static convertDataFromArrayToHash(hashes,type){
            var columnNames = hashes[0];
            var contents = hashes.splice(1,hashes.length);
            var templateHash = {};

            columnNames.forEach(function(columnName){
                var obj = {};
                var lookAt = obj;
                var keys = columnName.split(".");
                keys.forEach(function(_key,index){
                    var key = _key.replace(/^\d+$/,"0");
                    if(index === keys.length-1){
                        lookAt[key] = "";
                    }else{
                        if(lookAt[key] === undefined){
                            if(Number.isNaN(+keys[index+1])){
                                lookAt[key] = {};
                            }else{
                                lookAt[key] = [];
                            }
                        }
                        lookAt = lookAt[key];
                    }
                });
                $.extend(true,templateHash,obj);
            });
            type = type || $(true,{},templateHash);

            contents = contents.map(function(row){
                var result = $.extend(true,{},templateHash);
                var pairs = row.map(function(cell,cellIndex){
                        return {"value":cell,"keys":columnNames[cellIndex].split(".")};
                    }).filter(function(pair){return pair.value !== ""});
                pairs.forEach(function(pair,pairIndex){
                    var cell = pair.value;
                    var keys = pair.keys;
                    var lookAt_result = result;
                    var lookAt_type = type;
                    keys.forEach(function(key,index){
                        if(index === keys.length-1){
                            if(lookAt_type[key] === "other"){
                                try{
                                    lookAt_result[key] = JSON.parse(cell);
                                }catch(e){
                                    lookAt_result[key] = cell;
                                }
                            }else{
                                lookAt_result[key] = castType(cell,lookAt_type[key]);
                            }
                        }else{
                            lookAt_type = lookAt_type[key.replace(/^\d+$/,"0")];
                            if(lookAt_result[key] === undefined && !Number.isNaN(+key)){
                                if(Number.isNaN(+keys[index+1])){
                                    lookAt_result[key] = {};
                                }else{
                                    lookAt_result[key] = [];
                                }
                            }
                            lookAt_result = lookAt_result[key];
                        }
                    });
                });
                return result;
            });

            return contents;
        }
        static convertDataFromHashToArray(hashes,type,order){
            var hashes;
            var keyList;

            var sample = {};
            if(hashes.length === 0){
                $.extend(true,sample,type);
            }else{
                hashes.forEach(function(hash){
                    $.extend(true,sample,hash);
                });
            }

            (function(){
                keyList = func(sample,"");
                function func(value,prefix){
                    var ret = [];
                    $.map(value,function(v,key){
                        switch(classof(v)){
                            case "object":
                            case "array":
                                return ret.push(func(v,prefix === "" ? key : prefix + "." + key));
                            default :
                                ret.push(prefix === "" ? key : prefix + "." + key);
                        }
                    });
                    return ret;
                }
                while(keyList.some(function(v){return classof(v) !== "string"})){
                    keyList = keyList.reduce(function(prev,curt){
                        if(!Array.isArray(curt))  curt = [curt];
                        return prev.concat(curt);
                    },[]);
                }
            })();

            if(order !== undefined){
                keyList.sort(function(a,b){
                    var aValue = order.findIndex(function(v){
                        return a.replace(/\.\d+/g,".0").replace(/^\d+$/,"0").replace(/^\d+\./,"0.") === v;
                    });
                    var bValue = order.findIndex(function(v){
                        return b.replace(/\.\d+/g,".0").replace(/^\d+$/,"0").replace(/^\d+\./,"0.") === v;
                    });
                    if(aValue === -1)  aValue = order.length;
                    if(bValue === -1)  bValue = order.length;
                    if(aValue === bValue){
                        var arrayA = a.split("").reverse();
                        var arrayB = b.split("").reverse();
                        var lookAt_A,lookAt_B;
                        do{
                            lookAt_A = arrayA.pop();
                            lookAt_B = arrayB.pop();                            
                        }while(lookAt_A !== undefined && lookAt_B !== undefined && lookAt_A === lookAt_B)

                        if(lookAt_A === undefined)  return -1;
                        if(lookAt_B === undefined)  return 1;
                        return lookAt_A.charCodeAt() - lookAt_B.charCodeAt();
                    }else{
                        return aValue - bValue;
                    }
                });
            }else{
                keyList.sort(function(a,b){return a.charCodeAt() - b.charCodeAt()});
            }

            return [keyList].concat(hashes.map(function(hash){
                return keyList.map(function(_keys){
                    var keys = _keys.split(".");
                    var lookAt_result = hash;
                    var lookAt_type = type;
                    keys.forEach(function(key){
                        lookAt_result = (lookAt_result === undefined ? undefined : lookAt_result[key]);
                        lookAt_type = (lookAt_type === undefined || lookAt_type === "" ? "" : lookAt_type[key.replace(/^\d+$/,"0")] );
                    });
                    if(lookAt_result === undefined){
                        return null;
                    }else if(lookAt_type === "other"){
                        return JSON.stringify(lookAt_result);
                    }else{
                        return castIntoString(castType(lookAt_result,lookAt_type))
                    }
                });
            }));
        }
    }
})();

