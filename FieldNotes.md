# Field Notes

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
