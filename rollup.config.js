import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import postcss from 'rollup-plugin-postcss';

const outputName = 'react-hook-visible-satellites';

export default {
  input: 'src/index.js',
  output: [
    {
      file: `dist/${ outputName }.cjs.js`,
      format: 'cjs'
    },
    {
      file: `dist/${ outputName }.esm.js`,
      format: 'esm'
    }
  ],
  external: [
    'prop-types',
    'ramda',
    'react',
    'react-dom',
    'tle.js'
  ],
  plugins: [
    resolve(),
    babel({
      exclude: 'node_modules/**'
    }),
    postcss({
      modules: true,
      extensions: ['.css'],
    })
  ]
};