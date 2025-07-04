/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed standalone output and outputFileTracingRoot
  async headers() {
    return [
      {
        source: "/api/proxy/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Credentials",
            value: "true"
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "https://domain1.com"
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT"
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-Requested-With, Content-Type, Authorization"
          }
        ]
      }
    ]
  }
};

export default nextConfig;