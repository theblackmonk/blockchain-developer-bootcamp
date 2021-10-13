const Token = artifacts.require("./Token") //get the token

require('chai')                      //importing assertion library
.use(require('chai-as-promised'))
.should()                            //which asertions to import

import { assert } from 'chai'
import { tokens } from './helpers'

 contract('Token', ([deployer, receiver]) => { //(accounts) or ([deployer])
    const name = "Pear Token"
    const symbol = "PEAR"
    const decimals = '18'
    const totalSupply = tokens(1000000).toString() //1 mil tokens //'1000000000000000000000000'
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
            result.toString().should.equal(totalSupply.toString())
        })
        it('track deployers supply', async () => {
            const result = await token.balanceOf(deployer)
            result.toString().should.equal(totalSupply.toString())
        })
     })

     describe('sending tokens', () => {
      let amount
      let result
      
         describe('succes', () => {
            beforeEach(async () => {
               amount = tokens(100)  //BN big number
               result = await token.transfer(receiver, amount, { from: deployer } )
               //add function metadata {from:} msg.sender and from correspond
            })
            
            it('sending  token', async () => {
               let balanceOf
               
               //Before transfer
               balanceOf = await token.balanceOf(deployer)
               console.log("deployer balance before transfer ", balanceOf.toString())
               balanceOf = await token.balanceOf(receiver)
               console.log("receiver balance before transfer ", balanceOf.toString())
               
               //Transfer
               balanceOf = await token.balanceOf(deployer)
               balanceOf.toString().should.equal(tokens(999900).toString())
               console.log("initiate transfer")
               
               //After transfer
               balanceOf = await token.balanceOf(deployer)
               console.log("deployer balance after transfer ", balanceOf.toString())
               balanceOf = await token.balanceOf(receiver)
               console.log("receiver balance after transfer ", balanceOf.toString())
               balanceOf.toString().should.equal(tokens(100).toString())
            })
      
            it('emits a transfer event', async () => { //async () => is passing in a function
               const log = result.logs[0]
              log.event.should.eq('Transfer')
              const event = log.args
              event.from.toString().should.equal(deployer, 'from is correct')
              event.to.should.equal(receiver, 'to is correct')
              event.value.toString().should.equal(amount.toString(), 'value is correct')
            })
      
         })

         describe('failure', () => {
            it('rejects insufficient balances', () => {
               let invalidAmount

               invalidAmount = tokens(100000000) //100 million greater than totalSupply
               await token.transfer(reciever, invalidAmount, { from: deployer}).should.be.rejectedWith('VM Exception while processing transaction: revert')
            })
         })
     })
 })