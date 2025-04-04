module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/Inspiration-Provider/'
    : '/',
  // 如果需要，可以在这里添加其他配置
  outputDir: 'dist',
  assetsDir: '',
  productionSourceMap: false
}; 