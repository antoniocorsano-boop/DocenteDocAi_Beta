// Vite plugin per forzare l'interoperabilità CJS/ESM su lodash, lodash-es, underscore
export default function viteCjsInteropPlugin() {
  return {
    name: 'vite-cjs-interop',
    enforce: 'pre', // Vite accetta solo 'pre' | 'post' | undefined
    transform(code, id) {
      if (/node_modules[\\/](lodash|lodash-es|underscore)[\\/]/.test(id)) {
        return code + '\nexport default module.exports;';
      }
      return null;
    },
  };
}
