import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, beginCell, Cell, toNano } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { compile } from '@ton/blueprint';
import '@ton/test-utils';

describe('KAWTAA Jetton Burn', () => {
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

    it('should burn KAWTAA and reduce total supply', async () => {
        const config = {
            totalSupply: 0n,
            adminAddress: deployer.address,
            content: beginCell().endCell(),
            jettonWalletCode: walletCode,
        };

        const minter = blockchain.openContract(
            JettonMinter.createFromConfig(config, minterCode)
        );

        await minter.sendDeploy(
            deployer.getSender(),
            toNano('0.2')
        );

        const mintAmount = 1000n * 1_000_000_000n;

        await minter.sendMint(
            deployer.getSender(),
            player.address,
            mintAmount
        );

        const walletAddress = await minter.getWalletAddress(
            player.address
        );

        const wallet = blockchain.openContract(
            JettonWallet.createFromAddress(walletAddress)
        );

        const before = await wallet.getWalletData();

        expect(before.jettonBalance).toBe(mintAmount);

        const burnAmount = 100n * 1_000_000_000n;

        const burnBody = beginCell()
            .storeUint(0x595f07bc, 32)
            .storeUint(0, 64)
            .storeCoins(burnAmount)
            .storeAddress(player.address)
            .storeBit(0)
            .endCell();

        const burnResult = await player.send({
            to: walletAddress,
            value: toNano('0.05'),
            body: burnBody,
        });

        expect(burnResult.transactions).toHaveTransaction({
            from: player.address,
            to: walletAddress,
            success: true,
        });

        const after = await wallet.getWalletData();

        expect(after.jettonBalance).toBe(
            900n * 1_000_000_000n
        );

        const minterData = await minter.getJettonData();

        expect(minterData.totalSupply).toBe(
            900n * 1_000_000_000n
        );
    });
});
