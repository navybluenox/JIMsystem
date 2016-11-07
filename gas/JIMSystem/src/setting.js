$(function(){
    var pageFun;
    _val.pageFun.setting = {
        onload:function(){
            _val.server.loadDataAll();
            pageFun = _val.pageFun.setting;
        },onunload:function(){
        },changeMode:function(){
            var form = $("#formModeSetting");
            return Promise.all([
                Server.handlePropertiesService({"mode":form.find('[name="modeName"]').val()},"script","set"),
                (Promise.resolve().then(function(){
                    var curtPass = form.find('[name="curtPass"]').val(); 
                    var newPass = form.find('[name="newPass"]').val();

                    if(newPass === "") return true;
                    if(form.find('[name="newPassConfirm"]').val() !== newPass){
                        alert("新しいパスワードと確認用のパスワードが一致していません。");
                        return null;
                    }
                    return Server.checkLogInPass(curtPass).then(function(flag){
                        if(flag){
                            var obj = {};
                            obj["loginPass_" + _val.config.getIdCode()] = newPass;
                            return Server.handlePropertiesService(obj,"script","set");
                        }else{
                            alert("現在のパスワードが間違っています。");
                            return null;
                        }
                    });
                }))
            ]).then(function(arr){
                if(arr[1] !== null){
                    alert("システムを再起動します。");
                    location.reload();
                }else{
                    alert("モードの変更は再起動後に有効になります。");
                }
            })
        }
    };
});