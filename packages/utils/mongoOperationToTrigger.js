export const mongoOperationToTrigger = (collectionName, operationType, { updateDescription }) => {
    let triggerOperation;
    const triggerCollection = collectionName.endsWith('s') ? collectionName.slice(0, collectionName.length - 1) : collectionName;

    switch (operationType) {
        case 'insert': {
            triggerOperation = 'created';

            break;
        }

        case 'update': {
			if (triggerCollection === 'ticket') {
				if (updateDescription?.updatedFields?.status === 'open') {
					triggerOperation = 'assigned';
					break;
				}
			}

            triggerOperation = 'updated';

            break;
        }

        case 'delete': {
            triggerOperation = 'deleted';

            break;
        }

        default:
            return;
    }

    return [triggerCollection, triggerOperation].join('.');
};