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
    return class Datapiece {
        constructor(datapieceObj,dataName,option){
            if(option === undefined)  option = {};
            var that = this;
            if(server === undefined){
                //Serverオブジェクトを変える場合にはここを書き換える
                server = _val.server;
            }
            this._data = {};
            this._dataName = dataName;
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
            return this;
        }
        setNewId(overwrite){
            if(overwrite === undefined) overwrite = false;
            if(!overwrite && this.getValue("_id") !== undefined) return this;
            this.setValues({"_id":Datapiece.getNewId(this.getDataName())});
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
        //消すかも
        getValues(){
            return this._data;
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
        static getClassByName(dataName){
            var collInfo = server.getCollectionInfoByName(dataName);
            if(collInfo === undefined)  return undefined;
            return collInfo.getClass();
        }
        static getNewId(dataName){
            var result;
            var idList = server.getData(dataName).map(function(data){return data.getValue("_id")});
            do{
                result = makeRandomStr(16,{"number":true, "alphaLower":true, "alphaUpper":true});
            }while(inArray(idList,result))
            return result;
        }
        static sort(datapieces,colName,reverse,dataName){
            if(!Array.isArray(datapieces)) return;
            if(dataName === undefined)  dataName = datapieces[0].getDataName();
            if(colName === undefined)  colName = "_id";
            if(!Array.isArray(colName)) colName = [colName];
            if(reverse === undefined) reverse = [];
            var colInfo = server.getCollectionInfoByName(dataName);
            return datapieces.slice().sort(function(a,b){
                //TODO
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
                    return value;
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
        return "#FFFFFF";
        //return UserGroup.getColorByUserId(this.getValues("_id"),"background");
    }
    getFontColor(){
        return "#000000";
        //return UserGroup.getColorByUserId(this.getValues("_id"),"font");
    }
}

class UserGroup extends Datapiece{
    constructor(datapieceObj,option){
        super(datapieceObj,"userGroup",option);
    }
    static getColorByUserId(id,kind){
        return _val.server.getData("userGroup")
            .filter(function(userGroup){
                return userGroup.getValue("isColorGroup")
            }).find(function(userGroup){
                return userGroup.getValue("member") === id
            }).getValue(kind + "Color");
    }
}

class WorkAssign extends Datapiece{
    constructor(datapieceObj,option){
        super(datapieceObj,"workAssign",option);
    }
}

class WorkGroup extends Datapiece{
    constructor(datapieceObj,option){
        super(datapieceObj,"workGroup",option);
    }
    static getColorByWorkListId(id,kind){
        return _val.server.getData("workGroup")
            .filter(function(userGroup){
                return userGroup.getValue("isColorGroup")
            }).find(function(userGroup){
                return userGroup.getValue("member") === id
            }).getValue(kind + "Color");
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
        return "#FFFFFF";
        //return WorkGroup.getColorByUserId(this.getValues("_id"),"background");
    }
    getFontColor(){
        return "#000000";
        //return WorkGroup.getColorByUserId(this.getValues("_id"),"font");
    }
}

class WorkNotAssigned extends Datapiece{
    constructor(datapieceObj,option){
        super(datapieceObj,"workNotAssigned",option);
    }
}
