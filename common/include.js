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
    includeConfig変数
        GoogleDriveに保存されているスクリプトファイルで、ダウンロードするファイルを指定します
        引数なしで実行すると、予め指定されたファイルがincludeされます
            includeConfig.enable
                ダウンロードするファイルを追加します
                GoogleDriveのファイルIDの文字列で指定します
                    DriveFileIdクラスも使用可能
                ファイル名は拡張子まで記入すること
                省略可。省略した場合、デフォルトから追加しない
            includeConfig.disable
                ダウンロードするファイルをデフォルトから削除します
                省略可。省略した場合、デフォルトから削除しない
            includeConfig.disableDefault
                このファイルで設定されているデフォルトを無効にする
                    "driveFileId.js"は無効にされない
                省略可。省略した場合、無効にしない
            includeConfig.mode
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