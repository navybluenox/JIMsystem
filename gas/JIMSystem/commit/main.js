"use strict";

function myFunction() {
    //claim test!!!!!!
}

var this_checkPass = Script.checkPass.bind(undefined, "jimjim");

function doGet(request) {
    return HtmlService.createTemplateFromFile('html_login').evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).setTitle("JIMシステム_forJIMs");
}

function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}