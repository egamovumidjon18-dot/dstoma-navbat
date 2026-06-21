const http = require('http');

http.get('http://localhost:3000/api/clinics', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const clinics = JSON.parse(data);
    console.log("All Clinics:", clinics.map(c => c.name));
    const laziza = clinics.find(c => c.name && c.name.includes("Laziza"));
    console.log("Found clinic:", laziza);
  });
});
