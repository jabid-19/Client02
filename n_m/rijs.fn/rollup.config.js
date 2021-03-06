import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble'

export default {
  input: 'client.js'
, output: {
    file: 'client.bundle.js'
  , format: 'iife'
  , name: 'fn'
  }
, plugins: [
  , nodeResolve({ browser: true })
  , commonjs()
  , buble()
  ]
}