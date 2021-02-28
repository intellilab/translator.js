module.exports = {
  root: true,
  extends: [
    require.resolve('@gera2ld/plaid/eslint'),
    require.resolve('@gera2ld/plaid-common-react/eslint'),
  ],
  settings: {
    'import/resolver': {
      'babel-module': {},
    },
  },
  globals: {
    VM: true,
    GM_addStyle: true,
    GM_xmlhttpRequest: true,
    GM_getValue: true,
    GM_setValue: true,
  },
  rules: {
    'react/no-danger': 'off',
  },
};
