// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'eu-west-2'});
const https = require('https');
const http = require('http');
const fs = require('fs');
const xml2js = require('xml2js');
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
const VPCENDPOINT = process.env.VPCENDPOINT;
const VPCENDPOINTPORT = parseInt(process.env.VPCENDPOINTPORT);
const CISFQDN = process.env.CISFQDN;
const EXECMODE = process.env.EXECMODE;

const cisEventHandler = (EXECMODE == "stub" ? require('./proxyrequeststub') : require('./proxyrequest'));

exports.handler = async (event) => {
    let cisResponse = await cisEventHandler.handleEvent(event, VPCENDPOINT, VPCENDPOINTPORT, CISFQDN, http, https, fs);
    console.log(cisResponse);
    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/xml',
          },
        body: cisResponse
    };
    return response;
    
};
