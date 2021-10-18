//helper file
export const EVM_REVERT = 'VM Exception while processing transaction: revert'
export const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'
//n will be number of tokens
export const ether = (n) => {
    return new web3.utils.BN(
    web3.utils.toWei(n.toString(), 'ether')
    )
    //not really ether but works like it
    //both ether and our coin have 18 decimal places
    //We also want to convert this to a big number as well
 }  

//Understand that tokens and ether have same decimals so converting to whole numbers is the same
//same as ether
 export const tokens = (n) => ether(n)


 