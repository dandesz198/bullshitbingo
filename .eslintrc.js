module.exports = {
    "env": {
      "browser": true,
      "jest": true
    },
    "extends": ["airbnb", "plugin:prettier/recommended"],
    "parser": "babel-eslint",
    "plugins": ["react", "jsx-a11y", "import"],
    "globals": {
      "window": true
    },
    "rules": {
      "react/jsx-filename-extension": 0,
      "react/sort-comp": 0,
      "import/no-named-as-default": 0,
      "linebreak-style": 0,
      "jsx-a11y/href-no-hash": 0,
      "no-unused-expressions": "off",
      "react/forbid-prop-types": 0,
      "no-restricted-globals": "off",
      "import/prefer-default-export": 0,
      "no-console": 0,
      "camelcase": 0,
      "no-shadow": 0,
      "no-plusplus": 0,
      "import/no-extraneous-dependencies": 0,
      "import/no-unresolved": [2, { "ignore": ["^@"] }],
      "import/extensions": [2, { "ignore": ["^@"] }],
      "consistent-return": 0,
      "no-param-reassign": 0,
      "no-nested-ternary": 0,
      "prettier/prettier": [
        "error",
        {
          "bracketSpacing": true,
          "singleQuote": true,
          "trailingComma": "es5",
          "jsxBracketSameLine": false,
          "parser": "flow",
          "useTabs": false,
          "tabWidth": 2
        }
      ]
    },
    "settings": {
          "import/resolver": {
              "node": {
                  "extensions": [
                      ".js",
                      ".android.js",
                      ".ios.js"
                  ]
              }
          }
      }
  }
  