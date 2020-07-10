// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'eu-west-2'});
const https = require('https');
const http = require('http');
const fs = require('fs');
const xml2js = require('xml2js');
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
const EXECMODE = process.env.EXECMODE;
const DEFAULTPWD = process.env.DEFAULTPWD;
const COGNITOPOOL = process.env.COGNITOPOOL;
const COGNITOCLIENT = process.env.COGNITOCLIENT;
const APIENDPOINT = process.env.APIENDPOINT;
const APIKEY = process.env.APIKEY;

const cognitoHandler = require('./cognitohandler');
const samlRetrieveHandler = require('./smartcardtokensamlretrieve');

exports.handler = async (event) => {
    let samlResponse = await samlRetrieveHandler.handleEvent(event, APIKEY, APIENDPOINT, https);
    console.log(samlResponse);
    let cognitoResponse = await cognitoHandler.handleEvent(samlResponse, DEFAULTPWD, COGNITOPOOL, COGNITOCLIENT, xml2js, cognitoidentityserviceprovider);
    console.log(cognitoResponse);
    const response = {
        statusCode: 200,
        body: cognitoResponse
    };
    return response;
    
};
