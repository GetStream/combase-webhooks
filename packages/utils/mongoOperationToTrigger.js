export const mongoOperationToTrigger = (collectionName, operationType) => {
    let triggerOperation;
    const triggerCollection = collectionName.endsWith('s') ? collectionName.slice(0, collectionName.length - 1) : collectionName;

    switch (operationType) {
        case 'insert': {
            triggerOperation = 'created';

            break;
        }

        case 'update': {
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