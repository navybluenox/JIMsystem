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

function dateToValue(date){
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
    ret.day = ["日","月","火","水","木","金","土"][date.getDay()];
	ret.str  = "" + [ret.year,add_zero(ret.month),add_zero(ret.date)].join("/") + " " + [add_zero(ret.hour),add_zero(ret.minute),add_zero(ret.second)].join(":");
	ret.str1 = "" + [add_zero(ret.month),add_zero(ret.date)].join("/") + "（" + ret.day + "）" + " " + [add_zero(ret.hour),add_zero(ret.minute)].join(":");
    return ret;

	function add_zero(num){
		if(num < 10){
			return "0" + num;
		}else{
			return "" + num;
		}
	}
}

function makeRandomStr(length,option){
    if(length == null)  length = 10;
    if(option == null)  option = {};
    
    var availableLetters = [];
    ["number","alphaLower","alphaUpper"].forEach(function(key,index){
        if(option[key] == null || option[key]){
            availableLetters = availableLetters.concat([
                "0123456789",
                "abcdefghijklmnopqrstuvwxyz",
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            ][index].split(""));
        }
    });
    if(typeof option.otherLetters == "string"){
        availableLetters = availableLetters.concat(option.otherLetters.split(""));
    }
    
    var lettersNum = availableLetters.length;
    var result = "";
    while(length){
        result += availableLetters[Math.floor(Math.random() * lettersNum)];
        length--;
    }
    return result;
}

function makeIdForTable(data,column,length,option){
    //data = [ObjectA, ObjectB, ... ,ObjectZ];
    if(typeof column == "undefined")  column = "id";
    if(typeof data == "undefined") data = [];
    
    return data.map(function(obj){
        if(obj[column] == null || obj[column] === ""){
            do{
                obj[column] = makeRandomStr(length,option);
            }while(data.map(function(obj1){return obj1[column]}).inArray(obj[column]))
        }
        return obj;
    });
}


