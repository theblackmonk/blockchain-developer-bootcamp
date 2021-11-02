const Token = artifacts.require("Token"); 
const Exchange = artifacts.require("Exchange");

module.exports = async function(deployer) {
    //Might be a simpler way to pull in "fee account using truffle, but we'll use web3"
    const accounts = await web3.eth.getAccounts() //array of all accounts in ganache
    

    await deployer.deploy(Token);

    const feeAccount = accounts[0]
    const feePercent = 10
    await deployer.deploy(Exchange, feeAccount, feePercent) //pass in constructor args
};