import React, { Component } from 'react';
import './App.css';
import { connect } from 'react-redux'
import { loadWeb3, loadAccount, loadToken, loadExchange } from '../store/interactions' //We don't have to pass in (dispatch) it's passed down through props
import { contractsLoadedSelector } from '../store/selectors'
import Navbar from './Navbar'
import Content from './Content'

//by extending component we get a lot of react functions for free
class App extends Component {
  componentDidMount() {           //component lifecycle change componentWillMount = componentDidmount
    this.loadBlockchainData(this.props.dispatch) //passing in the value using props. Pretty neat
  }
  //if we restart ganache it will still know where the token is, move networks, redeploy, etc  
  //token is put here so we don't have to keep chainging address
  async loadBlockchainData(dispatch) { //Capstone project part 2 video 1
    //const web3 = new Web3(window.ethereum) //old format (Web3.givenProvider || 'http://localhost:7545')
    const web3 = await loadWeb3(dispatch)
    await web3.eth.net.getNetworkType()
    const networkId = await web3.eth.net.getId() //detects network changes. Does not switch live in browser. Not sure why
    await loadAccount(web3, dispatch) //web3.eth.getAccounts()    
    const token = await loadToken(web3, networkId, dispatch)          //new web3.eth.Contract(Token.abi, Token.networks[networkId].address)
    if(!token) {
      window.alert('Token smart contract not detected on the current network. Please select another network with Metamask')
      return
    }
    const exchange = await loadExchange(web3, networkId, dispatch)
    if(!exchange) {
      window.alert('Exchange smart contract not detected on the current network. Please select another network with Metamask.')
      return
    }
  }

  //{ this.props.contractsLoaded ? <Content /> : <div classname="content"></div> }
  render() {
    
  return (
    <div>
      <script src="http://localhost:7545"></script>
      <Navbar />
      { this.props.contractsLoaded ? <Content /> : <div className="content"></div> }
    </div>
    );
  }
}

// Here we have access to state
function mapStateToProps(state) {
  return {
    contractsLoaded: contractsLoadedSelector(state)
  }
}

export default connect(mapStateToProps)(App);
