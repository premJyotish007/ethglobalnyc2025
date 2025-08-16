// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;
pragma abicoder v2;

import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';

contract SwapExamples {
    ISwapRouter public immutable swapRouter;

    uint24 public constant poolFee = 3000; // 0.3%

    constructor(ISwapRouter _swapRouter) {
        swapRouter = _swapRouter;
    }

    /// @notice swapExactInputSingle swaps a fixed amount of tokenIn for a maximum possible amount of tokenOut
    /// @param tokenIn Address of the token to swap from
    /// @param tokenOut Address of the token to swap to
    /// @param amountIn Exact amount of tokenIn to spend
    /// @return amountOut Amount of tokenOut received
    function swapExactInputSingle(
        address tokenIn,
        address tokenOut,
        address recipient,
        uint256 amountIn
    ) external returns (uint256 amountOut) {
        // Transfer tokenIn from caller to this contract
        TransferHelper.safeTransferFrom(tokenIn, recipient, address(this), amountIn);

        // Approve swapRouter to spend tokenIn
        TransferHelper.safeApprove(tokenIn, address(swapRouter), amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: poolFee,
            recipient: recipient,
            deadline: block.timestamp,
            amountIn: amountIn,
            amountOutMinimum: 0, // In production, use slippage control
            sqrtPriceLimitX96: 0
        });

        // Execute swap
        amountOut = swapRouter.exactInputSingle(params);
    }

    /// @notice swapExactOutputSingle swaps as little as possible of tokenIn for an exact amount of tokenOut
    /// @param tokenIn Address of the token to swap from
    /// @param tokenOut Address of the token to swap to
    /// @param amountOut Exact amount of tokenOut desired
    /// @param amountInMaximum Max amount of tokenIn to spend
    /// @return amountIn Actual amount of tokenIn spent
    function swapExactOutputSingle(
        address tokenIn,
        address tokenOut,
        address recipient,
        uint256 amountOut,
        uint256 amountInMaximum
    ) external returns (uint256 amountIn) {
        // Transfer max tokenIn from caller to this contract
        TransferHelper.safeTransferFrom(tokenIn, recipient, address(this), amountInMaximum);

        // Approve swapRouter to spend tokenIn
        TransferHelper.safeApprove(tokenIn, address(swapRouter), amountInMaximum);

        ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter.ExactOutputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: poolFee,
            recipient: recipient,
            deadline: block.timestamp,
            amountOut: amountOut,
            amountInMaximum: amountInMaximum,
            sqrtPriceLimitX96: 0
        });

        // Execute swap
        amountIn = swapRouter.exactOutputSingle(params);

        // Refund unused tokenIn if any
        if (amountIn < amountInMaximum) {
            TransferHelper.safeApprove(tokenIn, address(swapRouter), 0);
            TransferHelper.safeTransfer(tokenIn, msg.sender, amountInMaximum - amountIn);
        }
    }
}
