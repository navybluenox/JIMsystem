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
                queueObj = {type:"updateType", contents:datapieces}
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

function loadDataFromDrive(fileIdStr, mode) {
    var result;
    if (mode == null) mode = "all";
    var raw = loadFileFromDrive(fileIdStr);
    var rawData = JSON.parse(raw);

    switch (mode) {
        case "all":
            result = rawData;
            break;
        case "raw":
            result = raw;
            break;
        case "data":
            result = rawData.data;
            break;
        case "version":
            result = rawData.version;
            break;
    }
    return result;
}


function updateDatabase(queues,versions){
    var task = {};
    queues.forEach(function(queue){
        if(task[queue.dataName] == null){
            task[queue.dataName] = {add:[],change:[],remove:[]};
        }
        task[queue.dataName][queue.type].push(queue.content);
    });
    versions.forEach(function(versionObj){
        task[versionObj.dataName].version = versionObj.version;
    })
    Object.keys(task).forEach(function(dataName){
        var dbInfo = Database.getDatabaseInfo(dataName);
        var db = loadDataFromDrive(dbInfo.fileId);
        task[dataName].add.forEach(function(content){
            var ids = db.data.map(function(d){return d.id});
            if(!ids.inArray(content.id)){
                db.data.push(content);
            }
        });
        task[dataName].change.forEach(function(content){
            var target = db.data.find(function(d){return d.id == content.id});
            Object.keys(content).forEach(function(column){
                target[column] = content[column];
            });
        });
        task[dataName].remove.forEach(function(content){
            db.data = db.data.filter(function(d){return d.id != content.id});
        });
        db.version = (new Date()).toISOString();
        updateFileToDrive(dbInfo.fileId,JSON.stringify(db));
    });
}


class Database{
    constructor(){
        this.cache = {};
        this.pendingQueue = [];
        this.updatingQueue = [];
        this.updating = false;
        this.loading = [];
    }
    static getDatabaseInfo(dataName){
        //TODO
        var list = [
            {dataName:"user", classObj:User, fileId:_fileId.database.user, column:[
                {name:"id", type:"string", defaultValue:""},
                {name:"sort", type:"number", defaultValue:0},
                {name:"name_last", type:"string", defaultValue:""},
                {name:"name_first", type:"string", defaultValue:""},
                {name:"name_last_phonetic", type:"string", defaultValue:""}
            ]}
        ];
        if(typeof dataName == "string"){
            return list.find(function(v){return v.dataName == dataName});
        }else{
            return list;
        }
    }
    loadData(dataName){
        var dbInfo = Database.getDatabaseInfo(dataName);
        if(dbInfo == null)  return null;
        //TODO this.loadingにpush
        this.loading.push(dataName);
        this.cache[dataName] = loadDataFromDrive(dbInfo.fileId);
        this.cache[dataName].data = this.cache[dataName].data.map(function(obj){
            return new dbInfo.classObj(obj);
        });
        this.loading.filter(function(v){return v != dataName});
        return this.cache[dataName].data;
    }
    loadDataAll(){
        Database.getDatabaseInfo().map(function(info){return this.loadData(info.dataName)});
        return this;
    }
    reloadData(dataName){
        if(this.cache[dataName] == null){
            this.loadData(dataName);
            return this.cache[dataName].data;
        }
        var dbInfo = Database.getDatabaseInfo(dataName);
        var dataNow = [].concat(this.cache[dataName].data);
        var dataNew = loadDataFromDrive(dbInfo.fileId).data.map(function(obj){
            return new dbInfo.classObj(obj);
        });
        var datapiece,dataAdded=[],index;
        while(dataNew.length){
            datapiece = dataNew.shift();
            index = dataNow.findIndex(function(p){return p.getValue("id") == datapiece.getValue("id")});
            if(index != -1){
                dataNow[index].setValues(datapiece.getValues());
                dataNow.splice(index,1);
            }else{
                this.cache[dataName].data.push(datapiece);
            }
        }
        //delete
        dataNow.forEach(function(p){
            var deletePiece = this.cache[dataName].data.find(function(p1){return p1.getValue("id") == p.getValue("id")});
            deletePiece.deleteValues();
        });
        this.cache[dataName].data = this.cache[dataName].data.filter(function(obj){return !!obj.getValues()});
    }
    getData(dataName,newCopy){
        var result;
        if(newCopy == null) newCopy = true;
        if(this.cache[dataName] != null){
            //キャッシュがある
            result = this.cache[dataName].data;
        }else{
            result = this.loadData(dataName);
        }
        if(newCopy){
            return [].concat(result);
        }else{
            return result;
        }
    }
    getDataById(dataName,ids){
        if(!Array.isArray(ids))  ids = [ids];
        return this.getData(dataName).filter(function(datapiece){
            return ids.inArray(datapiece.getValue("id"));
        });
    }
    getColumn(dataName){
        return this.cache[dataName].column;
    }
    getVersion(dataName){
        return new Date(this.cache[dataName].version);
    }
    getVersions(){
        return Object.keys(this.cache)
            .map(function(dataName){return {dataName:dataName,version:this.cache[dataName].version}})
    }
    runUpdate(){
        if(this.loading)  return false;
        this.loading = true;
        sendRequest();
        this.loading = false;

        function sendRequest(){
            this.updatingQueue = this.updatingQueue.concat(this.pendingQueue);
            this.pendingQueue = [];
            var sendQueue = [];
            this.updatingQueue.forEach(function(queue){
                queue.contents.forEach(function(content){
                    sendQueue.push({type:queue.type,dataName:content.getDataName(),content:content.getValues()});
                })
            });
            updateDatabase(sendQueue,this.getVersions());
            this.updatingQueue = [];
            if(this.pendingQueue.length > 0){
                sendRequest();
            }
        }
    }
    changeData(datapieces){
        if(!Array.isArray(datapieces))  datapieces = [datapieces];
        datapieces = datapieces.filter(function(datapiece){return datapiece instanceof Datapiece});
        datapieces.forEach(function(datapiece){
            var targetDP = this.getDataById(datapiece.getDataName(),datapiece.getValue("id"))[0];
            if(targetDP){
                targetDP.setValues(datapiece.getValues());
            }
        })
        this.pendingQueue.push({type:"change",contents:datapieces});
        this.runUpdate();
    }
    addData(datapieces){
        if(!Array.isArray(datapieces))  datapieces = [datapieces];
        datapieces = datapieces.filter(function(datapiece){return datapiece instanceof Datapiece});
        datapieces.forEach(function(datapiece){
            datapiece.setValue(
                "id",
                makeRandomStr(
                    null,
                    {doubleCheck:this.getData(datapiece.getDataName()
                        .map(function(dp){return dp.getValue("id")}))
                    }
                )
            );
            this.cache[datapiece.getDataName()].push(datapiece);
        })
        this.pendingQueue.push({type:"add",contents:datapieces});
        this.runUpdate();
    }
    removeData(datapieces){
        if(!Array.isArray(datapieces))  datapieces = [datapieces];
        datapieces = datapieces.filter(function(datapiece){return datapiece instanceof Datapiece});
        datapieces.forEach(function(datapiece){
            var id = datapiece.getValue("id");
            var targetDP = this.getDataById(datapiece.getDataName(),id)[0];
            this.cache[datapiece.getDataName()] = this.cache[datapiece.getDataName()].filter(function(dp){
                return dp.getValue("id") != id;
            })
            if(targetDP){
                targetDP.deleteValues();
            }
        })
        this.pendingQueue.push({type:"remove",contents:datapieces});
        this.runUpdate();
    }
}

class Datapiece{
    constructor(dataName,datapieceObj){
        this.dataName = dataName;
        this.data = {};
        this.getColumn().forEach(function(column){
            if(typeof datapieceObj[column.name] != "undefined"){
                this.data[column] = datapieceObj[column];
            }else if(typeof column.defaultValue != null){
                this.data[column] = column.defaultValue;
            }
        });
    }
    setValues(datapieceObj){
        this.getColumn().forEach(function(column){
            if(typeof datapieceObj[column.name] != "undefined"){
                this.data[column] = datapieceObj[column];
            }
        });
        return this;
    }
    setValue(columnName,value){
        if(this.getColumn().map(function(v){return v.name}).inArray(columnName)){
            this.data[columnName] = value;
        }
        return this;
    }
    deleteValues(){
        delete this.data;
    }
    deleteValue(columnName,setDefault){
        if(setDefault == null || setDefault){
            var dv = this.getColumn().find(function(v){return v.name = columnName}).defaultValue;
            if(dv){
                this.data[columnName] = dv;
            }else{
                delete this.data[columnName];
            }
        }else{
            delete this.data[columnName];
        }
    }
    getValues(){
        return this.data;
    }
    getValue(columnName){
        return this.data[columnName];
    }
    getColumn(){
        return this.getDatabaseInfo().column;
    }
    getDataName(){
        return this.dataName();
    }
    getDatabaseInfo(){
        return Database.getDatabaseInfo(this.dataName);
    }
}

class User extends Datapiece{
    constructor(datapieceObj){
        super("user",datapieceObj);
    }
}

