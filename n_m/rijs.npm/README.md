# Ripple | npm
[![Coverage Status](https://coveralls.io/repos/rijs/npm/badge.svg?branch=master&service=github)](https://coveralls.io/github/rijs/npm?branch=master)
[![Build Status](https://travis-ci.org/rijs/npm.svg)](https://travis-ci.org/rijs/npm)

This module registers an `npm` resource, from which you can dynamically request modules. The modules will be rolled up, bubled with the minimum level of transpilation applied, compressed in production and deduped on the client-side (i.e. if two components request the same module, it won't be redownloaded). 