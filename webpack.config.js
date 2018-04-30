'use strict';

const path = require('path')

module.exports =  {
	entry: [
		'./src/index.js'
	],
  output : {
    path : path.join(__dirname, 'dist/assets'),
    filename : 'app.js',
    publicPath : '/assets/'
  },
  devServer : {
    contentBase : './dist',
		inline: true,
		publicPath: '/assets'
  },
	devtool: 'source-map',

	module: {
		rules: [
			// Pass all Javascript through ESLint, then Babel
			{
				test: /\.(js|jsx)$/,
				enforce: 'pre',
				exclude: /node_modules/,
				use: ['eslint-loader']
			}, {
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: ['babel-loader']
			},

			// PostCSS loader
			{
				test: /\.css$/,
				use: [
					{ loader: 'style-loader' },
//					{ loader: 'css-loader' },
					{
						loader: 'postcss-loader',
						options: {
							plugins: function () {
								return [require('autoprefixer')({browsers: ['last 2 versions', 'ie >=8']})];
							}
						}
					}
				]
			}
		]
	},
	resolve: {
		// Don't require specifying ".js" on imports
		extensions: ['*', '.js', '.jsx'],

		// Import src/ paths to the top-level pseudo-directory
		modules: [__dirname, 'node_modules'],
		alias: {
			components: 'src/components',
			styles: 'src/styles'
		}
	},
}

console.log(module.exports.resolve);
