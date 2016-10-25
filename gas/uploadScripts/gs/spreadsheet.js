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


function getRangeWithContents(sheet,rowStartIndex,columnStartIndex,rowIndexOfColumns,columnName){
    rowStartIndex = rowStartIndex || 0;
    columnStartIndex = columnStartIndex || 0;
    rowIndexOfColumns = rowIndexOfColumns || 0;
    
    var allContents = sheet.getRange(rowStartIndex,columnStartIndex,sheet.getMaxRows(),sheet.getMaxColumns()).getValues();
    var columnIndexForCheck = columnName ? allContents[0].indexOf(columnName) : 0;
    var rowsForCheck = allContents.map(function(row){return row[columnIndexForCheck]}).filter(function(v){return !!v});
    var columnsForCheck = allContents[rowIndexOfColumns].filter(function(cell){return !!cell});

    return sheet.getRange(rowStartIndex,columnStartIndex,rowsForCheck.length,columnsForCheck.length);
}


function getSheetValues(sheet,option){
    option = option || {};
    return getRangeWithContents(sheet,option.top,option.left).getValues();
}

function setSheetValues(sheet,content,option){
    option = option || {};
    option.top = option.top || 0;
    option.left = option.left || 0;

    var columnNum;
    Object.keys(content).find(function(key){
        columnNum = content[key][0].length;
        return true;
    });
    var range = sheet.getRange(option.top + 1,option.left + 1,content.length,columnNum);

    if(option.rowHeight){
        sheet.setRowHeight(option.rowHeight.index,option.rowHeight.value);
    }
    if(option.columnWidth){
        sheet.setColumnWidth(option.columnWidth.index,option.columnWidth.value);
    }
    Object.keys(content).forEach(function(setting){
        if(setting === "border"){
            //これだけは一気に設定できなくてどうしようもない
            return;
        }
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
            case "fontColor":
                range.setFontColors(values);
                break;
            case "fontWeight":
                range.setFontWeights(values);
                break;
        }
    });
    if(content.border !== undefined){
        content.border.forEach(function(row,rowIndex){
            row.forEach(function(cell,cellIndex){
                var r = range.getCell(rowIndex+1, cellIndex+1);
                    Range.prototype.setBorder.apply(r,
                        ["top","left","bottom","right","vertical","horizontal","color","style"].map(function(key){return cell[key] ? cell[key] : null})
                    );
            });
        });
    }

    return range;
}

/*function _setSheetValues(sheet,values,option){
    if(!Array.isArray(values) || !Array.isArray(values[0])){
        Logger.log("Error : values is not double array (Script.setSheetValues)");
        throw new Error();
    }
    option = option || {};
    option.top = option.top || 0;
    option.left = option.left || 0;
    option.textOnly = (option.textOnly === undefined ? true : option.textOnly);

    var columnNum = values[0].length;
    var rangeAll = sheet.getRange(option.top + 1,option.left + 1,values.length,columnNum);
    var range = rangeAll.getCell(1,1);

    if(option.rowHeight){
        sheet.setRowHeight(option.rowHeight.index,option.rowHeight.value);
    }
    if(option.columnWidth){
        sheet.setColumnWidth(option.columnWidth.index,option.columnWidth.value);
    }
    if(option.textOnly){
        rangeAll.setValues(values);
    }else{
        values.forEach(function(row,rowIndex){
            row.forEach(function(_cell,cellIndex){
                var cell = (_cell && typeof _cell === "object" ? _cell : {"value":_cell});
                if(cell.merge){
                    cell.merge.colSpan = cell.merge.colSpan || 1;
                    cell.merge.rowSpan = cell.merge.rowSpan || 1;
                    if(cell.merge.rowSpan !== 1 || cell.merge.colSpan !== 1){
                        range = range.offset(0,0,cell.merge.rowSpan,cell.merge.colSpan).merge();
                    }
                }
                Object.keys(cell).forEach(function(key){
                    var value = cell[key];
                    switch(key){
                        case "value":
                            range.setValue(value);
                            return;
                        case "background":
                            range.setBackground(value);
                            return;
                        case "border":
                            Range.prototype.setBorder.apply(range,
                                ["top","left","bottom","right","vertical","horizontal","color","style"].map(function(key){return value[key] ? value[key] : null})
                            );
                            return;
                        case "alignHori":
                            range.setHorizontalAlignment(value);
                            return;
                        case "alignVer":
                            range.setVerticalAlignment(value);
                            return;
                        case "fontColor":
                            range.setFontColor(value);
                            return;
                        case "fontSize":
                            range.setFontSize(value);
                            return;
                        case "fontWeight":
                            range.setFontWeight(value);
                            return;
                    }
                })
                do{
                    range = range.offset(0,1);
                }while(range.isPartOfMerge())
            });
            range = range.offset(1,-columnNum);
        });
    }
    return rangeAll;
}*/

function readSheetValuesFromClient(fileId,sheetName){
    var spreadsheet = SpreadsheetApp.openById(fileId);
    var sheet = spreadsheet.getSheetByName(sheetName);

    return getRangeWithContents(sheet)
}

function writeSheetValuesFromClient(fileId,sheetName,contents,option){
    var spreadsheet = SpreadsheetApp.openById(fileId);
    var sheet = spreadsheet.getSheetByName(sheetName);

    setSheetValues(sheet,contents,option);
    openSpreadSheet(fileId,sheetName);

    return {"fileId":fileId,"sheetName":sheet.getName()};
}

/*function _writeSheetValuesFromClient(fileId,sheetName,contents,startRowIndex,textOnly){
    var spreadsheet = SpreadsheetApp.openById(fileId);
    var sheet = spreadsheet.getSheetByName(sheetName);

    setSheetValues(sheet,contents,{"top":startRowIndex,"textOnly":textOnly});
    openSpreadSheet(fileId,sheetName);

    return {"fileId":fileId,"sheetName":sheet.getName()};
}*/

function openSpreadSheet(fileId,sheetName){
    var spreadsheet = SpreadsheetApp.openById(fileId);
    var sheet;
    if(sheetName === undefined){
        sheet = spreadsheet.getSheets[0];
    }else{
        sheet = spreadsheet.getSheetByName(sheetName);
    }
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

function clearSheetFromClient(fileId,sheetName){
    SpreadsheetApp.openById(fileId).getSheetByName(sheetName).clear();
    return null;
}
