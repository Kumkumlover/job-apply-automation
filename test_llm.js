require('dotenv').config({path: '.env.local'});
const { askJSON } = require('./lib/llm');

askJSON('Return ["idfcfirstbank.com"] as JSON array').then(console.log).catch(console.error);
