// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IPool } from "./interfaces/IPool.sol";
import { IPoolAddressesProvider } from "./interfaces/IPoolAddressesProvider.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IFlashLoanSimpleReceiver {
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}

contract FlashLoanReceiver is IFlashLoanSimpleReceiver {
    IPoolAddressesProvider public immutable ADDRESSES_PROVIDER;
    IPool public immutable POOL;
    address public owner;

    constructor(address provider, address pool) {
        ADDRESSES_PROVIDER = IPoolAddressesProvider(provider);
        POOL = IPool(pool);
        owner = msg.sender;
    }

    function requestFlashLoan(address asset, uint256 amount) external {
        require(msg.sender == owner, "Not owner");

        POOL.flashLoanSimple(
            address(this),  // receiver
            asset,          // token to borrow
            amount,         // amount
            "",             // params
            0               // referralCode
        );
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata
    ) external override returns (bool) {
        require(msg.sender == address(POOL), "Not Aave Pool");
        require(initiator == address(this), "Not self");

        // ✅ Здесь можно вставить арбитраж/действия

        uint256 total = amount + premium;
        IERC20(asset).approve(address(POOL), total); // 💰 возвращаем с комиссией

        return true;
    }
}