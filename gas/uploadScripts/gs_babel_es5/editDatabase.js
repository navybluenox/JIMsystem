"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var database;

function onOpen() {
    database = new Datebase();
    database.loadDataAll();
}

function loadDatabase(dataName) {
    var sheet = ss.getSheetByName(dataName);
    var data = database.getData(dataName);
    var columns = database.getColumn(dataName);
    sheet = clearValuesOfSheet(ss, sheet);
    setValuesInRange([columns.map(function (v) {
        return v.name;
    }), columns.map(function (v) {
        return v.type;
    })], columns.map(function (v) {
        return v.name;
    }), sheet.getRange(1, 1));
    setValuesInRange(data, columns.map(function (v) {
        return v.name;
    }), sheet.getRange(3, 1));
}

function updateDatabase(value) {
    var database = loadDataFromDrive(value.fileId);

    value.queue.forEach(function (queue) {
        var dpIndex;
        switch (queue.kind) {
            case "add":
                database.data.push(queue.value);
                break;
            case "change":
                database.data.forEach(function (datapiece, i) {
                    if (dpIndex !== undefined) return;
                    if (datapiece._id === queue.value._id) {
                        dpIndex = i;
                    }
                });
                //dpIndex = database.data.findIndex(function(datapiece){return datapiece._id === queue.value._id});
                fun = function (_fun) {
                    function fun(_x, _x2) {
                        return _fun.apply(this, arguments);
                    }

                    fun.toString = function () {
                        return _fun.toString();
                    };

                    return fun;
                }(function (dp_queue, dp_data) {
                    if (Array.isArray(dp_queue)) {
                        if (dp_queue.length === 0) {
                            return dp_queue;
                        } else {
                            dp_data = dp_queue.map(function (v, i) {
                                if (v === undefined) return;
                                if (dp_data === undefined) dp_data = [];
                                return fun(dp_queue[i], dp_data[i]);
                            });
                        }
                        return dp_data;
                    } else if ((typeof dp_queue === "undefined" ? "undefined" : _typeof(dp_queue)) === "object") {
                        Object.keys(dp_queue).forEach(function (key) {
                            if (dp_queue[key] === undefined) return;
                            if (dp_data === undefined) dp_data = {};
                            dp_data[key] = fun(dp_queue[key], dp_data[key]);
                        });
                        return dp_data;
                    } else {
                        if (dp_queue === undefined) {
                            return dp_data;
                        } else {
                            return dp_queue;
                        }
                    }
                });
                database.data[dpIndex] = fun(queue.value, database.data[dpIndex]);
                break;
            case "remove":
                database.data.forEach(function (datapiece, i) {
                    if (dpIndex !== undefined) return;
                    if (datapiece._id === queue.value._id) {
                        dpIndex = i;
                    }
                });
                //dpIndex = database.data.findIndex(function(datapiece){return datapiece._id === queue.value._id});
                database.data.splice(dpIndex, 1);
                break;
        }
    });
    database.updated = new Date(value.updated);
    database.version = +database.version + 1;

    updateFileToDrive(value.fileId, JSON.stringify(database, null, 2));
    var property = {};
    property["updated_" + value.modeName] = new Date(value.updated).toISOString();
    handlePropertiesService(property, "script", "set");
}

function loadAllDatabase() {
    Database.getDatabaseInfo().map(function (info) {
        return info.dataName;
    }).filter(function (dataName) {
        return !["workDetail"].inArray(dataName);
    }).forEach(function (dataName) {
        loadDatabase(dataName);
    });
}