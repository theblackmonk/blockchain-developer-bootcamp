import { get } from 'lodash' //provides us a lot of nice functions to use
import { createSelector } from 'reselect' //pre installed in package.json

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
);
