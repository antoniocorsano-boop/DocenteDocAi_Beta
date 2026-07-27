// stylelint.config.mjs
// MD3 Token Governance — enforces that every var(--md-sys-*) reference in CSS
// resolves to a property actually defined in theme.css or global.css.
//
// Run: npm run lint:css
// Fix: npm run lint:css -- --fix  (where autofixable)

/** @type {import('stylelint').Config} */
export default {
  ignoreFiles: [
    // src/components.css contains 100% non-ASCII UTF-8 bytes (corrupted/encoded file).
    // It is not valid CSS and cannot be parsed by stylelint.
    // TODO: investigate origin and regenerate this file.
    'src/components.css',
  ],
  plugins: ['stylelint-value-no-unknown-custom-properties'],
  rules: {
    // Disallow var() references to custom properties not defined in the
    // importFrom sources. Any --md-sys-* token used but not declared in
    // theme.css or global.css will produce an error.
    'csstools/value-no-unknown-custom-properties': [
      true,
      {
        importFrom: [
          'src/theme.css',
          'src/global.css',
          'src/modules.css',
        ],
      },
    ],
  },
};
