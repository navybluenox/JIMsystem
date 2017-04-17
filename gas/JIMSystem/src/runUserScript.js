$(function(){
    var pageFun;
    var textarea;
    var scriptLibrary_editing;
    _val.pageFun.runUserScript = {
        onload:function(){
            pageFun = _val.pageFun.runUserScript;
            textarea = $('#formRunUserScript textarea[name="content"]');
            _val.server.loadDataAll().then(()=>{
                pageFun.setScriptLibraryList();
                $("#formScriptLibrary_list").on("click",'input[type="button"]',e=>{
                    var button = $(e.currentTarget);
                    var kind = button.attr("name");
                    var scriptLibrary = _val.server.getDataById(button.siblings('[name="id"]').val(),"scriptLibrary")[0];
                    switch(kind){
                        case "edit":
                            scriptLibrary_editing = scriptLibrary;
                            $('#formRunUserScript [name="edit"]').prop("disabled",false).val("変更を保存 [編集中:" + scriptLibrary.getValue("title") + "]");
                        case "put":
                            textarea.val(scriptLibrary.getValue("content"));
                            break;
                        case "remove":
                            _val.server.removeData(scriptLibrary).sendUpdateQueue();
                            scriptLibrary_editing = null;
                            $('#formRunUserScript [name="edit"]').prop("disabled",true).val("↓編集する文例を選択してください");
                            break;
                    }
                    pageFun.setScriptLibraryList();
                });
            });
            textarea.on("keydown",function(e){
                var target = $(e.currentTarget);
                var caretPosition = target[0].selectionStart;
                var text = target.val();
                var nowLine = (() => {
                    var position = caretPosition;
                    return text.split("\n").findIndex(str => {
                        var num = str.length + 1;
                        return (position = position - num) < 0;
                    });
                })();
                if(e.keyCode === 9){
                    //Tab
                    e.preventDefault();
                    const spaceNum = 4;
                    let diffNum;
                    text = (() => {
                        var arr = text.split("\n");
                        arr[nowLine] = (
                            e.shiftKey ?
                            arr[nowLine].replace(new RegExp("^" + repeatString(" ",diffNum = -Math.min(
                                arr[nowLine].replace(/^( *)[\s\S]*$/,"$1").length, spaceNum
                            ))),"") :
                            repeatString(" ",diffNum = spaceNum) + arr[nowLine]
                        );
                        return arr.join("\n");
                    })();
                    target.val(text);
                    target[0].selectionEnd = target[0].selectionStart = caretPosition + (e.shiftKey ? -Math.min(diffNum,caretPosition - target.val().split("\n").slice(0,nowLine).join("\n").length) : diffNum);

                }else if(e.keyCode === 13){
                    //Enter
                    if(e.ctrlKey){
                        pageFun.runScript();
                    }else{
                        e.preventDefault();
                        let num = text.split("\n")[nowLine].replace(/^( *)[\s\S]*$/,"$1").length;
                        let arr = text.split("");
                        arr.splice(caretPosition,0,"\n" + repeatString(" ",num));
                        text = arr.join("");
                        target.val(text);
                        target[0].selectionEnd = target[0].selectionStart = caretPosition + 1 + num;
                    }
                }else if(e.ctrlKey && e.keyCode === 83){
                    //[s]key
                    localStorage.setItem("userScript",textarea.val());
                    var el = $("<p>保存しました</p>").appendTo($("#formRunUserScript"));
                    setTimeout(function(){
                        el.remove();
                    },3000);
                    return false;
                }
            })
            var script = localStorage.getItem("userScript");
            if(script !== null){
                textarea.val(script);
            }

            var dr = new DelayRun(function(){
                localStorage.setItem("userScript",textarea.val());
            },200);
            textarea.on("change",function(){
                dr.runLater();
            })
        },runScript:function(){
            if(!checkAuthorization("_val.pageFun.runUserScript.runScript")) return;
            var form = $("#formRunUserScript");
            var content = textarea.val();
            var div = $("#formRunUserScript_div");
            var server = _val.server;
            div.children().remove();
            eval(content);
        },saveudf:() => {

        },setScriptLibraryList:function(){
            var scriptLibraries = _val.server.getData("scriptLibrary");
            var div = $("#formScriptLibrary_list");
            div.children().remove();
            var table = createTable(div,scriptLibraries,["title","editor","button","caption"],cellObj => {
                if(cellObj.column === "button"){
                    cellObj.el.append('<input type="button" name="put" value="入力" style="display:block;"><input type="button" name="edit" value="編集" style="display:block;"><input type="button" name="remove" value="削除" style="display:block;">');
                    $('<input type="hidden" name="id">').appendTo(cellObj.el).val(cellObj.rowData.getValue("_id"));
                }else{
                    cellObj.el.text(cellObj.rowData.getValue(cellObj.column));
                }
            },{"header":["名前","作成者","","説明"]}).el;
            table.find("td:eq(3)").css({"white-space":"pre-line","text-align":"left"});
        },changeScriptLibrary:function(){
            pageFun.scriptLibraryEditMenu("change",scriptLibrary_editing);
        },addScriptLibrary:function(){
            pageFun.scriptLibraryEditMenu("add",scriptLibrary_editing);
        },scriptLibraryEditMenu:function(kind,scriptLibrary){
            var mw = new ModalWindow({"html":[
                "<table><tbody>",
                '<tr><td>タイトル</td><td><input type="text" name="title"></td></tr>',
                '<tr><td>作成者</td><td><input type="text" name="editor"></td></tr>',
                '<tr><td>説明</td><td><textarea name="caption"></textarea></td></tr>',
                "</tbody></table>",
                '<input type="button" name="run" value="保存"><input type="button" name="cancel" value="キャンセル">'
            ].join(""),"callback":el => {
                if(scriptLibrary !== undefined){
                    ["title","editor","caption"].forEach(key => {
                        el.find('[name="' + key +'"]').val(scriptLibrary.getValue(key));
                    });
                }
                el.find('[type="text"],textarea').css({"width":"35em"});
                el.find('[name="run"]').on("click",e => {
                    _val.server[kind + "Data"](new ScriptLibrary({
                        "_id":(kind === "change" ? scriptLibrary.getValue("_id") : null),
                        "title":el.find('[name="title"]').val(),
                        "editor":el.find('[name="editor"]').val(),
                        "caption":el.find('[name="caption"]').val(),
                        "content":textarea.val()
                    })).sendUpdateQueue();
                    mw.remove();
                });
                el.find('[name="cancel"]').on("click",e => {
                    mw.remove();
                });
            }});
        }
    };
});