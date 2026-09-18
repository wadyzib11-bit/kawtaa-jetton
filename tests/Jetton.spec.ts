import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, beginCell, Cell, toNano } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { compile } from '@ton/blueprint';
import '@ton/test-utils';

describe('KAWTAA Jetton', () => {
    jest.setTimeout(30000);
    let blockchain: Blockchain;

    let minterCode: Cell;
    let walletCode: Cell;

    let deployer: SandboxContract<TreasuryContract>;
    let player: SandboxContract<TreasuryContract>;

    beforeAll(async () => {
        minterCode = await compile('JettonMinter');
        walletCode = await compile('JettonWallet');
    });

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        player = await blockchain.treasury('player');
    });

    it('should compile Jetton contracts', async () => {
        expect(minterCode).toBeDefined();
        expect(walletCode).toBeDefined();

        expect(minterCode.hash().length).toBeGreaterThan(0);
        expect(walletCode.hash().length).toBeGreaterThan(0);
    });
});
