import React, { Component } from 'react'
import { connect } from 'react-redux'
import { exchangeSelector } from '../store/selectors'
import { loadAllOrders } from '../store/interactions'
import  Trades  from './Trades' //Can't use curly braces with a default export
import OrderBook from './OrderBook'
import MyTransactions from './MyTransactions'

class Content extends Component {
        componentDidMount() {           //component lifecycle change componentWillMount = componentDidmount
          this.loadBlockchainData(this.props.dispatch) //passing in the value using props. Pretty neat
        }
        //if we restart ganache it will still know where the token is, move networks, redeploy, etc  
        //token is put here so we don't have to keep chainging address
        async loadBlockchainData(dispatch) { //Capstone project part 2 video 1
          await loadAllOrders(this.props.exchange, dispatch)
        }




  render() {
    return (
      <div className="content">
        <div className="vertical-split">
          <div className="card bg-dark text-white">
            <div className="card-header">
              Card Title 1
            </div>
            <div className="card-body">
              <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
              <a href="/#" className="card-link">Card link</a>
            </div>
          </div>
          <div className="card bg-dark text-white">
            <div className="card-header">
              Card Title 2
            </div>
            <div className="card-body">
              <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
              <a href="/#" className="card-link">Card link</a>
            </div>
          </div>
        </div>
        <OrderBook />
        <div className="vertical-split">
          <div className="card bg-dark text-white">
            <div className="card-header">
              Card Title 3
            </div>
            <div className="card-body">
              <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
              <a href="/#" className="card-link">Card link</a>
            </div>
          </div>
        </div>
        <div className="vertical-split">
          <div className="card bg-dark text-white">
            <div className="card-header">
              Card Title 4
            </div>
            <div className="card-body">
              <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
              <a href="/#" className="card-link">Card link</a>
            </div>
          </div>
            </div>
            <MyTransactions />
        <div className="vertical">
          <Trades />
        </div>
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
