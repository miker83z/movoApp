pragma solidity >=0.4.24;

/**
 * @title Ownable contract
 */
contract Ownable {

  // Contract owner
  address _owner;

  /**
   * @dev Modifier to allow only the owner
   */
  modifier onlyOwner() {
    require(isOwner(msg.sender));
    _;
  }

  constructor () internal {
    _owner = msg.sender;
  }

  /**
  * @return Owner
  */
  function owner() public view returns (address) {
    return _owner;
  }

  /**
   * @dev Function indicating if account is owner 
   */
  function isOwner(address account) public view returns (bool) {
    return _owner == account;
  }

}