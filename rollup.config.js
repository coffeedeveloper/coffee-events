import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/index.js',
  dest: 'lib/events.js',
  moduleName: 'Events',
  format: 'umd',
  plugins: [
    nodeResolve({
      jsnext: true,
      browser: true,
    }),
    commonjs(),
    babel({
      exclude: 'node_modules/**',
    })
    // buble()
  ]
};
