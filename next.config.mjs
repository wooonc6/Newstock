/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig = {
  ...(isGithubPages && {
    output: "export",
    basePath: "/Newstock",
    images: { unoptimized: true },
  }),
  serverExternalPackages: ["yahoo-finance2"],
  webpack: (config, { webpack, isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "yahoo-finance2",
      ];
    }
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@std\/testing/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^@gadicc\/fetch-mock-cache/,
      })
    );
    return config;
  },
};

export default nextConfig;
