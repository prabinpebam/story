module.exports = {
    root: true,
    env: {
        browser: true,
        es2022: true
    },
    extends: ['eslint:recommended'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    ignorePatterns: [
        'dist/',
        'node_modules/',
        'src/vendor/'
    ],
    rules: {
        'no-unused-vars': 'off',
        'no-constant-condition': 'off',
        'no-case-declarations': 'off',
        'no-inner-declarations': 'off',
        'no-prototype-builtins': 'off'
    }
};