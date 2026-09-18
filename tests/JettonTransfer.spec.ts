import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, beginCell, Cell, toNano } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { compile } from '@ton/blueprint';
import '@ton/test-utils';

describe('KAWTAA Jetton Transfer', () => {
    jest.setTimeout(30000);

    let blockchain: Blockchain;
    let minterCode: Cell;
    let walletCode: Cell;

    let deployer: SandboxContract<TreasuryContract>;
    let playerA: SandboxContract<TreasuryContract>;
    let playerB: SandboxContract<TreasuryContract>;

    beforeAll(async () => {
        minterCode = await compile('JettonMinter');
        walletCode = await compile('JettonWallet');
    });

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        playerA = await blockchain.treasury('playerA');
        playerB = await blockchain.treasury('playerB');
    });

    it('should transfer KAWTAA between two wallets', async () => {
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
            playerA.address,
            mintAmount
        );

        const walletAAddress = await minter.getWalletAddress(
            playerA.address
        );

        const walletBAddress = await minter.getWalletAddress(
            playerB.address
        );

        const walletA = blockchain.openContract(
            JettonWallet.createFromAddress(walletAAddress)
        );

        const walletB = blockchain.openContract(
            JettonWallet.createFromAddress(walletBAddress)
        );

        const beforeA = await walletA.getWalletData();
        expect(beforeA.jettonBalance).toBe(mintAmount);

        const beforeB = await blockchain.provider(
            walletBAddress
        ).getState();

        expect(beforeB.state.type).toBe('uninit');

        const transferAmount = 250n * 1_000_000_000n;

        const transferResult = await walletA.sendTransfer(
            playerA.getSender(),
            transferAmount,
            playerB.address,
            playerA.address
        );

        expect(transferResult.transactions).toHaveTransaction({
            from: playerA.address,
            to: walletAAddress,
            success: true,
        });

        const afterA = await walletA.getWalletData();
        const afterB = await walletB.getWalletData();

        expect(afterA.jettonBalance).toBe(
            750n * 1_000_000_000n
        );

        expect(afterB.jettonBalance).toBe(
            250n * 1_000_000_000n
        );

        expect(afterB.ownerAddress.equals(playerB.address)).toBe(true);
        expect(afterB.minterAddress.equals(minter.address)).toBe(true);
    });
});
