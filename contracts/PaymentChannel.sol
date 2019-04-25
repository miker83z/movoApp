pragma solidity >=0.4.24;

import './properties/Ownable.sol';
import './IERC20.sol';
import './lib/ECDSA.sol';
import './lib/SafeMath.sol';

/**
 * @title Payment channel contract
 */
contract PaymentChannel is Ownable{
    using SafeMath for uint192;
    
    // Token used for payments
    IERC20 public _token;

    // All the opened channels
    mapping (bytes32 => Channel) public _channels;

    // Channel structure, blockNumber is the block number at which a channel between the
    // sender and receiver was created
    struct Channel {
        uint192 deposit;
        uint32 blockNumber;
    }

    event ChannelCreated(address indexed senderAddr, address indexed receiverAddr, uint32 indexed blockNumber, uint192 deposit);

    event ChannelClosed(address indexed senderAddr, address indexed receiverAddr, uint32 indexed blockNumber, uint192 balance);

    /** 
     * @notice Constructor for creating the payment channels contract
     * the `deposit` token deposit to this contract. Compatibility with ERC20 tokens.
     * @param tokenAddress The address of the ERC20 Token used by the contract.
     */
    constructor(address tokenAddress) Ownable() public {
        require (tokenAddress != address(0));
        _token = IERC20(tokenAddress);
    }

    /** 
     * @notice Creates a new channel between `msg.sender` and `receiver` and transfers
     * the `deposit` token deposit to this contract. Compatibility with ERC20 tokens.
     * @param receiver The address that receives tokens.
     * @param deposit The amount of tokens that the sender escrows.
     */
    function createChannel(address receiver, uint192 deposit) external {
        _createChannel(msg.sender, receiver, deposit);
        // needs approval first
        require(_token.transferFrom(msg.sender, address(this), deposit));
        
        emit ChannelCreated(msg.sender, receiver, uint32(block.number), deposit);
    }

    /** 
     * @notice Function called by the sender, receiver or a delegate, with all the needed
     * signatures to close the channel immediately.
     * @param receiver The address that receives tokens.
     * @param blockNumber The block number at which a channel was created.
     * @param balance The amount of tokens owed by the sender to the receiver.
     * @param senderBalanceSign The sender's balance proof message signature.
     * @param receiverBalanceSign The receiver's balance proof message signature.
     */
    function closeChannel(address receiver, uint32 blockNumber, uint192 balance, bytes calldata senderBalanceSign, bytes calldata receiverBalanceSign) external {
        
        address senderAddr = extractBalanceProofSignature(
            receiver,
            blockNumber,
            balance,
            senderBalanceSign
        );
        
        address receiverAddr = extractBalanceProofSignature(
            senderAddr,
            blockNumber,
            balance,
            receiverBalanceSign
        );

        require(receiver == receiverAddr);

        // Both signatures have been verified and the channel can be closed.
        _closeChannel(senderAddr, receiverAddr, blockNumber, balance);

        emit ChannelClosed(senderAddr, receiver, blockNumber, balance);
    }

    /** 
     * @notice Returns the address extracted from the balance proof signature.
     * @param otherPartyAddress The other address in the channel.
     * @param blockNumber The block number at which a channel was created.
     * @param balance The amount of tokens owed by the sender to the receiver.
     * @param balanceSign The balance proof message signed by the the address.
     * @return Address of the balance proof signer.
     */
    function extractBalanceProofSignature(address otherPartyAddress, uint32 blockNumber, uint192 balance, bytes memory balanceSign) public view returns (address) {
        // Compute message hash 
        bytes32 hash = keccak256(abi.encodePacked(otherPartyAddress, blockNumber, balance, address(this)));

        // Derive address from signature
        return ECDSA.recover(ECDSA.toEthSignedMessageHash(hash), balanceSign);
    }

    /** 
     * @dev Creates a new channel between a sender and a receiver.
     * @param sender The address that sends tokens.
     * @param receiver The address that receives tokens.
     * @param deposit The amount of tokens that the sender escrows.
     */
    function _createChannel(address sender, address receiver, uint192 deposit) private {
        uint32 blockNumber = uint32(block.number);
        bytes32 key = keccak256(abi.encodePacked(sender, receiver, blockNumber));

        require(_channels[key].deposit == 0);
        require(_channels[key].blockNumber == 0);

        _channels[key] = Channel({deposit: deposit, blockNumber: blockNumber});
    }

    /** 
     * @dev Deletes the channel and transfers the balance to the receiver and
     * the rest of the deposit back to the sender.
     * @param sender The address that sends tokens.
     * @param receiver The address that receives tokens.
     * @param blockNumber The block number at which a channel was created.
     * @param balance The amount of tokens owed by the sender to the receiver.
     */
    function _closeChannel(address sender, address receiver, uint32 blockNumber, uint192 balance) private {
        bytes32 key = keccak256(abi.encodePacked(sender, receiver, blockNumber));
        Channel memory channel = _channels[key];
        require(channel.blockNumber > 0);
        require(balance <= channel.deposit);

        delete _channels[key];

        require(_token.transfer(receiver, balance));
        require(_token.transfer(sender, channel.deposit.sub(balance)));
    }

}
