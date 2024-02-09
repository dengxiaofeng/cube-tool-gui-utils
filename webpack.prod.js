module.exports = {
  mode: 'production',
  output: {
    filename: "tools.js",
    path: __dirname + '/lib',
    // library: "cube-tool-gui-utils",
    libraryTarget: "umd",
    globalObject: '"undefined"!=typeof self?self:this',
  },
  // externals: {
  //   lodash: 'lodash',
  // }
}
