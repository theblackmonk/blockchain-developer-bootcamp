import React, { Component } from 'react'
import { connect } from 'react-redux'
import { exchangeSelector } from '../store/selectors'
import { loadAllOrders, subscribeToEvents } from '../store/interactions'
import  Trades  from './Trades' //Can't use curly braces with a default export
import OrderBook from './OrderBook'
import MyTransactions from './MyTransactions'
import PriceChart from './PriceChart'
import Balance from './Balance'
import NewOrder from './NewOrder'

class Content extends Component {
        componentDidMount() {           //component lifecycle change componentWillMount = componentDidmount
          this.loadBlockchainData(this.props) //passing in the value using props. Pretty neat
        }
        //if we restart ganache it will still know where the token is, move networks, redeploy, etc  
        //token is put here so we don't have to keep chainging address
        async loadBlockchainData(props) { //Capstone project part 2 video 1
          const { dispatch, exchange } = props
          await loadAllOrders(exchange, dispatch)
          await subscribeToEvents(exchange, dispatch) //refactored from this.props.exchange
        }

        render() {
          return (
            <div className="content">
              <div className="vertical-split">
                <Balance />
                <NewOrder />
              </div>
            <OrderBook />
            <div className="vertical-split">
                <PriceChart />
                <MyTransactions />
            </div>
        <Trades />
      </div>
          )
        }
      }

function mapStateToProps(state) {
  return {
    exchange: exchangeSelector(state)
  }
}

export default connect(mapStateToProps)(Content)
