import path from 'path';
import slash from 'slash';

export const createPath = parts => slash(path.join(...parts));

export const dataDir = createPath([process.cwd(), '.data']);
export const manifest = createPath([process.cwd(), '.data', 'integration-manifest.json']);