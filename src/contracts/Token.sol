pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Token {
    using SafeMath for uint;

    //Variables
    string public name = "Pear Token";
    string public symbol = "PEAR";
    uint256 public decimals = 18;
    uint256 public totalSupply; //cannot be negative

    //Track balances
    mapping(address => uint256) public balanceOf; //map address to uint balance
    mapping(address => mapping(address => uint256))public allowance;
    //person who approved the tokens mapping to the address of specfic exchange and it's allowance
    //one person might approve multiple exchanges
    //Send tokens

    //Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() public {
        totalSupply = 1000000 * (10 ** decimals); //= 1000000 * (10 ** decimals)
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value);
        _transfer(msg.sender, _to, _value);
        return true;
    }

    function _transfer(address _from, address _to, uint256 _value) internal {
        require(_to != address(0)); //needs to be a valid address, not null
        balanceOf[_from] = balanceOf[_from].sub(_value);
        balanceOf[_to] = balanceOf[_to].add(_value);
        emit Transfer(_from, _to, _value);
    }

    //We need a way to approve a crypto exchange to spend our token
    //From two unknown addresses. They will do the transfer, not us

    //Approve
    //The spender is the exchange in this case
    function approve(address _spender, uint256 _value) public returns (bool success) {
        require(_spender != address(0)); //needs to be a valid address, not null
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_value <= balanceOf[_from]); //requesting less than or equal to balance
        require(_value <= allowance[_from][msg.sender]); //requesting less than or equal to balance
        allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
        //here we reset the allowance. So after one transfer the exchange is not allowed to transfer anymore
        _transfer(_from, _to, _value);
        return true;
    }

}