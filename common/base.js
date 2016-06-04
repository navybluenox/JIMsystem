//  ---About This---
/*
名前
    base.js

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
*/

Number.isNaN = Number.isNaN || function(value) {
    return typeof value === "number" && value !== value;
}

Array.prototype.inArray = Array.prototype.inArray || function(value){
    return this.indexOf(value) !== -1;
}

function groupArray(array,keys){
    //array = [Object, Object, ... Object]
    //keys = "A" or ["A","B","C", ... ,"Z"];
    if(typeof keys === "string"){
        keys = [keys];
    }
    if(!Array.isArray(array)){
        Logger.log("Error : 1st argument is not array");
        return null;
    }

    //groupするキー（keys）の値（array[0][key],array[1][key], ...）の組み合わせを全て出す
    //軽量化のため、出力（result）と検索用（groupValueCombList）を別にする。それぞれのindexは共通
    var result = [];
    var groupValueCombList = [];
    
    array.forEach(function(obj){
        //objのキーのうちkeysにある値が、groupValueCombListに完全一致するものがあるか否か
        var fIndex = groupValueCombList.findIndex(function(groupValueComb){
            //groupValueCombに、objのキーのうちkeysにある値が完全一致するか
            return groupValueComb.every(function(value,index){return obj[keys[index]] === value})
        });
        var insertIndex,insertObj = {};
        if(fIndex === -1){
            //完全一致するものは無かった
            //挿入する場所を探す
            insertIndex = groupValueCombList.findIndex(function(groupValueComb){
                return groupValueComb.some(function(value,index){
                    return ("" + obj[keys[index]]).charCodeAt() < ("" + value).charCodeAt();
                })
            });
            //resultに入れるinsertObjを作成
            Object.keys(obj).forEach(function(objKey){
                if(keys.find(function(key){return key === objKey})){
                    insertObj[objKey] = obj[objKey];
                }else{
                    insertObj[objKey] = [obj[objKey]];                        
                }
            })
            if(insertIndex === -1){
                //最後に挿入
                groupValueCombList.push(keys.map(function(key){return obj[key]}));
                result.push(insertObj);
            }else{
                //insertIndex番目として挿入
                groupValueCombList.splice(insertIndex,0,keys.map(function(key){return obj[key]}));
                result.splice(insertIndex,0,insertObj);
            }
        }else{
            //完全一致するものがあった
            //最後の順番を探索
            //データによっては存在しないキーもあり、resultが長方形の二次元配列にならない可能性があるため
            Object.keys(obj).forEach(function(objKey){
                if(!keys.find(function(key){return key === objKey})){
                    if(insertIndex == null || insertIndex < result[fIndex][objKey].length){
                        insertIndex = result[fIndex][objKey].length;
                    }
                }
            })
            //既存の行にデータを追加
            Object.keys(obj).forEach(function(objKey){
                if(!keys.find(function(key){return key === objKey})){
                    result[fIndex][objKey][insertIndex] = obj[objKey];
                }
            });
        }
    });
    return result;
}

function ungroupArray(array,keys){
    //array = [Object, Object, ... Object]
    //keys = "A" or ["A","B","C", ... ,"Z"];
    //ungroup array with all of the data pairs remained
    //if you want to ungroup array and make all of the considerable combinations,
    //apply this function differently (at keys used at ungrouping)
    
    if(typeof keys === "string")  keys = [keys];
    if(keys.length === 0){
        return array;
    }else{
        var ungroupKey = keys.shift();
        //再帰的に実行
        return ungroupArray(
            array.map(function(obj){
                if(Array.isArray(obj[ungroupKey])){
                    if(obj[ungroupKey].length === 0){
                        obj[ungroupKey] = [undefined];
                    }
                    return obj[ungroupKey].map(function(value){
                        var r = {};
                        Object.keys(obj).forEach(function(objKey){
                            r[objKey] = (objKey === ungroupKey ? value : obj[objKey]);
                        })
                        return r;
                    });
                }else{
                    return [obj];
                }
            }).reduce(function(prev,curt){
                return prev.concat(curt)
            },[]),
            keys
        );
    }
}

//TODO
function makeRegExpSelectOneOfThem(array){
    return new RegExp("^(?:" + array.join("|") + ")?$");
}

function UrlShortenerService(longUrl) {
  var apiKey  = idlist().apikey.main;
  var apiUrl  = 'https://www.googleapis.com/urlshortener/v1/url?key='+apiKey;
  var options = {
        method: 'POST',
        contentType: 'application/json',
        payload: JSON.stringify({longUrl:longUrl}),
        muteHttpExceptions: true
      };
  var response = UrlFetchApp.fetch(apiUrl, options);
  if (response.getResponseCode() !== 200) {
    return longUrl;
  } else {
    return JSON.parse(response).id;
  }
}

function DateToString(date){
    //result = {
    //    str:2016/2/3 12:34:56, str1:2/3 12:34:56,
    //    year:2016, month:1,date:2,day:水, hour:12, minute:34, second:56
    //}
	if(typeof date === "string"){
		date = new Date(date);
		if(date.toString() === "Invalid Date")
			return {};
	}
	if(isNaN(date.getTime())){
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
	
	switch(date.getDay()){
		case 0:
			ret.day = "日";
			break;
		case 1:
			ret.day = "月";
			break;
		case 2:
			ret.day = "火";
			break;
		case 3:
			ret.day = "水";
			break;
		case 4:
			ret.day = "木";
			break;
		case 5:
			ret.day = "金";
			break;
		case 6:
			ret.day = "土";
			break;

	}
	ret.str  = "" + [ret.year,add_zero(ret.month),add_zero(ret.date)].join("/") + " " + [add_zero(ret.hour),add_zero(ret.minute),add_zero(ret.second)].join(":");
	ret.str1 = "" + [add_zero(ret.month),add_zero(ret.date)].join("/") + "（" + ret.day + "）" + " " + [add_zero(ret.hour),add_zero(ret.minute)].join(":");

	function min_ten(num){
		return num < 10;
	}
	function add_zero(num){
		if(min_ten(num)){
			return "0" + num;
		}else{
			return "" + num;
		}
	}
	return ret;
}

function makeIdForData(data,column){
    //data = [ObjectA, ObjectB, ... ,ObjectZ];
    if(typeof column == "undefined")  column = "id";
    if(typeof data == "undefined") data = [];
    var ids = data.map(function(v){return v[column]}).filter(function(v){return v != null && v !== ""});
    var result = Math.random().toString(36).slice(-10);
    while(ids.indexOf(result) != -1){
        result = Math.random().toString(36).slice(-10);
    }
    return result;    
}

function getAuthority(){
    //非常に適当
    UrlFetchApp.fetch();
    SpreadsheetApp.openById(idlist().spreadsheet.user);
    DocumentApp.openById(idlist().log.error);
    GmailApp.search("azusa");
    DriveApp.getFileById(idlist().jsondata.user);
    FormApp.openById(idlist().form.人割調査_for担当_修正用);
}

function sendAZUSA(sendName,subject,message,noLog,label){
    var startTime = new Date();
    if(typeof sendAZUSA == "undefined" || typeof message == "undefined"){
        Logger.log("Error : Some of requiered argument are missing (sendAZUSA)");
        throw new Error();
    }
    if(typeof subject == "undefined" || subject === ""){
        Logger.log("Attention : Argument(subject) is empty (sendAZUSA)");        
    }
    if(!Array.isArray(sendName)){
        sendName = [sendName];
    }
    if(typeof noLog == "undefined"){
        noLog = false;
    }
    GmailApp.sendEmail(
        noLog ? "azusa-nolog@a103.net" : "azusa@a103.net",
        subject,
        [
            "→" + sendName.join("、") + "さん",
            "",
            message,
            "",
            "※このAZUSAは自動送信です。",
            ""
        ].join("\n"),
        {
            name:"89JIM"
        }
    );
    if(typeof label != "undefined"){
        Utilities.sleep(100);
        var endTime = new Date();
        var labelObj = GmailApp.getUserLabelByName(label);
        var mails = GmailApp.search("in:sent has:nouserlabels newer_than:1d (to:azusa@a103.net OR to:azusa-nolog@a103.net)")
        .filter(function(mailThread){
        return (
            startTime.getTime() <= mailThread.getLastMessageDate().getTime() &&
            endTime.getTime() >= mailThread.getLastMessageDate().getTime()
        );
        }).forEach(function(mailThread){
            mailThread.addLabel(labelObj);
        });
    }
}
