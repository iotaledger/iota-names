# IOTA-Names TypeScript SDK

This is a lightweight SDK (1kB minified bundle size), providing utility classes and functions for
applications to interact with on-chain `.iota` names registered from
[Iota Name Service (iotaNames.io)](https://iotaNames.io).

## Getting started

The SDK is published to [npm registry](https://www.npmjs.com/package/@iota/iota-sdk-toolkit). To use
it in your project:

```bash
$ npm install @iota/iota-sdk-toolkit
```

You can also use yarn or pnpm.

## Examples

Create an instance of IotaNamesClient:

```typescript
import { IotaNamesClient } from '@iota/iota-sdk-toolkit';
import { IotaClient } from '@iota/iota-sdk/client';

const client = new IotaClient();
export const iotaNamesClient = new IotaNamesClient(client);
```

Choose network type:

```typescript
export const iotaNamesClient = new IotaNamesClient(client, {
	networkType: 'testnet',
});
```

> **Note:** To ensure best performance, please make sure to create only one instance of the
> IotaNamesClient class in your application. Then, import the created `iotaNamesClient` instance to use its
> functions.

Fetch an address linked to a name:

```typescript
const address = await iotaNamesClient.getAddress('iotaNames.iota');
```

Fetch the default name of an address:

```typescript
const defaultName = await iotaNamesClient.getName(
	'0xc2f08b6490b87610629673e76bab7e821fe8589c7ea6e752ea5dac2a4d371b41',
);
```

Fetch a name object:

```typescript
const nameObject = await iotaNamesClient.getNameObject('iotaNames.iota');
```

Fetch a name object including the owner:

```typescript
const nameObject = await iotaNamesClient.getNameObject('iotaNames.iota', {
	showOwner: true,
});
```

Fetch a name object including the Avatar the owner has set (it automatically includes owner too):

```typescript
const nameObject = await iotaNamesClient.getNameObject('iotaNames.iota', {
	showOwner: true, // this can be skipped as showAvatar includes it by default
	showAvatar: true,
});
```

## License

[Apache-2.0](https://github.com/IotaNamesdapp/toolkit/blob/main/LICENSE)
