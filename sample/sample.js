const {CoboSafeAccount} = require("jscobosafe");
const {ethers} = require("ethers");
const ERC20_ABI = require("./ERC20.json");

require("dotenv").config();
const PRI_KEY = process.env.PRIV;
const COBO_SAFE_ADDRESS = process.env.COBOSAFE

// const provider = new ethers.JsonRpcProvider("https://rpc.ankr.com/polygon")
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545")
const signer = new ethers.Wallet(PRI_KEY, provider);
const coboSafe = new CoboSafeAccount(COBO_SAFE_ADDRESS, signer)
const delegate = coboSafe.delegate;

const WMATIC_ADDRESS = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";

async function main(){
    console.log("CoboSafe", coboSafe.address);
    console.log("Safe", await coboSafe.safe());
    console.log("Delegate", coboSafe.delegate);

    let tx;

    // (Option 1) Call contract with ABI.
    const token = new ethers.Contract(WMATIC_ADDRESS, ERC20_ABI, coboSafe);

    console.log(await token.balanceOf(await coboSafe.safe()))
    tx = await token.transfer(delegate, 1);
    await tx.wait()
    console.log(await token.balanceOf(await coboSafe.safe()))

    // (Option 2) Call raw transaction.
    tx = await token.transfer.populateTransaction(delegate, 1);
    tx = await coboSafe.execRawTransaction(tx);
    await tx.wait()
    console.log(await token.balanceOf(await coboSafe.safe()))
    
    // (Option 3) Call directly with function signature.
    tx = await coboSafe.execTransactionEx(
        WMATIC_ADDRESS, 
        "transfer(address,uint256)", 
        [delegate, 1]
    );
    await tx.wait()
    console.log(await token.balanceOf(await coboSafe.safe()))
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

