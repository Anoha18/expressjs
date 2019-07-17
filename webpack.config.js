const path = require("path");
const VueLoaderPlugin = require('vue-loader/lib/plugin.js');

module.exports = {
    entry: './public/js/app.js',
    output: {
        filename: 'build.js',
        path: path.join(__dirname, 'public/js/'),
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },

            {
                test: /\.js$/,
                use: {
                    loader: "babel-loader", 
                    options: {
                        presets: ["@babel/preset-env"]
                    }
                }
            },
        ]
    },
    plugins: [
        new VueLoaderPlugin()
    ]
}