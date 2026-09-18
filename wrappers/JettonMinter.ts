import {
    Address,
    beginCell,
    Cell,
    Contract,
    ContractProvider,
    contractAddress,
    toNano,
    Sender,
    SendMode,
} from '@ton/core';

export type JettonMinterConfig = {
    totalSupply: bigint;
    adminAddress: Address;
    content: Cell;
    jettonWalletCode: Cell;
};

export function jettonMinterConfigToCell(
    config: JettonMinterConfig
): Cell {
    return beginCell()
        .storeCoins(config.totalSupply)
        .storeAddress(config.adminAddress)
        .storeRef(config.content)
        .storeRef(config.jettonWalletCode)
        .endCell();
}

export class JettonMinter implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: {
            code: Cell;
            data: Cell;
        }
    ) {}

    static createFromAddress(address: Address) {
        return new JettonMinter(address);
    }

    static createFromConfig(
        config: JettonMinterConfig,
        code: Cell,
        workchain = 0
    ) {
        const data = jettonMinterConfigToCell(config);

        const init = {
            code,
            data,
        };

        return new JettonMinter(
            contractAddress(workchain, init),
            init
        );
    }

    async sendDeploy(
        provider: ContractProvider,
        via: Sender,
        value: bigint
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getJettonData(provider: ContractProvider) {
        const result = await provider.get('get_jetton_data', []);

        return {
            totalSupply: result.stack.readBigNumber(),
            mintable: result.stack.readBoolean(),
            adminAddress: result.stack.readAddress(),
            jettonContent: result.stack.readCell(),
            jettonWalletCode: result.stack.readCell(),
        };
    }

    async getWalletAddress(
        provider: ContractProvider,
        ownerAddress: Address
    ) {
        const result = await provider.get(
            'get_wallet_address',
            [
                {
                    type: 'slice',
                    cell: beginCell()
                        .storeAddress(ownerAddress)
                        .endCell(),
                },
            ]
        );

        return result.stack.readAddress();
    }

    async sendMint(
        provider: ContractProvider,
        via: Sender,
        recipient: Address,
        amount: bigint,
        queryId = 0n
    ) {
        const internalTransfer = beginCell()
            .storeUint(0x178d4519, 32)
            .storeUint(queryId, 64)
            .storeCoins(amount)
            .storeAddress(null)
            .storeAddress(null)
            .storeCoins(0)
            .endCell();

        const body = beginCell()
            .storeUint(0x15, 32)
            .storeUint(queryId, 64)
            .storeAddress(recipient)
            .storeCoins(toNano('0.05'))
            .storeRef(internalTransfer)
            .endCell();

        await provider.internal(via, {
            value: toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body,
        });
    }
}
