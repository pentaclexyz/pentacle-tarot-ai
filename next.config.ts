import path from 'path';
import { Configuration } from 'webpack';

const nextConfig = {
    webpack: (config: Configuration) => {
        // Ensure config.resolve and config.resolve.alias exist
        config.resolve = config.resolve || {};
        const alias = (config.resolve.alias as { [key: string]: string }) || {};

        // Explicitly alias lodash submodules that Cloudinary (or lodash itself) is trying to import
        alias['lodash/compact'] = path.resolve(__dirname, 'node_modules/lodash/compact.js');
        alias['lodash/at'] = path.resolve(__dirname, 'node_modules/lodash/at.js');
        alias['lodash/clone'] = path.resolve(__dirname, 'node_modules/lodash/clone.js');
        alias['lodash/extend'] = path.resolve(__dirname, 'node_modules/lodash/extend.js');
        alias['lodash/filter'] = path.resolve(__dirname, 'node_modules/lodash/filter.js');

        // These are the internal dependencies referenced inside some lodash files:
        alias['lodash/assignIn'] = path.resolve(__dirname, 'node_modules/lodash/assignIn.js');
        alias['lodash/_arrayFilter'] = path.resolve(__dirname, 'node_modules/lodash/_arrayFilter.js');

        // Reassign the alias back to the config
        config.resolve.alias = alias;
        return config;
    },
};

export default nextConfig;
