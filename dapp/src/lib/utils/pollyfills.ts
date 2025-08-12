// https://github.com/TanStack/query/issues/3082#issuecomment-2152901146
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt as any).prototype['toJSON'] = function () {
    return this.toString();
};
