
module.exports.handleEvent = async (event, APIKEY, APIENDPOINT, https) => {
  console.log(event);
	return new Promise(function (resolve, reject) {
  
    let token = event.queryStringParameters.token;
    console.log("token is "+token);
    try {
      https.get(APIENDPOINT+'/Prod/saml/RoleAssertion?token='+encodeURI(token),{
        headers: {
          "x-api-key": APIKEY
        }
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
        }
      );
    } catch (error) {
      console.log('caught error in getting SAML');
      console.log(error);
      reject(error);
    }
	});
}
