const Exchange = artifacts.require("./Exchange") //get the contract
const Token = artifacts.require("./Token") //get the token inside this test


require('chai')                      //importing assertion library
.use(require('chai-as-promised'))
.should()                            //which asertions to import

import { assert } from 'chai'
import { tokens, EVM_REVERT, ETHER_ADDRESS, ether } from './helpers'

 contract('Exchange', ([deployer, feeAccount, user1, user2, rebalancer]) => { //second account is fee account
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
            //reminder that ether is expressed in wei 18 decimals
            amount = ether(1)
            
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
        await exchange.depositEther({ from: user1, value: ether(1) })
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
     
    describe('checking balances', async () => {
    let result
    let amount = ether(1)
        beforeEach(async () => { //deposit ether from user1
           await exchange.depositEther({ from: user1, value: ether(1) }) //value: cannot be variable
        })
        
        it('returns user balance', async () => {
           const result = await exchange.balanceOf(ETHER_ADDRESS, user1)
           result.toString().should.equal(ether(1).toString()) 
       }) 
    })

    describe('making orders', () => {
    let result

        beforeEach(async () => { //make order to buy 1 token for 1 ether
            result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 })
        })

        it('tracks the newly created order', async () => {
            const orderCount = await exchange.orderCount() //get the orderCount
            orderCount.toString().should.equal('1') //should be 1
            const order = await exchange.orders('1')  //check all values of matching mapping for_Order struct
            order.id.toString().should.equal('1', 'id is correct')
            order.user.should.equal(user1, 'user is correct')
            order.tokenGet.should.equal(token.address, 'tokenGet is correct')
            order.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
            order.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
            order.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
            order.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
            console.log(order.timestamp.toString())
        })

        it('emits an "Order" event', async () => {
            const log = result.logs[0]
            log.event.should.eq('Order')
            const event = log.args
            event.id.toString().should.equal('1', 'id is correct')
            event.user.should.equal(user1, 'user is correct')
            event.tokenGet.toString().should.equal(token.address, 'tokenGet is correct')
            event.amountGet.toString().should.equal(tokens(1).toString(), 'amountget is correct')
            event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
            event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
            event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
        })


    })
    //-------------------------------------------------------------------------------------------------------
    describe('order actions', async () => {  //large section
        let result

        beforeEach(async () => {
            // user1 deposits ether only
            await exchange.depositEther({ from: user1, value: ether(1) })
            // give tokens to user2
            await token.transfer(user2, tokens(100), { from: deployer })
            // user2 deposits tokens only
            //approve is necessary for an intermediary to transfer tokens from one account to another account
            await token.approve(exchange.address, tokens(2), { from: user2 })
            await exchange.depositToken(token.address, tokens(2), { from: user2 })
            //user1 makes an order to buy 1 token with 1 Ether
            await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 })
        })

        describe('filling orders', () => {
            let result

            describe('success', () => {
                beforeEach(async () => {
                  // user2 fills order
                  result = await exchange.fillOrder('1', { from: user2 })
                })
                //user2 should receive 10% less ether because fees
                it('executes the trade & charges fees', async () => {
                  let balance
                  balance = await exchange.balanceOf(token.address, user1)
                  balance.toString().should.equal(tokens(1).toString(), 'user1 received tokens')
                  balance = await exchange.balanceOf(ETHER_ADDRESS, user2)
                  balance.toString().should.equal(ether(1).toString(), 'user2 received Ether')
                  balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
                  balance.toString().should.equal('0', 'user1 Ether deducted')
                  balance = await exchange.balanceOf(token.address, user2)
                  balance.toString().should.equal(tokens(0.9).toString(), 'user2 tokens deducted with fee applied')
                  const feeAccount = await exchange.feeAccount()
                  balance = await exchange.balanceOf(token.address, feeAccount)
                  balance.toString().should.equal(tokens(0.1).toString(), 'feeAccount received fee')
                })
        
                it('updates filled orders', async () => {
                  const orderFilled = await exchange.orderFilled(1)
                  orderFilled.should.equal(true)
                })
        
                it('emits a "Trade" event', () => {
                  const log = result.logs[0]
                  log.event.should.eq('Trade')
                  const event = log.args
                  event.id.toString().should.equal('1', 'id is correct')
                  event.user.should.equal(user1, 'user is correct')
                  event.tokenGet.should.equal(token.address, 'tokenGet is correct')
                  event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
                  event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
                  event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
                  event.userFill.should.equal(user2, 'userFill is correct')
                  event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
                })
              })

              describe('failure', () => {

                it('rejects invalid order ids', () => {
                  const invalidOrderId = 99999
                  exchange.fillOrder(invalidOrderId, { from: user2 }).should.be.rejectedWith(EVM_REVERT)
                })
        
                it('rejects already-filled orders', () => {
                  // Fill the order
                  exchange.fillOrder('1', { from: user2 }).should.be.fulfilled
                  // Try to fill it again
                  exchange.fillOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
                })
        
                it('rejects cancelled orders', () => {
                  // Cancel the order
                  exchange.cancelOrder('1', { from: user1 }).should.be.fulfilled
                  // Try to fill the order
                  exchange.fillOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
                })
              })

        })
        //_____________________________
        
        
        describe('cancelling orders', () => {
            let result

            describe('success', async () => {
                beforeEach(async () => {
                    result = await exchange.cancelOrder('1', { from: user1 })
                })

                it('updates cancelled orders', async () => {
                    const orderCancelled = await exchange.orderCancelled(1)
                    orderCancelled.should.equal(true)
                })

                it('emits an "Cancel" event', async () => {
                    const log = result.logs[0]
                    log.event.should.eq('Cancel')
                    const event = log.args
                    event.id.toString().should.equal('1', 'id is correct')
                    event.user.should.equal(user1, 'user is correct')
                    event.tokenGet.toString().should.equal(token.address, 'tokenGet is correct')
                    event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
                    event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
                    event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
                    event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
                })

            })

            describe('failure', async () => {
                it('rejects invalid order ids', async () => {
                    const invalidOrderId = 99999
                    await exchange.cancelOrder(invalidOrderId, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
                })
    
                it('rejects unauthorized cancelations', async () => {
                    //Try to cancel the order from another user
                    await exchange.cancelOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
                })
            })
        })
    })
        //_____________________________
        describe('fillOrder()', () => {
            describe('Check balances after filling user1 buy Tokens order', () => {
              beforeEach(async () => {
                // user1 deposit 1 ETHER to the exchange
                await exchange.depositEther({from: user1, value: ether(1)})
                // user1 create order to buy 10 tokens for 1 ETHER
                await exchange.makeOrder(token.address, tokens(10), ETHER_ADDRESS, ether(1), {from: user1})
                // user2 gets tokens
                await token.transfer(user2, tokens(11), {from: deployer})
                // user2 approve exchange to spend his tokens
                await token.approve(exchange.address, tokens(11), {from: user2})
                // user2 deposit tokens + fee cost (1 token) to the exchange
                await exchange.depositToken(token.address, tokens(11), {from: user2})
                // user2 fills the order
                await exchange.fillOrder('1', {from: user2})
              })
        
              it('user1 tokens balance on exchange should eq. 10', async () => {
                await (await exchange.balanceOf(token.address, user1)).toString().should.eq(tokens(10).toString())
              })
        
              it('user1 ether balance on exchange should eq. 0', async () => {
                await (await exchange.balanceOf(ETHER_ADDRESS, user1)).toString().should.eq('0')
              })
        
              it('user2 tokens balance on exchange should eq. 0', async () => {
                await (await exchange.balanceOf(token.address, user2)).toString().should.eq('0')
              })
        
              it('user2 ether balance on exchange should eq. 1', async () => {
                await (await exchange.balanceOf(ETHER_ADDRESS, user2)).toString().should.eq(ether(1).toString())
              })
            })
        
            describe('Check balances after filling user1 buy Ether order', () => {
              beforeEach(async () => {
                // user1 Gets the 10 tokens
                await token.transfer(user1, tokens(10), {from: deployer})
                // user1 approve exchange to spend his tokens
                await token.approve(exchange.address, tokens(10), {from: user1})
                // user1 send tokens to the exchange 
                await exchange.depositToken(token.address, tokens(10), {from: user1})
                // user1 create order to buy 1 Ether for 10 tokens
                await exchange.makeOrder(ETHER_ADDRESS, ether(1), token.address, tokens(10), {from: user1})
                // user2 deposit 1 ETHER + fee cost (.1 ETH) to the exchange
                await exchange.depositEther({from: user2, value: ether(1.1)})
                // user2 fills the order
                await exchange.fillOrder('1', {from: user2})
              })
        
              it('user1 tokens balance on exchange should eq. 0', async () => {
                await (await exchange.balanceOf(token.address, user1)).toString().should.eq('0')
              })
        
              it('user1 Ether balance on exchange should eq. 1', async () => {
                await (await exchange.balanceOf(ETHER_ADDRESS, user1)).toString().should.eq(ether(1).toString())
              })
        
              it('user2 tokens balance on exchange should eq. 10', async () => {
                await (await exchange.balanceOf(token.address, user2)).toString().should.eq(tokens(10).toString())
              })
        
              it('user2 ether balance on exchange should eq. 0', async () => {
                await (await exchange.balanceOf(ETHER_ADDRESS, user2)).toString().should.eq('0')
              })
            })
          })
 })