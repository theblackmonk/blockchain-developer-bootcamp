// Handles all blockchain interactions and updating some redux
import Web3 from 'web3'
import Token from '../abis/Token.json'
import Exchange from '../abis/Exchange.json'
import { ETHER_ADDRESS } from '../helpers'
import { 
    web3Loaded,
    web3AccountLoaded,
    tokenLoaded,
    exchangeLoaded,
    cancelledOrdersLoaded,
    filledOrdersLoaded,
    allOrdersLoaded,
    orderCancelling,
    orderCancelled,
    orderFilling,
    orderFilled,
    etherBalanceLoaded,
    tokenBalanceLoaded,
    exchangeEtherBalanceLoaded,
    exchangeTokenBalanceLoaded,
    balancesLoaded,
    balancesLoading
 } from './actions'

// dispatch comes from redux. It means we want to trigger an action and dispatch it with redux
export const loadWeb3 = async (dispatch) => {
    if(typeof window.ethereum!=='undefined'){
      const web3 = new Web3(window.ethereum) //old format (Web3.givenProvider || 'http://localhost:7545')
      dispatch(web3Loaded(web3))  //comes from actions file
      return web3
    } else {
      window.alert('Please install MetaMask')
      window.location.assign("https://metamask.io/")
    }
  }

export const loadAccount = async (web3, dispatch) => {
    const accounts = await web3.eth.getAccounts()
    const account = await accounts[0] //grab the first account
    if(typeof account !== 'undefined'){
      dispatch(web3AccountLoaded(account)) //comes from actions file
      return account
    } else {
      window.alert('Please login with MetaMask')
      return null
    }
  }

export const loadToken = async (web3, networkId, dispatch) => {
    try {
        //console.log("abi", Token.abi) //console log abi
        //console.log("address", Token.networks[networkId].address)  //will break if we switch networks
        const token = new web3.eth.Contract(Token.abi, Token.networks[networkId].address)
        dispatch(tokenLoaded(token))
        //console.log("successful token load")
        return token
    } catch (error) {
        //window.alert
        console.log('Contract not deployed to the current network. Please select another network with Metamask.')
        //console.log("token load failed")
        return null
    }
}

export const loadExchange = async (web3, networkId, dispatch) => {
    try {
        const exchange = new web3.eth.Contract(Exchange.abi, Exchange.networks[networkId].address)
        dispatch(exchangeLoaded(exchange))
        //console.log("successful exchange load")
        return exchange
    } catch (error) {
        console.log('Contract not deployed to the current network. Please select another network with Metamask.')
        //console.log("exchange load failed")
        return null
    }
}

export const loadAllOrders = async (exchange, dispatch) => {
    // Fetch cancelled order with the "Cancel" event stream
    const cancelStream = await exchange.getPastEvents('Cancel', { fromBlock: 0, toBlock: 'latest' })
    const cancelledOrders = cancelStream.map((event) => event.returnValues)
    //console.log(cancelledOrders)
    dispatch(cancelledOrdersLoaded(cancelledOrders))
    
    // Fetch filled orders with the "Trade" event stream
    const tradeStream = await exchange.getPastEvents('Trade', { fromBlock: 0, toBlock: 'latest' })
    // Format filled orders
    const filledOrders = tradeStream.map((event) => event.returnValues)
    // Add cancelled orders to the redux store
    dispatch(filledOrdersLoaded(filledOrders))

    // Fetch all orders with the "Order"
    const orderStream = await exchange.getPastEvents('Order', { fromBlock: 0, toBlock: 'latest' })
    // Format order stream
    const allOrders = orderStream.map((event) => event.returnValues)
    // Add open orders to the redux store
    dispatch(allOrdersLoaded(allOrders))
}

//responding to an event using web3
export const subscribeToEvents = async (exchange, dispatch) => { 
  exchange.events.Cancel({}, (error, event) => {
    dispatch(orderCancelled(event.returnValues)) //dispatch a redux action corresponding to blockchain event
  })

  exchange.events.Trade({}, (error, event) => {
    dispatch(orderFilled(event.returnValues))
  })

  exchange.events.Deposit({}, (error, event) => {
    dispatch(balancesLoaded())
  })

  exchange.events.Withdraw({}, (error, event) => {
    dispatch(balancesLoaded())
  })
}

export const cancelOrder = (dispatch, exchange, order, account) => {
  exchange.methods.cancelOrder(order.id).send({ from: account })
  // good for client side transactions
  // in web3 documentation under ,methods.myMethod.send we use event emitter
  .on('transactionHash', (hash) => {  // order Cancelling event (then order cancelled event after confirmation)
     dispatch(orderCancelling())      
  })
  .on('error', (error) => {
    console.log(error)
    window.alert('There was an error!')
  })
}

export const fillOrder = (dispatch, exchange, order, account) => {
  exchange.methods.fillOrder(order.id).send({ from: account })
  .on('transactionHash', (hash) => {
     dispatch(orderFilling())
  })
  .on('error', (error) => {
    console.log(error)
    window.alert('There was an error!')
  })
}

export const loadBalances = async (dispatch, web3, exchange, token, account) => {
  if(typeof account !== 'undefined') {
      // Ether balance in wallet
      const etherBalance = await web3.eth.getBalance(account)
      dispatch(etherBalanceLoaded(etherBalance))

      // Token balance in wallet
      const tokenBalance = await token.methods.balanceOf(account).call()
      dispatch(tokenBalanceLoaded(tokenBalance))

      // Ether balance in exchange
      const exchangeEtherBalance = await exchange.methods.balanceOf(ETHER_ADDRESS, account).call()
      dispatch(exchangeEtherBalanceLoaded(exchangeEtherBalance))

      // Token balance in exchange
      const exchangeTokenBalance = await exchange.methods.balanceOf(token.options.address, account).call()
      dispatch(exchangeTokenBalanceLoaded(exchangeTokenBalance))

      // Trigger all balances loaded
      dispatch(balancesLoaded())
    } else {
      window.alert('Please login with MetaMask')
    }
}

export const depositEther = (dispatch, exchange, web3, amount, account) => {
  exchange.methods.depositEther().send({ from: account,  value: web3.utils.toWei(amount, 'ether') })
  .on('transactionHash', (hash) => {
    dispatch(balancesLoading())
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`There was an error!`)
  })
}

export const withdrawEther = (dispatch, exchange, web3, amount, account) => {
  exchange.methods.withdrawEther(web3.utils.toWei(amount, 'ether')).send({ from: account })
  .on('transactionHash', (hash) => {
    dispatch(balancesLoading())
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`There was an error!`)
  })
}

export const depositToken = (dispatch, exchange, web3, token, amount, account) => {
  amount = web3.utils.toWei(amount, 'ether')

  token.methods.approve(exchange.options.address, amount).send({ from: account })
  .on('transactionHash', (hash) => {
    exchange.methods.depositToken(token.options.address, amount).send({ from: account })
    .on('transactionHash', (hash) => {
      dispatch(balancesLoading())
    })
    .on('error',(error) => {
      console.error(error)
      window.alert(`There was an error!`)
    })
  })
}

export const withdrawToken = (dispatch, exchange, web3, token, amount, account) => {
  exchange.methods.withdrawToken(token.options.address, web3.utils.toWei(amount, 'ether')).send({ from: account })
  .on('transactionHash', (hash) => {
    dispatch(balancesLoading())
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`There was an error!`)
  })
}