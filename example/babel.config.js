const path = require('path')
const pak = require('../package.json')

// https://medium.com/call-stack/adding-an-example-app-to-your-react-native-library-d23b9741a19c
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          extensions: ['.tsx', '.ts', '.js', '.json'],
          alias: {
            [pak.name]: path.join(__dirname, '..', pak.source),
          },
        },
      ],
    ],
  }
}
