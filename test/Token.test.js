const Token = artifacts.require("./Token") //get the token

require('chai')                      //importing assertion library
.use(require('chai-as-promised'))
.should()                            //which asertions to import

 contract('Token', ([deployer, receiver]) => { //(accounts) or ([deployer])
    const name = "Pear Token"
    const symbol = "PEAR"
    const decimals = '1'
    const totalSupply = '100'
    let token
    
    beforeEach(async () => {
        token = await Token.new() //Fetch token from blockchain //new() instead of deployed()
    })

    describe('deployment', () => {
        it('tracks the name', async () => {
            const result = await token.name() //Read token name here...
            result.should.equal(name) //Check the token name is 'My Name'
         })
         it('tracks the symbol', async () => {
            const result = await token.symbol()
            result.should.equal(symbol)
         })
         it('tracks the decimal', async () => {
            const result = await token.decimals()
            result.toString().should.equal(decimals)
         })
         it('tracks the total supply', async () => {
            const result = await token.totalSupply()
            result.toString().should.equal(totalSupply)
        })
        it('track deployers supply', async () => {
            const result = await token.balanceOf(deployer)
            result.toString().should.equal(totalSupply)
        })
     })

     describe('sending tokens', () => {
      it('transfer token', async () => {
         let result = await token.transfer(receiver, 50)
         let transfered = await token.balanceOf(receiver)
         transfered.toString().should.equal('50')
         //result.should.equal(true)
         //let balanceOf
      })
     })
 })