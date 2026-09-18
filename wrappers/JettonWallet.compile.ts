import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tolk',
    entrypoint: 'contracts/kawtaa-jetton/jetton-wallet-contract.tolk',
    withStackComments: true,
    withSrcLineComments: true,
    experimentalOptions: '',
};
