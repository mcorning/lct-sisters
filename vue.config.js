const path = require('path');

module.exports = {
  lintOnSave: process.env.NODE_ENV !== 'production',
  transpileDependencies: ['vuetify'],

  // so we can see the sourtce code after opening the webpacked file in the browser
  configureWebpack: {
    devtool: 'source-map',
  },
  outputDir: path.resolve(__dirname, './dist'),

  pwa: {
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: './src/sw.js',
      swDest: 'service-worker.js',
    },
    name: 'LCT',
    short_name: 'LCT',
    themeColor: '#673AB7',
    msTileColor: '#673AB7',
    appleMobileWebAppCache: 'yes',
    manifestOptions: {
      background_color: '#673AB7',
    },
    start_url: '/',
    icons: [
      {
        src: '/public/img/icons/lct-sisters-icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/public/img/icons/lct-sisters-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
};
