import { toNano } from '@ton/core';
import { KAWTAA } from '../wrappers/KAWTAA';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const kAWTAA = provider.open(KAWTAA.createFromConfig({}, await compile('KAWTAA')));

    await kAWTAA.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(kAWTAA.address);

    // run methods on `kAWTAA`
}
