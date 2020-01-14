const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
	mode: 'development',
	entry: {
		master: './src/master.js',
		slave: './src/slave.js'
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: "[name].js"
	},
	// devtool: 'inline-source-map',
	devServer: {
		contentBase: path.join(__dirname, 'dist'),
		port: 9000,
		disableHostCheck: true
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader']
			},
			{
				test: /\.js$/,
				exclude: [
					/node_modules/,
					path.resolve(__dirname, "../dist/box/master/index.js"),
					path.resolve(__dirname, "../dist/box/slaves/index.js")
				],
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['env', 'stage-2'],
					}
				}
			}
		]
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './master.html',
			filename: './index.html',
			inject: false
		}),
		new HtmlWebpackPlugin({
			template: './slave.html',
			filename: './slave.html',
			inject: false
		}),
		new CopyWebpackPlugin([
			{from: 'src/helloworld', to: 'helloworld', force: true}
		])
	]
};
