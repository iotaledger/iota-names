export const FORBIDDEN_LIST: string[] =
    JSON.parse(process.env.NEXT_PUBLIC_NAMES_DAPP_FORBIDDEN_LIST || '[]') || [];
