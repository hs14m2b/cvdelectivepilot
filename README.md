# cvdelectivepilot

This project contains the source code and cloudformation templates for the excel-based pilot process with NHS Trusts.

The artefacts are as follows:

 - lambda.zip - a bundled lambda that reads the csv file from S3 and triggers the sending of a SMS via the national testing service platform in a separate AWS account
 - lambda_function.py - the python code for reading a raw excel file from S3. The file contains the message template for the Trust and the list of phone numbers. The function reads all the numbers and outputs a csv file to the S3 "/inbox" folder - this csv file is then picked up and processed by the lamba function referenced above. The function also outputs a csv status file noting success or failure for each supplied phone number. This py file is packaged in the "processexcel.zip" file for deployment to the lambda function.
  - count_uploads_function.py - this reads the status file from the function above and publishes a summary to SNS. The Service Management team email is subscribed to this SNS to receive the summary stats
  - count_results_function.py - this reads the status file from the function that publishes the messages to the national testing service platform (top function) publishes a summary to SNS. The Service Management team email is subscribed to this SNS to receive the summary stats
  - processresults.zip - this is the packaged code for the count_uploads* and count_results* functions.
  - cvdElectPilotCF.json - this is the cloudformation template that deploys the lambda functions, creates the S3 buckets, sets up the event subscriptions and creates the IAM roles for the functions and also for the Service Management team to upload csv or excel files to trigger the processing. The "EnvironmentName" parameter is used to deploy different logical versions of the artefacts and enables a basic "dev" instance to be used for testing before deploying any changes to the "prod" instance.
  - requirements.txt - python dependencies
