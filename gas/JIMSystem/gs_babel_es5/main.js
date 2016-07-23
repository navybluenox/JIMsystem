"use strict";

function myFunction() {
    //claim test!!!!!!
}

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

function checkPass(pass, pageName) {
    var key = "";
    var result;
    if (pageName === undefined) {
        result = key === pass;
    } else {
        if (key === pass) {
            result = getPage(pageName);
        } else {
            result = null;
        }
    }
    return result;
}

function getPage(pageName) {
    var htmlName = "html_" + pageName;
    return HtmlService.createTemplateFromFile(htmlName).evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();
}