//helper file
export const EVM_REVERT = 'VM Exception while processing transaction: revert'

//n will be number of tokens
export const tokens = (n) => {
    return new web3.utils.BN(
    web3.utils.toWei(n.toString(), 'ether')
    )
    //not really ether but works like it
    //both ether and our coin have 18 decimal places
    //We also want to convert this to a big number as well
 }  

 