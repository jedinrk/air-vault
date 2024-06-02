// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AirVault is Ownable {
    IERC20 public fudToken;
    IERC20 public winToken;
    uint256 public blockInterval; // Block Interval in which we want to airdrop WIN tokens
    uint256 public totalDeposits; // Total FUD tokens deposited to the AirVault

    struct DepositInfo {
        uint256 amount; // amount of FUD Token deposited
        uint256 blockNumber; // Block number at which FUD token was deposited
    }

    mapping(address => DepositInfo[]) public userDeposits; // Deposits per user
    mapping(address => uint256) public userDepositBalance; // Total FUD token deposit by each address

    event Deposited(address indexed user, uint256 amount, uint256 newBalance);
    event Withdrawn(address indexed user, uint256 amount, uint256 newBalance);

    constructor(
        IERC20 _fudToken,
        IERC20 _winToken,
        uint256 _blockInterval,
        address _owner
    ) Ownable(_owner) {
        fudToken = _fudToken;
        winToken = _winToken;
        blockInterval = _blockInterval;
    }

    /**  
     * Locks tokens in the AirVault contract. 
     * Each FUD token deposit corresponding to each user is tracked under the `userDeposits`
     * Total FUD token deposited by a user is also updated.
     * */
    function deposit(uint256 amount) external returns (bool) {
        require(
            fudToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        DepositInfo memory newDeposit = DepositInfo({
            amount: amount,
            blockNumber: block.number
        });

        userDeposits[msg.sender].push(newDeposit);
        userDepositBalance[msg.sender] += amount;
        totalDeposits += amount;

        emit Deposited(msg.sender, amount, userDepositBalance[msg.sender]);
        return true;
    }

    /**
     * Withdraws deposited FUD tokens for the requesting user.
     */
    function withdraw(uint256 amount) external returns (bool) {
        require(
            userDepositBalance[msg.sender] >= amount,
            "Insufficient balance for the user"
        );

        /**
         * When withdrawing we have to iterate through each deposits of the user in descending order. 
         * We substracts the amount from each particular deposit until the total amount to be withdrawn is collected.
         * The amount for each particular deposit is also updated accordingly as we collect the required amount.
         */
        uint256 remainingAmountToWithdraw = amount;
        for (uint256 i = userDeposits[msg.sender].length; i > 0; i--) {
            if (remainingAmountToWithdraw == 0) break;

            DepositInfo storage depositInfo = userDeposits[msg.sender][i - 1];

            if (depositInfo.amount > remainingAmountToWithdraw) {
                depositInfo.amount -= remainingAmountToWithdraw; //Updating particular DepositInfo amount by subtracting the amount to be withdrawn
                remainingAmountToWithdraw = 0;
            } else {
                remainingAmountToWithdraw -= depositInfo.amount;
                depositInfo.amount = 0; //Updating particular DepositInfo amount to zero as the complete amount is collected.
            }
        }

        userDepositBalance[msg.sender] -= amount;
        totalDeposits -= amount;
        require(fudToken.transfer(msg.sender, amount), "Transfer failed");

        emit Withdrawn(msg.sender, amount, userDepositBalance[msg.sender]);
        return true;
    }

    /**
     * Provides FUD tokens a specific address has deposited to the AirVault
     */
    function lockedBalanceOf(address account) external view returns (uint256) {
        return userDepositBalance[account];
    }

    function updateBlockInterval(uint256 _blockInterval) external returns(bool){
        blockInterval = _blockInterval;
        return true;
    }
}
