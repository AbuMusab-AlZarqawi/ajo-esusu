// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AjoEsusu
 * @notice Decentralized rotating savings (Ajo/Esusu) on Ritual Chain
 * @dev Fully trustless — contract owner has zero access to user funds
 */
contract AjoEsusu {

    // ─── Enums ────────────────────────────────────────────────────────────────

    enum Frequency { Weekly, Monthly }
    enum PoolStatus { Active, Completed, Cancelled }

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct Member {
        address wallet;
        uint256 joinedAt;
        uint256 collateralLocked;
        bool hasReceivedPayout;
        bool isActive;
        uint256 missedContributions;
    }

    struct Pool {
        uint256 id;
        string name;
        address creator;
        uint256 contributionAmount;   // in wei
        uint256 collateralAmount;     // in wei — locked on join
        Frequency frequency;
        uint256 maxMembers;
        uint256 currentRound;         // 0-indexed round number
        uint256 lastCycleTimestamp;   // when last cycle started
        uint256 totalContributed;
        PoolStatus status;
        address[] memberAddresses;
    }

    // ─── Storage ──────────────────────────────────────────────────────────────

    uint256 public poolCount;

    mapping(uint256 => Pool) public pools;
    mapping(uint256 => mapping(address => Member)) public members;
    // poolId => roundIndex => member contributions bool
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasContributedThisRound;

    // ─── Events ───────────────────────────────────────────────────────────────

    event PoolCreated(
        uint256 indexed poolId,
        address indexed creator,
        string name,
        uint256 contributionAmount,
        uint256 collateralAmount,
        uint256 maxMembers,
        Frequency frequency
    );

    event MemberJoined(
        uint256 indexed poolId,
        address indexed member,
        uint256 collateralLocked
    );

    event ContributionMade(
        uint256 indexed poolId,
        address indexed member,
        uint256 amount,
        uint256 round
    );

    event PayoutSent(
        uint256 indexed poolId,
        address indexed recipient,
        uint256 amount,
        uint256 round
    );

    event MemberSlashed(
        uint256 indexed poolId,
        address indexed member,
        uint256 collateralSlashed,
        uint256 round
    );

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier poolExists(uint256 poolId) {
        require(poolId < poolCount, "Pool does not exist");
        _;
    }

    modifier poolActive(uint256 poolId) {
        require(pools[poolId].status == PoolStatus.Active, "Pool not active");
        _;
    }

    // ─── Pool Creation ────────────────────────────────────────────────────────

    /**
     * @notice Create a new rotating savings pool
     */
    function createPool(
        string calldata name,
        uint256 contributionAmount,
        uint256 collateralAmount,
        Frequency frequency,
        uint256 maxMembers
    ) external payable returns (uint256 poolId) {
        require(bytes(name).length > 0, "Name required");
        require(contributionAmount > 0, "Contribution must be > 0");
        require(maxMembers >= 2 && maxMembers <= 50, "2-50 members");

        poolId = poolCount++;

        Pool storage p = pools[poolId];
        p.id = poolId;
        p.name = name;
        p.creator = msg.sender;
        p.contributionAmount = contributionAmount;
        p.collateralAmount = collateralAmount;
        p.frequency = frequency;
        p.maxMembers = maxMembers;
        p.currentRound = 0;
        p.lastCycleTimestamp = block.timestamp;
        p.status = PoolStatus.Active;

        emit PoolCreated(poolId, msg.sender, name, contributionAmount, collateralAmount, maxMembers, frequency);

        // Creator auto-joins if they send the collateral
        if (msg.value >= collateralAmount && collateralAmount > 0) {
            _addMember(poolId, msg.sender, collateralAmount);
        } else if (collateralAmount == 0) {
            _addMember(poolId, msg.sender, 0);
        }
    }

    receive() external payable {}

    // ─── Join Pool ────────────────────────────────────────────────────────────

    /**
     * @notice Join a pool by locking the required collateral
     */
    function joinPool(uint256 poolId) external payable poolExists(poolId) poolActive(poolId) {
        Pool storage p = pools[poolId];
        require(p.memberAddresses.length < p.maxMembers, "Pool is full");
        require(!members[poolId][msg.sender].isActive, "Already a member");
        require(msg.value >= p.collateralAmount, "Insufficient collateral");

        _addMember(poolId, msg.sender, p.collateralAmount);

        // Refund any excess
        uint256 excess = msg.value - p.collateralAmount;
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }
    }

    function _addMember(uint256 poolId, address wallet, uint256 collateral) internal {
        Member storage m = members[poolId][wallet];
        m.wallet = wallet;
        m.joinedAt = block.timestamp;
        m.collateralLocked = collateral;
        m.hasReceivedPayout = false;
        m.isActive = true;
        m.missedContributions = 0;

        pools[poolId].memberAddresses.push(wallet);

        emit MemberJoined(poolId, wallet, collateral);
    }

    // ─── Contributions ────────────────────────────────────────────────────────

    /**
     * @notice Contribute to the current round
     */
    function contribute(uint256 poolId) external payable poolExists(poolId) poolActive(poolId) {
        Pool storage p = pools[poolId];
        Member storage m = members[poolId][msg.sender];

        require(m.isActive, "Not an active member");
        require(!hasContributedThisRound[poolId][p.currentRound][msg.sender], "Already contributed this round");
        require(msg.value >= p.contributionAmount, "Insufficient contribution");

        hasContributedThisRound[poolId][p.currentRound][msg.sender] = true;
        p.totalContributed += p.contributionAmount;

        // Refund excess
        uint256 excess = msg.value - p.contributionAmount;
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }

        emit ContributionMade(poolId, msg.sender, p.contributionAmount, p.currentRound);

        // Check if all active members contributed — trigger payout
        if (_allContributed(poolId)) {
            _processPayout(poolId);
        }
    }

    function _allContributed(uint256 poolId) internal view returns (bool) {
        Pool storage p = pools[poolId];
        for (uint256 i = 0; i < p.memberAddresses.length; i++) {
            address addr = p.memberAddresses[i];
            if (members[poolId][addr].isActive && !hasContributedThisRound[poolId][p.currentRound][addr]) {
                return false;
            }
        }
        return true;
    }

    function _processPayout(uint256 poolId) internal {
        Pool storage p = pools[poolId];

        // Find next eligible recipient (hasn't received payout yet, joined earliest)
        address recipient;
        for (uint256 i = 0; i < p.memberAddresses.length; i++) {
            address addr = p.memberAddresses[i];
            Member storage m = members[poolId][addr];
            if (m.isActive && !m.hasReceivedPayout) {
                recipient = addr;
                break;
            }
        }

        require(recipient != address(0), "No eligible recipient");

        uint256 activeCount = _activeCount(poolId);
        uint256 payout = p.contributionAmount * activeCount;

        members[poolId][recipient].hasReceivedPayout = true;

        payable(recipient).transfer(payout);
        emit PayoutSent(poolId, recipient, payout, p.currentRound);

        p.currentRound++;
        p.lastCycleTimestamp = block.timestamp;

        // Check if all members received payout → pool complete
        bool allPaid = true;
        for (uint256 i = 0; i < p.memberAddresses.length; i++) {
            address addr = p.memberAddresses[i];
            if (members[poolId][addr].isActive && !members[poolId][addr].hasReceivedPayout) {
                allPaid = false;
                break;
            }
        }

        if (allPaid) {
            p.status = PoolStatus.Completed;
            _returnAllCollaterals(poolId);
        }
    }

    // ─── Slashing ─────────────────────────────────────────────────────────────

    /**
     * @notice Slash a member who missed a contribution after the cycle deadline
     */
    function slashMember(uint256 poolId, address memberAddr) external poolExists(poolId) poolActive(poolId) {
        Pool storage p = pools[poolId];
        Member storage m = members[poolId][memberAddr];

        require(m.isActive, "Not an active member");
        require(!hasContributedThisRound[poolId][p.currentRound][memberAddr], "Member contributed");

        // Check deadline passed
        uint256 deadline = p.frequency == Frequency.Weekly ? 7 days : 30 days;
        require(block.timestamp >= p.lastCycleTimestamp + deadline, "Deadline not passed");

        uint256 collateral = m.collateralLocked;
        m.collateralLocked = 0;
        m.isActive = false;

        emit MemberSlashed(poolId, memberAddr, collateral, p.currentRound);

        // Distribute slashed collateral to remaining active members
        uint256 activeCount = _activeCount(poolId);
        if (activeCount > 0 && collateral > 0) {
            uint256 share = collateral / activeCount;
            for (uint256 i = 0; i < p.memberAddresses.length; i++) {
                address addr = p.memberAddresses[i];
                if (members[poolId][addr].isActive) {
                    payable(addr).transfer(share);
                }
            }
        }

        // If all have now contributed, process payout
        if (_allContributed(poolId)) {
            _processPayout(poolId);
        }
    }

    // ─── Collateral Return ────────────────────────────────────────────────────

    function _returnAllCollaterals(uint256 poolId) internal {
        Pool storage p = pools[poolId];
        for (uint256 i = 0; i < p.memberAddresses.length; i++) {
            address addr = p.memberAddresses[i];
            uint256 col = members[poolId][addr].collateralLocked;
            if (col > 0) {
                members[poolId][addr].collateralLocked = 0;
                payable(addr).transfer(col);
            }
        }
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getPool(uint256 poolId) external view poolExists(poolId) returns (
        uint256 id,
        string memory name,
        address creator,
        uint256 contributionAmount,
        uint256 collateralAmount,
        uint8 frequency,
        uint256 maxMembers,
        uint256 memberCount,
        uint256 currentRound,
        uint256 lastCycleTimestamp,
        uint8 status
    ) {
        Pool storage p = pools[poolId];
        return (
            p.id,
            p.name,
            p.creator,
            p.contributionAmount,
            p.collateralAmount,
            uint8(p.frequency),
            p.maxMembers,
            p.memberAddresses.length,
            p.currentRound,
            p.lastCycleTimestamp,
            uint8(p.status)
        );
    }

    function getMembers(uint256 poolId) external view poolExists(poolId) returns (address[] memory) {
        return pools[poolId].memberAddresses;
    }

    function getMember(uint256 poolId, address wallet) external view returns (
        address addr,
        uint256 joinedAt,
        uint256 collateralLocked,
        bool hasReceivedPayout,
        bool isActive,
        uint256 missedContributions
    ) {
        Member storage m = members[poolId][wallet];
        return (m.wallet, m.joinedAt, m.collateralLocked, m.hasReceivedPayout, m.isActive, m.missedContributions);
    }

    function getNextPayoutRecipient(uint256 poolId) external view poolExists(poolId) returns (address) {
        Pool storage p = pools[poolId];
        for (uint256 i = 0; i < p.memberAddresses.length; i++) {
            address addr = p.memberAddresses[i];
            if (members[poolId][addr].isActive && !members[poolId][addr].hasReceivedPayout) {
                return addr;
            }
        }
        return address(0);
    }

    function getAllPools() external view returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](poolCount);
        for (uint256 i = 0; i < poolCount; i++) {
            ids[i] = i;
        }
        return ids;
    }

    function _activeCount(uint256 poolId) internal view returns (uint256 count) {
        Pool storage p = pools[poolId];
        for (uint256 i = 0; i < p.memberAddresses.length; i++) {
            if (members[poolId][p.memberAddresses[i]].isActive) {
                count++;
            }
        }
    }

    function getActiveCount(uint256 poolId) external view poolExists(poolId) returns (uint256) {
        return _activeCount(poolId);
    }
}
