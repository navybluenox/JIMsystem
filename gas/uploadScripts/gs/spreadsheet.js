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

function handleSpreadsheetInterface(funName,fileId,sheetName,argus){
    var func = ThisScript[funName];
    if(typeof func !== "function") return null;
    var spreadsheet = SpreadsheetApp.openById(fileId);
    var sheet = spreadsheet.getSheetByName(sheetName);
    return func.apply(null,[sheet].concat(argus));
}

function getRangeWithContents(sheet,rowStartIndex,columnStartIndex,maxHeight,rowIndexOfColumns,columnName){
    rowStartIndex = rowStartIndex || 0;
    columnStartIndex = columnStartIndex || 0;
    rowIndexOfColumns = rowIndexOfColumns || 0;
    
    var allContents = sheet.getRange(rowStartIndex+1,columnStartIndex+1,sheet.getMaxRows(),sheet.getMaxColumns()).getValues();
    var columnIndexForCheck = columnName ? allContents[0].indexOf(columnName) : 0;
    var rowsForCheck = allContents.map(function(row){return row[columnIndexForCheck]}).filter(function(v){return !!v});
    var columnsForCheck = allContents[rowIndexOfColumns].filter(function(cell){return !!cell});
    maxHeight = (maxHeight ? Math.min(maxHeight,rowsForCheck.length) : rowsForCheck.length);

    return sheet.getRange(rowStartIndex+1,columnStartIndex+1,maxHeight,columnsForCheck.length);
}


function getSheetValues(sheet,option){
    option = option || {};
    return getRangeWithContents(sheet,option.top,option.left,option.height).getValues();
}

function setSheetValues(sheet,content,option){
    option = option || {};
    option.top = option.top || 0;
    option.left = option.left || 0;

    var columnNum = content[Object.keys(content)[0]][0].length;
    var range = sheet.getRange(option.top + 1,option.left + 1,content[Object.keys(content)[0]].length,columnNum);

    Object.keys(content).sort(function(a,b){
        var arr = ["text","background","alignHori","alignVer","fontSize","fontColor","fontWeight"];
        return arr.indexOf(a) - arr.indexOf(b);
    }).forEach(function(setting){
        var values = content[setting];
        switch(setting){
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
            case "fontSize":
                range.setFontSizes(values);
                break;
            case "fontColor":
                range.setFontColors(values);
                break;
            case "fontWeight":
                range.setFontWeights(values);
                break;
        }
    });
    return range;
}

function setCellSize(sheet,settings){
    //setting = {"type":["height"/"width"],"index":[row/column index], "value":[height/width px]}
    settings.forEach(function(setting){
        if(setting.type === "height"){
            sheet.RowHeight(setting.index + 1,setting.value);
        }else if(setting.type === "width"){}
            sheet.setColumnWidth(setting.index + 1,setting.value);
    })
    return true;
}

function mergeCells(sheet,settings){
    settings.forEach(function(setting){
        var range = sheet.getRange(setting.range.top+1,setting.range.left+1,setting.range.height,setting.range.width);
        range.merge();
    });
    return true;
}

function setBorderCells(sheet,settings){
    var borderStyle = SpreadsheetApp.BorderStyle;

    settings.forEach(function(setting){
        var range = sheet.getRange(setting.range.top+1,setting.range.left+1,setting.range.height,setting.range.width);
        range.setBorder.apply(range,
            ["top","left","bottom","right","vertical","horizontal","color","style"].map(function(key){
                if(key === "style"){
                    if(setting.border[key] === undefined)  return null;
                    if(setting.border[key] === "dotted")  return borderStyle.DOTTED;
                    if(setting.border[key] === "dashed")  return borderStyle.DASHED;
                    if(setting.border[key] === "solid")  return borderStyle.SOLID;
                    return null;
                }else{
                    return (setting.border[key] === undefined ? null : setting.border[key]);
                }
            })
        );
    });
    return true;
}



function openSpreadSheet(sheet){
    var spreadsheet = sheet.getParent();
    SpreadsheetApp.setActiveSpreadsheet(spreadsheet);
    SpreadsheetApp.setActiveSheet(sheet);
    return {"fileId":fileId,"sheetName":sheet.getName()};
}

function refreshSheetCompletely(sheet){
    var spreadsheet = sheet.getParent();
    var sheetName = sheet.getName();
    var sheetIndex = sheet.getIndex();
    spreadsheet.deleteSheet(sheet);
    var newSheet = spreadsheet.insertSheet(sheetIndex);
    newSheet.setName(sheetName);
    return newSheet;
}

function clearSheet(sheet){
    sheet.clear();
    return true;
}
