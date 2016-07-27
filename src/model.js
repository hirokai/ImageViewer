const electron = window.require('electron');
var remote = electron.remote;

var processTable = {};
var _ = require('lodash');
var assert = require('assert');
var fs = remote.require('fs');
var toml = require('toml');

export function mkParams(conds){
    return _.compact(_.map(conds,function(v,k){
        return (k == 'file') ? null : {name: k, col: v, fill: true};
    }));
}

processTable['microscope'] = function (tbl,conds,col_file) {
    var params = mkParams(conds);
    console.log(params);
    var hash = {};
    var skip_rows = 1;
    for (var i = skip_rows; i < tbl.length; i++) {
        var file_basename = getCell(tbl, i, col_file || conds['file'] || 'b');
        var obj = {};
        _.map(params, function (param) {
            var name = param.name;
            obj[name] = getCell(tbl, i, param.col, param.fill);
        });
        obj.basename = file_basename;
        if(file_basename){
            hash[file_basename.toLowerCase()] = obj;
        }
    }
    return hash;
};

var test_func = (x) => x*2;

processTable['video'] = processTable['microscope'];

processTable['video_1113'] = processTable['video'];

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

processTable['force'] = function (tbl) {
    var params = [{name: 'run', col: 'a'}, {name: 'adhesion', col: 'm'}, {name: 'angle', col: 'f'}];
    var hash = {};
    for (var i = 1; i < tbl.length; i++) {
        var file_basename = getCell(tbl, i, 'b');
        var obj = {};
        _.map(params, function (param) {
            var name = param.name;
            obj[name] = getCell(tbl, i, param.col, param.fill);
        });
        //obj.path = 'csv/force_vs_displacement/' + pad(obj.run, 2) + '.png';
        hash[file_basename] = obj;
    }
    return hash;
};

function getCell(tbl, row_index, column_pos, fill) {
    if (row_index < 0) {
        return undefined;
    }
    assert(/[a-zA-Z]/.test(column_pos));
    assert(column_pos.length == 1);
    var v = tbl[row_index][column_pos.toLowerCase().charCodeAt(0) - 'a'.toLowerCase().charCodeAt(0)];
    return v || (fill ? getCell(tbl, row_index - 1, column_pos, fill) : undefined)
}


var rootFolder = '/Users/hiroyuki/Google Drive/';
//var rootFolder = '/Volumes/MacintoshHD/Google Drive/';

function mk_path(obj, root) {
    _.map(obj,function(o){
        o.folder = root + o.folder;
    });
    return obj;
}

//var projectPresets = {};
// var projectPresets = mk_path(toml.parse(fs.readFileSync('presets.toml','utf8')), rootFolder);
let projectPresets;

function loadMetaData(folder) {
    var json_path = folder + '/metadata.json';
    try {
        var obj = JSON.parse(fs.readFileSync(json_path, 'utf8'));
        obj.col_file = obj.condition_kinds ? obj.condition_kinds.file : null;
        return obj;
    } catch (e) {
        return null;
    }
}

module.exports = {
    processTable: processTable,
    projectPresets: projectPresets,
    loadMetaData: loadMetaData
};
