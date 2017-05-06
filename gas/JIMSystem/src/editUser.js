$(() => {
    var pageFun;
    var editing;
    var form;
    var formNameList = [{"name":"sortId"},{"name":"azusaId"},{"name":"azusaSendName"},{"name":"cellphone"},{"name":"grade"},{"name":"nameLast"},{"name":"nameFirst"},{"name":"nameLastPhonetic"},{"name":"nameFirstPhonetic"},{"name":"inchargeId"},{"name":"isRojin"},{"name":"isAvailable"},{"name":"sheetConfig"}];
    _val.pageFun.editUser = {
        onload:() => {
            _val.server.loadDataAll();
            pageFun = _val.pageFun.editUser;
        },onunload:() => {
        },updateUser:() => {
        },searchUser:() => {
        },fillForm:() => {
        },getFormData:() => {
        }
    };
});