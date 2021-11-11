// Handles all blockchain interactions and updating some redux
import Web3 from 'web3'
import Token from '../abis/Token.json'
import Exchange from '../abis/Exchange.json'
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
    orderFilled
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