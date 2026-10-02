/**
 * Production entry point.
 *
 * Hostinger's Node.js pipeline defaults `entry_file` to `server.js` at the
 * project root, and Passenger starts whatever that setting names. Rather than
 * depend on a dashboard field being set correctly on every environment, this
 * shim loads the compiled server so the default convention works as-is.
 *
 * `npm run build` must have run first: the real entry is dist/server/index.js,
 * which starts listening as a side effect of being imported.
 */
import './dist/server/index.js'
