import {
    Address,
    Contract,
    ContractProvider,
    Sender,
    SendMode,
    beginCell,
    toNano,
} from '@ton/core';

export class JettonWallet implements Contract {
    constructor(readonly address: Address) {}

    static createFromAddress(address: Address) {
        return new JettonWallet(address);
    }

    async getWalletData(provider: ContractProvider) {
        const result = await provider.get('get_wallet_data', []);

        return {
            jettonBalance: result.stack.readBigNumber(),
            ownerAddress: result.stack.readAddress(),
            minterAddress: result.stack.readAddress(),
            jettonWalletCode: result.stack.readCell(),
        };
    }

    async sendTransfer(
        provider: ContractProvider,
        via: Sender,
        amount: bigint,
        destination: Address,
        responseDestination: Address,
        forwardAmount = 0n,
        queryId = 0n,
    ) {
        const body = beginCell()
            .storeUint(0x0f8a7ea5, 32)
            .storeUint(queryId, 64)
            .storeCoins(amount)
            .storeAddress(destination)
            .storeAddress(responseDestination)
            .storeBit(0)
            .storeCoins(forwardAmount)
            .storeBit(0)
            .endCell();

        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body,
        });
    }
}
