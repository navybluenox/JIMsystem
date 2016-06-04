//  ---About This---
/*
名前
    baseServer.js

このファイルについて
    汎用的な関数を集めたファイルです
    サーバー側のGASでのみ動作します

定義一覧

*/


//TODO
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