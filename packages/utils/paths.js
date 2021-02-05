import path from 'path';
import slash from 'slash';

const createPath = parts => slash(path.join(...parts));

const dataDir = createPath([process.cwd(), 'dist']);
const manifest = createPath([process.cwd(), 'dist', 'integration-manifest.json']);

export {
	dataDir,
	manifest,
}