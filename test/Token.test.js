const Token = artifacts.require("./Token") //get the token

require('chai')                      //importing assertion library
.use(require('chai-as-promised'))
.should()                            //which asertions to import

import { assert } from 'chai'
import { tokens, EVM_REVERT } from './helpers'

 contract('Token', ([deployer, receiver, exchange]) => { //(accounts) or ([deployer])
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

      beforeEach(async () => {
         amount = tokens(100)
         await token.approve(exchange, amount, { from: deployer })
         //here we make sure the exchange is approved to transfer tokens
      })
      

         describe('success', () => {
            beforeEach(async () => {
               amount = tokens(100)  //BN big number
               //Transfer
               result = await token.transferFrom(deployer, receiver, amount, { from: exchange } )
               //add function metadata {from:} msg.sender and from correspond
            })
            
            it('sending  token', async () => {
               let balanceOf
               
                  //Before transfer
                  balanceOf = await token.balanceOf(deployer)
                  console.log("deployer balance before transfer ", balanceOf.toString())
                  balanceOf = await token.balanceOf(receiver)
                  console.log("receiver balance before transfer ", balanceOf.toString())
               
               
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
      
            it('emits a Transfer event', async () => { //async () => is passing in a function
              const log = result.logs[0]
              log.event.should.eq('Transfer')
              const event = log.args
              event.from.toString().should.equal(deployer, 'from is correct')
              event.to.should.equal(receiver, 'to is correct')
              event.value.toString().should.equal(amount.toString(), 'value is correct')
            })
      
         })

         describe('failure', () => {
            it('rejects insufficient balances', async () => {
               let invalidAmount

               invalidAmount = tokens(100000000) //100 million greater than totalSupply
               await token.transfer(receiver, invalidAmount, { from: deployer }).should.be.rejectedWith(EVM_REVERT)

               // Attempt transfer tokens, when you have none
               invalidAmount = tokens(10) // recipient has no tokens
               await token.transfer(deployer, amount, { from: receiver }).should.be.rejectedWith(EVM_REVERT)
            })

            it ('rejects invalid recipients', async () => {
               await token.transfer(0x0, amount, { from: deployer }).should.be.rejectedWith('invalid address')
            })
         })
     })

     describe('approving tokens', () => {
      let result
      let amount

      beforeEach(async () => {
         amount = tokens(100) //amount to be approved for exchange
         result = await token.approve(exchange, amount, { from: deployer })
         //approve x exchange for this amount from this wallet
         //coincideces with mapping of a mapping
      })

         describe('success', () => {
            it('allocates an allowance for delegated token spending on an exchange', async () => {
               const allowance = await token.allowance(deployer, exchange)
               allowance.toString().should.equal(amount.toString())
            })

            it('emits an Approval event', async () => { //async () => is passing in a function
               const log = result.logs[0]
               log.event.should.eq('Approval')
               const event = log.args
               event.owner.toString().should.equal(deployer, 'from is correct')
               event.spender.should.equal(exchange, 'to is correct')
               event.value.toString().should.equal(amount.toString(), 'value is correct')
             })
         })

         describe('failure', () => {
            it('', async () => {
               
            })
         })

     })
 })