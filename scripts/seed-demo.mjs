#!/usr/bin/env node
// Seeds realistic found items into the live DynamoDB table and S3 bucket so the
// app can be demoed end to end. Idempotent: re-running overwrites the same items.
//
//   node --env-file=.env.local scripts/seed-demo.mjs
//
// The demo finder's sign-in details are written to .demo-finder.txt (git-ignored).

import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import bcrypt from "bcryptjs";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const env = process.env;
const config = {
  region: env.HOMEWARD_REGION || "eu-north-1",
  credentials: { accessKeyId: env.HOMEWARD_ACCESS_KEY_ID, secretAccessKey: env.HOMEWARD_SECRET_ACCESS_KEY },
};
const TABLE = env.HOMEWARD_TABLE || "homeward";
const BUCKET = env.HOMEWARD_BUCKET;
const db = DynamoDBDocumentClient.from(new DynamoDBClient(config), { marshallOptions: { removeUndefinedValues: true } });
const s3 = new S3Client(config);

const FINDER = { id: "usr_demofinder01", name: "Tunde Adeyemi", email: "tunde.finder@homeward.demo" };

const P = {
  engineering: { name: "Faculty of Engineering", zone: "engineering" },
  library: { name: "Main Library", zone: "library" },
  cbt: { name: "CBT Centre", zone: "library" },
  sub: { name: "Student Union Building", zone: "sub" },
  shuttle: { name: "Shuttle Park", zone: "transport" },
  arts: { name: "Faculty of Arts", zone: "arts" },
};

const hoursAgo = (h) => new Date(Date.now() - h * 3_600_000).toISOString();

// prettier-ignore
const ITEMS = [
  { id: "lst_seedbag01", art: "found-backpack", title: "Navy laptop backpack", category: "bag", colour: "blue", brand: "HP", place: P.engineering, h: 20,
    description: "Navy HP laptop backpack left under a seat in the Engineering lecture theatre. Padded laptop sleeve inside.",
    check: { question: "What is in the front pocket?", answer: "blue biro and a printed handout" } },
  { id: "lst_seedbag02", art: "found-backpack", title: "Blue school backpack", category: "bag", colour: "blue", place: P.arts, h: 50,
    description: "Plain blue backpack found on a bench outside the Faculty of Arts.",
    check: { question: "What keyring is on the zip?", answer: "small red football keyring" } },
  { id: "lst_seedslv03", art: "match-sleeve", title: "Grey laptop sleeve", category: "laptop-sleeve", colour: "grey", place: P.library, h: 9,
    description: "Grey padded laptop sleeve on a reading desk, second floor of the Main Library.",
    check: { question: "What sticker is on the front?", answer: "unilorin logo sticker" } },
  { id: "lst_seedcal04", art: "found-calculator", title: "Casio scientific calculator", category: "calculator", colour: "black", brand: "Casio", place: P.cbt, h: 3,
    description: "Casio fx-991 left on a desk after the morning CBT session.",
    check: { question: "What name is written on the back?", answer: "kemi" } },
  { id: "lst_seedphn05", art: "found-phone", title: "Tecno phone, cracked screen", category: "phone", colour: "black", brand: "Tecno", place: P.shuttle, h: 1.5,
    description: "Black Tecno phone with a cracked screen, found on a shuttle seat.",
    check: { question: "What is the lock-screen picture?", answer: "a white cat" } },
  { id: "lst_seedkey06", art: "found-keys", title: "Keys on a leather fob", category: "keys", colour: "brown", place: P.sub, h: 6,
    description: "Three keys on a brown leather fob, by the SUB entrance.",
    check: { question: "What else hangs on the key ring?", answer: "a tiny torch" } },
];

async function upsertFinder(password) {
  const existing = await db.send(new GetCommand({ TableName: TABLE, Key: { pk: `USER#${FINDER.id}`, sk: "PROFILE" } }));
  await db.send(new PutCommand({
    TableName: TABLE,
    Item: {
      pk: `USER#${FINDER.id}`, sk: "PROFILE", ...FINDER, faculty: "Engineering and Technology",
      passwordHash: await bcrypt.hash(password, 10),
      karma: existing.Item?.karma ?? 150, createdAt: hoursAgo(24 * 30),
    },
  }));
  await db.send(new PutCommand({ TableName: TABLE, Item: { pk: `EMAIL#${FINDER.email}`, sk: "LOOKUP", userId: FINDER.id } }));
}

async function putItem(item) {
  const imageKey = `up/${item.id}.jpg`;
  const jpeg = await sharp(path.join(ROOT, "assets-src", `${item.art}.png`)).resize(1024, 1024, { fit: "inside" }).jpeg({ quality: 82 }).toBuffer();
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: imageKey, Body: jpeg, ContentType: "image/jpeg" }));
  const createdAt = hoursAgo(item.h);
  await db.send(new PutCommand({
    TableName: TABLE,
    Item: {
      pk: `ITEM#${item.id}`, sk: "LISTING", gsi1pk: "LISTING", gsi1sk: createdAt,
      id: item.id, title: item.title, category: item.category, colour: item.colour, brand: item.brand,
      place: item.place, foundAt: createdAt, createdAt, status: "logged", imageKey,
      description: item.description, check: item.check,
      finder: { name: FINDER.name, email: FINDER.email, userId: FINDER.id },
    },
  }));
  console.log(`  ✓ ${item.title}`);
}

if (!BUCKET || !config.credentials.accessKeyId) {
  console.error("Run with --env-file=.env.local after `pnpm aws:setup`.");
  process.exit(1);
}

const password = `Demo-${randomBytes(4).toString("hex")}`;
await upsertFinder(password);
for (const item of ITEMS) await putItem(item);
await writeFile(
  path.join(ROOT, ".demo-finder.txt"),
  `Demo finder account (for testing the handover)\nEmail: ${FINDER.email}\nPassword: ${password}\n\nOwnership answers:\n${ITEMS.map((i) => `- ${i.title}: ${i.check.question} → ${i.check.answer}`).join("\n")}\n`,
);
console.log(`\nSeeded ${ITEMS.length} items. Finder login saved to .demo-finder.txt`);
