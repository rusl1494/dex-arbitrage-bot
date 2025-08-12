// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract ArbitrageBot {
    address public owner;
    IUniswapV2Router02 public uniswapRouter;
    IUniswapV2Router02 public sushiswapRouter;

    event ExecutedSwap(string dexBought, string dexSold, uint amountIn, uint amountOut);
    event NoArbitrage(uint amountOutUni, uint amountOutSushi);

    constructor(address _uniswapRouter, address _sushiswapRouter) {
        owner = msg.sender;
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        sushiswapRouter = IUniswapV2Router02(_sushiswapRouter);
    }

    function executeArbitrage(
    uint amountIn,
    uint amountOutUni,
    uint amountOutSushi,
    uint minBuyOut,
    uint minSellOut,
    address[] calldata path,
    address[] calldata reverse,
    address tokenIn,
    address tokenOut,
    uint deadline
) external {
        uint amountOut = 0;

        if (amountOutUni > amountOutSushi) {
            // Buy on SushiSwap
            IERC20(tokenIn).approve(address(sushiswapRouter), amountIn);
            sushiswapRouter.swapExactTokensForTokens(amountIn, minBuyOut, path, address(this), deadline);

            // Sell on Uniswap
            uint tokenOutBalance = IERC20(tokenOut).balanceOf(address(this));
            IERC20(tokenOut).approve(address(uniswapRouter), tokenOutBalance);
            uint[] memory finalAmounts = uniswapRouter.swapExactTokensForTokens(
                tokenOutBalance,
                minSellOut,
                reverse,
                msg.sender,
                deadline
            );
            amountOut = finalAmounts[finalAmounts.length - 1];

            //require(amountOut > amountIn, "No profit");
            emit ExecutedSwap("X", "Y", amountIn, amountOut);
            emit ExecutedSwap("SushiSwap", "Uniswap", amountIn, amountOut);

        } else if (amountOutSushi > amountOutUni) {
            // Buy on Uniswap
            IERC20(tokenIn).approve(address(uniswapRouter), amountIn);
            uniswapRouter.swapExactTokensForTokens(amountIn, minBuyOut, path, address(this), deadline);

            // Sell on SushiSwap
            uint tokenOutBalance = IERC20(tokenOut).balanceOf(address(this));
            IERC20(tokenOut).approve(address(sushiswapRouter), tokenOutBalance);
            uint[] memory finalAmounts = sushiswapRouter.swapExactTokensForTokens(
                tokenOutBalance,
                minSellOut,
                reverse,
                msg.sender,
                deadline
            );
            amountOut = finalAmounts[finalAmounts.length - 1];

            //require(amountOut > amountIn, "No profit");
            emit ExecutedSwap("X", "Y", amountIn, amountOut);
            emit ExecutedSwap("Uniswap", "SushiSwap", amountIn, amountOut);
        } else {
            emit NoArbitrage(amountOutUni, amountOutSushi);
        }
    }
}
