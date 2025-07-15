# Subnames

This package provides functions to create and manage subnames. Subnames are free to create as long as the parent name is owned, and any number of subnames can be created.

## Types of Subname

Subnames can be one of two different types: leaf or node. Each has different use-cases and limitations.

### Node Subnames

Node subnames have an associated NFT (`SubnameRegistration`), an expiration date and time, and a set of rules which govern their usage. The NFT defines the ownership of the subname, and can be used to manage it, transfer it, and burn it.

When creating a node subname, an expiration date and time must be provided. This must be after the minimum time defined by `MINIMUM_SUBNAME_DURATION` and before the expiration of the parent.

Node subnames have two configuration options:

- Allow creation: Whether the subname can create additional subnames
- Allow time extension: Whether the expiration can be extended

Node subnames can only be burned once they have expired.

### Leaf Subnames

Leaf subnames do not have an associated NFT, they only exist as a record in the IOTA-Names registry. This means they have several limitations compared to nodes:

- They cannot have subnames
- They cannot be individually transferred
- Their expiration is tied to their parent

Leaf subnames can also be removed at will, regardless of the parent expiration.
