# Temporary Subname Proxy

This package provides a mirror interface to the `iota_names::controller` and `subnames::subnames` modules, in order to circumvent a limitation in transaction access patterns. Specifically, the `SubnameRegistration` NFT is a thin wrapper around the `NameRegistration`, and in many cases the inner reference must be unwrapped and passed to various functions. However, as references returned by move functions cannot currently be used as inputs for subsequent calls, these functions provide an alternative.
