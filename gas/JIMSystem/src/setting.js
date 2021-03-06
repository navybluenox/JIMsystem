$(function(){
    var pageFun;
    _val.pageFun.setting = {
        onload:function(){
            _val.server.loadDataAll();
            pageFun = _val.pageFun.setting;
            $("#formModeSetting").find('[name="modeName"]').append(_val.server.getData("systemConfig").map(function(systemConfig){
                var modeName = systemConfig.getValue("modeName");
                return '<option value="' + modeName + '">' + modeName + "</option>";
            }).join("")).val(_val.config.getValue("modeName"));
            pageFun.loadSystemConfig();
            $("#formEditSystemConfig table.description tbody").append((()=>{
                var captions = SystemConfig.getPropertyCaption();
                return Object.keys(captions).map(key => "<tr><td>" + key + "</td><td>" + captions[key].replace(/ /,"\n") + "</td></tr>").join("");
            })())

        },onunload:function(){
        },changeMode:function(){
            var form = $("#formModeSetting");
            return Promise.all([
                Server.handlePropertiesService({"mode":form.find('[name="modeName"]').val()},"script","set",{"message":"モードの変更"}).then(function(v){
                    if(v === null){
                        return null;
                    }else{
                        return true;
                    }
                }),
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
                            return Server.handlePropertiesService(obj,"script","set",{"message":"パスワードの変更"});
                        }else{
                            alert("現在のパスワードが間違っています。");
                            return null;
                        }
                    });
                }))
            ]).then(function(arr){
                if(arr[1] !== null && arr[0] !== null){
                    alert([
                        "システムを再起動します。",
                        "（安定版(stable)で開くので開発版(dev)で開きたい場合は、このタイミングでF5キーを押してからこのダイアログを閉じてください）"
                    ].join("\n"));
                    reloadApp();
                }else if(arr[0] !== null){
                    alert("モードの変更は再起動後に有効になります。");
                }
            })
        },loadSystemConfig:()=>{
            var jq = $("#formEditSystemConfig").find('[name="content"]');
            var value = _val.config.getValues();
            var str = JSON.stringify(value,null,2);
            jq.val(str);
            jq.css({"width":"" + $(window).width()*0.7 + "px","height":"" + (str.split("\n").length * 2.2) + "ex"});
        },updateSystemConfig:()=>{
            if(confirm([
                "この内容で更新してよろしいですか？",
                "※内容に誤りがあるとシステムが次回以降起動しない場合があります",
                "→その場合は、手動でGoogleDriveからsystemConfig.jsonを前の版（version）に戻してください"
            ].join("\n"))){
                _val.config.updateValues($("#formEditSystemConfig").find('[name="content"]').val()).then(()=>{
                    _val.pageFun.setting.loadSystemConfig();
                });
            }
        }
    };
});