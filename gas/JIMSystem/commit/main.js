function myFunction() {
    //claim test!!!!!!
}


var checkPassThis = Script.checkPass.bind(this,"jimjim");


function doGet(request) {
  return HtmlService.createTemplateFromFile('html_login')
      .evaluate()
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setTitle("JIMシステム_forJIMs");
}
