//  ---About This---
/*
名前
    include.js

依存ファイル
    driveFileId.js

このファイルについて
    GAS側でよく使用される関数を、他のファイルから取得するのをまとめています
    include関数の引数を設定すると、個別にincludeする関数を設定できます

定義一覧
    config変数
        JIMシステムで用いる様々な設定を格納している変数です
    config.whichSide変数
        スクリプトが動作しているのが、クライアント側なのかサーバー側なのかについての設定です
            client
                クライアントJavascriptモード
            server
                サーバーJavascriptモード（GAS）
        省略可。省略した場合、window.console.log関数を実行して決めます（失敗したらserver-side）
    config.include変数
        GoogleDriveに保存されているスクリプトファイルで、ダウンロードするファイルを指定します
        この変数は、include.jsの手前で初期化する必要がある
        引数なしで実行すると、予め指定されたファイルがincludeされます
            config.include.enable
                ダウンロードするファイルを追加します
                GoogleDriveのファイルIDの文字列で指定します
                    DriveFileIdクラスも使用可能
                    複数設定する場合は、配列で指定
                ファイル名は拡張子まで記入すること
                省略可。省略した場合、デフォルトから追加しない
            config.include.disable
                ダウンロードするファイルをデフォルトから削除します
                省略可。省略した場合、デフォルトから削除しない
            config.include.disableDefault
                このファイルで設定されているデフォルトを無効にする
                    "driveFileId.js"は無効にされない
                省略可。省略した場合、無効にしない
            config.include.downloadFrom
                ダウンロード先を選択できます
                //未実装

    loadFileFromDrive(fileIdStr,charEnc)
        説明
            GoogleDriveからテキストファイルをダウンロードして、文字列として返します
        引数
            fileIdStr
                GoogleDriveのファイルID（ファイルを開いた時に、URLに記載されている一部のランダムな文字列のこと）
                String型で記入
            charEnc
                テキストファイルの文字コード
                省略可。省略した場合、UTF-8となる
*/

function loadFileFromDrive(fileIdStr,charEnc){
    if(charEnc == null)  charEnc = "UTF-8";
    return DriveApp.getFileById(fileIdStr).getBlob().getDataAsString(charEnc);
}

//configを設定
try{
    config;
}catch(e){
    config = {};
}

if(config.whichSide == null){
    try{
        console.log("All the scripts work as client-side");
        config.whichSide = "client";
    }catch(e){
        Logger.log("All the scripts work as server-side")
        config.whichSide = "server";
    }
}

//処理本体
//IF文でローカルスコープ生成を防いでいる

//driveFileId.jsのファイルIDのみ直書きが必要
eval(loadFileFromDrive("##fileId of driveFileId.js##"));

if(config.include == null)  config.include = {};

if(!config.include.disableDefault){
    if(config.include.disable == null)  config.include.disable = [];
    //デフォルトでロードするファイル
    if(config.whichSide == "client"){
        
    }else if(config.whichSide == "server"){
        
    }
}

if(config.include.enable){
    if(typeof config.include.enable == "string")  config.include.enable = [config.include.enable];
    for(var i=0,l=config.include.enable.length; i<l; i++)
    {
        eval(loadFileFromDrive(config.include.enable[i]));
    }
}
