const dookie = require('dookie');
const fs = require('fs');
dookie.pull('mongodb://localhost:27017/dehesa').then(function(res) {
  fs.writeFileSync('./dehesa-db-bkp.json', res);
});