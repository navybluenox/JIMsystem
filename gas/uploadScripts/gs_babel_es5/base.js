"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

//  ---About This---
/*
名前
    base.js

依存ファイル
    include.js
    driveFileId.js

このファイルについて
    汎用的な関数を集めたファイルです
    サーバー側のGASでのみ動作します

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

    /////////////////////////////////////////////////////////////////

    loadfun(funName,argument)

    UrlShortenerService(longUrl,callback)
        説明
            Googleの提供する"url shortener"サービスを使用して、URLを短縮します
            短縮に失敗した場合、デフォルトではlongUrlのまま返します
        引数
            longUrl
                短縮するURL
            avoidLong
                必ず短縮するか否か
                省略可。省略した場合、falseになる

    getAuthority()
        説明
            google app scriptで様々な権限を得るためのパッケージ関数
            初回時にコードから一度実行します
        引数
            なし

    sendAZUSA(sendName,subject,message,noLog,label)
        説明
            使用しているGoogleアカウントからAZUSAを送信します
            予め、AZUSAシステムにこのGmailアドレスを登録しておく必要があります
            //別にJIMシステム用の配送名をもらったほうが良い
            //送信時は特に利点はないが、受信時にいろいろ使える
        引数
            sendName
                送信先の配送名をString型で指定する
                複数に送りたい場合は、Array型で指定する
            subject
                件名
            message
                本文
                送信先配送名は自動で入る。他にも先頭と末尾に文字列が入る
            noLog
                noLogとして送信するか否か
                省略可。省略した場合、false（onLog）になる
            label
                送信したGmailのメールにつけるラベルの名前
                    ネストされたラベルを使用する場合は「a1/b1/ ... 」のように「/」で区切って全て書くことに注意
                省略可。省略した場合、ラベルをつけない
                //ラベルが関係のない送信メールにまで付加される可能性がある（GmailAppクラスの仕様）
                //    直接送信したメールにラベルをつけているのではなく、ある時間内に送信したメールを対象としているため
                //「ある時間内」とは、関数を実行し始めて、途中100msをはさんで、送信を実行するまでのこと（変数startTimeと変数endTimeの宣言した時間）

*/

function loadfun(funName, _arguments) {
    var fun;
    eval("fun = " + funName + ";");
    if (typeof _arguments == "undefined") {
        return JSON.stringify(fun.apply(null));
    } else {
        if (!Array.isArray(_arguments)) _arguments = [_arguments];
        return JSON.stringify(fun.apply(null, _arguments));
    }
}
function UrlShortenerService(longUrl, avoidLong) {
    var apiKey = _fileId.apikey.main;
    var apiUrl = 'https://www.googleapis.com/urlshortener/v1/url?key=' + apiKey;
    var options = {
        method: 'POST',
        contentType: 'application/json',
        payload: JSON.stringify({ longUrl: longUrl }),
        muteHttpExceptions: true
    };
    var response = UrlFetchApp.fetch(apiUrl, options);
    if (response.getResponseCode() !== 200) {
        return longUrl;
    } else {
        if (avoidLong) {
            //時間をおいて成功するまで実行する
            Utilities.sleep(100);
            UrlShortenerService(longUrl, callback);
        } else {
            return JSON.parse(response).id;
        }
    }
}

function getAuthority() {
    //非常に適当
    //UrlFetchApp.fetch();
    SpreadsheetApp.openById("##idString##");
    DocumentApp.openById("##idString##");
    GmailApp.search("azusa");
    DriveApp.getFileById("##idString##");
    FormApp.openById("##idString##");
}

function sendAZUSA(sendName, subject, message, noLog, label) {
    var startTime = new Date();
    if (sendAZUSA == null || message == null) {
        Logger.log("Error : Some of requiered argument are missing (sendAZUSA)");
        throw new Error();
    }
    if (subject == null || subject === "") {
        Logger.log("Attention : Argument(subject) is empty (sendAZUSA)");
    }
    if (!Array.isArray(sendName)) {
        sendName = [sendName];
    }
    if (noLog == null) {
        noLog = false;
    }
    GmailApp.sendEmail(noLog ? "azusa-nolog@a103.net" : "azusa@a103.net", subject, ["→" + sendName.join("、") + "さん", "", message, "", "※このAZUSAは自動送信です。", ""].join("\n"), {
        name: "89JIM"
    });
    if (label != null) {
        Utilities.sleep(100);
        var endTime = new Date();
        var labelObj = GmailApp.getUserLabelByName(label);
        var mails = GmailApp.search("in:sent has:nouserlabels newer_than:1d (to:azusa@a103.net OR to:azusa-nolog@a103.net)").filter(function (mailThread) {
            return startTime.getTime() <= mailThread.getLastMessageDate().getTime() && endTime.getTime() >= mailThread.getLastMessageDate().getTime();
        }).forEach(function (mailThread) {
            mailThread.addLabel(labelObj);
        });
    }
}

//TODO
function updateFileToDrive(fileIdStr, content) {
    DriveApp.getFileById(fileIdStr).setContent(content);
}

function loadFileFromDrive(fileIdStr, charEnc) {
    if (charEnc == null) charEnc = "UTF-8";
    return DriveApp.getFileById(fileIdStr).getBlob().getDataAsString(charEnc);
}

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
        case "updated":
            result = rawData.updated;
            break;
    }
    return result;
}

//TODO
function updateDatabase(fileIdStr, queues) {
    var database = loadDataFromDrive(fileIdStr);

    queues.forEach(function (queue) {
        var dpIndex;
        switch (queue.kind) {
            case "add":
                database.data.push(queue.value);
                break;
            case "change":
                dpIndex = database.data.findIndex(function (datapiece) {
                    return datapiece._id === queue.value._id;
                });
                database.data[dpIndex] = fun(queue.value, database.data[dpIndex]);

                var fun = function fun(dp_queue, dp_data) {
                    if (Array.isArray(dp_queue)) {
                        dp_queue.forEach(function (v, i) {
                            if (v === undefined) return;
                            if (dp_data === undefined) dp_data = [];
                            dp_data[i] = fun(dp_queue[i], dp_data[i]);
                        });
                        return dp_data;
                    } else if ((typeof dp_queue === "undefined" ? "undefined" : _typeof(dp_queue)) === "object") {
                        Object.keys(dp_queue).forEach(function (key) {
                            if (dp_queue[key] === undefined) return;
                            if (dp_data === undefined) dp_data = {};
                            dp_data[key] = fun(dp_queue[key], dp_data[key]);
                        });
                        return dp_data;
                    } else {
                        if (dp_queue === undefined) {
                            return dp_data;
                        } else {
                            return dp_queue;
                        }
                    }
                };

                break;
            case "remove":
                dpIndex = database.data.findIndex(function (datapiece) {
                    return datapiece._id === queue.value._id;
                });
                database.data.splice(dpIndex, 1);
                break;
        }
    });
    database.updated = new Date();
    database.version = +database.version + 1;

    updateFileToDrive(JSON.stringify(data));
}