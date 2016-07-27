import 'babel-polyfill';
import path from 'path';
import webpack from 'webpack';

const DEBUG = !process.argv.includes('--release');
const VERBOSE = process.argv.includes('--verbose');
const ExternalsPlugin = webpack.ExternalsPlugin

export default {
    cache: DEBUG,

    debug: DEBUG,

    stats: {
        colors: true,
        reasons: DEBUG,
        hash: VERBOSE,
        version: VERBOSE,
        timings: true,
        chunks: VERBOSE,
        chunkModules: VERBOSE,
        cached: VERBOSE,
        cachedAssets: VERBOSE,
    },

    entry: {main: './src/main.js', index: './src/index.jsx'},


    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
    },

    target: 'web',

    // devtool: DEBUG ? 'cheap-module-eval-source-map' : false,

    plugins: [
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.DefinePlugin({ 'process.env.NODE_ENV': `"${process.env.NODE_ENV || (DEBUG ? 'development' : 'production')}"` }),
        ...(DEBUG ? [] : [
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.UglifyJsPlugin({ compress: { screw_ie8: true, warnings: VERBOSE } }),
            new webpack.optimize.AggressiveMergingPlugin(),
        ]),
        new ExternalsPlugin('commonjs', [
            'app',
            'auto-updater',
            'browser-window',
            'content-tracing',
            'dialog',
            'global-shortcut',
            'jquery',
            'ipc',
            'menu',
            'menu-item',
            'power-monitor',
            'protocol',
            'tray',
            'react',
            'electron',
            'remote',
            'web-frame',
            'clipboard',
            'crash-reporter',
            'screen',
            'shell'
        ]),
    ],

    resolve: {
        extensions: ['', '.js', '.jsx'],
    },

    module: {
        loaders: [
            { test: /\.jsx?$/, include: [path.resolve(__dirname, 'src')], loader: 'babel' },
        ],
    },
};