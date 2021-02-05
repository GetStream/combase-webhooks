import path from 'path';
import slash from 'slash';

const createPath = parts => slash(path.join(...parts));

const dataDir = createPath([process.cwd(), '.data']);
const manifest = createPath([process.cwd(), '.data', 'integration-manifest.json']);

export {
	dataDir,
	manifest,
}