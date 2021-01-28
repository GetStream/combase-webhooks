import path from 'path';
import slash from 'slash';

const dataDir = slash(path.join(process.cwd(), '.data'));

console.log('DATA DIR', dataDir)

export {
	dataDir,
}