import { get, groupBy, reject, maxBy, minBy } from 'lodash' //provides us a lot of nice functions to use
import { createSelector } from 'reselect' //pre installed in package.json
import { ETHER_ADDRESS, tokens, ether, GREEN, RED } from '../helpers'
import moment from 'moment'  // formatting time

//use lodash to avoid error of no account
const account = state => get(state, 'web3.account') //state.web3.account, will run error if account does not exist

// long form createSelector(account, (account) => { return account })
// mid form createSelector(account, account => acount)
// short form createSelector(account, a => a)
export const accountSelector = createSelector(account, a => a)

const tokenLoaded = state => get(state, 'token.loaded', false)
export const tokenLoadedSelector = createSelector(tokenLoaded, tl => tl)

const exchangeLoaded = state => get(state, 'exchange.loaded', false)
export const exchangeLoadedSelector = createSelector(exchangeLoaded, el => el)

const exchange = state => get(state, 'exchange.contract')
export const exchangeSelector = createSelector(exchange, e => e)

export const contractsLoadedSelector = createSelector(
    tokenLoaded,
    exchangeLoaded,
    (tl, el) => (tl && el)
)

// All Orders
const allOrdersLoaded = state => get(state, 'exchange.allOrders.loaded', false)
const allOrders = state => get(state, 'exchange.allOrders.data', [])

// Cancelled orders
const cancelledOrdersLoaded = state => get(state, 'exchange.cancelledOrders.loaded', false)
export const cancelledOrdersLoadedSelector = createSelector(cancelledOrdersLoaded, loaded => loaded)

const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])
export const cancelledOrdersSelector = createSelector(cancelledOrders, o => o)

// Filled orders
const filledOrdersLoaded = state => get(state, 'exchange.filledOrders.loaded', false)
export const filledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

const filledOrders = state =>get(state, 'exchange.filledOrders.data', [])
export const filledOrdersSelector = createSelector(
    filledOrders,
    (orders) => {
        // Sort orders by date ascending for price comparison
        orders = orders.sort((a,b) => a.timestamp - b.timestamp)
        // Decorate the orders
        orders = decorateFilledOrders(orders)
        // Sort orders by date descending for display
        orders = orders.sort((a,b) => b.timestamp - a.timestamp)
        console.log("orders cancelled")
        console.log(orders)
    return orders   
    }
)

const decorateFilledOrders = (orders) => {
    // Track previous order to compare history
    let previousOrder = orders[0]
    return(
      orders.map((order) => {
        order = decorateOrder(order)
        order = decorateFilledOrder(order, previousOrder)
        previousOrder = order // Update the previous order once it's decorated
        return order
      })
    )
  }

const decorateOrder = (order) => {
    let etherAmount
    let tokenAmount
    // if tokenGive is ETHER then amountGet is token and vice versa
    if(order.tokenGive === ETHER_ADDRESS) {
        etherAmount = order.amountGive
        tokenAmount = order.amountGet
    } else {
        etherAmount = order.amountGet
        tokenAmount = order.amountGive
    }

    // Calculate token price to 5 decimal places
    const precision = 100000
    let tokenPrice = (etherAmount / tokenAmount)
    tokenPrice = Math.round(tokenPrice * precision) / precision
    //here we print to the console
    return({
        ...order,
        etherAmount: ether(etherAmount),
        tokenAmount: tokens(tokenAmount),
        tokenPrice,
        formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ss a M/D')
    })
}

const decorateFilledOrder = (order, previousOrder) => {
    return({
        ...order,
        tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder)
    })
}

const tokenPriceClass = (tokenPrice, orderId, previousOrder) => {
    //Show green price if only one order exists
    if(previousOrder.id === orderId){
        return GREEN
    }
    
    // Show green price if order price is higher than previous order
    // Show red price if order price lower than previous order
    if(previousOrder.tokenPrice <= tokenPrice) {
        return GREEN // success
    } else {
        return RED  // dnager
    }
}

const openOrders = state => {
    const all = allOrders(state)
    const cancelled = cancelledOrders(state)
    const filled = filledOrders(state)

    // Loop through open orders and reject orders that match a value. Lodash function
    const openOrders = reject(all, (order) => {  // pass in a function
        // we know it's a filled order if it exists inside array of filled orders and we want to reject it
        const orderFilled = filled.some((o) => o.id === order.id)
        // same thing for order cancelled. Don't include it in open orders
        const orderCancelled = cancelled.some((o) => o.id === order.id)
        return(orderFilled || orderCancelled) // if either is true reject it from open orders
    })
    return openOrders // open orders selected. We inject this into orderBookSelector
}

// If all these things are true then we know the orderbook has loaded. Used instead of a loaded boolean
const orderBookLoaded = state => cancelledOrdersLoaded(state) && filledOrdersLoaded(state) && allOrdersLoaded(state)
export const orderBookLoadedSelector = createSelector(orderBookLoaded, loaded => loaded)


// Create the order book
export const orderBookSelector = createSelector(
    openOrders,
    (orders) => {  // pass in a function
        // Decorate the orders
        orders = decorateOrderBookOrders(orders) // we must define this function
        // Group order by "orderType" aka buy or sell below
        orders = groupBy(orders, 'orderType')
        
        
    // Fetch buy orders using lodash function
        const buyOrders = get(orders, 'buy', [])
        // Sort buy orders by token price
        orders = {
            ...orders,  // higher price first
            buyOrders: buyOrders.sort((a,b) => b.tokenPrice - a.tokenPrice)
        }

    // Fetch sell orders
        const sellOrders = get(orders, 'sell', [])
        // Sort sell orders by token price
        orders = {
            ...orders,
            sellOrders: sellOrders.sort((a,b) => b.tokenPrice - a.tokenPrice)
        }

        return orders
    }
)

// define it here
const decorateOrderBookOrders = (orders) => {
    return(
        orders.map((order) => {
            order = decorateOrder(order)
            // Decorate order book order
            order = decorateOrderBookOrder(order)
            return(order)

        })
    )
}

// We will assign some css classes to these values to fill out our exchange like we want to
const decorateOrderBookOrder = (order) => { 
    const orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'
    return({
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? GREEN : RED),
        orderFillClass: orderType === 'buy' ? 'sell' : 'buy'
    })
}

//----------------------------------------------------------------------------------------------------
// My Transactions selectors. This fetches the data that fills the section
  //check to make sure the oders have been loaded
export const myFilledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

export const myFilledOrdersSelector = createSelector(
  account,
  filledOrders,
  (account, orders) => {
    // Find our orders
    orders = orders.filter((o) => o.user === account || o.userFill === account)
    // Sort by date ascending
    orders = orders.sort((a,b) => a.timestamp - b.timestamp)
    // Decorate orders - add display attributes
    orders = decorateMyFilledOrders(orders, account)
    return orders
  }
)

// Another decorate function
const decorateMyFilledOrders = (orders, account) => {
  return(
    orders.map((order) => {
      order = decorateOrder(order)
      order = decorateMyFilledOrder(order, account)
      return(order)
    })
  )
}

const decorateMyFilledOrder = (order, account) => {
  const myOrder = order.user === account // check if it is my (metamask) order

  let orderType
  if(myOrder) {
    orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell' // if tokenGive is ether it's a buy
  } else {
    orderType = order.tokenGive === ETHER_ADDRESS ? 'sell' : 'buy' // otherwise it's a token sell
  }

  return({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED),
    orderSign: (orderType === 'buy' ? '+' : '-')
  })
}

// if entire order book is loaded then open orders is also loaded
export const myOpenOrdersLoadedSelector = createSelector(orderBookLoaded, loaded => loaded)

export const myOpenOrdersSelector = createSelector(
  account,         // pass in account
  openOrders,      // pass in openOrders
  (account, orders) => { 
    // Filter orders created by current account
    orders = orders.filter((o) => o.user === account)
    // Decorate orders - add display attributes
    orders = decorateMyOpenOrders(orders)
    // Sort orders by date descending
    orders = orders.sort((a,b) => b.timestamp - a.timestamp)
    return orders
  }
)

const decorateMyOpenOrders = (orders, account) => {
  return(
    orders.map((order) => {
      order = decorateOrder(order)
      order = decorateMyOpenOrder(order, account)
      return(order)
    })
  )
}

const decorateMyOpenOrder = (order, account) => {
  let orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'

  return({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED)
  })
}

export const priceChartLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

export const priceChartSelector = createSelector(
  filledOrders,
  (orders) => {
    // Sort orders by date ascending to compare history
    orders = orders.sort((a,b) => a.timestamp - b.timestamp)
    // Decorate orders - add display attributes
    orders = orders.map((o) => decorateOrder(o))
    // Get last 2 order for final price & price change
    let secondLastOrder, lastOrder
    [secondLastOrder, lastOrder] = orders.slice(orders.length - 2, orders.length)
    // get last order price
    const lastPrice = get(lastOrder, 'tokenPrice', 0)
    // get second last order price
    const secondLastPrice = get(secondLastOrder, 'tokenPrice', 0)

    return({
      lastPrice,
      lastPriceChange: (lastPrice >= secondLastPrice ? '+' : '-'),
      series: [{
        data: buildGraphData(orders) // group candles by hour
      }]
    }) 
  }
)

const buildGraphData = (orders) => {
  // Group the orders by the hour for the graph  
  orders = groupBy(orders, (o) => moment.unix(o.timestamp).startOf('hour').format())
  // Get each hour where data exists
  const hours = Object.keys(orders)
  // Build the graph series
  const graphData = hours.map((hour) => {
    // Calculate price values for open high/low close
    const group = orders[hour]
    // Calculate price values - open, high, low, close using lodash maxBy minBy
    const open = group[0] // first order
    const high = maxBy(group, 'tokenPrice') // high price
    const low = minBy(group, 'tokenPrice') // low price
    const close = group[group.length - 1] // last order
    return({
      x: new Date(hour),
      y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice] 
    })
  })

    return graphData
}

const orderCancelling = state => get(state, 'exchange.orderCancelling', false)
export const orderCancellingSelector = createSelector(orderCancelling, status => status)

const orderFilling = state => get(state, 'exchange.orderFilling', false)
export const orderFillingSelector = createSelector(orderFilling, status => status)