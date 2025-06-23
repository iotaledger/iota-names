import { useQuery } from '@tanstack/react-query';

import { useIotaNamesClient } from '@/contexts';

/**
 * Finds the object ID of the parent domain for a given subdomain name.
 * This function is only callable for subdomains
 *
 * Example: 'sub.domain.iota' → finds objectId of 'domain.iota'
 *
 * @param subdomainName - The complete subdomain name (e.g., "sub.domain.iota")
 * @returns Object ID of the parent domain or null if not found/is root domain
 */
export function useFindParentObjectId(subdomainName: string) {
    const { iotaNamesClient } = useIotaNamesClient();

    const getRootParentDomainName = (name: string): string => {
        const parts = name.split('.');

        if (parts.length <= 2) {
            return name;
        }

        const rootParts = parts.slice(-2);
        return rootParts.join('.');
    };

    const parentDomainName = getRootParentDomainName(subdomainName);

    return useQuery({
        queryKey: ['find-parent-object-id', subdomainName, parentDomainName],
        async queryFn() {
            const parentNameRecord = await iotaNamesClient.getNameRecord(parentDomainName);

            if (!parentNameRecord) {
                return null;
            }

            const objectId = parentNameRecord.nftId;

            return {
                parentDomainName,
                objectId,
                nameRecord: parentNameRecord,
            };
        },
        enabled: !!iotaNamesClient && !!subdomainName && !!parentDomainName,
    });
}
