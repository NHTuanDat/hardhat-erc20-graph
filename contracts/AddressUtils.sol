// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

library AddressUtils {
    function isContract(address _addr)
        internal
        view
        returns (bool)
    {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }
}
