const electron = window.require('electron');
var remote = electron.remote;

import $ from  'jquery';

var dialog = remote.dialog;
var fs = remote.require('fs');
var _ = require('lodash');
var parse = remote.require('csv-parse');
var assert = require('assert');
var exec = remote.require('child_process').exec;
var path = remote.require('path');
var d3 =  require('d3');
import React from 'react';
// var React = require('react');
var ReactDOM = require('react-dom');
var classNames = require('classnames');
var glob = remote.require("multi-glob").glob;
var request = remote.require('request');
var model = require('./model.js');
var processTable = model.processTable;
var projectPresets = model.projectPresets;
var loadMetaData = model.loadMetaData;

console.log(model);
// console.log(PS.Reader.exp20151111.reader([[]]));

function mkConditionStr(conditionFilter) {
    return _.map(conditionFilter, function (v, k) {
            return k + ' = ' + (v || 'any');
        }).join(', ') || '(Not specified)';
}

var Images = React.createClass({
    propTypes: {
        images: React.PropTypes.array,
        loaded: React.PropTypes.bool,
        tableData: React.PropTypes.object,
        keys: React.PropTypes.array,
        video: React.PropTypes.bool
    },
    renderImages() {
        var self = this;
        var key_group = findGroups(self.props.images, self.props.tableData, self.props.keys);
        var group = [<span>{key_group.name}: </span>].concat(_.map(key_group.colors, function (v, k) {
            return <span className='colors_list' style={{color: v}} key={k}>{k}</span>;
        }));
        //console.log(self.props.images,self.props.tableData);
        var imgs = _.map(self.props.images, function (image_path) {
            var basename = path.basename(image_path);
            if(!basename){
                return null;
            }else{
                var row = self.props.tableData[basename.toLowerCase()];
                var bcolor = row ? key_group.colors[row[key_group.name]] : 'black';
                if (self.props.video) {
                    return (
                        <div className='img_holder' key={image_path} style={{borderColor: bcolor}}>
                            <h5>{basename}</h5>
                            <video width="320" height="240" controls>
                                <source src={row.path || image_path} type="video/mp4"/>
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    );
                } else if (row) {
                    return (
                        <div className='img_holder' key={image_path} style={{borderColor: bcolor}}>
                            <h5>{basename}</h5>
                            <img src={row.path || image_path} className='thumb' key={image_path}
                                 onClick={self.onClickImage.bind(self, image_path)}/>
                        </div>
                    );
                } else {
                    console.log('row does not exist.');
                    return (
                        <div className='img_holder' key={image_path} style={{borderColor: bcolor}}>
                            <h5>No data</h5>
                        </div>
                    );
                }
            }
        });
        console.log(self.props.images.length, imgs.length);
        return group.concat([<br/>]).concat(imgs);
    },
    onClickImage(im) {
        var isWin = /^win/.test(process.platform);
        if (isWin) {
            exec('start "' + im + '"');
        } else {
            // if Mac
            //var cmd = 'osascript -e \'tell app "Finder" to reveal POSIX file "' + im + '"\'';
            //exec(cmd);
            exec('open "' + im + '"');
        }
    },
    render() {
        var self = this;
        return (
            <div>
                <h1>Images</h1>
                {!self.props.loaded ? <p>No image loaded.</p> : self.renderImages()
                }
            </div>
        );
    }
});

var Conditions = React.createClass({
    propTypes: {
        condition_kinds: React.PropTypes.object,
        tableData: React.PropTypes.object,
        conditionFilter: React.PropTypes.object
    },
    render() {
        const self = this;
        var condition_keys = self.props.condition_kinds;
        return (
            <div id='toolbar'>
                {_.compact(_.map(condition_keys, function (key) {
                    var conditions = collectConditions(key, self.props.tableData);
                    if (conditions.length > 0) {
                        return (
                            <div key={key} className='row'>
                                <span className='col-md-1 key-title'>{key}</span>
                                <div className='btn-group col-md-11' role='group' aria-label='...'>
                                    {_.map(conditions, function (cond, i) {
                                        return <button key={cond} className='btn btn-default'
                                                       onClick={self.setConditionFilter.bind(self, key, cond)}>{cond}</button>
                                    })}
                                    <button className='btn btn-default'
                                            onClick={self.setConditionFilter.bind(self, key, null)}>Clear
                                    </button>
                                </div>
                            </div>);

                    } else {
                        return null;
                    }
                }))}
                <pre>{mkConditionStr(self.props.conditionFilter)}</pre>
            </div>
        );
    },
    setConditionFilter(key, cond) {
        var f = _.extend(this.props.conditionFilter);
        f[key] = cond;
        this.props.setConditionFilter(f);
    }
});

var TopLevel = React.createClass({
    getInitialState() {
        return {
            read: {sheet: false, images: false},
            sheetUrl: null,
            folder: null,
            condition_kinds: [],
            conditionFilter: {},
            images: [],
            params: {},
            tableData: {},
            projectPreset: {},
            analysisPreset: 'microscope'
        };

    },
    onProjectPresetChange(ev) {
        var name = ev.target.value;
        this.doOpenFolder(projectPresets[name].folder);
    },
    render() {
        var self = this;
        var c1 = classNames(self.state.read.sheet ? 'okay' : 'ng');
        var c2 = classNames(self.state.read.images ? 'okay' : 'ng');
        return (
            <div className="row">
                <div className="col-md-12">
                    <div>
                        <select onChange={self.onProjectPresetChange}>
                            <option>--Select preset--</option>
                            {_.map(projectPresets, (preset, k)=> {
                                return <option value={k} key={k}> {k}</option>
                            })}
                        </select>
                    </div>
                    <div>
                        <span id='sheet-read'
                              className={c1}>{self.state.read.sheet ? 'Sheet ready' : 'Sheet not ready.'}</span>
                        <span id='images-read'
                              className={c2}>{self.state.read.images ? 'Images ready' : 'Images not ready.'}</span>
                    </div>
                    <div className="">
                        <button type="button" name="button" className='btn btn-primary' id='open_file'
                                onClick={self.onOpenFolder}>
                            Open image folder
                        </button>
                        <button type="button" name="button" className='btn btn-primary' id='open_sheet'
                                onClick={self.onReloadSheet}>
                            Reload Google Sheet
                        </button>
                        <pre id="folder_path">{self.state.folder || '(not selected)'}</pre>
                    </div>
                    <Conditions setConditionFilter={self.setConditionFilter}
                                condition_kinds={Object.keys(self.state.condition_kinds)}
                                tableData={self.state.tableData || {}}
                                conditionFilter={self.state.conditionFilter}/>
                    <Images images={self.filterImages()}
                            loaded={self.state.read.images && self.state.read.sheet}
                            tableData={self.state.tableData}
                            keys={Object.keys(self.state.condition_kinds)}
                            video={is_video_analysis(self.state.projectPreset.analysis)}
                    />
                </div>

            </div>


        );
    },
    setConditionFilter(f) {
        console.log(f);
        this.setState({conditionFilter: f});
    },
    filterImages() {
        var self = this;
        console.log(`${self.state.images.length} images total.`);
        //return self.state.images; //FIXME
        return _.filter(self.state.images, function (im) {
            return conditionMatch(im, self.state.conditionFilter, self.state.tableData);
        });
    },
    onOpenFolder() {
        var folders = dialog.showOpenDialog({properties: ['openDirectory']});
        this.doOpenFolder(folders[0]);
    },
    doOpenFolder(folder) {
        var self = this;
        var preset = loadMetaData(folder);
        if (!preset) {
            dialog.showMessageBox({message: "metadata.json does not exist or is invalid.", buttons: ['OK']});
        }
        function remove_file(obj) {
            _.map(obj, (v, k)=> {
                if (k == 'file') {
                    delete obj[k];
                }
            });
            return obj;
        }

        this.setState({
            projectPreset: preset,
            analysisPreset: preset.analysis,
            folder: preset.folder,
            sheetUrl: preset.sheet,
            condition_kinds: remove_file(preset.condition_kinds)
        });
        var m = preset.sheet.match(/docs\.google\.com\/spreadsheets\/d\/(.+?)\/.+?gid=(\d+)/);
        var key = m[1];
        var gid = m[2];
        readCsv(key, gid, function (output) {
            var tableData = processTable[preset.analysis](output, preset.condition_kinds, preset.col_file);
            console.log(preset,tableData);
            var cond = _.fromPairs(_.map(preset.condition_kinds, function (obj, name) {
                return [name, null];
            }));
            var read = _.extend(self.state.read);
            read.sheet = true;
            self.setState({read: read, csvRows: output, tableData: tableData, conditionFilter: cond});
        });

        var exts = _.map(preset.extensions || ['jpg', 'png'], function (ext) {
            return folder + '/**/*.' + ext;
        });
        glob(exts, function (err, images) {
            console.log('' + images.length + ' images loaded.');
            var read = _.extend(self.state.read);
            read.images = true;
            self.setState({folder: folder, read: read, images: images});
        });
    }
});


ReactDOM.render(
    <TopLevel/>,
    document.getElementById('react-container')
);

function readCsv(key, gid, callback) {
    var self = this;
    var url = 'https://docs.google.com/spreadsheets/d/' + key + '/export?gid=' + gid + '&format=csv';

    console.log('Requesting: ' + url);
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            parse(body, {comment: '#', relax_column_count: true}, function (err, output) {
                console.log('Obtained: ' + url);
                if (!output) {
                    console.log(err);
                    dialog.showMessageBox({
                        message: "Can't open the google sheet. Make sure URL is correct and shared with a link.",
                        buttons: ['OK']
                    })
                }
                callback(output);
            });
        } else {
            dialog.showMessageBox({
                message: "Can't open the google sheet. Make sure URL is correct and shared with a link.",
                buttons: ['OK']
            })
        }
    })
}

function colores_google(n) {
    var colores_g = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477",
        "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300",
        "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
    return colores_g[n % colores_g.length];
}

// Return key of maximum different entries;
function findGroups(images, tableData, keys) {
    var key_count = [];
    _.map(keys, function (k) {
        var vs = [];
        _.map(images, function (im) {
            var name = path.basename(im).toLowerCase();
            var row = tableData[name];
            if (row) {
                vs.push(row[k]);
            }
        });
        vs = _.uniq(vs);
        key_count.push({name: k, keys: vs, count: vs.length});
    });
    if (key_count.length == 0) {
        return null;
    } else {
        var d = _.max(key_count, function (d) {
            return d.count;
        });
        d.colors = {};
        _.map(d.keys, function (k, i) {
            d.colors[k] = colores_google(i);
        });
        return d;
    }
}

function collectConditions(key, tableData) {
    return _.uniq(_.map(tableData, function (v, k) {
        return v[key];
    }));
}

function all_true(xs, pred) {
    for (var i = 0; i < xs.length; i++) {
        if (!pred(xs[i])) {
            return false;
        }
    }
    return true;
}

function find_first(xs, pred) {
    for (var i = 0; i < xs.length; i++) {
        if (pred(xs[i])) {
            return xs[i];
        }
    }
    return undefined;
}

// Filter images based on conditions.
function conditionMatch(path, cond, tableData) {
    var names = Object.keys(tableData || {});
    //console.log(names);
    var thisname = find_first(names, function (name) {
        //console.log(name,path);
        return path.toLowerCase().indexOf(name) != -1;
    });
    //console.log(thisname);
    if (thisname) {
        var ks = Object.keys(cond);
        return all_true(ks, (k) => {
            return !(cond[k] && tableData[thisname][k] != cond[k]);
        });
    } else {
        return false;
    }
}

function is_video_analysis(a) {
    return a && a.indexOf('video') != -1;
}