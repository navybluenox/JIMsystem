function myFunction() {
    //claim test!!!!!!
}


var this_checkPass = Script.checkPass.bind(this,"jimjim");
var this_include = Script.include(this);

function doGet(request) {
  return HtmlService.createTemplateFromFile('html_login')
      .evaluate()
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setTitle("JIMシステム_forJIMs");
}
