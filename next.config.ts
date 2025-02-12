import path from 'path';
import { Configuration } from 'webpack';

const nextConfig = {
    webpack: (config: Configuration) => {
        // Ensure config.resolve exists
        config.resolve = config.resolve || {};

        // Cast alias to a record so we can index it with custom keys
        const alias = config.resolve.alias as { [key: string]: string } || {};

        alias['lodash/compact'] = path.resolve(__dirname, 'node_modules/lodash/compact.js');
        alias['lodash/at'] = path.resolve(__dirname, 'node_modules/lodash/at.js');
        alias['lodash/clone'] = path.resolve(__dirname, 'node_modules/lodash/clone.js');
        alias['lodash/extend'] = path.resolve(__dirname, 'node_modules/lodash/extend.js');
        alias['lodash/filter'] = path.resolve(__dirname, 'node_modules/lodash/filter.js');

        // Assign the updated alias back to config.resolve.alias
        config.resolve.alias = alias;

        return config;
    },
};

export default nextConfig;
