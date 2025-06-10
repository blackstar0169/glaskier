import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import stylistic from '@stylistic/eslint-plugin'
import globals from "globals";

export default defineConfig([
	{
        files: ["src/**/*.js"],
		plugins: {
			js,
            '@stylistic': stylistic
		},
		extends: ["js/recommended"],
        languageOptions : {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.node,
            }
        },
		rules: {
			"@stylistic/arrow-spacing": ["error", { "before": true, "after": true }],
            "@stylistic/brace-style": ["error", "stroustrup", { "allowSingleLine": true }],
            "@stylistic/comma-dangle": ["error", "always-multiline"],
            "@stylistic/comma-spacing": "error",
            "@stylistic/comma-style": "error",
            "curly": ["error", "multi-line", "consistent"],
            "@stylistic/dot-location": ["error", "property"],
            "handle-callback-err": "off",
            "@stylistic/indent": ["error", 4],
            "@stylistic/keyword-spacing": "error",
            "max-nested-callbacks": ["error", { "max": 4 }],
            "@stylistic/max-statements-per-line": ["error", { "max": 2 }],
            "no-console": "off",
            "no-empty-function": "error",
            "@stylistic/no-floating-decimal": "error",
            "no-inline-comments": "error",
            "no-lonely-if": "error",
            "@stylistic/no-multi-spaces": "error",
            "no-shadow": ["error", { "allow": ["err", "resolve", "reject"] }],
            "@stylistic/no-trailing-spaces": ["error"],
            "no-var": "error",
            "@stylistic/object-curly-spacing": ["error", "always"],
            "prefer-const": "error",
            "@stylistic/quotes": ["error", "single"],
            "@stylistic/semi": ["error", "always"],
            "@stylistic/space-before-blocks": "error",
            "@stylistic/space-before-function-paren": ["error", {
                "anonymous": "never",
                "named": "never",
                "asyncArrow": "always"
            }],
            "@stylistic/space-in-parens": "error",
            "@stylistic/space-infix-ops": "error",
            "@stylistic/space-unary-ops": "error",
            "@stylistic/spaced-comment": "error",
            "yoda": "error"
		},
    },
]);
