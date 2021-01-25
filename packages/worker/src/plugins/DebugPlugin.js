export class DebugPlugin {
    constructor(capn) {
        this.capn = capn;

        this.listen();
    }

    listen = async () => {
        for await (const response of this.capn.listen('email.receive')) {
            // eslint-disable-next-line no-console
			console.log('received event', response);
        }
    };
}
