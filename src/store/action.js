// This is a basic redux action
// WEB3
export function web3Loaded(connection) {
    return {
        type: 'WEB3_LOADED',
        connection //same as saying connection: connection
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

