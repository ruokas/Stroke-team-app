import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/app.js',
  output: {
    file: 'dist/app.js',
    format: 'es',
    sourcemap: true,
  },
  plugins: [nodeResolve()],
};
