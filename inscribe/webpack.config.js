const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  // Other webpack configuration options...
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true, // Speeds up compilation
          },
        },
      },
      // Add other loaders as needed (e.g., for CSS, images)
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'], // Ensure webpack resolves these extensions
    fallback: {
      path: require.resolve('path-browserify'),
      os: require.resolve('os-browserify/browser'),
      crypto: require.resolve('crypto-browserify'),
    },
  },
  externalsPresets: { node: true }, // Consider modules inside node_modules as external
  externals: [
    // Exclude node modules except for those which are required for webpack to bundle
    nodeExternals({
      allowlist: ['webpack/hot/poll?1000'],
    }),
  ],
  plugins: [
    new webpack.DefinePlugin({
      'process.env.REACT_APP_MY_ACCOUNT_ID': JSON.stringify(process.env.REACT_APP_MY_ACCOUNT_ID),
      'process.env.REACT_APP_MY_PRIVATE_KEY': JSON.stringify(process.env.REACT_APP_MY_PRIVATE_KEY),
    })
  ],
};
