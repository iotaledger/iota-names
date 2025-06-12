import { bcs } from '@iota/iota-sdk/bcs';

export const PricingConfigBcs = bcs.struct('PricingConfig', {
    dummy_field: bcs.bool(),
});

export const DomainBcs = bcs.struct('Domain', {
    labels: bcs.vector(bcs.string()),
});
