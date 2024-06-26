// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FUDToken is ERC20, Ownable {
    uint256 private constant _maxSupply = 1500000 * 10**18;

    constructor(address _owner) ERC20("FUD Token", "FUD") Ownable(_owner) {
        _mint(msg.sender, _maxSupply); 
    }

    function maxSupply() public pure returns (uint256) {
        return _maxSupply;
    }
}
