function myFunction() {
    //claim test!!!!!!
}


var checkPassThis = scripts.checkPass.bind(null,"jimjim");


function doGet(request) {
  return HtmlService.createTemplateFromFile('html_login')
      .evaluate()
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setTitle("JIMシステム_forJIMs");
}
