IOTANS_PACKAGE_ID=0x323b9fd87dcf0c5cbfdddeb43bf9834b4da5493246cfac2ae59e7b9b0fa62a99
IOTANS_OBJECT_ID=0x61e87238b5fb84112389445f8fed701f1013d225edbe6ec57a80912b7e608e12
REGISTRATION_PACKAGE_ID=0x51f69ff4853e6db1b3c640149e7f7aa703d2234df70759fa8418590666a76853
UTILS_PACKAGE_ID=0x7dac054be28072957fe99fae70b49d47eb7de18326949b27fe81e02ab2fba49f
CLOCK_OBJECT_ID=0x6

# These are the same but they could be different which would allow updating 
# the keys without touching anything else
KEY_PACKAGE_ID=0xb36ffc6dc23c02dd237300ce83f3b5343f766c1bcb735e80b656f0a5bc910254
DEV_UTIL_PACKAGE_ID=0xb36ffc6dc23c02dd237300ce83f3b5343f766c1bcb735e80b656f0a5bc910254

MY_COIN=0xeb357ee5d4742aa36853c52b7d269a3b28512cbc9a50c0033848105bdc3018c7
MY_ADDRESS=0x9dfc3b14610ce6204060e87a2f9181c272e7890c5772eb0faf973123b545afbd
MY_NFT=0x2c9f7b24ae92c71a9515e04fd05aa51bdfedf4df35e8ce4d3fa4e936dd2cc85f
MY_DOMAIN="chloe.iota"

# Get a value by manual key
iota client ptb \
--move-call $DEV_UTIL_PACKAGE_ID::metadata::get_value @$IOTANS_OBJECT_ID @$MY_NFT '"IMAGE_URL"'

# Get a value using the const key
iota client ptb \
--move-call $KEY_PACKAGE_ID::keys::image_url \
--assign key \
--move-call $DEV_UTIL_PACKAGE_ID::metadata::get_value @$IOTANS_OBJECT_ID @$MY_NFT key

# Get a value via a helper
# If this helper exists the DEV_UTIL package depends on KEY and would need to be updated if it changes
iota client ptb \
--move-call $DEV_UTIL_PACKAGE_ID::metadata::get_image_url @$IOTANS_OBJECT_ID @$MY_NFT

# Set a value manually
iota client ptb \
--move-call $DEV_UTIL_PACKAGE_ID::metadata::set_value @$IOTANS_OBJECT_ID @$MY_NFT @$CLOCK_OBJECT_ID '"IMAGE_URL"' '"https://nothing.com"'

# Set a value using the const key
iota client ptb \
--move-call $KEY_PACKAGE_ID::keys::image_url \
--assign key \
--move-call $DEV_UTIL_PACKAGE_ID::metadata::set_value @$IOTANS_OBJECT_ID @$MY_NFT @$CLOCK_OBJECT_ID key '"https://nothing.com"'

# Set a value via a helper
# If this helper exists the DEV_UTIL package depends on KEY and would need to be updated if it changes
iota client ptb \
--move-call $DEV_UTIL_PACKAGE_ID::metadata::set_image_url @$IOTANS_OBJECT_ID @$MY_NFT @$CLOCK_OBJECT_ID '"https://nothing.com"'
