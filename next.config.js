/** @type {import('next').NextConfig} */
module.exports = (nextConfig) => {
  return {
    ...nextConfig,
    output: "export",
  };
};
/*
module.exports = (nextConfig) => {
  return {
    ...nextConfig,
    output: "export",
    webpack(webpackConfig) {
      return {
        ...webpackConfig,
        optimization: {
          minimize: true,
        },
      };
    },
  };
};
*/
