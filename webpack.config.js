const path = require('path');

module.exports = {
  entry: './example/index.js',

  output: {
    path: path.resolve(__dirname, 'example'),
    filename: "bundle.js",
  },

  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
    }
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        use: {
          loader: "vue-loader"
        }
      }
    ]
  },

  devtool: 'cheap-module-eval-source-map'
};