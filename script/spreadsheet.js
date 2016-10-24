var Spreadsheet = (function(){
    var server;
    return class Spreadsheet{
        constructor(fileName,sheetName,columnType){
            this._fileInfo = server.getData("fileInfo").find(function(fileInfo){return fileInfo.getValue("name") === fileName});
            this._sheetName = sheetName;
            this._columnType = columnType;
        }
        copy(newSheetName){
            return new Spreadsheet(this.getFileName(),newSheetName ? newSheetName : this.getSheetName());
        }
        getFileInfo(){
            return this._fileInfo;
        }
        getFileName(){
            return this.getFileInfo().getValues("name");
        }
        getSheetData(){
            var that = this;
            var la = new LoadingAlert();
            return runServerFun("Script.getSheetValuesFromClient",[this.getFileInfo().getValue("fileId"),this.getSheetName()]).then(function(v){
                that._data = Spreadsheet.convertDataFromArrayToHash(v,that.getColumnType());
                console.log("load spreadsheet from server success!");
                la.remove();
            });
        }
        getSheetName(){
            return this._sheetName;
        }
        getColumnType(){
            return this._columnType;
        }
        hasData(){
            return this._data === undefined;
        }
        static convertDataFromArrayToHash(arrays,type){
            var columnNames = hashes[0];
            var contents = hashes.splice(1,values.length);
            var templateHash = {};

            columnNames.forEach(function(columnName){
                var obj = {};
                var lookAt = obj;
                var keys = columnName.split(".");
                keys.forEach(function(key,index){
                    if(index === keys.length-1){
                        lookAt[key] = "";
                    }else{
                        lookAt[key] = {};
                    }
                });
                $.extend(true,templateHash,obj);
            });
            type = type || $({},templateHash);

            return contents.map(function(row){
                var result = $.extend({},templateHash);

                row.forEach(function(cell,cellIndex){
                    var keys = columnNames[cellIndex].split(".");
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
                            lookAt_result[key] = lookAt_result;
                            lookAt_type[key] = lookAt_type;
                        }
                    });
                });
                return result;
            });
        }
        static convertDataFromHashToArray(hashes,type,order){
            var hashes;
            var keyList;

            var sample = {};
            hashes.forEach(function(hash){
                $.extend(true,sample,hash);
            });

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
                while(order.some(function(v){return classof(v) !== "string"})){
                    order = order.reduce(function(prev,curt){
                        if(!Array.isArray(curt))  curt = [curt];
                        return prev.concat(curt);
                    },[]);
                }
            })();

            if(order !== undefined){
                keyList.sort(function(a,b){
                    var aValue = order.findIndex(function(v){
                        return a.replace(/\d/g,"0") === v;
                    });
                    var bValue = order.findIndex(function(v){
                        return b.replace(/\d/g,"0") === v;
                    });
                    if(aValue === -1)  aValue = order.length;
                    if(bValue === -1)  bValue = order.length;
                    if(aValue === bValue){
                        return aValue - bValue;
                    }else{
                        return a.charCodeAt() - b.charCodeAt();
                    }
                });
            }else{
                keyList.sort(function(a,b){return a.charCodeAt() - b.charCodeAt()});
            }

            return hashes.map(function(hash){
                return keyList.map(function(_keys){
                    var keys = _keys.split(".");
                    var lookAt_result = hash;
                    var lookAt_type = type;
                    keys.forEach(function(key){
                        lookAt_result = (lookAt_result === undefined ? undefined : lookAt_result[key]);
                        lookAt_type = (lookAt_type === undefined || lookAt_type === "" ? "" : lookAt_type[key.replace(/\d/g,"0")] );
                    });
                    if(lookAt_result === undefined){
                        return undefined;
                    }else if(lookAt_type === "other"){
                        return JSON.stringify(lookAt_result);
                    }else{
                        return castIntoString(castType(lookAt_result,lookAt_type))
                    }
                });
            });
        }
    }
})();

