import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { KAWTAA } from '../wrappers/KAWTAA';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('KAWTAA', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('KAWTAA');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let kAWTAA: SandboxContract<KAWTAA>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        kAWTAA = blockchain.openContract(KAWTAA.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await kAWTAA.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: kAWTAA.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and kAWTAA are ready to use
    });
});
