# Auctions

This package is for the initial IOTA-Names launch. It provides an alternative purchase path via auctions in order to ensure fairer registration.

## Process

In order to purchase a name via this method, one must begin by starting a new auction for a particular name. The `start_auction_and_place_bid` function accepts an initial bid, which must be at minimum the base price of the name. This will create the NFT and register it within IOTA-Names, though it will be initially owned by the Auction House. 

Until the end of the auction period, which is defined by `AUCTION_BIDDING_PERIOD_MS`, anyone may place additional bids on the name via the `place_bid` function. Each bid must be greater than the last by at least `AUCTION_MIN_OVERBID_VALUE_IOTA`. When a new bid is successfully placed, the previous bid will be returned to the owner.

Once the auction period is over, there may be an additional quiet period to allow for last-minute bids. When a bid is made near the end of the period, a small amount of additional time is added, defined by `AUCTION_MIN_QUIET_PERIOD_MS`. Once this full time has passed without any additional bids, the auction will be locked.

Finally, the winner may call the `claim` function to accept their NFT.
