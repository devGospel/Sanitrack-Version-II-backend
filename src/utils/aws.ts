//import { User } from '@/resources/users';
import aws from "aws-sdk";
import { createChildLogger } from "./childLogger";

const moduleName = '[aws/util]'
const Logger = createChildLogger(moduleName)

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: "us-east-1",
  apiVersion: "2006-03-01",
  signatureVersion: "v4",
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME!

export const UploadToS3 = async (
  imageFile: any,
  imageKey: string,
): Promise<any> => {
  try {
    const UploadParams = {
      Bucket: S3_BUCKET_NAME!,
      Key: imageKey,
      Body: imageFile,
    };

    const UploadResult = await s3.upload(UploadParams).promise();
    const evidenceUrl = UploadResult.Location!;

    return evidenceUrl;
  } catch (error: any) {
    Logger.error(error)
    throw new Error(error);
  }
};