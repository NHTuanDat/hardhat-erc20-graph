// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
// pragma solidity ^0.7.6;

import "./AddressUtils.sol";
import "./interfaces/IERC1820.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IERC777.sol";
import "./interfaces/IERC777Hooks.sol";

error ABCToken__BurnFromNoOne();
error ABCToken__ERC777InterfaceNotImplemented();
error ABCToken__NotAuthorized();
error ABCToken__NotEnoughBalance();
error ABCToken__NotImplemented();
error ABCToken__RecipientRevert();
error ABCToken__SameHolderAndOperator();
error ABCToken__SendAmountNotDivisible();
error ABCToken__SendTokenToNoOne();
error ABCToken__NotEnoughAllowance();

/// TODO: add ERC20 compatiple
contract ABCToken is ERC777Token, Token {
    using AddressUtils for address;
    uint256 internal _totalTokenSupply;
    uint256 internal constant _GRANULARITY = 1;

    mapping(address => uint256) internal _addressBalance;

    // address internal immutable i_deployer;
    // address[] holders;
    mapping(address => mapping(address => bool))
        internal _holderOperators;

    mapping(address => mapping(address => uint256))
        internal _holderOperatorsAllowance;

    // TODO: CHANGE TO THE CORRECT ADDRESS BEFORE DEPLOY
    IERC1820Registry internal constant _ERC1820_REGISTRY =
        IERC1820Registry(
            0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24
        );

    constructor() {
        _addressBalance[msg.sender] = 101e18;
        _totalTokenSupply = 101e18;
    }

    /// Get the name of the token
    function name()
        external
        pure
        override(ERC777Token, Token)
        returns (string memory)
    {
        return "Alphabet";
    }

    /// Get the symbol of the token
    function symbol()
        external
        pure
        override(ERC777Token, Token)
        returns (string memory)
    {
        return "ABC";
    }

    /// Get the total number of minted tokens.
    function totalSupply()
        external
        view
        override(ERC777Token, Token)
        returns (uint256)
    {
        return _totalTokenSupply;
    }

    /// Get the balance of the account with address holder .
    /// The balance MUST be zero ( 0 ) or higher.
    function balanceOf(address holder)
        external
        view
        override(ERC777Token, Token)
        returns (uint256)
    {
        return _addressBalance[holder];
    }

    /// Get the smallest part of the token that’s not divisible.
    function granularity()
        external
        pure
        override
        returns (uint256)
    {
        return _GRANULARITY;
    }

    /// Get the list of default operators as defined by the token contract.
    function defaultOperators()
        external
        pure
        override
        returns (address[] memory)
    {
        address[] memory operators;
        // operators[0] = msg.sender;
        // operators[1] = i_deployer;
        return operators;
    }

    /// Indicate whether the operator address is an operator of the holder address.
    function isOperatorFor(address operator, address holder)
        public
        view
        override
        returns (bool)
    {
        if (holder == operator) {
            return true;
        }

        return _holderOperators[holder][operator];
    }

    /// Set a third party operator address as an operator of msg.sender to send and burn tokens on its behalf.
    function authorizeOperator(address operator)
        external
        override
    {
        if (msg.sender == operator)
            revert ABCToken__SameHolderAndOperator();

        _holderOperators[msg.sender][operator] = true;
        emit AuthorizedOperator(operator, msg.sender);
    }

    /// Remove the right of the operator address to be an operator for msg.sender and to send and burn tokens on its behalf.
    function revokeOperator(address operator)
        external
        override
    {
        if (msg.sender == operator)
            revert ABCToken__SameHolderAndOperator();

        _holderOperators[msg.sender][operator] = false;
        emit RevokedOperator(operator, msg.sender);
    }

    /// Send the 'amount' of tokens from the address 'msg.sender' to the address 'to' .
    function send(
        address to,
        uint256 amount,
        bytes calldata data
    ) external override {
        operatorSend(
            msg.sender,
            to,
            amount,
            data,
            bytes("")
        );
    }

    /// Send the 'amount' of tokens on behalf of the address 'from' to the address 'to'.
    function operatorSend(
        address from,
        address to,
        uint256 amount,
        bytes memory data,
        bytes memory operatorData
    ) public override {
        // Simple first error check
        _basicRevertCheck(from, amount);
        if (to == address(0))
            revert ABCToken__SendTokenToNoOne();

        // recipient ERC777
        address recipientImplementerAddress = _ERC1820_REGISTRY
                .getInterfaceImplementer(
                    to,
                    keccak256("ERC777TokensRecipient")
                );

        if (
            to.isContract() &&
            recipientImplementerAddress == address(0)
        ) revert ABCToken__ERC777InterfaceNotImplemented();

        // call holder ERC777 hook before changing state
        _callTokenToSendHook(
            msg.sender,
            from,
            to,
            amount,
            data,
            operatorData
        );

        // Changing State
        _addressBalance[from] -= amount;
        _addressBalance[to] += amount;
        if (!isOperatorFor(msg.sender, from)) {
            _holderOperatorsAllowance[from][
                msg.sender
            ] -= amount;
        }
        // call recipient ERC777 hook after changing state.
        // Revert if recipient revert.

        if (recipientImplementerAddress != address(0)) {
            try
                IERC777Recipient(
                    recipientImplementerAddress
                ).tokensReceived(
                        msg.sender,
                        from,
                        to,
                        amount,
                        data,
                        operatorData
                    )
            {} catch {
                _addressBalance[from] += amount;
                _addressBalance[to] -= amount;
                revert ABCToken__RecipientRevert();
            }
        }

        emit Sent(
            msg.sender,
            from,
            to,
            amount,
            data,
            operatorData
        );

        emit Transfer(from, to, amount);
    }

    function burn(uint256 amount, bytes calldata data)
        external
        override
    {
        operatorBurn(msg.sender, amount, data, bytes(""));
    }

    function operatorBurn(
        address from,
        uint256 amount,
        bytes calldata data,
        bytes memory operatorData
    ) public override {
        if (from == address(0))
            revert ABCToken__BurnFromNoOne();
        _basicRevertCheck(from, amount);

        _callTokenToSendHook(
            msg.sender,
            from,
            address(0),
            amount,
            data,
            operatorData
        );

        // State Change
        _addressBalance[from] -= amount;
        _totalTokenSupply -= amount;

        emit Burned(
            msg.sender,
            from,
            amount,
            data,
            operatorData
        );

        /// ERC20 Compatiple
        emit Transfer(from, address(0), amount);
    }

    function _basicRevertCheck(address from, uint256 amount)
        internal
        view
    {
        if (
            !isOperatorFor(msg.sender, from) &&
            allowance(from, msg.sender) < amount
        ) {
            revert ABCToken__NotAuthorized();
        }
        if (amount % _GRANULARITY != 0)
            revert ABCToken__SendAmountNotDivisible();
        if (amount > _addressBalance[from])
            revert ABCToken__NotEnoughBalance();
    }

    function _callTokenToSendHook(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes memory data,
        bytes memory operatorData
    ) internal {
        address holderImplementerAddress = _ERC1820_REGISTRY
            .getInterfaceImplementer(
                from,
                keccak256("ERC777TokensSender")
            );
        if (holderImplementerAddress != address(0)) {
            IERC777Sender(holderImplementerAddress)
                .tokensToSend(
                    operator,
                    from,
                    to,
                    amount,
                    data,
                    operatorData
                );
        }
    }

    /// ERC20 Compatiple
    function decimals() external pure returns (uint8) {
        return 18;
    }

    function transfer(address to, uint256 amount)
        external
        override
        returns (bool success)
    {
        success = false;
        operatorSend(
            msg.sender,
            to,
            amount,
            bytes(""),
            bytes("")
        );
        success = true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external override returns (bool success) {
        success = false;
        operatorSend(
            from,
            to,
            amount,
            bytes(""),
            bytes("")
        );
        success = true;
    }

    function approve(address _spender, uint256 _value)
        external
        override
        returns (bool success)
    {
        success = false;

        if (msg.sender == _spender)
            revert ABCToken__SameHolderAndOperator();

        _holderOperatorsAllowance[msg.sender][
            _spender
        ] = _value;

        emit Approval(msg.sender, _spender, _value);

        success = true;
    }

    function allowance(address _owner, address _spender)
        public
        view
        override
        returns (uint256 remaining)
    {
        remaining = _holderOperatorsAllowance[_owner][
            _spender
        ];
    }
}
