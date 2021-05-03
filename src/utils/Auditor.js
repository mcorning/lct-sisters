const crypto = require('crypto');
const randomId = () => crypto.randomBytes(8).toString('hex');

class Auditor {
  constructor() {
    this.log = new Map();
  }

  findLogEntry(id) {
    return this.log.get(id);
  }

  logEntry(entry, type = 'info') {
    this.log.set(randomId(), {
      message: entry,
      type: type,
      sentTime: new Date().toISOString(),
    });
  }

  findAllLogEntries() {
    return [...this.log.values()];
  }
}

module.exports = Auditor;
