/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/api/pdf": ["./node_modules/@sparticuz/chromium/**"],
  },
};

export default nextConfig;
