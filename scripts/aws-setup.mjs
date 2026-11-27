#!/usr/bin/env node
// One-time AWS setup for Homeward. Idempotent: safe to run again.
//
//   pnpm aws:setup
//
// Reads keys from .env.local, then creates the DynamoDB table and the private
// photo bucket, writes their names back to .env.local, and checks that
// Rekognition, Nova and Titan all answer.

import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { BedrockRuntimeClient, ConverseCommand, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { CreateTableCommand, DescribeTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DetectLabelsCommand, RekognitionClient } from "@aws-sdk/client-rekognition";
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketEncryptionCommand,
  PutPublicAccessBlockCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const ENV_FILE = path.join(ROOT, ".env.local");

const env = process.env;
const region = env.HOMEWARD_REGION || "us-east-1";
const table = env.HOMEWARD_TABLE || "homeward";
const textModel = env.HOMEWARD_TEXT_MODEL || "us.amazon.nova-2-lite-v1:0";
const embedModel = env.HOMEWARD_EMBED_MODEL || "amazon.titan-embed-text-v2:0";

if (!env.HOMEWARD_ACCESS_KEY_ID || !env.HOMEWARD_SECRET_ACCESS_KEY) {
  console.error("✗ Put HOMEWARD_ACCESS_KEY_ID and HOMEWARD_SECRET_ACCESS_KEY in .env.local first (see docs/AWS-SETUP.md, Part 4).");
  process.exit(1);
}

const config = {
  region,
  credentials: { accessKeyId: env.HOMEWARD_ACCESS_KEY_ID, secretAccessKey: env.HOMEWARD_SECRET_ACCESS_KEY },
};

const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg, error) => console.log(`  ✗ ${msg}\n      ${error?.name ?? ""}: ${error?.message ?? error}`);

async function setEnv(key, value) {
  let text = "";
  try {
    text = await readFile(ENV_FILE, "utf8");
  } catch {}
  const line = `${key}=${value}`;
  text = new RegExp(`^${key}=.*$`, "m").test(text) ? text.replace(new RegExp(`^${key}=.*$`, "m"), line) : `${text.trimEnd()}\n${line}\n`;
  await writeFile(ENV_FILE, text);
}

async function ensureTable() {
  const db = new DynamoDBClient(config);
  try {
    await db.send(
      new CreateTableCommand({
        TableName: table,
        BillingMode: "PAY_PER_REQUEST",
        AttributeDefinitions: ["pk", "sk", "gsi1pk", "gsi1sk"].map((name) => ({ AttributeName: name, AttributeType: "S" })),
        KeySchema: [
          { AttributeName: "pk", KeyType: "HASH" },
          { AttributeName: "sk", KeyType: "RANGE" },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "gsi1",
            KeySchema: [
              { AttributeName: "gsi1pk", KeyType: "HASH" },
              { AttributeName: "gsi1sk", KeyType: "RANGE" },
            ],
            Projection: { ProjectionType: "ALL" },
          },
        ],
      }),
    );
    process.stdout.write(`  … creating table "${table}"`);
  } catch (error) {
    if (error.name !== "ResourceInUseException") throw error;
  }
  for (;;) {
    const { Table } = await db.send(new DescribeTableCommand({ TableName: table }));
    const indexReady = (Table.GlobalSecondaryIndexes ?? []).every((i) => i.IndexStatus === "ACTIVE");
    if (Table.TableStatus === "ACTIVE" && indexReady) break;
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 3000));
  }
  ok(`DynamoDB table "${table}" is ready (on-demand, encrypted at rest by default)`);
  await setEnv("HOMEWARD_TABLE", table);
}

async function ensureBucket() {
  const s3 = new S3Client(config);
  let bucket = env.HOMEWARD_BUCKET;
  if (bucket) {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
      ok(`S3 bucket "${bucket}" already exists`);
      return;
    } catch {
      console.log(`  … bucket "${bucket}" not found, creating it`);
    }
  } else {
    bucket = `homeward-photos-${randomBytes(4).toString("hex")}`;
  }
  await s3.send(new CreateBucketCommand({ Bucket: bucket, ...(region === "us-east-1" ? {} : { CreateBucketConfiguration: { LocationConstraint: region } }) }));
  await s3.send(
    new PutPublicAccessBlockCommand({
      Bucket: bucket,
      PublicAccessBlockConfiguration: { BlockPublicAcls: true, IgnorePublicAcls: true, BlockPublicPolicy: true, RestrictPublicBuckets: true },
    }),
  );
  await s3.send(
    new PutBucketEncryptionCommand({
      Bucket: bucket,
      ServerSideEncryptionConfiguration: { Rules: [{ ApplyServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" } }] },
    }),
  );
  await setEnv("HOMEWARD_BUCKET", bucket);
  ok(`S3 bucket "${bucket}" created (private, encrypted)`);
}

async function ensureSecret() {
  if (env.HOMEWARD_SESSION_SECRET && env.HOMEWARD_SESSION_SECRET.length >= 32) return ok("Session secret already set");
  await setEnv("HOMEWARD_SESSION_SECRET", randomBytes(32).toString("base64url"));
  ok("Session secret generated");
}

async function checkAi() {
  const sample = await sharp(path.join(ROOT, "public/images/found-calculator-216.webp")).jpeg().toBuffer();
  try {
    const { Labels } = await new RekognitionClient(config).send(new DetectLabelsCommand({ Image: { Bytes: sample }, MaxLabels: 5 }));
    ok(`Rekognition sees: ${Labels.map((l) => l.Name).join(", ")}`);
  } catch (error) {
    fail("Rekognition", error);
  }

  const bedrock = new BedrockRuntimeClient(config);
  try {
    const result = await bedrock.send(
      new ConverseCommand({
        modelId: textModel,
        messages: [{ role: "user", content: [{ text: "Reply with the single word: ready" }] }],
        inferenceConfig: { maxTokens: 10 },
      }),
    );
    ok(`Bedrock ${textModel} says: ${result.output.message.content[0].text.trim()}`);
  } catch (error) {
    fail(`Bedrock ${textModel} (the app falls back to the built-in parser if this stays off)`, error);
  }

  try {
    const result = await bedrock.send(
      new InvokeModelCommand({
        modelId: embedModel,
        contentType: "application/json",
        body: JSON.stringify({ inputText: "black HP laptop", dimensions: 512, normalize: true }),
      }),
    );
    const { embedding } = JSON.parse(new TextDecoder().decode(result.body));
    ok(`Bedrock ${embedModel} returned a ${embedding.length}-number vector`);
  } catch (error) {
    fail(`Bedrock ${embedModel}`, error);
  }
}

console.log(`\nHomeward AWS setup · region ${region}\n`);
try {
  await ensureTable();
  await ensureBucket();
  await ensureSecret();
  await setEnv("HOMEWARD_REGION", region);
  await setEnv("HOMEWARD_ADAPTERS", "aws");
  console.log("\nChecking the AI services…");
  await checkAi();
  console.log("\nDone. Restart `pnpm dev` to use AWS locally.\n");
} catch (error) {
  fail("Setup stopped", error);
  process.exit(1);
}
