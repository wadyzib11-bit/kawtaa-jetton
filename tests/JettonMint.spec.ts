import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, beginCell, Cell, toNano } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { compile } from '@ton/blueprint';
import '@ton/test-utils';

describe('KAWTAA Jetton Mint', () => {
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

    it('should deploy minter and mint KAWTAA', async () => {
        const config = {
            totalSupply: 0n,
            adminAddress: deployer.address,
            content: beginCell().endCell(),
            jettonWalletCode: walletCode,
        };

        const minter = blockchain.openContract(
            JettonMinter.createFromConfig(
                config,
                minterCode
            )
        );

        const deployResult = await minter.sendDeploy(
            deployer.getSender(),
            toNano('0.2')
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: minter.address,
            deploy: true,
            success: true,
        });

        const dataBefore = await minter.getJettonData();

        expect(dataBefore.totalSupply).toBe(0n);
        expect(dataBefore.mintable).toBe(true);
        expect(dataBefore.adminAddress.equals(deployer.address)).toBe(true);

        const mintAmount = 1000n * 1_000_000_000n;

        const mintResult = await minter.sendMint(
            deployer.getSender(),
            player.address,
            mintAmount
        );

        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: minter.address,
            success: true,
        });

        const dataAfter = await minter.getJettonData();

        expect(dataAfter.totalSupply).toBe(mintAmount);

        const walletAddress = await minter.getWalletAddress(
            player.address
        );

        const wallet = blockchain.openContract(
            JettonWallet.createFromAddress(walletAddress)
        );

        const walletData = await wallet.getWalletData();

        expect(walletData.jettonBalance).toBe(mintAmount);
        expect(walletData.ownerAddress.equals(player.address)).toBe(true);
        expect(walletData.minterAddress.equals(minter.address)).toBe(true);
    });
});
