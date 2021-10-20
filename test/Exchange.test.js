const Exchange = artifacts.require("./Exchange") //get the contract
const Token = artifacts.require("./Token") //get the token inside this test


require('chai')                      //importing assertion library
.use(require('chai-as-promised'))
.should()                            //which asertions to import

import { assert } from 'chai'
import { tokens, EVM_REVERT, ETHER_ADDRESS, ether } from './helpers'

 contract('Exchange', ([deployer, feeAccount, user1]) => { //second account is fee account
    let exchange
    let token
    const feePercent = 10
    
    
    

    beforeEach(async () => {
        //pass in fee account as argument to contract constructor
        //Deploy exchange
        exchange = await Exchange.new(feeAccount, feePercent)
        
        //Deploy token
        token = await Token.new() 
        
        //Transfer some tokens to user1
        token.transfer(user1, tokens(100), { from: deployer })
    })

    describe('deployment', async () => {
        it('tracks the fee account', async () => {
            const result = await exchange.feeAccount()
            result.should.equal(feeAccount)
        })

        it('tracks the fee percent', async () => {
            const result = await exchange.feePercent()
            result.toString().should.equal(feePercent.toString())
        })


     })

    describe('fallback', async () => {
        it('reverts when Ether is sent', async () => {
            //basic send ethereum transaction
            await exchange.sendTransaction({ value: 1, from: user1 }).should.be.rejectedWith(EVM_REVERT)
        })
    }) 

    describe('deposit Ether', () => {
        let result
        let amount

        
        beforeEach(async () => {
            amount = ether(1)
            //reminder that ether is expressed in wei 18 decimals
            result = await exchange.depositEther({ from: user1, value: amount })
        })

        it('tracks ether deposit', async () => {
            const balance = await exchange.tokens(ETHER_ADDRESS, user1)
            balance.toString().should.equal(amount.toString())
        })

        it('emits a Deposit Ether event', async () => { //async () => is passing in a function
            const log = result.logs[0]
            log.event.should.eq('Deposit')
            const event = log.args
            event.token.should.equal(ETHER_ADDRESS, 'token address is correct')
            event.user.should.equal(user1, 'user address is correct')
            event.amount.toString().should.equal(amount.toString(), 'amount is correct')
            event.balance.toString().should.equal(amount.toString(), 'balance is correct')
        })
    })

    describe('withdrawing Ether', () => {
    let result
    let amount

    beforeEach(async () => {
        //Deposit ether first
        amount = ether(1)
        await exchange.depositEther({ from: user1, value: amount })
    })
        describe('success', () => {
            beforeEach(async () => {
                //Withdraw Ether
                result = await exchange.withdrawEther(amount, { from: user1 })
            })
            it('withdraw Ether funds', async () => {
                const balance = await exchange.tokens(ETHER_ADDRESS, user1)
                balance.toString().should.equal('0')
            })
            it('emits a Withdraw Ether event', async () => { //async () => is passing in a function
                const log = result.logs[0]
                log.event.should.eq('Withdraw')
                const event = log.args
                event.token.should.equal(ETHER_ADDRESS)
                event.user.should.equal(user1)
                event.amount.toString().should.equal(amount.toString())
                event.balance.toString().should.equal('0')
            })
        })

        describe('failure', () => {
            it('user cannot withdraw more than their balance', async () => {
                await exchange.withdrawEther(ether(100), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
        })
        
    })

    describe('depositing tokens', () => {
        let result
        let amount
        
        describe('success', () => {
            //run approve and deposit to exchange for successful tokens only
            beforeEach(async () => {
                amount = tokens(10)
                //approve the exchange to move tokens for us
                await token.approve(exchange.address, tokens(10), { from: user1 }) //user1 is deployer
                result = await exchange.depositToken(token.address, tokens(10), { from: user1 })
            })

            it('tracks the token deposit', async () => {
                //Check exchange token balance
                let balance
                balance = await token.balanceOf(exchange.address)
                balance.toString().should.equal(amount.toString())
                //Check tokens on exchange
                balance = await exchange.tokens(token.address, user1)
                balance.toString().should.equal(amount.toString())
            })
            
            it('emits a Deposit event', async () => { //async () => is passing in a function
                const log = result.logs[0]
                log.event.should.eq('Deposit')
                const event = log.args
                event.token.should.equal(token.address, 'token address is correct')
                event.user.should.equal(user1, 'user address is correct')
                event.amount.toString().should.equal(amount.toString(), 'amount is correct')
                event.balance.toString().should.equal(amount.toString(), 'balance is correct')
            })
        })
        describe('failure', () => {
            it('rejects Ether deposits', async () => {
                //Rejects ether deposits
                await exchange.depositToken(ETHER_ADDRESS, amount, { from: user1, value: 10}).should.be.rejectedWith(EVM_REVERT)
            })
            

            it('fails when no tokens are approved', async () =>{
            //lets try and transfer the token without approving it first
            await exchange.depositToken(token.address, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
        })


    })

    describe('withdrawing tokens', () => {
        let result
        let amount

        describe('success', () => {
            beforeEach(async () => {
                //Deposit tokens first
                amount = tokens(10)
                await token.approve(exchange.address, amount, { from: user1 })
                await exchange.depositToken(token.address, amount, { from: user1 })

                result = await exchange.withdrawToken(token.address, amount, { from: user1 })
            })

            it('withdraws token funds', async () => {
                const balance = await exchange.tokens(token.address, user1)
                balance.toString().should.equal('0')
            })
           
            it('emits a Withdraw tokens event', async () => { //async () => is passing in a function
                const log = result.logs[0]
                log.event.should.eq('Withdraw')
                const event = log.args
                event.token.should.equal(token.address)
                event.user.should.equal(user1)
                event.amount.toString().should.equal(amount.toString())
                event.balance.toString().should.equal('0')
            })
        })

        describe('failure', () => {
            it('user cannot withdraw ETHER', async () => {
                await exchange.withdrawToken(ETHER_ADDRESS, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
            
            it('user cannot withdraw more than their balance', async () => {
                await exchange.withdrawToken(token.address, tokens(100), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
            
        })
            
        })
     
     
 })