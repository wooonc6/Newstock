/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig = {
  ...(isGithubPages && {
    output: "export",
    basePath: "/Newstock",
    images: { unoptimized: true },
  }),
  experimental: {
    serverComponentsExternalPackages: ["yahoo-finance2"],
  },
  webpack: (config, { webpack }) => {
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
