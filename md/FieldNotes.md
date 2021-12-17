# Field Notes

## Alert Protocol

For two visitors to share an alert, both must be on the same node server (e.g., localhost or cvew) because each server has its own HTTP endpoint for each socket client.

When a visitor hits the BRB, they pass a score to Model that in turns emits `onExposureWarning` the event to the node server, index.js. The server delegates the event to redis.js `onExposureWarning()` method.

The redis server queries each graphName the given userID visited, and returns a list of userIDS that shared the same spacetime.

### CVEW

ID   | Browser | Device
-----|---------|--------
456a | Edge/PWA | Surface
5ff2 | PWA | iPhone
7610 | Firefox Debug| Surface
90a8 | PWA | Tablet
abf6 | PWA | Android
e8b1 | Chrome | Surface
e912 | Firefox | Surface

### localhost:3003 DEBUGgered

ID   | Browser | Device
-----|---------|--------
3ee5 | Chrome  | Surface
d7ff | Firefox Developer | Surface

### localhost:3003

ID   | Browser | Device|Comment
-----|---------|--------|-----
1fa4 | Firefox | Surface|Singapore
5741 | Firefox Developer | Surface
5ed9 | Edge | Tablet
60ac | Chrome | Surface
ac89|Firefox| iPhone
ad5f | Edge | Surface

```js
MATCH (carrier:visitor{userID:'f7e7d622acece46e'})-[c:visited]->(s:space)<-[e:visited]-(exposed:visitor) 
    WHERE ((e.start>=c.start AND e.end>=c.end)
    OR (e.start<=c.start AND e.end>=c.start)
    OR (e.start<= c.start AND e.end>=c.end))
    AND exposed.userID <> carrier.userID    
    RETURN exposed.userID,  id(exposed), s.name, id(s), c.start, c.end, id(c),  e.start, e.end, id(e)

no info

MATCH (carrier:visitor{userID:'f7e7d622acece46e'})-[c:visited]->(s:space)<-[e:visited]-(exposed:visitor)
WHERE (e.end>=c.start OR e.start>= c.end)
AND exposed.userID <> carrier.userID 
RETURN exposed.userID,  id(exposed), s.name, id(s), c.start, c.end, id(c),  e.start, e.end, id(e)

### Example query results
```

exposed.userID | id(exposed) |s.name | id(s) | c.start | c.end | id(c) | e.start | e.end | id(e)
---------------|-------------|-------|-------|---------|-------|-------|---------|-------|------
2ebbb7d06677456a | 94 | Fika Sisters Coffeehouse 18 | 1634598005865 | 1634616005865 | 34 | 1634603400000 1634605200000 64
9b7c302f6f1b1fa4 | 98 | Fika Sisters Coffeehouse 18 | 1634598005865 | 1634616005865 | 34 | 1634603400000 1634605200000 36

## Workflows

### Share events

On the Calendar, visitor shares via email or qr code.

```js
    decodedUri() {
      // the QR code generator needs to use the decoded URI
      const d = decodeURIComponent(this.mailToUri);
      console.log(d);
      return d;
    },

    // TODO we shouldn't need this guard
    mailToUri() {
      if (!this.selectedEvent) {
        return;
      }
      const { place_id, name, date, start, end } = this.selectedEvent;
      const printedName = `${name}${this.room ? `:_${this.room}` : ''}`;
      const escapedName = printedName.replace(/ /g, '_').replace(/&/g, 'and'); 
      // do normal url encoding for the rest of the args
      // we will reverse this edit in space.js (but see note above in decodedUri())
      const uri = encodeURIComponent(
        `place_id=${place_id}&date=${date}&start=${start}&end=${end}&name=${escapedName}`
      );
      return `${this.origin}/?${uri}`;
    },
```

When following the link in email or the scan of the QR code:

GoogleMap.vue

```javascript
  watch: {
    ready() {
      console.log('Map component ready');
      if (this.$route.query.place_id) {
        console.log('Detected a shared event:', this.$route.query.place_id);
        // in **space.js**
        this.**onSharePlace**();
      }
    },
  },
```  

```js
space.js
    onSharePlace() {
      const place_id = this.$route.query.place_id;
      const start = Number(this.$route.query.start);
      const end = Number(this.$route.query.end);
      // replace the "escaped" underscores with spaces
      const name = this.$route.query.name.replace(/_/g, ' ');
      const shared = true;
      this.callVisitUpdate({ place_id, start, end, name, shared });
    },
```

## Bootstrap

When Model.js (a renderless component) mounts, it calls connectMe().

To start the handshake with the server, connectMe() needs a username. If there are no settings in the Setting entity, or if the username is empty, connectMe() prompts for a value to send to the server.

## Bundles

File sizes at 6.9.21 before we add any more modules

 File | Size | Gzipped
------|------|---------
dist\js\chunk-vendors.be1fa76a.js | 1353.50 KiB | 416.46 KiB
dist\js\app.29bbf23b.js           | 66.11 KiB   | 19.13 KiB
dist\js\chunk-4579f52a.88f086ad.js | 26.80 KiB | 7.90 KiB
dist\precache-manifest.290f594d873f2966cf65520918c6f033.js | 466 KiB | 1.36 KiB
dist\js\chunk-2d0e8e33.78f0c8d6.js | 2.90 KiB | 1.34 KiB
dist\js\chunk-2977fb41.3771221b.js | 2.58 KiB | 1.23 KiB
dist\js\chunk-2d0abdfe.bd07dfdc.js | 1.94 KiB | 1.06 KiB
dist\service-worker.js | 0.96 KiB | 0.54 KiB
dist\css\chunk-vendors.b28b62e1.css | 535.54 KiB | 67.05 KiB
dist\css\chunk-4579f52a.cf1fd058.css | 16.17 KiB | 2.60 KiB
dist\css\app.e748cc17.css | 0.99 KiB | 0.41 KiB
dist\css\chunk-2977fb41.ca516ae9.css | 0.15 KiB | 0.11 KiB
