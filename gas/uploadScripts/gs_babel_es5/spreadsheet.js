"use strict";

//  ---About This---
/*
名前
    spreadsheet.js
依存ファイル

このファイルについて
    スプレッドシートを編集するためのスクリプトです

定義一覧
    getRangeWithContents(sheet,row,column,rowNumber,columnName)
        説明
        引数
*/

//NEWWWWWW

function getRangeWithContents(sheet, row, column, rowNumber, columnName) {
    if (row == null) {
        row = 1;
    }
    if (column == null) {
        column = 1;
    }

    var allContents = sheet.getRange(row, column, sheet.getMaxRows(), sheet.getMaxColumns()).getValues();
    var toprow = allContents[0];
    var columns, rows;

    if (rowNumber != null) {
        columns = allContents[rowNumber];
    } else {
        columns = allContents[0];
    }
    if (columnName != null) {
        rows = allContents.map(function (a) {
            return a[toprow.indexOf(columnName)];
        });
    } else {
        rows = allContents.map(function (a) {
            return a[0];
        });
    }
    columns = columns.filter(function (v) {
        return !!v;
    });
    rows = rows.filter(function (v) {
        return !!v;
    });

    return sheet.getRange(row, column, rows.length, columns.length);
}

function setValuesInRange(setData, column, range) {
    //setData = [
    //    {columnA:dataA,columnB:dataB, ... ,columnZ:dataZ},
    //    {columnA:dataA',columnB:dataB', ... ,columnZ:dataZ'}, ...
    //];
    //column = [columnA,columnB, ... columnZ];
    //range = [Range Object];
    if (!Array.isArray(setData)) {
        Logger.log("Error : argument(setData) is not array");
        throw new Error();
    }
    if (!Array.isArray(column)) {
        Logger.log("Error : argument(setData) is not array");
        throw new Error();
    }
    if (range.getWidth() == 1 && range.getHeight() == 1) {
        range = range.getSheet().getRange(range.getRow(), range.getColumn(), setData.length, column.length);
    } else {
        if (column.length !== range.getWidth() || setData.length !== range.getHeight()) {
            Logger.log("Error : setData does not fit columnSize and setDataSize");
            throw new Error();
        }
    }
    var result = [];
    setData.forEach(function (row) {
        var piece = [];
        for (var i = 0; i < column.length; i++) {
            if (typeof row[column[i]] != "undefined") {
                piece[i] = row[column[i]];
            }
        }
        result.push(piece);
    });
    range.setValues(result);
    return range;
}

function clearValuesOfSheet(ss, sheet) {
    var sheetName = sheet.getName();
    ss.deleteSheet(sheet);
    return ss.insertSheet(sheetName);
}