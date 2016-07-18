"use strict";

//  ---About This---
/*
名前
    server_base.js
このファイルについて

定義一覧
    ○○
        説明
        引数
*/

function loadFileFromDrive(fileIdStr, charEnc) {
    if (charEnc == null) charEnc = "UTF-8";
    return DriveApp.getFileById(fileIdStr).getBlob().getDataAsString(charEnc);
}

function movePage(pageName) {
    var htmlName = pageName;
    return JSON.stringify(HtmlService.createTemplateFromFile(htmlName).evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent());
}

function checkPass(key, pass, pageName) {
    var result;
    if (pageName === undefined) {
        result = key === pass;
    } else {
        if (key === pass) {
            result = movePage(pageName);
        } else {
            result = null;
        }
    }
    return JSON.stringify(result);
}

function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}