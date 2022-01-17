# Universal Loyalty Tracking

Universal Loyalty Tracking (ULT) uses the same inter-server communications used by LCT.

## Justification

ULT is based on the assumption of minimal dependency on technology and maximum protection of privacy.

### Earning

Most customer loyalty reward systems require sharing PII. ULT is anonymous.

Earning reward points is as simple as scanning a QR in the sponsor's place of choosing (usually the cashier or at tables).

Customer and Sponsor see immediate feeback from the server after a scan.

### Claiming

Many times, claiming a reward is difficult, often requiring a special app or process to access a reward certificate.

At the Sponsor's discretion, the customer may get their reward in real time (e.g., 10% off the tab).

## Operations

A Progressive Web App provides access to servers for Sponsors and Customers. A nodeJS and a Redis server provide backoffice capabilities.

### Client

A sponsor fills out a simple form providing `Business Name`, `Business Address`, and `Country`.

> The only reason we require an address is to get a `place_id` from Google (see below).

The client sends these data to a node server. The server accesses Google `Place` services to return a `formatted address` and a `place_id` (the latter is a globally unique and persistent string to access other Google services).

If the returned adderss is correct, the app adds the Sponsor to a Redis Stream taking the `Business Name` as the stream's identity. The app saves the stream identity as the sponsor ID (`sid`) in the Sponsor's indexedDB local storage.

In addition, the app stores the socket ID (used to communicate with the node server) in local storage as the Owner ID (`uid`).

Finally, the app stores the `Business Name` in local storage as the `biz` property and the `place_id` as the `place_id` property.

When the Sponsor opens the app, the Business Name appears on the form, but the Business Address field is blank. This way, the Sponsor can add other business units they control.

>NOTE: a limitation during development is that a Sponsor can create and print as many QR codes as they want, but only the last entered business is stored in IndexedDB.

### Server
The nodeJS server controls Socket.io enabling by directional an anonymous communications with clients. Also, it sends and receives data to and from the Redis server that uses a `STREAM` data structure. 


