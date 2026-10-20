/**
 * Lets `node --test` run the TypeScript RPG modules directly (Node ≥ 23.6 strips
 * types natively) while keeping the codebase's extensionless relative imports:
 * `import { x } from './config'` resolves to `./config.ts`. No dependencies.
 */
import { registerHooks } from 'node:module';

const RELATIVE = /^\.{1,2}\//;
const HAS_EXT = /\.[cm]?[jt]sx?$/;

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      if (!RELATIVE.test(specifier) || HAS_EXT.test(specifier)) throw err;
      for (const suffix of ['.ts', '.tsx', '/index.ts']) {
        try {
          return nextResolve(specifier + suffix, context);
        } catch {
          // try the next candidate
        }
      }
      throw err;
    }
  },
});
