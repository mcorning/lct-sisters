module.exports = {
  lintOnSave: process.env.NODE_ENV !== 'production',

  pwa: {
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: './src/sw.js',
      swDest: 'service-worker.js',
    },
    name: 'LCT-C',
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
