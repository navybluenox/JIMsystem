"use strict";

//  ---About This---
/*
名前
    htmlService.js

依存ファイル
    include.js

このファイルについて
    Googleの提供しているHTMLServiceというWebアプリを作成するためのサービスで使用します
    主に、clinentサイドとserverサイドの橋渡しになる関数や、
    ページ遷移・セッション管理などのウェブアプリの基幹となる関数が入っています

定義一覧
    loadfun(funName,argument)
        説明
            クライアント側からGASで書かれたサーバー側の関数を呼び出す時に使用します
        引数
            funName
                関数の名前
            argument
                関数の引数
    */

function loadfun(funName, argument) {
    var fun;
    eval("fun = " + funName + ";");
    if (typeof argument == "undefined") {
        return JSON.stringify(fun.apply(this));
    } else {
        if (!Array.isArray(argument)) argument = [argument];
        return JSON.stringify(fun.apply(this, argument));
    }
}