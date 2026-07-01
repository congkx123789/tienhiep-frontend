const dns = require('dns');
const originalLookup = dns.lookup;

dns.lookup = function(hostname, options, callback) {
  let cb = callback;
  let opts = options;
  
  if (typeof options === 'function') {
    cb = options;
    opts = {};
  } else if (typeof options === 'number') {
    opts = { family: options };
  }
  
  opts = opts || {};
  opts.family = 4; // Force IPv4 resolution
  
  return originalLookup(hostname, opts, cb);
};

console.log("✔ DNS monkeypatch active: Forced IPv4 resolution.");
