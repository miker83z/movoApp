pragma solidity >=0.4.24;

import "./Ownable.sol";

/**
 * @title Mintable token
 */
contract Mintable is Ownable{

  // Minters allowed to generate new tokens
  mapping (address => bool) _minters;

  /**
   * Event for adding a minter
   */
  event MinterAdded(address indexed account);

  /**
   * Event for removing a minter
   */
  event MinterRemoved(address indexed account);

  /**
   * @dev Modifier to allow only a minter
   */
  modifier onlyMinter() {
    require(isMinter(msg.sender));
    _;
  }

  constructor () Ownable() internal {
    _addMinter(msg.sender);
  }

  /**
   * @dev Function to mint tokens
   */
  function mint(address to, uint256 value) public onlyMinter returns (bool) {
    _mint(to, value);
    return true;
  }

  /**
  * @dev Add account to minters for this token
  */
  function addMinter(address account) public onlyOwner {
    _addMinter(account);
  }

  /**
  * @dev Remove msg.sender from minters
  */
  function renounceMinter() public {
    _removeMinter(msg.sender);
  }
  
  /**
   * @dev Internal function that mints an amount of the token and assigns it to
   * an account.
   */
  function _mint(address account, uint256 value) internal;

  /**
  * @dev Add account to minters
  */
  function _addMinter(address account) internal {
    require(account != address(0));
    require(!isMinter(account));

    _minters[account] = true;
    emit MinterAdded(account);
  }

  /**
  * @dev Remove account from minters
  */
  function _removeMinter(address account) internal {
    require(account != address(0));
    require(isMinter(account));

    _minters[account] = false;
    emit MinterRemoved(account);
  }

  /**
   * @dev Function indicating if account is a minter
   */
  function isMinter(address account) public view returns (bool) {
    return _minters[account];
  }

}