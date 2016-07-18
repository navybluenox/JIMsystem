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

function loadfun(funName, _arguments) {
    var fun;
    eval("fun = " + funName + ";");
    if (_arguments === undefined) {
        return JSON.stringify(fun.apply(undefined));
    } else {
        if (!Array.isArray(_arguments)) _arguments = [_arguments];
        return JSON.stringify(fun.apply(undefined, _arguments));
    }
}