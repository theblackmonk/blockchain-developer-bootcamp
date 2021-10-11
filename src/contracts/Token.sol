pragma solidity ^0.5.0;

contract Token {
    string public name = "Pear Token";
    string public symbol = "PEAR";
    uint256 public decimals = 1;
    uint256 public totalSupply; //cannot be negative

    //Track balances
    mapping(address => uint256) public balanceOf; //map address to uint balance
    //Send tokens

    constructor() public {
        totalSupply = 100 * (1 ** decimals); //= 1000000 * (10 ** decimals)
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        balanceOf[msg.sender] = balanceOf[msg.sender] - (_value);
        balanceOf[_to] = balanceOf[_to] + (_value);
        return true;
    }
}