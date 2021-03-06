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
    mapping(uint256 => _Order) public orders;  //The key will be a uint256
    uint256 public orderCount; //keeps track of our orders as counter cache
    mapping(uint256 => bool) public orderCancelled;
    mapping(uint256 => bool) public orderFilled; //mapping for was true/false the order filled

    //Events
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);
    event Order(uint id, address user, address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint timestamp);
    event Cancel(uint id, address user, address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint timestamp);
    //address userFill is the user that filled the order
    event Trade(uint id, address user, address tokenGet, uint amountGet, address tokenGive, uint amountGive, address userFill, uint timestamp);

    struct _Order {  //use _ to avoid naming conflict with event Order used outside contract
        uint id;      //uint = uint256
        address user;
        address tokenGet;
        uint amountGet;
        address tokenGive;
        uint amountGive;
        uint timestamp;
    }

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

    function balanceOf(address _token, address _user) public view returns (uint256) {
        return tokens[_token][_user];
    }

    function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
        orderCount = orderCount.add(1);
        //orders is a mapping of the struct _Order
        orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now); //now is counted in epoch time seconds
        emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
    }

    //requires could be improved
    function cancelOrder(uint256 _id) public {
       //point to struct _Order
       //Pass in id. Id maps to a _order of type _Order struct fetched from storage
       _Order storage _order = orders[_id];
        require(address(_order.user) == msg.sender); //require msg.sender modifies order they made
        require(_order.id == _id); //order must exist
        require(_id > 0 && _id <= orderCount); //id is > 0 and it exists in our list
       //Must be "my" order. Can't cancel someone else's order
       //Must be a valid order
        orderCancelled[_id] = true;
        emit Cancel(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, now);
    }
    
    function fillOrder(uint256 _id) public {
        require(_id > 0 && _id <= orderCount); //id is > 0 and it exists in our list
        require(!orderFilled[_id]); //the order has not already been filled
        require(!orderCancelled[_id]); //the order has not been cancelled
        //Fetch the order
        _Order storage _order = orders[_id]; //fetch order struct given id
        _trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);
        orderFilled[_order.id] = true; //mark as filled
    }
    
    //internal means it can only be called inside
    function _trade(uint256 _orderId, address _user, address _tokenGet, uint _amountGet, address _tokenGive, uint256 _amountGive) internal {
        // Fee paid by user that fills the order a.k.a msg.sender
        uint256 _feeAmount = _amountGet.mul(feePercent).div(100); //get the fee
        
        //Do the trade (msg.sender is using the order, )
        tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount));
        tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet);
        tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount].add(_feeAmount);
        tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive);
        tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(_amountGive);
        //emit a trade event
        emit Trade(_orderId, _user, _tokenGet, _amountGet, _tokenGive, _amountGive, msg.sender, now);
    }


     
}



// TODO:
// Set fee account
//Deposit 
