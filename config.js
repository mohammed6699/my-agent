import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// All generated projects live inside this one folder, regardless of
// where `node server.js` is actually run from.
export const WORKSPACE_ROOT = path.join(__dirname, 'workspace');