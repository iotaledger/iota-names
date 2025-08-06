import * as z from 'zod';

const Params = z.object({
    name: z.string(),
    timestamp: z.coerce.number(),
});

export function validateParams(params: unknown) {
    return Params.safeParse(params);
}
