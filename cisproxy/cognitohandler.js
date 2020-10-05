
module.exports.handleEvent = async (cisResponse, DEFAULTPWD, COGNITOPOOL, COGNITOCLIENT, xml2js, cognitoidentityserviceprovider) => {
  //parse xml
  let parsedXML = await parseXML(xml2js, cisResponse);
  console.log(JSON.stringify(parsedXML));
  //check the response status
  let samlResponseStatus = "fail";
  try {
    samlResponseStatus = parsedXML["samlp:Response"]["samlp:Status"][0]["samlp:StatusCode"][0]["$"]["Value"];
  } catch (error) {
    console.log("caught error retrieving response status", error);    
  }
  if (samlResponseStatus == "samlp:Success")
  {
    console.log("Got success from SAML response - finding UID");
    let cn = getAttribute(parsedXML,"cn");
    let uid = getAttribute(parsedXML,"uid");
    let nhsIdCode = getAttribute(parsedXML,"nhsIdCode");
    console.log("after parsing the saml the cn is ", cn);
    console.log("after parsing the saml the uid is ", uid);
    console.log("after parsing the saml the nhsIdCode is ", nhsIdCode);
    let cognitoUserDetails = await getCognitoUser(COGNITOPOOL, uid, cognitoidentityserviceprovider);
    if (cognitoUserDetails){
      console.log("User exists ", cognitoUserDetails);
    }
    else{
      console.log("User does not exist - adding to user pool");
      let newCognitoUser = await addCognitoUser(COGNITOCLIENT, COGNITOPOOL, uid, DEFAULTPWD, cognitoidentityserviceprovider, nhsIdCode);
      console.log(newCognitoUser);
      let newCognitoUserConfirm = await confirmUser(COGNITOPOOL, uid, cognitoidentityserviceprovider);
      console.log(newCognitoUserConfirm);
    }
    let cognitoUser = await authenticateCognitoUser(COGNITOCLIENT, COGNITOPOOL, uid, DEFAULTPWD, cognitoidentityserviceprovider);
    console.log(cognitoUser);
    return cognitoUser;
  }
  else{
    //SAML response was not success - fail gracefully
  }
}

async function parseXML(xml2js, xmlString){
  return xml2js.parseStringPromise(xmlString);
}

function getAttribute(parsedXML, attributeName){
  let samlAttributes = parsedXML["samlp:Response"]["saml:Assertion"][0]["saml:AttributeStatement"][0]["saml:Attribute"];
  console.log("samlAttributes are ", samlAttributes)
  for (samlAttribute of samlAttributes)
  {
    console.log("samlAttribute is ", samlAttribute);
    if (samlAttribute["$"]["AttributeName"] == attributeName) return samlAttribute["saml:AttributeValue"][0];
  }
  return "";
}

async function getCognitoUser(COGNITOPOOL, uid, cognitoidentityserviceprovider){
    //find the user in the cognito pool
  let params = {
    UserPoolId: COGNITOPOOL, /* required */
    Username: uid /* required */
  };
  console.log("cognito params are ", params);
  return new Promise(function (resolve, reject) {
      cognitoidentityserviceprovider.adminGetUser(params, function(err, data) {
        if (err){ 
          console.log(err.message, err.code); // an error occurred
          resolve(data);
        }
        else{
          console.log(data);           // successful response
          resolve(data);
        }
      });
  });
}

async function authenticateCognitoUser(COGNITOCLIENT, COGNITOPOOL, uid, DEFAULTPWD, cognitoidentityserviceprovider){
  let params = {
    AuthFlow: "ADMIN_USER_PASSWORD_AUTH", /* required */
    ClientId: COGNITOCLIENT, /* required */
    UserPoolId: COGNITOPOOL, /* required */
    AuthParameters: {
      "USERNAME": uid,
      "PASSWORD": DEFAULTPWD
    }
  };
  return new Promise(function (resolve, reject) {
    cognitoidentityserviceprovider.adminInitiateAuth(params, function(err, data) {
      if (err){ 
        console.log(err); // an error occurred
        if (err)
        resolve("");
      }
      else{
        console.log(data);           // successful response
        resolve(data);
      }
    });
  });
}

async function addCognitoUser(COGNITOCLIENT, COGNITOPOOL, uid, DEFAULTPWD, cognitoidentityserviceprovider, nhsIdCode){
  let params = {
    ClientId: COGNITOCLIENT, /* required */
    Password: DEFAULTPWD, /* required */
    UserAttributes: [
      {
        Name: 'custom:organisation', /* required */
        Value: nhsIdCode
      },
      {
        Name: 'custom:smartcarduser', /* required */
        Value: "true"
      }
      /* more items */
    ],
    Username: uid /* required */
  };
  return new Promise(function (resolve, reject) {
    cognitoidentityserviceprovider.signUp(params, function(err, data) {
      if (err){ 
        console.log(err); // an error occurred
        if (err)
        resolve("");
      }
      else{
        console.log(data);           // successful response
        resolve(data);
      }
    });
  });
}

async function confirmUser(COGNITOPOOL, uid, cognitoidentityserviceprovider){
  let params = {
    UserPoolId: COGNITOPOOL, /* required */
    Username: uid /* required */
  };
  return new Promise(function (resolve, reject) {
    cognitoidentityserviceprovider.adminConfirmSignUp(params, function(err, data) {
      if (err){ 
        console.log(err); // an error occurred
        if (err)
        resolve("");
      }
      else{
        console.log(data);           // successful response
        resolve(data);
      }
    });  
  });
}