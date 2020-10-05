
module.exports.handleEvent = async (event, VPCENDPOINT, VPCENDPOINTPORT, CISFQDN, http, https, fs, querystring) => {
  console.log(event);
	return new Promise(function (resolve, reject) {
  
    let token = event.queryStringParameters.token;
    console.log("token is "+token);
    let path = CISFQDN + ":443";
    try {
      http.request({
        host: VPCENDPOINT, // IP address of proxy server
        port: VPCENDPOINTPORT, // port of proxy server
        method: 'CONNECT',
        path: path, // some destination, add 443 port for https!
        headers: {
        },
      }).on('connect', (res, socket) => {
        console.log("connected");
        if (res.statusCode === 200) { // connected to proxy server
          https.get({
            host: CISFQDN,
            socket: socket,    // using a tunnel
            agent: false,      // cannot use a default agent
            ca: [fs.readFileSync("NHS_DEV_Level_1C.pem"),fs.readFileSync("NHS_PTL_Root_Authority.pem"), fs.readFileSync("NHS_Level_1A.pem"), fs.readFileSync("NHS_Root_Authority.pem")], //load the CIS internal CA certs
            path: '/saml/RoleAssertion?token='+querystring.escape(token)  // specify path to get from server
          }, (res) => {
              let statusCode = res.statusCode;
              console.log('statusCode:', res.statusCode);
              console.log('headers:', res.headers);
              let chunks = [];
              res.on('data', chunk => chunks.push(chunk));
              res.on('end', () => {
              console.log('DONE', statusCode, Buffer.concat(chunks).toString('utf8'));
              resolve(Buffer.concat(chunks).toString('utf8'));
            });
          });
        }
      }).on('error', (err) => {
        console.log('caught error');
        console.error('error', err);
        reject(err);
      }).end();
    } catch (error) {
      console.log('caught error in connecting through to host via proxt');
      console.log(error);
      reject(error);
    }
	});
}