/** @type {import('next').NextConfig} */
const webpack = require("webpack");

const nextConfig = {
  webpack: (config) => {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^@react-native-async-storage\/async-storage$/,
        require.resolve("./src/lib/asyncStorageMock.js")
      )
    );
    return config;
  },
};

module.exports = nextConfig;
