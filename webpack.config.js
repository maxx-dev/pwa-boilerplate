const packageJSON = require("./package.json");
process.env.ENV_PATH = packageJSON.env.envPath;
const helper = require(process.env.ENV_PATH);
process.env = helper.getEnv(packageJSON.env.env);
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const fs = require("fs");
const path = require("path");
//const swVersion = require('./webpack/helper/sw.js');
process.env.ENV.BUILD_TIME = new Date();
process.env.VERSION = packageJSON.version;
console.log('ENV',process.env.ENV,'BUILD_TIME',process.env.BUILD_TIME);
let host;
// Note: For testing with tunnel disable https, set host to 0.0.0.0 and port to 5000^
//host = 'localhost';
host = '0.0.0.0';
//swVersion('./public/sw.js',packageJSON.version);
module.exports = {
    mode:'development',
    entry: {
        index: path.resolve(__dirname, "src", "main.js")
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.scss$/,
                use: ["style-loader", "css-loader", "sass-loader"]
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                loader: "file-loader?name=/public/assets/icons/[name].[ext]"
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src", "index.html")
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            'process.env.ENV': JSON.stringify(process.env.ENV),
        })
    ],
    output: {
        filename: 'main.js',
        chunkFilename: '[name].bundle.js',
    },
    resolve : {
        alias : {
            "react": "preact/compat",
            "react-dom": "preact/compat",
        }
    },
    devServer: {
        contentBase:'public', // enables to serve manifest.json and sw.js correctly
        historyApiFallback: true,
        disableHostCheck:true,
        hot: true,
        inline: true,
        //https: true,
        host:host,
        before: function(app, server)
        {
            app.post('/webhook', function(req, res)
            {
                console.log(new Date(),'webhook');
                res.json({success:1})
            });
        }
    },
};