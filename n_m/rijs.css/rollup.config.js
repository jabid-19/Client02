import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import buble from 'rollup-plugin-buble'

export default {
  input: 'client.js'
, output: {
    file: 'client.bundle.js'
  , format: 'iife'
  , name: 'css'
  }
, plugins: [
    nodeResolve({ browser: true })
  , commonjs()
  , buble()
  ]
}