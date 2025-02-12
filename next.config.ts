import path from 'path';
import { Configuration } from 'webpack';
import { NextConfig } from 'next';

const nextConfig: NextConfig = {
    webpack: (config: Configuration, { isServer }) => {
        if (!config.resolve) {
            config.resolve = {};
        }

        if (!config.resolve.alias) {
            config.resolve.alias = {};
        }

        // Helper function to create path to lodash modules
        const getLodashPath = (module: string) => path.resolve(process.cwd(), `node_modules/lodash/${module}`);

        // Map of all required lodash modules
        const lodashModules = {
            'lodash/compact': 'compact',
            'lodash/at': 'at',
            'lodash/clone': 'clone',
            'lodash/extend': 'extend',
            'lodash/filter': 'filter',
            'lodash/assignIn': 'assignIn',
            'lodash/_arrayFilter': '_arrayFilter',
        };

        // Type assertion to handle the alias object type
        const alias = config.resolve.alias as Record<string, string>;

        // Create aliases for all lodash modules
        Object.entries(lodashModules).forEach(([aliasKey, module]) => {
            alias[aliasKey] = getLodashPath(module + '.js');
        });

        // If you're using ECMAScript modules
        if (isServer) {
            config.resolve.mainFields = ['module', 'main'];
        }

        return config;
    },
};

export default nextConfig;
