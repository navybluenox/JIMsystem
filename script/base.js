//  ---About This---
/*
名前
    base.js

依存ファイル
    driveFileId.js

このファイルについて
    汎用的な関数を集めたファイルです
    javascript,GASの両方で動作します

定義一覧
    Number.isNaN
        GAS側で存在しないためこちら側で定義
        Number型のNaNを正確に判定できる

    Array.prototype.inArray
        Array型に作成したユーザー定義メソッド
        引数が配列にあるか否かを判定する
            判定は「厳密に等しい(===)」で行われる。（Array.prototype.indexOfの仕様のため）
        //よく使うので作成したが、もしかしたら適切なのがあるかも。ｊQueryにはある

    LocalDate(timeValue)クラス
        説明
            0日目0時0分0秒を0とし、ミリ秒を単位とするローカル時間です
        引数
            timeValue
                LocalDateがもつ時間を指定する値。値の入れ方は複数ある
                    undefined
                        現在時刻が設定される
                        引数なしの場合
                    引数1つ：String型
                        ISOフォーマット（YYYY-MM-DDTHH:mm:ss.sssZ）などの、Dateクラスの引数に入れて動作する文字列として読む
                    引数1つ:Date型
                        代入されたDate型からはdeep-copyする
                    引数1つ:{day:Number,hour:Number,minute:Number,second:Number,millsecond:Number}型
                        全て省略可。省略した場合、0として読む
                    引数1つ：Number型
                        0日目を0とするローカル時間として読む
        プロパティ
            localTime
                0日目0時0分0秒を0とし、1秒間を1間隔とするローカル時間
        静的メソッド
            //インスタンスからは呼べない。LocalDate.getStandardTime()のように使う
            getStandardTime()
                0日目0時0分0秒のDateオブジェクトを返します
            getTimeUnit()
                人割上の一単位の時間を返します
        メソッド
            getAsDateClass()
                Date型で設定時間を返します
            getLocalTime()
                0日目からのローカル時間を返します
            getLocalTimeObj()
                0日目からのローカル時間を返します
                {day:Number,hour:Number,minute:Number,second:Number} の形で返します
            getLocalDays()
            getLocalHours()
            getLocalMinutes()
            getLocalSeconds()
            getLocalMillseconds()
                ローカル時間を返します
            addTime(localTime)
                ローカル時間を進めます
                    引数
                        localTime
                            進める時間
                                {day:Number,hour:Number,minute:Number,second:Number,millsecond:Number}の形
            addDays(days)
            addHours(hours)
            addMinutes(minutes)
            addSeconds(seconds)
            addMillseconds(millseconds)
                ローカル時間を進めます
                    引数
                        seconds,minutes,hours,days
                            進める時間
            addTimeUnit(timeUnits)
                ローカル時間を進めます
                    引数
                        timeUnits
                            進める単位時間の数
                                timeUnitsの時間はconfig.json参照

    groupArray(array,keys)
        説明
            データが入ったオブジェクトの配列を、オブジェクトのキーごとにまとめる
            キーがarrayの直下に無い、キーが入っているarrayの値がオブジェクトや配列の場合については、対応していない
                groupされるキーについてはオブジェクトでも問題ない
        引数
            array
                オブジェクトが入ったデータ。Arrayであることが必要
                （別にそうでなくても良いが）配列にあるデータはほぼ同型である想定で動作する
            keys
                まとめるオブジェクトのキー。一つのキーでまとめるならString、複数のキーでまとめるなら[String1,String2, ...]
                複数のキーを指定した場合には、全てのキーの値が一致するものでgroupする

    ungroupArray(array,keys)
        説明
            データが入ったオブジェクトの配列を、オブジェクトの一つのキーにある配列についてばらしてデータを増やす
            //見れば分かるが、keysについて一つずつ処理している（再起関数）
        引数
            array
                オブジェクトが入ったデータ。Arrayであることが必要
                （別にそうでなくても良いが）配列にあるデータはほぼ同型である想定で動作する
            keys
                ばらばらにする配列が含まれるオブジェクトのキー。一つのキーでばらすならString、複数のキーでばらすなら[String1,String2, ...]
                複数のキーを指定した場合には、全てのキーについてungroupする

    dateToValue(date)
        説明
            Date型の値を使用しやすい値に変換して出力します
            出力は以下の通りです
                result = {year:年, month:月, day:日付, date:日, hour:時間, minute:分, second:秒, str:2016/2/3 12:34:56形式, str1:2/3 12:34:56形式}
                year,month,date,hour,minute,second -> Number型, the others -> String型
        引数
            date
                入力したいDate型の値

    makeRandomStr(length,option)
        説明
            ランダムな文字列を作成します
        引数
            length
                作成する文字列の長さをできる
                省略可。省略した場合、10になる
            option
                オプションを指定できる
                    number(Boolean型、デフォルトはtrue)
                        数字を使用する
                    alphaLower(Boolean型、デフォルトはtrue)
                        英小文字を使用する
                    alphaUpper(Boolean型、デフォルトはtrue)
                        英大文字を使用する
                    otherLetters(String型、デフォルトはなし)
                        他に使用したい文字列を追加できる

    makeIdForTable(data,column,length,option)
        説明
            データが入ったオブジェクトの配列に対して、idをランダムにつける
        引数
            data
                オブジェクトが入ったデータ。Arrayであることが必要
            column
                idをつけるキー（カラム名）を指定する
                省略可。省略した場合、"id"になる
            length,option
                内部で使用しているmakeRandomStr関数のオプション
                    詳細は該当関数にて
*/

Number.isNaN = Number.isNaN || function (value) {
    return typeof value === "number" && value !== value;
}

/*Array.prototype.inArray = Array.prototype.inArray || function (value) {
    return this.indexOf(value) !== -1;
}*/

var LocalDate = (function(){
    var _config = _val.config;
    return class LocalDate {
        constructor(timeValue){
            var targetTime;
            var standardTime = LocalDate.getStandardTime();
            switch(typeof timeValue){
                case "number":
                    this._localTime = timeValue;
                    //targetTime = LocalDate.getStandardTime();
                    //targetTime.setMilliseconds(targetTime.getMilliseconds() + timeValue);
                    break;
                case "object":
                    if(timeValue instanceof Date){
                        targetTime = new Date(timeValue.toISOString());
                        this._localTime = targetTime.getTime() - standardTime.getTime();
                    }else if(timeValue != null){
                        this._localTime = 0;
                        targetTime = LocalDate.getStandardTime()
                        if(timeValue.day != null)  this._localTime += timeValue.day * 24 * 60 * 60 * 1000;
                        if(timeValue.hour != null)  this._localTime += timeValue.hour * 60 * 60 * 1000;
                        if(timeValue.minute != null)  this._localTime += timeValue.minute * 60 * 1000;
                        if(timeValue.second != null)  this._localTime += timeValue.second * 1000;
                        if(timeValue.millsecond != null)  this._localTime += timeValue.millsecond;
                        //targetTime.setMilliseconds(targetTime.getMilliseconds() + this._localTime);
                    }else{
                        targetTime = new Date();
                        this._localTime = targetTime.getTime() - standardTime.getTime();
                    }
                    break;
                case "string":
                    if(
                        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?(?:Z|[\+\-]\d{2}:\d{2})$/.test(timeValue) ||
                        /^local_\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?(?:Z|[\+\-]\d{2}:\d{2})$/.test(timeValue)
                    ){
                        this._localTime = (new Date(timeValue.replace(/local_/,""))).getTime() - standardTime.getTime();
                    }else{
                        targetTime = new Date(timeValue);
                        this._localTime = targetTime.getTime() - standardTime.getTime();
                    }
                    break;
                default:
                    targetTime = new Date(timeValue);
                    this._localTime = targetTime.getTime() - standardTime.getTime();
            }
        }
        static getStandardTime(){
            return new Date(_config.getValue("base.standardTime"));
        }
        static getTimeUnit(){
            return _config.getValue("workAssign.timeUnit");
        }
        static getOpenTime(day){
            var obj = _config.getValue("base.openTime")[day-1];
            return {
                "start":new LocalDate(obj.start),
                "end":new LocalDate(obj.end)
            };
        }
        static getWorkTime(day){
            var startDay = _config.getValue("workAssign.workStart");
            var obj = _config.getValue("workAssign.workTime")[day-startDay];
            return {
                "start":new LocalDate(obj.start),
                "end":new LocalDate(obj.end)
            };
        }
        getAsDateClass(){
            var targetTime = LocalDate.getStandardTime();
            return targetTime.setMilliseconds(targetTime.getMilliseconds() + this._localTime);
        };
        getLocalTime(){return this._localTime};
        getLocalTimeObj(){
            var dayOffset = 0;
            var localTime = this._localTime;
            while(localTime < 0){
                dayOffset--;
                localTime += 24*60*60*1000;
            }
            return {
                day:(localTime - localTime%(24*60*60*1000))/(24*60*60*1000) + dayOffset,
                hour:(localTime%(24*60*60*1000) - localTime%(60*60*1000))/(60*60*1000),
                minute:(localTime%(60*60*1000) - localTime%(60*1000))/(60*1000),
                second:(localTime%(60*1000) - localTime%(1000))/(1000),
                millsecond:localTime%1000
            };
        };
        getLocalDays(){return this.getLocalTimeObj().day};
        getLocalHours(){return this.getLocalTimeObj().hour};
        getLocalMinutes(){return this.getLocalTimeObj().minute};
        getLocalSeconds(){return this.getLocalTimeObj().second};
        getLocalMillseconds(){return this.getLocalTimeObj().millsecond};
        addTime(time){this._localTime += time; return this;}
        addDays(days){this.addTime(days * 24*60*60*1000); return this;};
        addHours(hours){this.addTime(hours * 60*60*1000); return this;};
        addMinutes(minutes){this.addTime(minutes * 60*1000); return this;};
        addSeconds(seconds){this.addTime(seconds * 1000); return this;};
        addMillseconds(millseconds){this.addTime(millseconds); return this;};
        addTimeUnit(timeUnits){this.addTime(timeUnits * LocalDate.getTimeUnit()); return this;};
        getAsDate(){
            return new Date(LocalDate.getStandardTime().getTime() + this._localTime);
        }
        toJSON(){
            return this.toISOString();
        }
        toISOString(){
            return "local_" + this.getAsDate().toISOString();
        }
        toString(option){
            if(option === undefined)  option = {};
            ["hideDay","hideHour","hideMinute"].forEach(function(v){
                if(option[v] === undefined)  option[v] = false;
            });
            ["hideSecond","hideMillsecond"].forEach(function(v){
                if(option[v] === undefined)  option[v] = true;
            });
            return [
                option.hideDay ? "" : this.getLocalDays() + "日目",
                option.hideHour ? "" : this.getLocalHours() + "時",
                option.hideMinute ? "" : this.getLocalMinutes() + "分",
                option.hideSecond ? "" : this.getLocalSeconds() + "秒",
                option.hideMillsecond ? "" : this.getLocalMillseconds() + "ミリ秒"                
            ].join("");
        }
    }
})();

function classof(val){
    if(typeof val === "object"){
        if(val === null)  return "null";
        if(Array.isArray(val))  return "array";
        if(val instanceof Datapiece)  return val.getDataName();
        if(val instanceof LocalDate) return "localdate";
        if(val instanceof Date) return "date";
        if(val instanceof Server) return "server";
        return "object";
    }else{
        return typeof val;
    }
}

function repeatString(str,num){
    return (new Array(num+1)).join(str);
}

function groupArray(array, keys) {
    //array = [Object, Object, ... Object]
    //keys = "A" or ["A","B","C", ... ,"Z"];
    if (typeof keys === "string") {
        keys = [keys];
    }
    if (!Array.isArray(array)) {
        Logger.log("Error : 1st argument is not array");
        return null;
    }

    //groupするキー（keys）の値（array[0][key],array[1][key], ...）の組み合わせを全て出す
    //軽量化のため、出力（result）と検索用（groupValueCombList）を別にする。それぞれのindexは共通
    var result = [];
    var groupValueCombList = [];

    array.forEach(function (obj) {
        //objのキーのうちkeysにある値が、groupValueCombListに完全一致するものがあるか否か
        var fIndex = groupValueCombList.findIndex(function (groupValueComb) {
            //groupValueCombに、objのキーのうちkeysにある値が完全一致するか
            return groupValueComb.every(function (value, index) { return obj[keys[index]] === value })
        });
        var insertIndex, insertObj = {};
        if (fIndex === -1) {
            //完全一致するものは無かった
            //挿入する場所を探す
            insertIndex = groupValueCombList.findIndex(function (groupValueComb) {
                return groupValueComb.some(function (value, index) {
                    return ("" + obj[keys[index]]).charCodeAt() < ("" + value).charCodeAt();
                })
            });
            //resultに入れるinsertObjを作成
            Object.keys(obj).forEach(function (objKey) {
                if (keys.find(function (key) { return key === objKey })) {
                    insertObj[objKey] = obj[objKey];
                } else {
                    insertObj[objKey] = [obj[objKey]];
                }
            })
            if (insertIndex === -1) {
                //最後に挿入
                groupValueCombList.push(keys.map(function (key) { return obj[key] }));
                result.push(insertObj);
            } else {
                //insertIndex番目として挿入
                groupValueCombList.splice(insertIndex, 0, keys.map(function (key) { return obj[key] }));
                result.splice(insertIndex, 0, insertObj);
            }
        } else {
            //完全一致するものがあった
            //最後の順番を探索
            //データによっては存在しないキーもあり、resultが長方形の二次元配列にならない可能性があるため
            Object.keys(obj).forEach(function (objKey) {
                if (!keys.find(function (key) { return key === objKey })) {
                    if (insertIndex == null || insertIndex < result[fIndex][objKey].length) {
                        insertIndex = result[fIndex][objKey].length;
                    }
                }
            })
            //既存の行にデータを追加
            Object.keys(obj).forEach(function (objKey) {
                if (!keys.find(function (key) { return key === objKey })) {
                    result[fIndex][objKey][insertIndex] = obj[objKey];
                }
            });
        }
    });
    return result;
}

function ungroupArray(array, keys) {
    //array = [Object, Object, ... Object]
    //keys = "A" or ["A","B","C", ... ,"Z"];
    //ungroup array with all of the data pairs remained
    //if you want to ungroup array and make all of the considerable combinations,
    //apply this function differently (at keys used at ungrouping)

    if (typeof keys === "string") keys = [keys];
    if (keys.length === 0) {
        return array;
    } else {
        var ungroupKey = keys.shift();
        //再帰的に実行
        return ungroupArray(
            array.map(function (obj) {
                if (Array.isArray(obj[ungroupKey])) {
                    if (obj[ungroupKey].length === 0) {
                        obj[ungroupKey] = [undefined];
                    }
                    return obj[ungroupKey].map(function (value) {
                        var r = {};
                        Object.keys(obj).forEach(function (objKey) {
                            r[objKey] = (objKey === ungroupKey ? value : obj[objKey]);
                        })
                        return r;
                    });
                } else {
                    return [obj];
                }
            }).reduce(function (prev, curt) {
                return prev.concat(curt)
            }, []),
            keys
        );
    }
}

function inArray(array, value){
    if(!Array.isArray(array))  throw new Error();
    return array.indexOf(value) !== -1;
}

function dateToValue(date) {
    //result = {
    //    str:2016/2/3 12:34:56, str1:2/3 12:34:56,
    //    year:2016, month:1,date:2,day:水, hour:12, minute:34, second:56
    //}
    if (typeof date === "string") {
        date = new Date(date);
        if (date.toString() === "Invalid Date")
            return {};
    }
    if (isNaN(date.getTime())) {
        alert("DateToStringの引数が不正です。");
        throw new Error("DateToStringの引数が不正です。");
    }
    var ret = {};
    ret.year = date.getFullYear();
    ret.month = date.getMonth() + 1;
    ret.date = date.getDate();
    ret.hour = date.getHours();
    ret.minute = date.getMinutes();
    ret.second = date.getSeconds();
    ret.day = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
    ret.str = "" + [ret.year, add_zero(ret.month), add_zero(ret.date)].join("/") + " " + [add_zero(ret.hour), add_zero(ret.minute), add_zero(ret.second)].join(":");
    ret.str1 = "" + [add_zero(ret.month), add_zero(ret.date)].join("/") + "（" + ret.day + "）" + " " + [add_zero(ret.hour), add_zero(ret.minute)].join(":");
    return ret;

    function add_zero(num) {
        if (num < 10) {
            return "0" + num;
        } else {
            return "" + num;
        }
    }
}

function makeRandomStr(length, option) {
    //長さ10,英数字小文字大文字
    if (length == null) length = 16;
    if (option == null) option = {};
    var _length = length;

    var availableLetters = [];
    ["number", "alphaLower", "alphaUpper"].forEach(function (key, index) {
        if (option[key] == null || option[key]) {
            availableLetters = availableLetters.concat([
                "0123456789",
                "abcdefghijklmnopqrstuvwxyz",
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            ][index].split(""));
        }
    });
    if (typeof option.otherLetters == "string") {
        availableLetters = availableLetters.concat(option.otherLetters.split(""));
    }

    var lettersNum = availableLetters.length;
    var result = "";
    while (length) {
        result += availableLetters[Math.floor(Math.random() * lettersNum)];
        length--;
    }
    if(option.doubleCheck){
        while(inArray(option.doubleCheck,result)){
            result = makeRandomStr(_length, option);
        }
    }
    return result;
}

function makeIdForTable(data, column, length, option) {
    //data = [ObjectA, ObjectB, ... ,ObjectZ];
    if (typeof column == "undefined") column = "_id";
    if (typeof data == "undefined") data = [];

    return data.map(function (obj) {
        if (obj[column] == null || obj[column] === "") {
            do {
                obj[column] = makeRandomStr(length, option);
            } while (inArray(data.map(function (obj1) { return obj1[column] })),obj[column])
        }
        return obj;
    });
}


