//  ---About This---
/*
名前

依存ファイル
driveFileId.js
include.js
base.js
baseClient.js
baseServer.js

このファイルについて

定義一覧
    Database()クラス
        説明
            GoogleDriveに保存されている各種データをまとめるクラスです
            それぞれのデータベースから生成されたデータオブジェクトのクラスは、このクラスを継承します
        データの形式について
            生データはdataキーとcolumnキーで構成される
            rawData = {
                data:[datapiece1, datapiece2, ... ],
                version:Date.ISOString
            }
        引数
        プロパティ
            cache
                GoogleDriveからダウンロードしたデータ
            pendingQueue
                更新待ちのデータの配列
                queueObj = {type:"updateType", dataName:"name1", contents:datapieces}
                    type
                        add
                            データを追加
                        change
                            データを変更
                        remove
                            データを削除
            updatingQueue
                更新中のデータの配列
            updating
                更新中か否か
                更新中であれば開始時間がDateで入っている
                更新中で無ければ、nullが入っている
            loading
        静的メソッド
            getDatabaseInfo()
                説明
                    データ名（dataName）と対応する情報のリストを返します
                    Databaseクラスの子のクラスの全てが含まれます
                        //手打ちが必要
        メソッド
            loadData(dataName)
            loadDataAll()
            reloadData(dataName)
                説明
                    データをGoogleDriveからリロードして、キャッシュを新しくします
                    //キャッシュをリフレッシュする際には、ポインタの保存のために.setValue()を使用する
            getData(dataName,newCopy)
                説明
                    GoogleDriveからデータをダウンロードして、データに対応したクラスのインスタンスを返します
                引数
                    dataName
                        ロードするデータ名
                    newCopy
                        常にキャッシュからはロードせず、クラスを作成しなおします
                        省略可。省略した場合、キャッシュにあるインスタンスのポインタのコピーとなる
            getDataById(ids,newCopy)
                説明
                    this.curtDataから、IDリスト（ids）に合致するもののみ返します
                引数
                    ids
                        指定するidの配列
                        文字列を代入すると、一つだけ返します。
                        省略もしくは、nullを代入すると、全てのデータを返します
                    newCopy
                        常にキャッシュからはロードせず、クラスを作成しなおします
            getVersion(dataName)
                説明
                    versionデータをDate型で返します
            //以下はデータの変更関係のメソッド
            runUpdate()
                説明
                    this.pooledQueueにあるキューを元にデータを更新します
                    更新中は実行されません
                    更新後、またthis.pooledQueueにキューが残っていれば更新します
            changeData(datapieces)
                説明
                    既存のデータを更新します
                    変更するデータのキーのみ記入することも可能
                引数
                    datapieces
                        変更する新しいデータ
                            idキーは必須
                        Datapieceクラスを継承するデータごとのクラスを用いる
                            一つのみであればインスタンスを直接代入、複数であればインスタンスの配列を代入
            addData(datapieces)
                説明
                    新規にデータを作成します
                    基本的にデータの全てを設定する必要があります
                引数
                    datapieces
                        ※詳細はchangeメソッドと同様
            removeData(datapieces)
                説明
                    新規にデータを作成します
                    基本的にデータの全てを設定する必要があります
                引数
                    datapieces
                        idのみが設定されてれば良い
                        ※詳細はchangeメソッドと同様


    Datapiece(dataName,datapieceObj)クラス
        説明
            各種データの一つのデータを格納するクラスです
            Databaseクラスがデータ全体、Datapieceクラスがデータ一つ分
            それぞれのデータベースのデータ一つひとつを表すクラスは、このクラスを継承します
        引数
            dataName
            datapieceObj
                インスタンスのデータの元となるオブジェクト
                    細かい定義は継承先のクラスで行う
        プロパティ
            data
                格納されているデータ
            dataName
                このデータの由来となるデータの名称
        メソッド
            setValues(datapieceObj)
            setValue(columnName,value)
            getValues()
                説明
                    this.dataを返します
            getValue(columnName)
            getDatabaseInfo()

    loadDataFromDrive(fileIdStr,mode)
        説明
            GoogleDriveからJSON形式で保存されたデータを取得します
        引数
            fileIdStr
                GoogleDriveのファイルID（ファイルを開いた時に、URLに記載されている一部のランダムな文字列のこと）
            mode
                返り値のデータの指定
                    all
                        rawDataを返す
                    raw
                        rawData（JSON文字列）を返す
                    data
                        データ本体を返す
                    column
                        カラムデータを返す
                    version
                        データの更新日時を返す
                省略可。省略した場合、allとなる
*/

var Datapiece = (function(){
    var server;
    var config;
    return class Datapiece {
        constructor(datapieceObj,dataName,option){
            if(option === undefined)  option = {};
            var that = this;
            if(server === undefined){
                //Serverオブジェクトを変える場合にはここを書き換える
                server = _val.server;
            }
            if(config === undefined){
                //SystemConfigオブジェクトを変える場合にはここを書き換える
                config = _val.config;                
            }
            this._data = {};
            this._dataName = dataName;
            this._event = [];
            if(option.init === true){
                //executed from start.js
                if(datapieceObj !== undefined){
                    this.setValues(datapieceObj,{overwrite:true,setCollectionInfo:option.init_data});
                }
                server.onReady(function(){
                    that._collInfo = server.getCollectionInfoByName(dataName);
                })
            }else{
                this._collInfo = server.getCollectionInfoByName(dataName);
                if(datapieceObj !== undefined){
                    this.setValues(datapieceObj,option);
                }
            }
        }
        setValues(datapieceObj,option){
            if(typeof datapieceObj !== "object" || datapieceObj === null){
                console.log("Attention : argu is not object (Datapiece.prototype.setValues)");
                return this;
            }
            if(option === undefined){
                //大抵optionは空なので軽量化のためにここに文を設置
                //defaultでオーバーライトモードを有効（2016/10/6）
                goDeepLevelValue(datapieceObj,this.getCollectionInfo().getValue("column"),this._data,null,null,{overwrite:true});
            }else{
                //アプリ起動時にデータロードを行う際、CollectionInfoクラスのsetValues()で、まだ値が代入されていないServerのcloser内のcacheにアクセスするのを避ける
                if(option.setCollectionInfo !== undefined){
                    goDeepLevelValue(datapieceObj,option.setCollectionInfo.column,this._data,null,null,option);
                }else{
                    goDeepLevelValue(datapieceObj,this.getCollectionInfo().getValue("column"),this._data,null,null,option);
                }
            }

            //オブジェクトの最下層まで掘り進むための再起関数
            //collInfo.columnにないカラムは追加することが出来ず、型が異なる値も代入することは出来ない
            //なお、datapieceに不正なキーや値があった場合は、そのキーのみ無視される
            function goDeepLevelValue(dpObj,colObj,d,dParent,dKey,op){
                if(colObj === "other"){
                    dParent[dKey] = dpObj;
                    return d;
                }
                if(classof(dpObj) !== classof(colObj) && classof(dpObj) !== colObj) return undefined;
                switch(classof(dpObj)){
                    case "object":
                        //オーバーライトモードの時、もともとのデータ（data of this closer）にないキーのデータを生成する必要があるため、空のオブジェクトを作成
                        ////上の説明が悪いので、分からなければ下のif文をコメントアウトして実行すれば分かると思う
                        if(op.overwrite === true && d === undefined && (Array.isArray(dParent) || typeof dParent === "object")){
                            d = {};
                        }
                        Object.keys(dpObj).forEach(function(key){
                            if(/^@/.test(key)){
                                //autoKeyモード
                                //setterがうまくやってくれるはず
                                d[key] = dpObj[key];
                            }else{
                                if(colObj[key] !== undefined){
                                    goDeepLevelValue(dpObj[key],colObj[key],d[key],d,key,op);
                                }
                            }
                        });
                        return d;
                    case "array":
                        //オーバーライトモードの時、もともとのデータ（data of this closer）にない番号のデータを生成する必要があるため、空の配列を作成
                        if(op.overwrite === true && d === undefined && Array.isArray(dParent) || typeof dParent === "object"){
                            d = [];
                        }
                        if(op.overwrite === true){
                            dParent[dKey] = dpObj.map(function(v,i){
                                return goDeepLevelValue(dpObj[i],colObj[0],d[i],d,i,op)
                            })
                        }else{
                            dpObj.forEach(function(v,i){
                                if(v === undefined || v === null)  return;
                                goDeepLevelValue(dpObj[i],colObj[0],d[i],d,i,op);
                            });
                        }
                        return d;
                    default:
                        //shallow copyをするため、あえてdではなくdParent[dKey]を使用
                        dParent[dKey] = castType(dpObj,colObj);
                        return castType(dpObj,colObj);
                }
            }
            this.triggerEvent("change");
            return this;
        }
        //非推奨
        setValue(colName,value){
            var colType;
            if(/^@/.test(colName)){
                //autoKeyモード
                this._data[colName] = value;
            }else{
                try{
                    colType = getValueFromObjectByKey(this.getCollectionInfo().getValue("column"),colName);
                }catch(e){
                    console.log("Attention : " + "There is no property(" + colName + ") of" + this.getDataName() + " (Datapiece.prototype.setValue)");
                    return this;
                }
                this._data[colName] = castType(value,colType);
            }
            this.triggerEvent("change");
            return this;
        }
        setNewId(overwrite){
            if(overwrite === undefined) overwrite = false;
            if(overwrite || this.getValue("_id") === undefined){
                this.setValues({"_id":Datapiece.getNewId(this.getDataName())});
            }
            return this;
        }
        setDefaultValue(){
            var colObj = this.getCollectionInfo().getValue("column");
            var data = this.getValues();
            var fun = function(d,col){
                switch(classof(col)){
                    case "string":
                        if(d === undefined){
                            switch(col){
                                case "string":
                                    return "";
                                case "number":
                                    return 0;
                                case "boolean":
                                    return false;
                                case "date":
                                    return new Date();
                                case "localdate":
                                    return new LocalDate();
                                default:
                                    return undefined;
                            }
                        }
                    case "array":
                        if(d === undefined)  return [];
                        return d.map(function(e){
                            return e === undefined ? fun(e,col[0]) : e;
                        })
                    case "object":
                        var ret = {};
                        Object.keys(col).forEach(function(key){
                            if(d === undefined || d[key] === undefined){
                                ret[key] = fun(undefined,col[key]);
                            }
                        })
                        return ret;
                }
            }
            this.setValues(fun(data,colObj),{overwrite:true});
            return this;
        }
        getValues(newCopy){
            if(newCopy === undefined)  newCopy = false;
            return newCopy ? JSON.parse(JSON.stringify(this._data)) : this._data;
        }
        getValue(colName){
            if(typeof colName !== "string")  return undefined;
            return getValueFromObjectByKey(this._data,colName);
        }
        toJSON(){
            return this._data;
        }
        toString(){
            return JSON.stringify({"dataName":this.getDataName(), "data":this.toJSON()})
        }
        getDataName(){
            return this._dataName;
        }
        getCollectionInfo(){
            return this._collInfo;
        }
        getDatapieceRelated(colName,dataName){
            var ret = server.getDataById(this.getValue(colName),dataName)[0];
            if(ret === undefined)  ret = new (Datapiece.getClassByName(dataName))();
            return ret;
        }
        getEventListener(events){
            var that = this;
            var ret = [];
            if(events === undefined || events === ""){
                ret = this._event.slice();
            }else{
                events.split(" ").forEach(function(event){
                    var type = event.split(".")[0];
                    var nameSpace = event.split(".").splice(1);
                    Array.prototype.push.apply(ret,that._event.filter(function(e){
                        return (type === e.type || type === "" || type === "*") && nameSpace.every(function(s){return inArray(e.nameSpace,s)});
                    }));
                });
            }
            return ret;
        }
        addEventListener(events,handler){
            //events === String 
            //events === Array -> eventObjs(Array)
            //events === Object -> eventObj(Obj)
            var that = this;
            if(classof(events) === "array"){
                events.forEach(function(event){
                    that.addEventListener(event);
                });
            }else if(classof(events) === "object"){
                var nameSpace,type;
                if(events.nameSpace !== undefined){
                    nameSpace = events.nameSpace;
                    if(Array.isArray(nameSpace)){
                        nameSpace = nameSpace.join(".");
                    }
                    type = nameSpace.split(" ").map(function(nameSpace){
                        return events.type + (nameSpace !== "" ? "." + nameSpace : "");
                    }).join(" ");
                }
                this.addEventListener(type,events.handler);
            }else{
                if(events === undefined)  events = "";
                events.split(" ").forEach(function(event){
                    var type = event.split(".")[0];
                    var nameSpace = event.split(".").splice(1);
                    var obj = {"type":type,"nameSpace":nameSpace};
                    if(typeof handler === "function"){
                        obj.handler = handler;
                    }
                    that._event.push(obj);
                });
            }
            return this;
        }
        removeEventListener(events){
            var that = this;
            events.split(" ").forEach(function(event){
                var type = event.split(".")[0];
                var nameSpace = event.split(".").splice(1);
                that._event = that._event.filter(function(e){
                    return !((type === e.type || type === "" || type === "*") && nameSpace.every(function(s){return inArray(e.nameSpace,s)}));
                });
            });
            return this;
        }
        triggerEvent(events){
            //setValue,setValuesで何回も呼ばれるため、省略
            if(this._event.length === 0)  return this;
            var that = this;
            this.getEventListener(events).filter(function(e){
                return e.handler !== undefined
            }).forEach(function(e){
                e.handler({"type":e.type,"nameSpace":e.nameSpace,"handler":e.handler,"target":that});
            });
            return this;
        }
        copy(copyHandler){
            if(copyHandler === undefined)  copyHandler = false;
            var ret = (new (Datapiece.getClassByName(this.getDataName()))()).setValues(this.getValues(true),{"overwrite":true});
            if(copyHandler){
                this.getEventListener().forEach(function(e){
                    ret.addEventListener(e.type + (e.nameSpace.length !== 0 ? "." + e.nameSpace.join(".") : ""), e.handler);
                });
            }
            return ret;
        }
        static getServer(){
            //Datapiece系クラスで使う専用
            return server;
        }
        static getConfig(){
            //Datapiece系クラスで使う専用
            return config;
        }
        static getClassByName(dataName){
            var collInfo = server.getCollectionInfoByName(dataName);
            if(collInfo === undefined)  return undefined;
            return collInfo.getClass();
        }
        static getNewId(dataName){
            var result;
            var idList = server.getData(dataName,null,true).map(function(data){return data.getValue("_id")});
            do{
                result = makeRandomStr(16,{"number":true, "alphaLower":true, "alphaUpper":true});
            }while(inArray(idList,result))
            return result;
        }
        static sort(datapieces,colName,reverse,dataName){
            if(!Array.isArray(datapieces)) return;
            if(datapieces.length === 0)  return [];
            if(dataName === undefined)  dataName = datapieces[0].getDataName();
            if(colName === undefined)  colName = "_id";
            if(!Array.isArray(colName)) colName = [colName];
            if(reverse === undefined) reverse = [];
            var colInfo = server.getCollectionInfoByName(dataName);
            return datapieces.slice().sort(function(a,b){
                var ret;
                colName.find(function(c,index){
                    var type = colInfo.getValue("column." + c);
                    var aValue = a.getValue(c);
                    var bValue = b.getValue(c);
                    if(classof(type) !== "string") type = classof(type);
                    switch(type){
                        case "number":
                            ret = (aValue-bValue);
                            break;
                        case "boolean":
                            ret = (bValue-aValue);
                            break;
                        case "string":
                            ret = aValue.charCodeAt() - bValue.charCodeAt();
                            break;
                        case "date":
                        case "localdate":
                            ret = aValue.getTime() - bValue.getTime();
                            break;
                        default :
                            ret = 0;
                            break;
                    }
                    ret = ret * (reverse[index] ? -1 : 1);
                    return ret !== 0;
                })
                return ret;
            });
        }
        static getShiftTableAsData(that,dataName,start,end,extraWorkAssign){
            //UserとWorkListでほぼ共通なのでまとめた
            //{"[dataName]Id":"","workNum":"","content":[{"workAssignId":"","userId":"","workName":"","workIndex":"","timeIndex":"","interval":"","start":"","end":"","backgroundColor":"","fontColor":""}]}
            if(start === undefined)  start = new LocalDate({"day":Datapiece.getConfig().getWorkStartDay()});
            if(end === undefined)  end = new LocalDate({"day":Datapiece.getConfig().getWorkEndDay()+1});
            var idName = dataName + "Id";

            if(extraWorkAssign === undefined)  extraWorkAssign = [];
            if(!Array.isArray(extraWorkAssign))  extraWorkAssign = [extraWorkAssign];
            extraWorkAssign = extraWorkAssign.filter(function(workAssign){
                if(workAssign.getValue("_id") === undefined){
                    workAssign.setValue("_id","_extra");
                }
                return workAssign.getValue(idName) === that.getValue("_id");
            });
            var extraIds = extraWorkAssign.map(function(workAssign){
                return workAssign.getValue("_id")
            }).filter(function(v,i,s){return s.indexOf(v) === i});

            var workAssigns = that.getWorkAssigns().filter(function(workAssign){
                return !inArray(extraIds,workAssign.getValue("_id"));
            }).concat(extraWorkAssign).filter(function(workAssign){
                return (
                    workAssign.getValue("end").getTime() > start.getTime() &&
                    workAssign.getValue("start").getTime() < end.getTime()
                );
            }).map(function(workAssign){
                var ret = workAssign.copy();
                if(ret.getValue("start").getTime() < start.getTime()){
                    ret.setValue("interval",ret.getValue("interval") - ret.getValue("start").getDiff(start,"timeunit"))
                    ret.setValue("start",start.copy());
                }
                if(ret.getValue("end").getTime() > end.getTime()){
                    ret.setValue("end",end.copy());
                }
                return ret;
            }).filter(function(workAssign){return workAssign.getValue("interval") !== 0});

            workAssigns.sort(function(a,b){
                if(a.getValue("memberOrder") === b.getValue("memberOrder") || (a.getValue("memberOrder") <= 0 && b.getValue("memberOrder") <= 0)){
                    if(a.getValue("start").getTime() === b.getValue("start").getTime()){
                        return -(a.getValue("interval") - b.getValue("interval"));
                    }else{
                        return a.getValue("start").getTime() - b.getValue("start").getTime();
                    }
                }else{
                    if(a.getValue("memberOrder") <= 0){
                        return 1;
                    }else if(b.getValue("memberOrder") <= 0){
                        return -1;
                    }else{
                        return a.getValue("memberOrder") - b.getValue("memberOrder");
                    }
                }
            });

            var lists = [];
            var ret = {"workNum":0,"tableStartTime":start.copy(),"tableInterval":start.getDiff(end,"timeunit"),"content":[]};
            ret[idName] = that.getValue("_id");
            workAssigns.forEach(function(workAssign){
                var workIndex = 0;
                while(lists[workIndex] === undefined || getVacant(lists[workIndex]).length !== workAssign.getValue("interval")){
                    if(lists[workIndex] === undefined){
                        lists[workIndex] = [];
                        ret.workNum = lists.length;
                        for(var i=0,l=start.getDiff(end,"timeunit");i<l;i++){
                            lists[workIndex][i] = {"time":start.copy().addTimeUnit(i),"hasWork":false};
                        }
                    }else{
                        workIndex++;
                    }
                }
                getVacant(lists[workIndex]).forEach(function(obj){
                    obj.hasWork = true;
                });
                ret.content.push({
                    "workAssignId":workAssign.getValue("_id"),
                    "workIndex":workIndex,
                    "interval":workAssign.getValue("interval"),
                    "start":workAssign.getValue("start").copy(),
                    "extra":(inArray(extraIds,workAssign.getValue("_id")) ? true : false)
                });
                function getVacant(list){
                    if(list == undefined)  return undefined;
                    return list.filter(function(obj){
                        return (
                            !obj.hasWork &&
                            obj.time.getTime() >= workAssign.getValue("start").getTime() &&
                            obj.time.getTime() < workAssign.getValue("end").getTime()
                        );
                    })
                }
            });
            ret.content.sort(function(a,b){
                if(a.workIndex === b.workIndex){
                    return a.start.getTime() - b.start.getTime();
                }else{
                    return a.workIndex - b.workIndex;
                }
            });
            var timeIndex = 0, nowWorkIndex = 0;
            ret.content.forEach(function(obj){
                if(nowWorkIndex !== obj.workIndex){
                    timeIndex = 0;
                    nowWorkIndex = obj.workIndex;
                }
                obj.timeIndex = timeIndex;
                timeIndex++;
            });
            return ret;
        }
        static getShiftTableAsElement(that,dataName,start,end,option){
            //UserとWorkListでほぼ共通なのでまとめた
            //option = {"mode":["tr","table"],"trans":[true,false],"callback":function,"extraWorkAssign":[WorkAssign]}
            //tr table
            var cellWidthPerInterval = 2;  //em
            var cellHeightPerInterval = 4;  //ex

            if(option === undefined)  option = {};
            if(option.mode === undefined)  option.mode = "table";
            if(option.trans === undefined)  option.trans = false;
            if(option.extraWorkAssign === undefined)  option.extraWorkAssign = [];
            var idName = dataName + "Id";

            var data = that.getShiftTableAsData(start,end,option.extraWorkAssign);
            var rowContents = [];
            for(var i=0; i<data.workNum; i++){
                rowContents[i] = data.content.filter(function(obj){return obj.workIndex === i});
            }
            var _tdMatrix = [];
            rowContents.forEach(function(_rowContent,rowIndex){
                var rowContent = _rowContent.slice();
                var insert;
                _tdMatrix[rowIndex] = []
                if(_rowContent.length === 0){
                    insert = [];
                    for(var j=0,l=start.getDiff(end, "timeunit"); j<l; j++){
                        insert[j] = {"start":start.copy().addTimeUnit(j),"workAssignId":"_blank"};
                    }
                    rowContent = [insert];
                }else{
                    for(var i=_rowContent.length-1; i>=0; i--){
                        insert = [];
                        for(var j=0,l=_rowContent[i].start.copy().addTimeUnit(_rowContent[i].interval).getDiff(i===_rowContent.length-1 ? end : _rowContent[i+1].start, "timeunit"); j<l; j++){
                            insert[j] = {"start":_rowContent[i].start.copy().addTimeUnit(_rowContent[i].interval + j),"workAssignId":"_blank"};
                        }
                        rowContent.splice(i+1,0,insert);
                    }
                    insert = [];
                    for(var j=0,l=start.getDiff(_rowContent[0].start, "timeunit"); j<l; j++){
                        insert[j] = {"start":start.copy().addTimeUnit(j),"workAssignId":"_blank"};
                    }
                    rowContent.splice(0,0,insert);
                }
                rowContent = rowContent.reduce(function(prev,curt){
                    return prev.concat(Array.isArray(curt) ? curt : [curt]);
                });
                _tdMatrix[rowIndex] = rowContent.map(function(cell,cellIndex){
                    var td = $("<td><span></span></td>");
                    if(cell.workAssignId === "_blank"){
                        td.children("span").text(" ");
                        td.css({
                            "background":"#FFFFFF",
                            "color":"#000000",
                            "border":"1px solid #000000",
                            "border-style": (option.trans ? "dashed solid" : "solid dashed")
                        });

                        if(cell.start.getMinutes() === 0){
                            td.css((option.trans ? {"border-top-style":"solid"} : {"border-left-style":"solid"}));
                        }
                        td.data({"start":cell.start.getTime(),"interval":1,"workIndex":rowIndex});
                    }else{
                        var workAssign = Datapiece.getServer().getDataById(cell.workAssignId,"workAssign")[0];
                        if(workAssign === undefined){
                            workAssign = option.extraWorkAssign.find(function(workAssign){return workAssign.getValue("_id") === cell.workAssignId});
                        }
                        var datapiece = workAssign.getDatapieceRelated(idName,dataName);
                        if(dataName === "user"){
                            td.children("span").text(datapiece.getValue("nameLast") + " " + datapiece.getValue("nameFirst"));
                        }else if(dataName === "workList"){
                            td.children("span").text(datapiece.getValue("nameShort"));
                        }
                        td.css({
                            "background":datapiece.getBackgroundColor(),
                            "color":datapiece.getFontColor(),
                            "border":"1px solid #000000",
                            "text-align":"center"
                        });
                        td.attr(option.trans ? "rowspan" :"colspan",cell.interval).addClass("hasWork");
                        td.data({"workassignid":cell.workAssignId,"start":cell.start.getTime(),"interval":cell.interval,"workIndex":rowIndex,"extra":cell.extra});
                        if(cell.extra){
                            td.css("border","2px solid red").addClass("extra");
                        }
                    }
                    td.addClass("shiftTableContent").css({"padding":"0","margin":"0"})
                    .children("span").css({"padding":"1ex 0.5em","white-space":"pre","display":"block","cursor":"pointer","box-sizing":"border-box"}).map(function(i,_el){
                        var el = $(_el);
                        if(option.trans){
                            el.css({"min-height":cellHeightPerInterval * td.data("interval") + "ex"});
                        }else{
                            el.css({"min-width":cellWidthPerInterval * td.data("interval") + "em"});
                        }
                    });
                    return td;
                });
            });

            var timeScales = [];
            (function(){
                //make header
                var t;
                for(var i=0,l=data.tableInterval; i<l; i++){
                    t = data.tableStartTime.copy().addTimeUnit(i);
                    if(i === 0 || t.getMinutes() === 0){
                        timeScales.push(t);
                    }
                }
                var tableEnd = data.tableStartTime.copy().addTimeUnit(data.tableInterval);
                timeScales = timeScales.map(function(time,index){
                    var timeSpan;
                    if(time.getMinutes() !== 0){
                        timeSpan = data.tableStartTime.getDiff(time,"timeunit");
                    }else if(time.getDiff(tableEnd,"minute") < 60){
                        timeSpan = time.getDiff(tableEnd,"timeunit");
                    }else{
                        timeSpan = 60 / LocalDate.getTimeUnitAsConverted("minute");
                    }
                    var td = $("<td></td>");
                    td.text("" + time.getHours() + "時").css({
                        "color":"#000000",
                        "border":"1px solid #000000",
                        "background":(index%2===0 ? "#7FFFD4" : "#66CDAA"),
                        "text-align":(option.trans ? "" : "center"),
                        "padding":"1ex 0"
                    }).attr(option.trans ? "rowspan" :"colspan",timeSpan).addClass("timeScale");
                    if(option.trans){
                        td.css({"min-height":cellHeightPerInterval * timeSpan + "ex"});
                    }else{
                        td.css({"min-width":cellWidthPerInterval * timeSpan + "em"});
                    }
                    return td;
                });
            })();
            _tdMatrix = [timeScales].concat(_tdMatrix);

            var tdMatrix;
            if(option.trans){
                //option.transpose
                tdMatrix = [];
                _tdMatrix.forEach(function(tds){
                    var skip = 0;
                    tds.forEach(function(td,tdIndex){
                        if(tdMatrix[tdIndex+skip] === undefined){
                            tdMatrix[tdIndex+skip] = [];
                        }
                        tdMatrix[tdIndex+skip].push(td);
                        if(td.attr("rowspan") !== undefined && td.attr("rowspan") > 1){
                            skip += +td.attr("rowspan") - 1;
                        }
                    });
                })
            }else{
                tdMatrix = _tdMatrix.slice();
            }

            var trs = $(repeatString("<tr></tr>",tdMatrix.length));
            tdMatrix.forEach(function(tds,rowIndex){
                var tr = trs.eq(rowIndex);
                tds.forEach(function(td,cellIndex){
                    tr.append(td);
                    if(typeof option.callback === "function"){
                        option.callback({"td":td,"rowIndex":rowIndex,"cellIndex":cellIndex});
                    }
                })
            })
            var result;
            if(option.mode === "table"){
                result = $("<table><tbody></tbody></table>");
                result.css({"border-collapse":"collapse","border":"1px solid #000000"});
                result.find("tbody").append(trs);
            }else if(option.mode === "tr"){
                result = trs;
            }

            return result;
        }
    }
    function castType(value,type){
        switch(type){
            case "number":
                return +value;
            case "boolean":
                return !!value;
            case "string":
                return "" + value;
            case "date":
                if(classof(value) === "date"){
                    return value;
                }else{
                    return new Date(value);
                }
            case "localdate":
                if(classof(value) === "localdate"){
                    return value.copy();
                }else{
                    return new LocalDate(value);
                }
            default:
                return value;
        }
    }
    function getValueFromObjectByKey(obj,key){
        if(typeof key !== "string")  return undefined;
        var keyArray = key.split(".");
        var i,result = obj;
        try{
            for(i=0; i<keyArray.length; i++){
                result = result[keyArray[i]];
            }
        }catch(e){
            keyArray.length = i;
            console.log("Error : There is no property(" + keyArray.join(".") + ") of a following object (getValueFromObjectByKey which is defined in closer of Datapiece )");
            console.log(obj);
            throw new Error(e);
        }
        return result;
    }
    function setValueFromObjectByKey(obj,key,value){
        if(typeof key !== "string")  return undefined;
        var keyArray = key.split(".");
        var i,result = obj;
        try{
            for(i=0; i<keyArray.length-1; i++){
                result = result[keyArray[i]];
            }
        }catch(e){
            keyArray.length = i;
            console.log("Error : There is no property(" + keyArray.join(".") + ") of a following object (setValueFromObjectByKey which is defined in closer of Datapiece )");
            console.log(obj);
            throw new Error(e);
        }
        result[keyArray[i]] = value;
        return obj;
    }
})();

class CollectionInfo extends Datapiece{
    constructor(datapieceObj,option){
        super(datapieceObj,"collectionInfo",option);
    }
    getClass(){
        var classNamePairList = [
            {name:"collectionInfo",class:CollectionInfo},
            {name:"fileInfo",class:FileInfo},
            {name:"shiftTableUser",class:ShiftTableUser},
            {name:"shiftTableWork",class:ShiftTableWork},
            {name:"systemConfig",class:SystemConfig},
            {name:"user",class:User},
            {name:"userGroup",class:UserGroup},
            {name:"workAssign",class:WorkAssign},
            {name:"workGroup",class:WorkGroup},
            {name:"workList",class:WorkList},
            {name:"workNotAssigned",class:WorkNotAssigned}
        ];
        var v = classNamePairList.find(function(o){return o.name === this.getValue("name")},this);
        if(v === undefined){
            console.log("Error : The class is not found (maybe forget regist the class in val;classNamePairList) (fun:CollectionInfo.prototype.getClass)");
            throw new Error(e);
        }
        return v.class;
    }
}

class FileInfo extends Datapiece{
    constructor(datapieceObj,option){
        super(datapieceObj,"fileInfo",option);
    }
}

class ShiftTableUser extends Datapiece{
    constructor(datapieceObj,option){
        super(datapieceObj,"shiftTableUser",option);
    }
}

class ShiftTableWork extends Datapiece{
    constructor(datapieceObj,option){
        super(datapieceObj,"shiftTableWork",option);
    }
}

class SystemConfig extends Datapiece{
    constructor(datapieceObj,option){
        super(datapieceObj,"systemConfig",option);
    }
    getOpenTime(day,kind){
        var localDateObj = this.getValue("content.base.openTime")[day-1];
        if(kind == "start" || kind == "end"){
            return (new LocalDate(localDateObj[kind])).addDays(day);
        }else{
            return {"start":this.getOpenTime(day,"start"),"end":this.getOpenTime(day,"end")};
        }
    }
    getOpenStartDay(){
        return 1;
    }
    getOpenEndDay(){
        return this.getValue("content.base.openTime").length;
    }
    getWorkTime(day,kind){
        var localDateObj = this.getValue("content.workAssign.workTime")[day - this.getWorkStartDay()];
        if(kind == "start" || kind == "end"){
            return (new LocalDate(localDateObj[kind])).addDays(day);
        }else{
            return {"start":this.getWorkTime(day,"start"),"end":this.getWorkTime(day,"end")};
        }
    }
    getWorkStartDay(){
        return this.getValue("content.workAssign.workStart");
    }
    getWorkEndDay(){
        return this.getValue("content.workAssign.workStart") + this.getValue("content.workAssign.workTime").length - 1;
    }
}

class User extends Datapiece{
    constructor(datapieceObj,option){
        super(datapieceObj,"user",option);
    }
    getBackgroundColor(){
        return UserGroup.getColorByUserId(this.getValues("_id"),"background");
    }
    getFontColor(){
        return UserGroup.getColorByUserId(this.getValues("_id"),"font");
    }
    getWorkAssigns(){
        var that = this;
        return Datapiece.getServer().getData("workAssign").filter(function(workAssign){
            return workAssign.getValue("userId") === that.getValue("_id");
        });
    }
    getShiftTableAsData(start,end,extraWorkAssign){
        return Datapiece.getShiftTableAsData(this,this.getDataName(),start,end,extraWorkAssign);
    }
    getShiftTableAsElement(start,end,option){
        return Datapiece.getShiftTableAsElement(this,this.getDataName(),start,end,option);        
    }
    getShiftTableUser(){
        var setValue = {"userId":this.getValue("_id"),"content":[],"workNum":[]};
        var data;
        for(var day=LocalDate.getWorkStartDay(); day<=LocalDate.getWorkEndDay; day++){
            data = this.getShiftTableAsData(LocalDate.getWorkTime(day,"start"),LocalDate.getWorkTime(day,"end"));
            setValue.content = setValue.content.concat(data.content.map(function(obj){
                var workAssign = Datapiece.getServer().getDataById(obj.workAssignId,"workAssign")[0];
                return {
                    "day":day,
                    "startTimeUnitNum":data.tableStartTime.getDiff(obj.start,"timeunit"),
                    "timeIndex":obj.timeIndex,
                    "workIndex":obj.workIndex,
                    "interval":obj.interval,
                    "name":workAssign.getDatapieceRelated("workListId","workList").getValue("nameShort"),
                    "backgroundColor":workAssign.getDatapieceRelated("workListId","workList").getBackgroundColor(),
                    "fontColor":workAssign.getDatapieceRelated("workListId","workList").getFontColor()
                }
            }));
            setValue.workNum.push({"day":day,"num":data.workNum});
        }
        return new ShiftTableUser(setValue);
    }
    getPreviousWork(workAssign){
        if(workAssign instanceof WorkAssign){
            workAssign = workAssign.copy();
        }else{
            workAssign = Datapiece.getServer().getDataById(workAssign,"workAssign");
        }
        if(workAssign.getValue("userId") !== this.getValue("_id"))  return new WorkAssign();

        var workAssigns = Datapiece.sort(this.getWorkAssigns(),["start"]);
        var targetIndex = workAssigns.findIndex(function(_workAssign){
            return _workAssign.getValue("_id") === workAssign.getValue("_id");
        });
        if(targetIndex <= 0)  return new WorkAssign();
        return workAssigns[targetIndex - 1];
    }
    getNextWork(workAssign){
        if(workAssign instanceof WorkAssign){
            workAssign = workAssign.copy();
        }else{
            workAssign = Datapiece.getServer().getDataById(workAssign,"workAssign");
        }
        if(workAssign.getValue("userId") !== this.getValue("_id"))  return new WorkAssign();

        var workAssigns = Datapiece.sort(this.getWorkAssigns(),["start"]);
        var targetIndex = workAssigns.findIndex(function(_workAssign){
            return _workAssign.getValue("_id") === workAssign.getValue("_id");
        });
        if(targetIndex === -1 || targetIndex === workAssign.length - 1)  return new WorkAssign();
        return workAssigns[targetIndex + 1];
    }
    static getFreeUsers(start,end){
        var users = Datapiece.getServer().getData("user");
        return users.filter(function(user){
            return user.getShiftTableAsData(start,end).content.length === 0;
        });
    }
}

class UserGroup extends Datapiece{
    constructor(datapieceObj,option){
        super(datapieceObj,"userGroup",option);
    }
    static getColorByUserId(id,kind){
        var userGroup = Datapiece.getServer().getData("userGroup")
            .filter(function(userGroup){
                return userGroup.getValue("isColorGroup")
            }).find(function(userGroup){
                return userGroup.getValue("member") === id
            });
        return userGroup === undefined ? (kind === "background" ? "#FFFFFF" : (kind === "font" ? "#000000" : "#FFFFFF")) : userGroup.getValue(kind + "Color");
    }
}

class WorkAssign extends Datapiece{
    constructor(datapieceObj,option){
        super(datapieceObj,"workAssign",option);
        var that = this;
        Object.defineProperty(this._data,"end",{
            "get":function(){
                return that.getValue("start").copy().addTimeUnit(that.getValue("interval"));
            },"set":function(value){
                if(that.getValue("start") === undefined){
                    that.setValue("start",value);
                }else if(that.getValue("start").getDiff(value,"timeunit") >= 0){
                    that.setValue("interval",that.getValue("start").getDiff(value,"timeunit"))
                }else{
                    that.setValue("interval",0);
                }
            }
        });
    }
}

class WorkGroup extends Datapiece{
    constructor(datapieceObj,option){
        super(datapieceObj,"workGroup",option);
    }
    static getColorByWorkListId(id,kind){
        var workGroup = Datapiece.getServer().getData("workGroup")
            .filter(function(userGroup){
                return userGroup.getValue("isColorGroup")
            }).find(function(userGroup){
                return userGroup.getValue("member") === id
            })
         return workGroup === undefined ? (kind === "background" ? "#FFFFFF" : (kind === "font" ? "#000000" : "#FFFFFF")) : workGroup.getValue(kind + "Color");
   }
}

class WorkList extends Datapiece{
    constructor(datapieceObj,option){
        super(datapieceObj,"workList",option);
        var that = this;
        Object.defineProperty(this._data,"@detail",{
            "get":function(){
                return that.getValue("detail").map(function(obj){
                    var ret = {};
                    Object.keys(obj).forEach(function(key){
                        if(key === "number"){
                            ret[key] = obj[key].split(",");
                        }else{
                            ret[key] = obj[key];
                        }
                    })
                    return ret;
                })
            },"set":function(value){
                that.setValues({"detail":value.map(function(obj){
                    if(obj === undefined || classof(obj) !== "object")  return;
                    if(obj.number !== undefined && classof(obj.number) === "array"){
                        obj.number = obj.number.join(",");
                    }else{
                        delete obj.number;
                    }
                    return obj;
                })},{overwrite:true});
            }
        })
    }
    getBackgroundColor(){
        return WorkGroup.getColorByWorkListId(this.getValues("_id"),"background");
    }
    getFontColor(){
        return WorkGroup.getColorByWorkListId(this.getValues("_id"),"font");
    }
    getWorkAssigns(){
        var that = this;
        return Datapiece.getServer().getData("workAssign").filter(function(workAssign){
            return workAssign.getValue("workListId") === that.getValue("_id");
        });
    }
    getShiftTableAsData(start,end,extraWorkAssign){
        return Datapiece.getShiftTableAsData(this,this.getDataName(),start,end,extraWorkAssign);
    }
    getShiftTableAsElement(start,end,option){
        return Datapiece.getShiftTableAsElement(this,this.getDataName(),start,end,option);        
    }
}

class WorkNotAssigned extends Datapiece{
    constructor(datapieceObj,option){
        super(datapieceObj,"workNotAssigned",option);
    }
}
