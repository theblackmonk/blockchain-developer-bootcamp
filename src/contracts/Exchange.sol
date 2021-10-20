// Deposit & Withdraw funds
// Manage Orders - Make or Cancel
// Handle Trades - Charge fees
pragma solidity ^0.5.0;

import "./Token.sol"; //will work for any erc20 token
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Exchange {
    using SafeMath for uint;

    //Variables
    address public feeAccount; // the account that recieves exchange fees
    uint256 public feePercent;
    //store Ether in tokens mapping with blank address
    address constant ETHER = address(0);
    //first key is the token, second key is the user address, final value is number of tokens help by user
    mapping(address => mapping(address => uint256)) public tokens;

    //Define the event
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);

    constructor (address _feeAccount, uint256 _feePercent) public {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    //fallback function to refund ether sent directly to the exchange
    function() external {
        revert();
    }
    //we need to send ether to exchange and keep track of balance
    //keep track of ether inside of the tokens mapping to save storage
    //ether doesn't have an address so we'll just use a blank address
    //you have an equivalent amount of ether stored per tokens bought
    //Solidity allows you to send/recieve ether inside of any function
    function depositEther() payable public {
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    function withdrawEther(uint256 _amount) public {
        require(tokens[ETHER][msg.sender] >= _amount); //they can't withdraw more than their balance
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
        msg.sender.transfer(_amount);
        emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
    }

    function depositToken(address _token, uint256 _amount) public {
        //Don't allow ether deposits by blocking ether address
        require(_token != ETHER);
        
        //Send token to this contract
        //add the require so nothing else happens if this trasnfer doesn't occur
        require(Token(_token).transferFrom(msg.sender, address(this), _amount)); //this smart contract we are currently in
        //add tokens to msg.sender in specified amount (update balance form tokens variable)
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
        //Emit event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint256 _amount) public {
        require(_token != ETHER);
        require(tokens[_token][msg.sender] >= _amount);
        tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
        require(Token(_token).transfer(msg.sender, _amount));
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }
    




}



// TODO:
// Set fee account
//Deposit 
