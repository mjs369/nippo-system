/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dockerコンテナでの最適化
  output: 'standalone',

  // 環境変数の検証
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  },

  // 本番環境での最適化
  swcMinify: true,

  // 画像最適化の設定
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
