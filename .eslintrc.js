module.exports = {
    'env': {
        'browser': true,
        'es2021': true,
    },
    'extends': [
        'plugin:vue/essential',
        'google',
    ],
    'parserOptions': {
        'ecmaVersion': 12,
        'parser': '@typescript-eslint/parser',
        'sourceType': 'module',
    },
    'plugins': [
        'vue',
        '@typescript-eslint',
    ],
    'rules': {
        'indent': ['error', 4],
        'new-cap': 0,
        'require-jsdoc': 0,
        'max-len': ["error", {
            'code': 120
        }],
        "object-curly-spacing": ["always"],
    },
};
