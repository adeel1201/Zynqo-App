git add .
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
      remotePatterns: [
            {
                    protocol: 'https',
                            hostname: '**.googleapis.com',
                                  },
                                        {
                                                protocol: 'https',
                                                        hostname: '**.firebasestorage.app',
                                                              },
                                                                  ],
                                                                    },
                                                                    };

                                                                    export default nextConfig;