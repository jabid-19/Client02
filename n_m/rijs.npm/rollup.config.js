import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'dist/client.js'
, dest: 'dist/client.bundle.js'
, format: 'iife'
, moduleName: 'sync'
, plugins: [
    nodeResolve({ browser: true })
  , commonjs()
  ]
}