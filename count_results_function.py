import csv
import logging
import boto3
import urllib
import json
from datetime import datetime
import os

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

logger.debug('This will get logged')

RESULTS_SNS_TOPIC = os.getenv(key="RESULTS_SNS_TOPIC")

# Config Items

# Set up S3 client
s3 = boto3.client('s3')
sns = boto3.client('sns')

def lambda_handler(event, context):

    logger.debug(f"event is {event}")
    bucket = event['Records'][0]['s3']['bucket']['name']
    logger.debug(f"bucket is {bucket}")
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')
    logger.debug(f"key is {key}")
    file_name = key.split('/')[1].replace(' ', '_')
    logger.debug(f"file_name is {file_name}")

    logger.debug(f"downloading file from S3 {key}")
    s3.download_file(bucket, key, '/tmp/'+file_name)
    logger.debug(f"downloaded file from S3 with file name {file_name}")

    success_count = 0
    failed_count = 0
    row_count = 0
    errors = []
    with open('/tmp/'+file_name) as csvDataFile:
        csvReader = csv.reader(csvDataFile)
        for row in csvReader:
            row_count += 1
            logger.debug(f"row first column is {row[0]}")
            if row[0] == "mobile":
                logger.debug("processing header row - ignoring")
            else:
                if row[2] != "":
                    logger.debug(f"encountered an error processing row {row_count}, {row[2]}")
                    errors.append({"mobile": row[0], "error_message": row[2]})
                    failed_count += 1
                else:
                    success_count += 1
    
    final_status = {
        "processing_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "file_name": file_name,
        "success_count": success_count,
        "failed_count": failed_count,
        "errors": errors
    }
    logger.info(json.dumps(final_status, indent=4))
    sns.publish(
        TopicArn=RESULTS_SNS_TOPIC,
        Message=json.dumps(final_status, indent=4),
        Subject="Covid-19 Elective Pilot File Processed"
    )
    logger.info("processing completed")
