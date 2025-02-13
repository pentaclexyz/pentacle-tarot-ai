import type { Configuration } from 'webpack';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: {
        domains: ['res.cloudinary.com'], // Allow images from Cloudinary
    },
    webpack: (config: Configuration) => {
        // Ensure resolve.modules includes node_modules
        if (!config.resolve) config.resolve = {};
        if (!config.resolve.modules) config.resolve.modules = [];
        config.resolve.modules.push('node_modules');

        return config;
    },
};

export default nextConfig;
