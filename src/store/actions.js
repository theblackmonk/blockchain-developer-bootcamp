// This is a basic redux action
// WEB3
//same as saying connection: connection
export function web3Loaded(connection) {
    return {
        type: 'WEB3_LOADED',
        connection 
    }
}

export function web3AccountLoaded(account) {
    return {
        type: 'WEB3_ACCOUNT_LOADED',
        account
    }
}

// TOKEN
export function tokenLoaded(contract) {
    return {
        type: 'TOKEN_LOADED',
        contract
    }
}

// EXCHANGE
export function exchangeLoaded(contract) {
    return {
        type: 'EXCHANGE_LOADED',
        contract
    }
}

// Cancelled Orders
export function cancelledOrdersLoaded(cancelledOrders) {
    return {
        type: 'CANCELLED_ORDERS_LOADED',
        cancelledOrders
    }
}

// filledOrdersLoaded
export function filledOrdersLoaded(filledOrders) {
    return {
        type: 'FILLED_ORDERS_LOADED',
        filledOrders
    }
}

// allOrdersLoaded
export function allOrdersLoaded(allOrders) {
    return {
        type: 'ALL_ORDERS_LOADED',
        allOrders
    }
}

// Cancel Order
export function orderCancelling() {  //returns no data since we only care about status
    return {
      type: 'ORDER_CANCELLING'
    }
  }
  
  export function orderCancelled(order) {
    return {
      type: 'ORDER_CANCELLED',
      order   //pass in order data
    }
  }

  // Fill Order
export function orderFilling() {
    return {
      type: 'ORDER_FILLING'
    }
  }
  
  export function orderFilled(order) {
    return {
      type: 'ORDER_FILLED',
      order
    }
  }
