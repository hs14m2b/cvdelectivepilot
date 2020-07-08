// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'eu-west-2'});
const https = require('https');
const http = require('http');
const fs = require('fs');
const VPCENDPOINT = process.env.VPCENDPOINT;
const VPCENDPOINTPORT = parseInt(process.env.VPCENDPOINTPORT);
const CISFQDN = process.env.CISFQDN;
const eventHandler = require('./proxyrequest');

exports.handler = async (event) => {
    let responseBody = await eventHandler.handleEvent(event, VPCENDPOINT, VPCENDPOINTPORT, CISFQDN, http, https, fs);
    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/xml',
          },
        body: responseBody
    };
    return response;
    
};
