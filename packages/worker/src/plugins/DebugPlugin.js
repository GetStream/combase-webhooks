export class DebugPlugin {
    constructor(capn) {
        this.capn = capn;

        this.listen();
    }

    listen = async () => {
        for await (const event of this.capn.listen('capn:event')) {
            // eslint-disable-next-line no-console
            console.log('received event', event.trigger);
        }
    };
}
