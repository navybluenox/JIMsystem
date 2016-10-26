"use strict";

//  ---About This---
/*
名前
    spreadsheet.js
依存ファイル

このファイルについて
    スプレッドシートを編集するためのスクリプトです

定義一覧
    getRangeWithContents(sheet,row,column,rowForCheckColumn,columnName)
        説明
        引数
*/

function getRangeWithContents(sheet, rowStartIndex, columnStartIndex, maxHeight, rowIndexOfColumns, columnName) {
    rowStartIndex = rowStartIndex || 0;
    columnStartIndex = columnStartIndex || 0;
    rowIndexOfColumns = rowIndexOfColumns || 0;

    var allContents = sheet.getRange(rowStartIndex + 1, columnStartIndex + 1, sheet.getMaxRows(), sheet.getMaxColumns()).getValues();
    var columnIndexForCheck = columnName ? allContents[0].indexOf(columnName) : 0;
    var rowsForCheck = allContents.map(function (row) {
        return row[columnIndexForCheck];
    }).filter(function (v) {
        return !!v;
    });
    var columnsForCheck = allContents[rowIndexOfColumns].filter(function (cell) {
        return !!cell;
    });
    maxHeight = maxHeight ? Math.min(maxHeight, rowsForCheck.length) : rowsForCheck.length;

    return sheet.getRange(rowStartIndex, columnStartIndex, maxHeight, columnsForCheck.length);
}

function getSheetValues(sheet, option) {
    option = option || {};
    return getRangeWithContents(sheet, option.top, option.left, option.height).getValues();
}

function setSheetValues(sheet, content, option) {
    option = option || {};
    option.top = option.top || 0;
    option.left = option.left || 0;

    var columnNum = content[Object.keys(content)[0]][0].length;
    var range = sheet.getRange(option.top + 1, option.left + 1, content[Object.keys(content)[0]].length, columnNum);

    if (option.rowHeight) {
        sheet.setRowHeight(option.rowHeight.index, option.rowHeight.value);
    }
    if (option.columnWidth) {
        sheet.setColumnWidth(option.columnWidth.index, option.columnWidth.value);
    }
    Object.keys(content).forEach(function (setting) {
        if (setting === "border") {
            //これだけは一気に設定できなくてどうしようもない
            return;
        }
        var values = content[setting];
        switch (setting) {
            case "text":
                range.setValues(values);
                break;
            case "background":
                range.setBackgrounds(values);
                break;
            case "alignHori":
                range.setHorizontalAlignments(values);
                break;
            case "alignVer":
                range.setVerticalAlignments(values);
                break;
            case "fontColor":
                range.setFontColors(values);
                break;
            case "fontWeight":
                range.setFontWeights(values);
                break;
        }
    });
    if (content.border !== undefined) {
        content.border.forEach(function (row, rowIndex) {
            row.forEach(function (cell, cellIndex) {
                var r = range.getCell(rowIndex + 1, cellIndex + 1);
                Range.prototype.setBorder.apply(r, ["top", "left", "bottom", "right", "vertical", "horizontal", "color", "style"].map(function (key) {
                    return cell[key] ? cell[key] : null;
                }));
            });
        });
    }

    return range;
}

function mergeCells(fileId, sheetName, settings) {
    var spreadsheet = SpreadsheetApp.openById(fileId);
    var sheet = spreadsheet.getSheetByName(sheetName);

    settings.forEach(function (setting) {
        var range = sheet.getRange(setting.top + 1, setting.left + 1, setting.width, setting, height);
        range.merge();
    });
}

function readSheetValuesFromClient(fileId, sheetName, option) {
    var spreadsheet = SpreadsheetApp.openById(fileId);
    var sheet = spreadsheet.getSheetByName(sheetName);

    return getSheetValues(sheet, option);
}

function writeSheetValuesFromClient(fileId, sheetName, contents, option) {
    var spreadsheet = SpreadsheetApp.openById(fileId);
    var sheet = spreadsheet.getSheetByName(sheetName);

    setSheetValues(sheet, contents, option);
    openSpreadSheet(fileId, sheetName);

    return { "fileId": fileId, "sheetName": sheet.getName() };
}

function openSpreadSheet(fileId, sheetName) {
    var spreadsheet = SpreadsheetApp.openById(fileId);
    var sheet;
    if (sheetName === undefined) {
        sheet = spreadsheet.getSheets[0];
    } else {
        sheet = spreadsheet.getSheetByName(sheetName);
    }
    SpreadsheetApp.setActiveSpreadsheet(spreadsheet);
    SpreadsheetApp.setActiveSheet(sheet);
    return { "fileId": fileId, "sheetName": sheet.getName() };
}

function refreshSheetCompletely(sheet) {
    var spreadsheet = sheet.getParent();
    var sheetName = sheet.getName();
    var sheetIndex = sheet.getIndex();
    spreadsheet.deleteSheet(sheet);
    var newSheet = spreadsheet.insertSheet(sheetIndex);
    newSheet.setName(sheetName);
    return newSheet;
}

function clearSheetFromClient(fileId, sheetName) {
    SpreadsheetApp.openById(fileId).getSheetByName(sheetName).clear();
    return null;
}