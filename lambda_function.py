import csv
import logging
import pathlib
import re
import time
import urllib
import os
from openpyxl import load_workbook
import phonenumbers
from phonenumbers import NumberParseException

import boto3

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logging.debug('This will get logged')

# Config Items
SOURCE_XLSX_FILENAME = "Trust Submission Template - v2.xlsx"
SOURCE_FOLDER = "upload"
OUTPUT_CSV_FILENAME = "number_list_output.csv"
#OUTPUT_FOLDER = "inbox"
RESULTS_CSV_FILENAME = "results.csv"
#RESULTS_FOLDER = "processedupload"

RESULTS_FOLDER = os.getenv(key="RESULTS_FOLDER")
OUTPUT_FOLDER = os.getenv(key="OUTPUT_FOLDER")
S3BUCKETNAME = os.getenv(key="S3BUCKETNAME")

# Set up S3 client
s3 = boto3.client('s3')

def lambda_handler(event, context):

    logging.debug(f"event is {event}")
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')

    obj = s3.get_object(Bucket='bucket-name', Key=key) 
    binary_data = obj['Body'].read()
    
    # Load workbook
    # workbook = load_workbook(filename=SOURCE_XLSX_FILENAME, read_only=True)
    workbook = load_workbook(BytesIO(binary_data))

    # Get message content
    config_sheet = workbook["Config"]
    message = config_sheet["B1"].value

    # Get list of mobile numbers
    sheet = workbook["Patient Details"]
    data = sheet["C3:C100"]

    export_list = []

    processed_success = 0
    processed_error = 0

    processed_results = []

    for cell in data:
        number = cell[0].value
        if number:
            try:
                phonenumbers.parse(number, "GB")
                regex_result = re.search("^\d{11}$", number)
                if not regex_result:
                    raise ValueError("Does not match regex")
                export_list.append(cell)
                logging.info(number)
                processed_success += 1
                processed_results.append((number, "Processed"))

            except (ValueError, NumberParseException) as e:
                logging.error(e)
                processed_error += 1
                processed_results.append((number, e))


    # Write numbers out to CSV
    with open(OUTPUT_CSV_FILENAME, mode='w') as number_list_file:
        writer = csv.writer(number_list_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_ALL)

        row_count = 0

        for row in export_list:
            print(row)
            number = row[0].value
            writer.writerow([number, message])
            row_count += 1

        print(row_count)    
        logging.debug(f"Wrote {row_count} rows to {OUTPUT_CSV_FILENAME}")

    # Move file to processed folder

    source = pathlib.Path(SOURCE_XLSX_FILENAME)
    processed_folder = pathlib.Path(OUTPUT_FOLDER)

    destination = processed_folder.joinpath(SOURCE_XLSX_FILENAME)
    print(destination)

    if not destination.exists():
        source.replace(destination)

    # Write results out to CSV
    with open('/tmp/'+RESULTS_CSV_FILENAME, mode='w') as results_list_file:
        writer = csv.writer(results_list_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_ALL)

        row_count = 0

        for item in processed_results:
            writer.writerow([item[0], item[1]])
            row_count += 1

        print(row_count)    
        logging.debug(f"Wrote {row_count} rows to {RESULTS_CSV_FILENAME}")

    #copy csv to S3 inbox
    s3.meta.client.upload_file(RESULTS_CSV_FILENAME, S3BUCKETNAME, RESULTS_CSV_FILENAME)

    logging.info(f"Results: {processed_success} number(s) processed succesfully, {processed_error} number(s) failed.")

lambda_handler(None, None)