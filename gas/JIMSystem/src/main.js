function myFunction() {
    //claim test!!!!!!
}


var checkPassThis = checkPass.bind(null,"jimjim");


function doGet(request) {
  return HtmlService.createTemplateFromFile('html_start')
      .evaluate()
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setTitle("JIMシステム_forJIMs");
}
