import path from 'path';
import slash from 'slash';

const dataDir = slash(path.join(process.cwd(), '.data'));

export {
	dataDir,
}