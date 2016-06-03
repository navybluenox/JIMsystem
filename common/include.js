//  ---About This---
/*
名前
    include.js

このファイルについて
    GAS側でよく使用される関数を、他のファイルから取得するのをまとめています
    include関数の引数を設定すると、個別にincludeする関数を設定できます

定義一覧
    include([configObj,mode])
        googleDriveに保存されているスクリプトファイルから必要な関数をダウンロードします
        引数なしで実行すると、予め指定されたファイルがincludeされます
        引数
            configObj
                = {
                    enable:[scriptFileName1,scriptFileName2, ... ],
                    disable:[scriptFileName1,scriptFileName2, ... ],
                    disableDefault:(Boolean)
                }
                includeする関数を個別に指定できます
                scriptFileNameには、DriveFileIdクラスを使用します
                disableDefaultをtrueにすると、予めinclude関数にあるプリセットを無視します。デフォルトはfalse
            mode
                = modeName:(String)
                ダウンロード先を選択できます
                //未実装

*/
