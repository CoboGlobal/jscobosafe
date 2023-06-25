const { ethers } = require("ethers");

let COBOSAFE_ABI = require('./abi/CoboSafeAccount.json');

const Operation = {
    CALL: 0,
    DELEGATE_CALL: 1
}

class CoboSafeAccount extends ethers.AbstractSigner{

    constructor(coboSafeAddress, signer) {
        super(signer.provider);
        this.signer = signer;
        this.delegate = this.signer.address;
        this.contract = new ethers.Contract(coboSafeAddress, COBOSAFE_ABI, this.signer);
        this.address = coboSafeAddress;
    }

    // Override wallet functions.
    async getAddress(){ 
        return this.contract.getAccountAddress(); 
    }

    async safe(){
        return this.getAddress();
    }

    async signTransaction(tx){
        let coboSafeTx = [
            Operation.CALL,
            tx["to"],
            tx["value"],
            tx["data"],
            "0x", // hint
            "0x"
        ]
        const ret = await this.contract.execTransaction.staticCall(coboSafeTx)
        coboSafeTx[4] = ret[2]
        tx = await this.contract.execTransaction.populateTransaction(coboSafeTx)
        tx = await this.signer.populateTransaction(tx);
        return await this.signer.signTransaction(tx);
    }

    async signMessage(){
        throw "not support in Cobo Safe"
    }

    signMessageSync(message) {
        throw "not support in Cobo Safe"
    }

    async signTypedData(domain, types, value){
        throw "not support in Cobo Safe";
    }
       
    // Cobo Safe functions.
    async execTransactionWithHint(
        to,
        data = "0x",
        value = 0,
        flag = Operation.CALL,
        useHint = true,
        extra = "0x",
        delegate = null,
    ) {
        let cobosafe = this.contract;
        if (delegate) {
            cobosafe = cobosafe.connect(delegate)
        }

        let tx = [
            flag,
            to,
            value,
            data,
            "0x", // hint
            extra
        ]
        if (useHint) {
            const ret = await cobosafe.execTransaction.staticCall(tx)
            tx[4] = ret[2]
        }
        return await cobosafe.execTransaction(tx)
    }

    async execRawTransaction(
        tx, 
        flag = Operation.CALL, 
        useHint = true, 
        extra = "0x",
        delegate = null
    ) {
        const to = tx["to"];
        const value = tx["value"];
        const data = tx["data"];
        return await this.execTransactionWithHint(
            to, data, value, flag, useHint, extra, delegate
        );
    }

    async execTransactionEx(to, funcSig, args, value = 0, flag = Operation.CALL, useHint = true, extra = "0x", delegate = null) {
        const funcName = funcSig.substr(0, funcSig.indexOf('('));
        const iface = new ethers.Interface(["function " + funcSig])
        const data = iface.encodeFunctionData(funcName, args)
        return await this.execTransactionWithHint(to, data, value, flag, useHint, extra, delegate);
    }
}


module.exports = { CoboSafeAccount };