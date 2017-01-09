
var Datapiece = (function(){
    var server;
    var config;
    return class Datapiece {
        constructor(datapieceObj,dataName,option){
            if(option === undefined)  option = {};
            var that = this;
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
                            //undefined,nullのキーは削除
                            if(d[key] === undefined || d[key] === null){
                                delete d[key];
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
                                if(v === undefined || v === null)  return;
                                return goDeepLevelValue(dpObj[i],colObj[0],d[i],d,i,op)
                            }).filter(function(_d){
                                //undefined,null,{}が入っている値は除外
                                if(classof(_d) === "object"){
                                    return Object.keys(_d).length !== 0;
                                }else{
                                    return _d !== null && _d !== undefined;
                                }
                            });
                        }else{
                            dpObj.forEach(function(v,i){
                                if(v === undefined || v === null)  return;
                                goDeepLevelValue(dpObj[i],colObj[0],d[i],d,i,op);
                            });
                        }
                        return d;
                    case "null":
                        //nullはスキップ
                        return undefined;
                    default:
                        //shallow copyをするため、あえてdではなくdParent[dKey]を使用
                        dParent[dKey] = castType(dpObj,colObj);
                        return castType(dpObj,colObj);
                }
            }
            this.triggerEvent("changed");
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
            this.triggerEvent("changed");
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
            if(typeof newCopy !== "boolean")  throw new Error("Datapiece.prototype.getValues()の引数に真偽値以外が渡されています");
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
            //setValue,setValues,Server.sendUpdateQueueで何回も呼ばれるため、省略
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
        isBlank(){
            return Object.keys(this.getValues()).length === 0;
        }
        static initialize(settings){
            if(settings === undefined || typeof settings !== "object" || settings === null)  return;
            server = server || settings.server;
            config = config || settings.config;
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
            return datapieces.sort(function(a,b){
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
            var cellWidthPerInterval = {"value":2,"unit":"em"};
            var cellHeightPerInterval = {"value":3,"unit":"ex"};

            var cellWidth = function(interval){
                return "" + (cellWidthPerInterval.value * interval) + cellWidthPerInterval.unit;
            }
            var cellHeight = function(interval){
                return "" + (cellHeightPerInterval.value * interval) + cellHeightPerInterval.unit;
            }

            option = option || {};
            option.mode = option.mode || "table";
            option.trans = option.trans || false;
            option.extraWorkAssign = option.extraWorkAssign || [];
            option.diffFormRequired = option.diffFormRequired || true;

            var idName = dataName + "Id";

            var data = that.getShiftTableAsData(start,end,option.extraWorkAssign);
            var rowContents = [];
            for(var i=0,l=Math.max(data.workNum,(dataName === "workList" ? that.getDiffFromRequired(start,end,true).reduce(function(prev,curt){return Math.max(prev,curt.diff)},0) : 0)); i<l; i++){
                rowContents[i] = data.content.filter(function(obj){return obj.workIndex === i});
            }
            var _tdMatrix = [];
            if(dataName === "workList"){
                //後ろの blank -> vacancy の変更で使用する
                var _requires = that.getDiffFromRequired(start,end,true).map(function(v){return v.diff});
            }
            rowContents.forEach(function(_rowContent,rowIndex){
                var rowContent = _rowContent.slice();
                var insert;
                _tdMatrix[rowIndex] = []
                if(_rowContent.length === 0){
                    insert = [];
                    for(var j=0,l=start.getDiff(end, "timeunit"); j<l; j++){
                        insert[j] = {"start":start.copy().addTimeUnit(j),"workAssignId":"_vacancy"};
                    }
                    rowContent = [insert];
                }else{
                    for(var i=_rowContent.length-1; i>=0; i--){
                        insert = [];
                        for(var j=0,l=_rowContent[i].start.copy().addTimeUnit(_rowContent[i].interval).getDiff(i===_rowContent.length-1 ? end : _rowContent[i+1].start, "timeunit"); j<l; j++){
                            insert[j] = {"start":_rowContent[i].start.copy().addTimeUnit(_rowContent[i].interval + j),"workAssignId":"_vacancy"};
                        }
                        rowContent.splice(i+1,0,insert);
                    }
                    insert = [];
                    for(var j=0,l=start.getDiff(_rowContent[0].start, "timeunit"); j<l; j++){
                        insert[j] = {"start":start.copy().addTimeUnit(j),"workAssignId":"_vacancy"};
                    }
                    rowContent.splice(0,0,insert);
                }
                rowContent = rowContent.reduce(function(prev,curt){
                    return prev.concat(Array.isArray(curt) ? curt : [curt]);
                },[]);
                _tdMatrix[rowIndex] = rowContent.map(function(cell,cellIndex){
                    var td = $("<td><div></div></td>");
                    if(cell.workAssignId === "_vacancy"){
                        td.children("div").text(" ");
                        td.css({
                            "background":"#FFFFFF",
                            "color":"#000000",
                            "border":"1px solid #000000",
                            "border-style": (option.trans ? "dashed solid" : "solid dashed")
                        });
                        if(cell.start.getMinutes() === 0){
                            td.css((option.trans ? {"border-top-style":"solid"} : {"border-left-style":"solid"}));
                        }
                        if(dataName === "workList"){
                            if(rowIndex >= _requires[cellIndex]){
                                td.css({"background":"#E8E8E8"});
                                cell.workAssignId = "_blank";
                            }
                        }
                        td.data({"workassignid":cell.workAssignId,"start":cell.start.getTime(),"interval":1,"workIndex":rowIndex});
                    }else{
                        var workAssign = Datapiece.getServer().getDataById(cell.workAssignId,"workAssign")[0];
                        if(workAssign === undefined){
                            workAssign = option.extraWorkAssign.find(function(workAssign){return workAssign.getValue("_id") === cell.workAssignId});
                        }
                        var datapiece;
                        if(dataName === "user"){
                            datapiece = workAssign.getDatapieceRelated("workListId","workList");
                            td.children("div").text(datapiece.getValue("nameShort"));
                        }else if(dataName === "workList"){
                            datapiece = workAssign.getDatapieceRelated("userId","user");
                            td.children("div").text(datapiece.getValue("nameLast") + " " + datapiece.getValue("nameFirst"));
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
                            td.children("div").css("border","2px solid #FF0000").addClass("extra");
                        }
                    }
                    td.addClass("shiftTableContent").css({"padding":"0","margin":"0"})
                    .children("div").css({"padding":"1ex 0.5em","white-space":"pre","cursor":"pointer","box-sizing":"border-box"});
                    td.map(function(i,_el){
                        var el = $(_el);
                        if(option.trans){
                            el.css({"height":cellHeight(td.data("interval"))});
                            el.children("div").css({"height":cellHeight(td.data("interval"))});
                        }else{
                            el.css({"width":cellWidth(td.data("interval"))});
                            el.children("div").css({"width":cellWidth(td.data("interval"))});
                        }
                    });
                    return td;
                });
            });

            if(option.diffFormRequired && dataName === "workList"){
                var requires = _requires.slice();
                var diffs = that.getDiffFromRequired(start,end).map(function(v){return v.diff});

                [requires,diffs].forEach(function(array,index,s){
                    array = array.map(function(diff,diffIndex){
                        var td = $("<td><div></div></td>");
                        td.addClass(index === 0 ? "requireNum" : "diffNum").css({
                            "padding":"0","margin":"0",
                            "border":"1px solid #000000",
                            "color":"#000000",
                            "background":WorkList.getBackgroundColorByNumber(diff),
                            "text-align":(option.trans ? "" : "center")
                        }).data({"time":start.copy().addTimeUnit(diffIndex).getTime(),"diff":diff})
                        .children("div")
                            .text("" + diff)
                            .css({"cursor":"pointer"});
                        if(that.getValue("asAssigned")){
                            td.children("div").css("text-decoration","line-through");
                        }
                        if(option.trans){
                            td.css({"height":cellHeight(timeSpan)});
                            td.children("div").css({"height":cellHeight(1)})
                        }else{
                            td.css({"width":cellWidth(1)});
                            td.children("div").css({"width":cellWidth(1)});
                        }
                        return td;
                    });
                    if(index === 0){
                        requires = array;
                    }else{
                        diffs = array;
                    }
                });
                _tdMatrix = [requires,diffs].concat(_tdMatrix);
            }

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
                        timeSpan = (60 - time.getMinutes()) / LocalDate.getTimeUnitAsConverted("minute");
                    }else if(time.getDiff(tableEnd,"minute") < 60){
                        timeSpan = time.getDiff(tableEnd,"timeunit");
                    }else{
                        timeSpan = 60 / LocalDate.getTimeUnitAsConverted("minute");
                    }
                    var td = $("<td><div></div></td>");
                    td.attr(option.trans ? "rowspan" :"colspan",timeSpan).addClass("timeScale").css({
                        "padding":"0","margin":"0",
                        "border":"1px solid #000000",
                        "color":"#000000",
                        "background":(index%2===0 ? "#7FFFD4" : "#66CDAA"),
                        "text-align":(option.trans ? "" : "center")
                    }).children("div").text("" + time.getDifferentialHours(data.tableStartTime) + "時").data({"time":time.getTime()});
                    if(option.trans){
                        td.css({"height":cellHeight(timeSpan)});
                        td.children("div").css({"height":cellHeight(timeSpan)})
                    }else{
                        td.css({"width":cellWidth(timeSpan)});
                        td.children("div").css({"width":cellWidth(timeSpan)});
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
            {name:"systemConfig",class:SystemConfig},
            {name:"user",class:User},
            {name:"userGroup",class:UserGroup},
            {name:"workAssign",class:WorkAssign},
            {name:"workGroup",class:WorkGroup},
            {name:"workList",class:WorkList}
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
    getIdCode(){
        return this.getValue("content.kind") + this.getValue("content.nth")
    }
}

class User extends Datapiece{
    constructor(datapieceObj,option){
        super(datapieceObj,"user",option);
        var that = this;
        Object.defineProperty(this._data,"@name",{
            "get":function(){
                return [that.getValue("nameLast"),that.getValue("nameFirst")].join(" ");
            }
        });
    }
    getBackgroundColor(){
        return UserGroup.getColorByUserId(this.getValue("_id"),"background");
    }
    getFontColor(){
        return UserGroup.getColorByUserId(this.getValue("_id"),"font");
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
    getShiftTableAsSpreadsheetSetting(start,end,rowIndex,leftOffset){
        rowIndex = rowIndex || 0;
        leftOffset = leftOffset || 0;
        var data = this.getShiftTableAsData(start,end);
        var _row = data.content.filter(function(obj){return obj.workIndex === 0});

        var row = _row.slice();
        if(_row.length === 0){
            for(var j=0,l=start.getDiff(end, "timeunit"); j<l; j++){
                row[j] = {"start":start.copy().addTimeUnit(j),"workAssignId":"_vacancy"};
            }
        }else{
            var insert;
            for(var i=_row.length-1; i>=0; i--){
                insert = [];
                for(var j=0,l=_row[i].start.copy().addTimeUnit(_row[i].interval).getDiff(i===_row.length-1 ? end : _row[i+1].start, "timeunit"); j<l; j++){
                    insert[j] = {"start":_row[i].start.copy().addTimeUnit(_row[i].interval + j),"workAssignId":"_vacancy"};
                }
                row.splice(i+1,0,insert);
            }
            insert = [];
            for(var j=0,l=start.getDiff(_row[0].start, "timeunit"); j<l; j++){
                insert[j] = {"start":start.copy().addTimeUnit(j),"workAssignId":"_vacancy"};
            }
            row.splice(0,0,insert);
        }
        row = row.reduce(function(prev,curt){
            return prev.concat(Array.isArray(curt) ? curt : [curt]);
        },[]);

        var mergeSetting = [];
        var borderSetting = [];

        row = row.map(function(cell){
            var ret = {"time":cell.start.getTime(),"text":null};
            if(cell.workAssignId !== "_vacancy" && cell.workAssignId !== "_blank"){
                var workAssign = _val.server.getDataById(cell.workAssignId,"workAssign")[0].copy();
                workAssign.setValue("start",cell.start.copy()).setValue("interval",cell.interval)
                var workList = workAssign.getDatapieceRelated("workListId","workList");
                ret = [];
                for(var i=0,l=workAssign.getValue("interval");i<l;i++){
                    ret[i] = {"time":cell.start.copy().addTimeUnit(i).getTime(),"text":null};
                }
                ret[0] = {"time":cell.start.getTime(),"startWork":true,"text":workList.getValue("nameShort"),"background":workList.getBackgroundColor(),"fontColor":workList.getFontColor()};
                ret[ret.length-1].endWork = true;
                mergeSetting.push({"range":{"top":rowIndex,"left":leftOffset + data.tableStartTime.getDiff(cell.start,"timeunit"),"height":1,"width":workAssign.getValue("interval")}});
            }
            return ret;
        }).reduce(function(prev,curt){
            return prev.concat(curt);
        },[]).map(function(cell,cellIndex,self){
            var time = new LocalDate(cell.time);
            if(time.getMinutes() === 0 || cellIndex === 0 /*|| cell.startWork || cell.endWorkNext*/){
                borderSetting.push({"range":{"top":rowIndex,"left":leftOffset + cellIndex,"height":1,"width":1},"border":{"style":"solid","left":true}})
            }
            if(cell.endWork && cellIndex !== self.length-1){
                self[cellIndex+1].endWorkNext = true;
            }
            return cell;
        }).map(function(cell){
            ["time","startWork","endWork","endWorkNext"].forEach(function(key){
                if(cell[key] !== undefined){
                    delete cell[key];
                }
            });
            return cell;
        });
        return {"content":row,"merge":mergeSetting,"border":borderSetting};
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
                return inArray(userGroup.getValue("member"),id);
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
        this.addEventListener("updated",function(e){
            that.getDatapieceRelated("workListId","workList").refreshWorkAssignList();
        });
    }
    getWorkListSectionNumber(){
        var workList = this.getDatapieceRelated("workListId","workList");
        if(workList === undefined)  return this;
        var time = this.getValue("start");
        return workList.getValue("@detail").findIndex(function(section){
            var start = section.start;
            var end = start.copy().addTimeUnit(section.number.length);
            return time.getTime() >= start.getTime() && time.getTime() < end.getTime();
        });
    }
}

class WorkGroup extends Datapiece{
    constructor(datapieceObj,option){
        super(datapieceObj,"workGroup",option);
    }
    static getColorByWorkListId(id,kind){
        var workGroup = Datapiece.getServer().getData("workGroup")
        .filter(function(workGroup){
            return workGroup.getValue("isColorGroup")
        }).find(function(workGroup){
            return inArray(workGroup.getValue("member"),id);
        });
         return workGroup === undefined ? (kind === "background" ? "#FFFFFF" : (kind === "font" ? "#000000" : "#FFFFFF")) : workGroup.getValue(kind + "Color");
   }
}

class WorkList extends Datapiece{
    constructor(datapieceObj,option){
        super(datapieceObj,"workList",option);
        var that = this;
        this._workAssigns = [];
        Object.defineProperty(this._data,"@detail",{
            "get":function(){
                return that.getValue("detail").map(function(obj){
                    var ret = {};
                    Object.keys(obj).forEach(function(key){
                        if(key === "number"){
                            ret[key] = obj[key].split(",").map(function(n){return +n});
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
        });
        Object.defineProperty(this._data,"@workAssign",{
            "get":function(){
                return that._workAssigns.slice();
            }
        });
        //軽量化のためにworkAssignIdを記録
        this.refreshWorkAssignList();
    }
    getBackgroundColor(){
        return WorkGroup.getColorByWorkListId(this.getValue("_id"),"background");
    }
    getFontColor(){
        return WorkGroup.getColorByWorkListId(this.getValue("_id"),"font");
    }
    getWorkAssigns(useReliableMode){
        var that = this;
        useReliableMode = (useReliableMode === undefined ? false : useReliableMode);
        return useReliableMode ? (
            Datapiece.getServer().getData("workAssign").filter(function(workAssign){
                return workAssign.getValue("workListId") === that.getValue("_id");
            })
        ) : (
            this.getValue("@workAssign")
        );
    }
    getShiftTableAsData(start,end,extraWorkAssign){
        return Datapiece.getShiftTableAsData(this,this.getDataName(),start,end,extraWorkAssign);
    }
    getShiftTableAsElement(start,end,option){
        return Datapiece.getShiftTableAsElement(this,this.getDataName(),start,end,option);        
    }
    getDiffFromRequired(start,end,diffFromZero){
        var result = [];
        var workAssigns = this.getWorkAssigns();
        diffFromZero = diffFromZero || false;

        var time,num_required,num_assigned;
        for(var i=0,l=start.getDiff(end,"timeunit");i<l;i++){
            time = start.copy().addTimeUnit(i);
            num_required = 0;
            this.getValue("@detail").map(function(section){
                var diff = section.start.getDiff(time,"timeunit");
                if(diff >= 0 && diff < section.number.length){
                    num_required += section.number[diff];
                }
            });
            if(diffFromZero){
                num_assigned = 0;
            }else{
                num_assigned = workAssigns.filter(function(workAssign){
                    return (
                        time.getTime() >= workAssign.getValue("start").getTime() &&
                        time.getTime() < workAssign.getValue("end").getTime()
                    );
                }).length;
            }
            result.push({"time":time,"diff":num_required - num_assigned});
        }
        return result;
    }
    refreshWorkAssignList(){
        this._workAssigns = this.getWorkAssigns(true);
    }
    static getBackgroundColorByNumber(num){
        if(num > 0){
            var hue = [200,140,60,30];
            var lightness = [90,80,70,60,50];
            var n = (num > 20 ? 20 : num) - 1;
            return "hsl(" + hue[(n-n%5)/5] + ", 100%, " + lightness[n%5] + "%)";
        }else{
            return "#CCCCCC";
        }
    }
    static getAtInterval(start,end){
        var workLists = Datapiece.getServer().getData("workList");
        return workLists.filter(function(workList){
            if(workList.getValue("asAssigned")) return false;
            return workList.getDiffFromRequired(start,end,true).every(function(obj){
                return obj.diff > 0;
            })
        });        
    }
    static getNotAssignedAtInterval(start,end){
        var workLists = Datapiece.getServer().getData("workList");
        return workLists.filter(function(workList){
            if(workList.getValue("asAssigned")) return false;
            return workList.getDiffFromRequired(start,end).every(function(obj){
                return obj.diff > 0;
            })
        });
    }
    static getNotAssigned(){
        var workLists = Datapiece.getServer().getData("workList").filter(function(workList){
            return !workList.getValue("asAssigned");
        });
        var ret = [];
        workLists.forEach(function(workList){
            var indexes = [];
            workList.getValue("@detail").forEach(function(section,sectionIndex){
                var start = section.start;
                var end = start.copy().addTimeUnit(section.number.length);
                if(workList.getDiffFromRequired(start,end).some(function(obj){return obj.diff !== 0})){
                    indexes.push(sectionIndex);
                }
            });
            if(indexes.length !== 0){
                    ret.push({"workList":workList,"index":indexes});
            }
        });
        return ret;
    }
}
