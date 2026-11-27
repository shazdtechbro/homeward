# Homeward on AWS: setup guide

Checked against AWS docs in November 2026. Everything here runs on the AWS **Free plan** credits.

**Region for everything: US East (N. Virginia) `us-east-1`.** Pick it in the region menu at the top right of the console, every time. It's the region where all the Bedrock models we use are available.

---

## What we use and what it costs

| AWS service | What it does in Homeward | Price | Our likely cost |
|---|---|---|---|
| Amplify Hosting | Builds and serves the site and server code from GitHub | Free-tier allowance, then cents | ~$0 |
| DynamoDB | Users, found items, claims, inbox | On-demand, fractions of a cent | ~$0 |
| S3 | Private photo storage | $0.023 per GB per month | <$0.10 |
| Rekognition | Labels in the photo, ID-card text, blocks unsafe uploads | $0.001 per image per API | 1,000 test photos ≈ $3 |
| Bedrock: Amazon Nova 2 Lite | Reads lost reports, writes listings from photos, suggests ownership questions | $0.30 / $2.50 per 1M tokens in/out | 1,000 calls ≈ $1 |
| Bedrock: Titan Text Embeddings V2 | Semantic "meaning" search between reports and finds | ~$0.02 per 1M tokens | ~$0 |
| CloudWatch | Logs | Free allowance | $0 |

**Expected total: under $5** out of $100–200 of credits.

### About the Free plan (from aws.amazon.com/free)
- New accounts get **$100 in credits on sign-up, plus up to $100 more** for trying services.
- On the **Free plan you are never charged**. The account closes on its own after **6 months** or when the credits run out, whichever comes first.
- A card is still needed to verify you. Naira cards often fail on USD charges; a **virtual dollar card** usually works.
- Credits are for genuinely new customers. Don't create several accounts as the same person, or you can lose them.

### One known catch
Free-plan accounts can't use **third-party** Bedrock models (Anthropic, Meta and others sold through AWS Marketplace). That's why Homeward uses **Amazon's own models: Nova and Titan**.

If Bedrock is still refused on your account, the app automatically falls back to its built-in parser, so nothing breaks. You could also upgrade to the Paid plan; your unused credits carry over, but you can't switch back to the Free plan.

---

## Part 1: Create the account (you, about 10 minutes)

1. Go to **https://aws.amazon.com/free** and click **Create a free account**.
2. Enter your email and an account name (`homeward`), then verify the email code.
3. Choose the **Free plan**.
4. Enter your card and phone number to verify.
5. Pick the **Basic support (free)** plan.
6. Sign in to the console as the **root user**.
7. **Turn on MFA for the root user:** click your account name at the top right → **Security credentials** → **Assign MFA device** → Authenticator app.

## Part 2: Spending alarm (2 minutes)

1. Search the console for **Billing and Cost Management**, then open **Budgets** → **Create budget**.
2. Choose **Use a template** → **Zero spend budget**.
3. Enter your email and click **Create budget**.

You'll get an email the moment anything costs even one cent beyond your credits.

## Part 3: A permission policy for the app (3 minutes)

1. Search the console for **IAM**, then go to **Policies** → **Create policy** → **JSON** tab.
2. Delete what's there and paste the policy below.
3. Click **Next**, name it `HomewardAppPolicy`, then click **Create policy**.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Database",
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable", "dynamodb:DescribeTable", "dynamodb:GetItem", "dynamodb:PutItem",
        "dynamodb:UpdateItem", "dynamodb:DeleteItem", "dynamodb:Query", "dynamodb:ConditionCheckItem"
      ],
      "Resource": ["arn:aws:dynamodb:us-east-1:*:table/homeward", "arn:aws:dynamodb:us-east-1:*:table/homeward/index/*"]
    },
    {
      "Sid": "Photos",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket", "s3:PutBucketPublicAccessBlock", "s3:PutEncryptionConfiguration",
        "s3:GetObject", "s3:PutObject", "s3:ListBucket"
      ],
      "Resource": ["arn:aws:s3:::homeward-photos-*", "arn:aws:s3:::homeward-photos-*/*"]
    },
    {
      "Sid": "Vision",
      "Effect": "Allow",
      "Action": ["rekognition:DetectLabels", "rekognition:DetectText", "rekognition:DetectModerationLabels"],
      "Resource": "*"
    },
    {
      "Sid": "GenerativeAI",
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel"],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/amazon.nova-*",
        "arn:aws:bedrock:*::foundation-model/amazon.titan-embed-*",
        "arn:aws:bedrock:*:*:inference-profile/us.amazon.nova-*",
        "arn:aws:bedrock:*:*:inference-profile/global.amazon.nova-*"
      ]
    }
  ]
}
```

This is **least privilege**: the app can only touch its own table, its own photo bucket, and Amazon's AI models. That's a security point worth mentioning to the judges.

## Part 4: Keys for local development (3 minutes)

1. Go to **IAM** → **Users** → **Create user**, and name it `homeward-dev`. **Don't** tick console access.
2. Choose **Attach policies directly**, tick **HomewardAppPolicy**, then click **Next** → **Create user**.
3. Open the user → **Security credentials** tab → **Create access key**.
4. Choose **Local code**, tick the confirmation box, then click **Next** → **Create access key**.
5. Open the project file **`.env.local`** (it's in `.gitignore`, so it never goes to GitHub) and paste the two values:

```
HOMEWARD_ADAPTERS=aws
HOMEWARD_REGION=us-east-1
HOMEWARD_ACCESS_KEY_ID=paste-access-key-id
HOMEWARD_SECRET_ACCESS_KEY=paste-secret-access-key
```

> **Don't paste keys into chat, GitHub, WhatsApp or the form.** If a key ever leaks, delete it in IAM and make a new one.

6. Tell Claude **"keys are in"**. Claude then runs `pnpm aws:setup`, which:
   - creates the DynamoDB table `homeward`
   - creates a private, encrypted S3 bucket `homeward-photos-<random>` and writes its name into `.env.local`
   - generates a session secret
   - checks that Rekognition, Nova and Titan all answer

## Part 5: Role for the live site (3 minutes)

The live site uses a **role** instead of keys, so no secret is stored in Amplify.

1. Go to **IAM** → **Roles** → **Create role**, and choose **Custom trust policy**.
2. Paste this trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Principal": { "Service": "amplify.amazonaws.com" }, "Action": "sts:AssumeRole" }
  ]
}
```

3. Click **Next**, tick **HomewardAppPolicy**, then **Next**.
4. Name it `HomewardComputeRole` and click **Create role**.

## Part 6: Deploy on Amplify (about 10 minutes, plus a 5-minute build)

1. Search the console for **Amplify** → **Create new app** → **GitHub** → **Next**.
2. Authorise GitHub, then pick the repo **shazdtechbro/homeward** and the branch **main**.
3. Amplify detects Next.js and uses the `amplify.yml` from the repo. Leave the build settings alone.
4. Open **Advanced settings** → **Environment variables** and add these (Claude will give you the exact values from `.env.local`):

| Key | Value |
|---|---|
| `HOMEWARD_ADAPTERS` | `aws` |
| `HOMEWARD_REGION` | `us-east-1` |
| `HOMEWARD_TABLE` | `homeward` |
| `HOMEWARD_BUCKET` | `homeward-photos-…` (from `.env.local`) |
| `HOMEWARD_SESSION_SECRET` | long random string (from `.env.local`) |

5. In the same screen, choose **Service role** → **Create and use a new service role** (this one is for building), then click **Save and deploy**.
6. While it builds, go to **App settings** → **IAM roles** → **Compute role** → **Edit**. Choose `HomewardComputeRole`, then **Save**.
7. When the build finishes, click **Redeploy this version** so the role is picked up.
8. Open the `https://main.xxxx.amplifyapp.com` link.

**If the live site says it can't reach AWS** (some accounts have had compute-role trouble), add two more environment variables in Amplify, **Hosting** → **Environment variables**: `HOMEWARD_ACCESS_KEY_ID` and `HOMEWARD_SECRET_ACCESS_KEY`. Use the `homeward-dev` key values, then redeploy.

Amplify only gives environment variables to the server at runtime if they're written into `.env.production` during the build. The repo's `amplify.yml` already does that for every `HOMEWARD_` variable.

## Part 7: Check, then submit

- Sign up, log a found item with a photo, search for it as a lost item, claim it, and confirm the finder's contact appears.
- Check **CloudWatch** → **Log groups** for the Amplify logs (shows judges it's running on AWS).
- Then fill the form with the Amplify URL and the updated architecture picture.

## Afterwards (to stop spending)
- Delete the Amplify app, the S3 bucket and the DynamoDB table, plus the `homeward-dev` access key.
- The Free plan closes on its own after 6 months anyway.
