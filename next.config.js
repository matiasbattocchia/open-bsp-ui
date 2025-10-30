/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
};

module.exports = nextConfig;
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
