/**
 * Adapted from https://github.com/gatsbyjs/gatsby/blob/master/packages/gatsby-core-utils/src/create-require-from-path.ts
 */
import Module from "module"
import path from "path"

const fallback = (filename)=> {
  const mod = new Module(filename);

  mod.filename = filename
  mod.paths = Module._nodeModulePaths(path.dirname(filename))
  mod._compile(`module.exports = require;`, filename)

  return mod.exports
}

// Polyfill Node's `Module.createRequireFromPath` if not present (added in Node v10.12.0)
export const createPluginRequire = Module.createRequire || Module.createRequireFromPath || fallback