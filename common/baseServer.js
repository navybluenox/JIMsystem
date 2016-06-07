//  ---About This---
/*
名前
    baseServer.js

依存ファイル
    include.js
    base.js
    driveFileId.js

このファイルについて
    汎用的な関数を集めたファイルです
    サーバー側のGASでのみ動作します

定義一覧
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

function UrlShortenerService(longUrl,avoidLong) {
  var apiKey  = _fileId.apikey.main;
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
          if(avoidLong){
              //時間をおいて成功するまで実行する
              Utilities.sleep(100);
              UrlShortenerService(longUrl,callback);
          }else{
              return JSON.parse(response).id;
          }
    }
}

function getAuthority(){
    //非常に適当
    UrlFetchApp.fetch();
    SpreadsheetApp.openById("##idString##");
    DocumentApp.openById("##idString##");
    GmailApp.search("azusa");
    DriveApp.getFileById("##idString##");
    FormApp.openById("##idString##");
}

function sendAZUSA(sendName,subject,message,noLog,label){
    var startTime = new Date();
    if(sendAZUSA == null || message == null){
        Logger.log("Error : Some of requiered argument are missing (sendAZUSA)");
        throw new Error();
    }
    if(subject == null || subject === ""){
        Logger.log("Attention : Argument(subject) is empty (sendAZUSA)");        
    }
    if(!Array.isArray(sendName)){
        sendName = [sendName];
    }
    if(noLog == null){
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
    if(label != null){
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

