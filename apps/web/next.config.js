const { withTamagui } = require("@tamagui/next-plugin");

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true
  },
  transpilePackages: ["tamagui"]
};

module.exports = withTamagui({
  config: "./tamagui.config.ts",
  components: ["tamagui"],
  logTimings: false,
  shouldExtract: process.env.NODE_ENV === "production",
  disableExtraction: process.env.NODE_ENV !== "production",
  outputCSS: process.env.NODE_ENV === "production" ? "./public/tamagui.css" : null
})(nextConfig);
