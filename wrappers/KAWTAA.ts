import {
    Address,
    beginCell,
    Cell,
    Contract,
    ContractABI,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode
} from '@ton/core';

export type KAWTAAConfig = {};

export function kAWTAAConfigToCell(config: KAWTAAConfig): Cell {
    return beginCell().endCell();
}

export class KAWTAA implements Contract {
    abi: ContractABI = { name: 'KAWTAA' }

    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new KAWTAA(address);
    }

    static createFromConfig(config: KAWTAAConfig, code: Cell, workchain = 0) {
        const data = kAWTAAConfigToCell(config);
        const init = { code, data };
        return new KAWTAA(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
