// next.config.js
const path = require('path');

module.exports = {
    webpack: (config) => {
        config.resolve.alias['lodash/compact'] = path.resolve(__dirname, 'node_modules/lodash/compact.js');
        config.resolve.alias['lodash/at'] = path.resolve(__dirname, 'node_modules/lodash/at.js');
        config.resolve.alias['lodash/clone'] = path.resolve(__dirname, 'node_modules/lodash/clone.js');
        config.resolve.alias['lodash/extend'] = path.resolve(__dirname, 'node_modules/lodash/extend.js');
        config.resolve.alias['lodash/filter'] = path.resolve(__dirname, 'node_modules/lodash/filter.js');
        return config;
    },
};
