import { get } from 'lodash' //provides us a lot of nice functions to use
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
