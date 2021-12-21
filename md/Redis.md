# Redis Datastructures used in LCT and TRq

This doc outlines how we use Redis Streams and Redis Graph.

## Redis Streams

Redis Streams provide most of the processing capabilities we built in node.js javascript. Using Streams will dramatically increase reliability, maintainability, and extensibility.

### Overview of API

One of the trickiest things to remember when learning the Redis Streams API are the special characters. Here is table of those characters, where, and how they are used in the API.

Command|Character | Useage|Notes
-------|----------|-------|----
`XADD` | * | Redis manages Stream event `ID`s
`XREAD` | 0 |Start reading the Stream from its `FIRST ID`
`XREAD` | $ |Start reading the Stream from its `LAST ID`
`XREADGROUP`|>|The `last-delivered-id` of a `CONSUMER GROUP`
`XRANGE`|-|Start reading the Stream `RANGE` from its `SMALLEST POSSIBLE ID` (viz., `0-1`)|1
`XRANGE`|+|Start reading the Stream `RANGE` from its `LARGEST POSSIBLE ID` (viz., `18446744073709551615-18446744073709551615`)
`XREVRANGE`|+|Start reading the Stream from its `LARGEST POSSIBLE ID`|2
`XREVRANGE`|-|Start reading the Stream from its `SMALLEST POSSIBLE ID`
`XPENDING`|-|Start reading the Stream from its `SMALLEST POSSIBLE ID`
`XPENDING`|+|Start reading the Stream from its `LARGEST POSSIBLE ID`

> NOTES:
>
>1. $ refers to the smallest ID in a given STREAM. The - character is the smallest Redis Stream ID possible. Those two IDs are rarely the same value.
>2. Order matters. XRANGE uses - + and XREVRANGE uses + -


Command| Signature (1)|Notes
-------|-------|----
`XADD`  | \<key> \<id>>  \<field-key> \<field-value>] ... \<field-key> \<field-value>]|
`XPENDING`  | \<key> \<groupname> [ \<start-id> \<end-id>] \<count> [\<consurmername>]|
`XCLAIM`  | \<key> \<groupname> \<consumer> \<min-idle-time> \<ID-1> \<ID-2> ... \<ID-N>|1

> NOTES:
>
>1. 'key' refers to stream name or key in the Redis server space.
>2. Since it is used for replication of consumer groups changes, this command is very complex and full of options in its full form
>3. Order matters. XRANGE uses - + and XREVRANGE uses + -