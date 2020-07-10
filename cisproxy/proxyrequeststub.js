
module.exports.handleEvent = async (event, VPCENDPOINT, VPCENDPOINTPORT, CISFQDN, http, https, fs) => {
  console.log(event);
	return new Promise(function (resolve, reject) {
    let stubResponse = fs.readFileSync("samlresponse.xml", "utf8");
    resolve(stubResponse);
	});
}