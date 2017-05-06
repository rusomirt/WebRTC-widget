let NODE_ENV = process.env.NODE_ENV || 'development';

let webpack = require('webpack');
let path = require('path');

let BUILD_DIR = path.resolve(__dirname, 'public/build');
let APP_DIR = path.resolve(__dirname, 'src');

let config = {
    entry: {
        "webchatClient": APP_DIR + '/webchatClient.js',
        "webchatOpEmul": APP_DIR + '/webchatOpEmul.js'
    },
    output: {
        publicPath: 'build/',
        library: '[name]Create',
        path: BUILD_DIR,
        filename: '[name]Bundle.js'
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
                    'css?modules&importLoaders=1&localIdentName=[local]_[hash:base64:4]',
                    'sass?sourceMap'
                ],
                exclude: /node_modules/
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                loaders: [
                    'file?hash=sha512&digest=hex&name=[hash].[ext]',
                    'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
                ]
            },
            // For font-awesome using:
            // the url-loader uses DataUrls.
            // the file-loader emits files.
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "url-loader?limit=10000&mimetype=application/font-woff"
            },
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "file-loader"
            }
        ]
    },
    resolve: {
        root: [ path.resolve('./src')]
    },
    devtool: 'source-map'
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
