// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add path alias support
config.resolver.alias = {
  ...config.resolver.alias,
  "@": path.resolve(__dirname, "./"),
};

// Add source extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, "mjs", "cjs"];

module.exports = config;
