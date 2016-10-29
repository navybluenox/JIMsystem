function myFunction() {
    //claim test!!!!!!
}

function doGet(request) {
  return HtmlService.createTemplateFromFile('html_login')
      .evaluate()
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setTitle("JIMシステム_forJIMs");
}

function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function loadfun(funName,_arguments){
    var fun = ThisScript;
    funName.split(".").forEach(function(key){
        fun = fun[key] || {}
    });
    if(_arguments === undefined){
        return JSON.stringify(fun.apply(undefined));
    }else{
        if(!Array.isArray(_arguments))  _arguments = [_arguments];
        return JSON.stringify(fun.apply(undefined,_arguments));
    }
}

function getPage(pageName){
    var htmlName = "html_" + pageName;
    return  HtmlService.createTemplateFromFile(htmlName)
        .evaluate()
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
        .getContent();
}
