const http = require('http')
const https = require('https')
const fs = require('fs');

let token = 'AQIC5wM2LY4Sfcy2QGK7a7JC79pwNnjfAOs5sVuaaCN1iQg=@AAJTSQACMDE=#';
try {
  http.request({
    host: '127.0.0.1', // IP address of proxy server
    port: 8888, // port of proxy server
    method: 'CONNECT',
    path: 'gas.national.ncrs.nhs.uk:443', // some destination, add 443 port for https!
    headers: {
    },
  }).on('connect', (res, socket) => {
    if (res.statusCode === 200) { // connected to proxy server
      https.get({
        host: 'gas.national.ncrs.nhs.uk',
        socket: socket,    // using a tunnel
        agent: false,      // cannot use a default agent
        ca: [fs.readFileSync("NHS_DEV_Level_1C.pem"),fs.readFileSync("NHS_PTL_Root_Authority.pem"), fs.readFileSync("NHS_Level_1A.pem"), fs.readFileSync("NHS_Root_Authority.pem")], //load the CIS internal CA certs
        path: '/saml/RoleAssertion?token='+encodeURI(token)  // specify path to get from server
      }, (res) => {
          let statusCode = res.statusCode;
          console.log('statusCode:', res.statusCode);
          console.log('headers:', res.headers);
          let chunks = []
          res.on('data', chunk => chunks.push(chunk))
          res.on('end', () => {
          console.log('DONE', statusCode, Buffer.concat(chunks).toString('utf8'))
        })
      })
    }
  }).on('error', (err) => {
    console.log('caught error');
    console.error('error', err);
  }).end();
} catch (error) {
  console.log('caught error in connecting through to host via proxt');
  console.log(error);
}
