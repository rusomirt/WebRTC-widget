let NODE_ENV = process.env.NODE_ENV || 'development';

let webpack = require('webpack');
let path = require('path');

let BUILD_DIR = path.resolve(__dirname, 'public/build');
let APP_DIR = path.resolve(__dirname, 'src');

let config = {
    entry: APP_DIR + '/index.js',
    output: {
        publicPath: '/build/',
        path: BUILD_DIR,
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules)/,
                loader: 'babel-loader'
            },

            {
                test: /\.css$/,
                loader: 'style-loader'
            },
            {
                test: /\.css$/,
                loader: 'css-loader',
                query: {
                    modules: true,
                    localIdentName: '[name]__[local]___[hash:base64:5]'
                }
            },
            {
                test: /\.scss$/,
                loaders: [
                    'style?sourceMap',
                    'css?modules&importLoaders=1&localIdentName=[name]--[local]',
                    'sass?sourceMap'
                ],
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        root: [ path.resolve('./src')]
    }
};

if ( NODE_ENV == 'development' ) {
    config.watch = true;
    config.watchOptions = {
        aggregateTimeout: 1000
    };
    config.devServer = {
        host: '0.0.0.0',
        port: 8083,
        contentBase: path.resolve(__dirname, 'public')
    };
}

module.exports = config;
