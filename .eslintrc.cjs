module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: 'C:/Users/julio/Documents/Ideia/echolearn/tsconfig.json',
    },
    plugins: ['@typescript-eslint', 'import'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended-type-checked',
        'plugin:import/typescript',
        'prettier',
    ],
    rules: {
        // All logging must go through the Logger module, never console directly.
        // This ensures consistent formatting and production log suppression.
        'no-console': 'error',

        // Implicit any defeats the purpose of TypeScript strict mode.
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unsafe-assignment': 'error',
        '@typescript-eslint/no-unsafe-call': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',

        // Unhandled promises are a common source of silent failures
        // in Chrome extension message handlers and event listeners.
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/require-await': 'error',

        // Forces exhaustive switch statements on discriminated unions.
        // If a new MessageType is added but not handled, this breaks the build.
        '@typescript-eslint/switch-exhaustiveness-check': 'error',

        '@typescript-eslint/explicit-function-return-type': [
            'warn',
            { allowExpressions: true },
        ],

        // Naming conventions make the codebase predictable across contexts.
        '@typescript-eslint/naming-convention': [
            'error',
            { selector: 'interface', format: ['PascalCase'], prefix: ['I'] },
            { selector: 'typeAlias', format: ['PascalCase'] },
            { selector: 'enum', format: ['PascalCase'] },
            { selector: 'enumMember', format: ['UPPER_CASE'] },
        ],

        'import/order': [
            'error',
            {
                groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                'newlines-between': 'always',
                alphabetize: { order: 'asc' },
            },
        ],
        'import/no-duplicates': 'error',
        'import/no-cycle': 'error',
    },
    overrides: [
        {
            // Relax some rules in test files to keep tests readable.
            files: ['tests/**/*'],
            rules: {
                '@typescript-eslint/explicit-function-return-type': 'off',
                '@typescript-eslint/no-unsafe-assignment': 'off',
            },
        },
    ],
};