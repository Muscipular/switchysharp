/*
 Copyright (c) 2011 Shyc2001 (http://twitter.com/shyc2001)
 This work is based on:
 *"Switchy! Chrome Proxy Manager and Switcher" (by Mohammad Hejazi (mohammadhi at gmail d0t com))
 *"SwitchyPlus" by @ayanamist (http://twitter.com/ayanamist)

 This file is part of SwitchySharp.
 SwitchySharp is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 SwitchySharp is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with SwitchySharp.  If not, see <http://www.gnu.org/licenses/>.
 */
var Settings = {};

Settings.configCache = {};

Settings.setValue = function setValue(key, value) {
    Settings.configCache[key] = value;

    var config = {};
    if (localStorage.config)
        config = JSON.parse(localStorage.config);

    config[key] = value;
    localStorage.lastModify = Date.now();
    localStorage.config = JSON.stringify(config);
    return value;
};

Settings.getValue = function getValue(key, defaultValue) {
    if (typeof Settings.configCache[key] != "undefined")
        return Settings.configCache[key];

    if (!localStorage.config)
        return defaultValue;

    var config = JSON.parse(localStorage.config);
    if (typeof config[key] == "undefined")
        return defaultValue;

    Settings.configCache[key] = config[key];
    return config[key];
};

Settings.keyExists = function keyExists(key) {
    if (!localStorage.config)
        return false;

    var config = JSON.parse(localStorage.config);
    return (config[key] != undefined);
};

Settings.setObject = function setObject(key, object) {
    localStorage[key] = JSON.stringify(object);
    localStorage.lastModify = Date.now();
    return object;
};

Settings.getObject = function getObject(key) {
    if (localStorage[key] == undefined)
        return undefined;

    return JSON.parse(localStorage[key]);
};

Settings.refreshCache = function refreshCache() {
    Settings.configCache = {};
};


!function (Settings) {
    var sync = chrome.storage.sync;

    var compute = function (syncOne, cb) {
        var localOne = localStorage;
        var lastModify = localOne.lastModify;
        if (!lastModify) {
            localOne.lastModify = lastModify = Date.now();
        }
        if (lastModify < syncOne.lastModify || 0) {
            Settings.refreshCache();
            localOne.clear();
            Object.getOwnPropertyNames(syncOne).forEach(function (f) {
                localOne[f] = syncOne[f];
            });
        } else if (lastModify > syncOne.lastModify || 0) {
            var syncObj = {};
            Object.getOwnPropertyNames(localOne).forEach(function (f) {
                syncObj[f] = localOne[f];
            });
            sync.clear(function () {
                var lastError = chrome.runtime.lastError;
                if (!lastError) {
                    sync.set(syncObj, cb);
                } else {
                    console.error(lastError);
                    cb();
                }
            });
        }
    };

    !function SyncLoop() {
        sync.getValue(null, function (storage) {
            var lastError = chrome.runtime.lastError;
            if (storage && !lastError) {
                compute(storage, function () {
                    setTimeout(SyncLoop, 60000);
                });
            } else {
                console.error(lastError);
                setTimeout(SyncLoop, 60000);
            }
        });
    }();
}(Settings);