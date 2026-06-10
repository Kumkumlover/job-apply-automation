require('dotenv').config({path: '.env.local'});
const https = require('https');

https.get('https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.GEMINI_API_KEY, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const models = JSON.parse(data).models;
    if (models) {
      console.log(models.filter(m => m.name.includes('gemini-2')).map(m => ({name: m.name, methods: m.supportedGenerationMethods})));
    } else {
      console.log("Error:", data);
    }
  });
});
