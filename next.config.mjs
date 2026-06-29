const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.nba.com"
      }
    ]
  }
};

export default nextConfig;
