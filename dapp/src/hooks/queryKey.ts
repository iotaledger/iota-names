// Query keys mostly to identify queries
// Non-identifying variables should not be included here (e.g, price of a name)
export const queryKey = {
    all: ['iota-name'],

    // Names
    nameRecord: (name: string) => [queryKey.all, 'name-record', name],
    registerName: (name: string, address?: string) => [
        queryKey.all,
        'register-name',
        name,
        address,
    ],
    updateName: (name: string, address?: string) => [queryKey.all, 'update-name', name, address],

    // Address
    defaultName: (address: string) => [queryKey.all, 'default-name', address],

    // Generic
    ownedObjects: (address: string) => [queryKey.all, 'owned-objects', address],

    // Price List
    priceList: () => [queryKey.all, 'price-list'],
};
