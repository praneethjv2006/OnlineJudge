const dns = require("dns");

dns.resolveSrv(
  "_mongodb._tcp.onlinejudgecluster.fnsaqqh.mongodb.net",
  (err, records) => {
    console.log("ERR:", err);
    console.log("RECORDS:", records);
  }
);