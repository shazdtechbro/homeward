import "server-only";
import { DynamoDBClient, type DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
  type QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import type { Claim, Notice } from "@/core/domain/claim";
import type { Category } from "@/core/domain/item";
import type { Listing } from "@/core/domain/listing";
import type { User } from "@/core/domain/user";
import type { ClaimRepository, ListingRepository, UserRepository } from "@/core/ports";
import { AppError } from "@/lib/errors";

/*
 * One DynamoDB table, keyed pk/sk, with one index (gsi1) for "all listings by date".
 *
 *   USER#<id>      PROFILE            the user
 *   EMAIL#<email>  LOOKUP             unique email → userId
 *   MATRIC#<no>    LOOKUP             unique matric → userId
 *   ITEM#<id>      LISTING            a found item      (gsi1: LISTING / createdAt)
 *   ITEM#<id>      CLAIM#<id>         a claim on it
 *   USER#<id>      CLAIM#<id>         the same claim, for "my claims"
 *   USER#<id>      NOTE#<iso>#<id>    inbox
 */

type Row = Record<string, unknown>;

const DATE_FIELDS = ["createdAt", "foundAt"] as const;

function toRow(value: object): Row {
  const row: Row = { ...value };
  for (const field of DATE_FIELDS) {
    const v = row[field];
    if (v instanceof Date) row[field] = v.toISOString();
  }
  return row;
}

function fromRow<T>(row: Row): T {
  const { pk: _pk, sk: _sk, gsi1pk: _g1, gsi1sk: _g2, ...rest } = row;
  for (const field of DATE_FIELDS) {
    const v = rest[field];
    if (typeof v === "string") rest[field] = new Date(v);
  }
  return rest as T;
}

const newestFirst = <T extends { createdAt: Date }>(a: T, b: T) =>
  b.createdAt.getTime() - a.createdAt.getTime();

/** Thin wrapper over the document client that knows the table and paginates. */
export class DynamoTable {
  readonly db: DynamoDBDocumentClient;

  constructor(
    config: DynamoDBClientConfig,
    readonly name: string,
  ) {
    this.db = DynamoDBDocumentClient.from(new DynamoDBClient(config), {
      marshallOptions: { removeUndefinedValues: true },
    });
  }

  async get(pk: string, sk: string): Promise<Row | undefined> {
    const { Item } = await this.db.send(new GetCommand({ TableName: this.name, Key: { pk, sk } }));
    return Item;
  }

  async put(item: Row) {
    await this.db.send(new PutCommand({ TableName: this.name, Item: item }));
  }

  async query(input: Omit<QueryCommandInput, "TableName">, limit = Infinity): Promise<Row[]> {
    const rows: Row[] = [];
    let ExclusiveStartKey: Row | undefined;
    do {
      const page = await this.db.send(
        new QueryCommand({ TableName: this.name, ...input, ExclusiveStartKey }),
      );
      rows.push(...(page.Items ?? []));
      ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey && rows.length < limit);
    return rows.slice(0, limit);
  }

  under(pk: string, prefix: string) {
    return this.query({
      KeyConditionExpression: "pk = :p AND begins_with(sk, :s)",
      ExpressionAttributeValues: { ":p": pk, ":s": prefix },
      ScanIndexForward: false,
    });
  }
}

export class DynamoListingRepository implements ListingRepository {
  constructor(private readonly table: DynamoTable) {}

  async create(listing: Listing) {
    await this.table.put({
      pk: `ITEM#${listing.id}`,
      sk: "LISTING",
      gsi1pk: "LISTING",
      gsi1sk: listing.createdAt.toISOString(),
      ...toRow(listing),
    });
  }

  async get(id: string) {
    const row = await this.table.get(`ITEM#${id}`, "LISTING");
    return row && fromRow<Listing>(row);
  }

  private async all(limit?: number) {
    const rows = await this.table.query(
      {
        IndexName: "gsi1",
        KeyConditionExpression: "gsi1pk = :p",
        ExpressionAttributeValues: { ":p": "LISTING" },
        ScanIndexForward: false,
      },
      limit,
    );
    return rows.map((row) => fromRow<Listing>(row));
  }

  recent(limit: number) {
    return this.all(limit);
  }

  async byFinder(userId: string) {
    return (await this.all()).filter((l) => l.finder.userId === userId);
  }

  async listOpen(filter?: { category?: Category }) {
    return (await this.all()).filter(
      (l) => l.status !== "claimed" && (!filter?.category || l.category === filter.category),
    );
  }

  async count() {
    return (await this.all()).length;
  }

  async markReturned(id: string, returnedTo: string) {
    await this.table.db.send(
      new UpdateCommand({
        TableName: this.table.name,
        Key: { pk: `ITEM#${id}`, sk: "LISTING" },
        UpdateExpression: "SET #s = :s, returnedTo = :r",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": "claimed", ":r": returnedTo },
      }),
    );
  }
}

export class DynamoUserRepository implements UserRepository {
  constructor(private readonly table: DynamoTable) {}

  async create(user: User) {
    const lookups: Row[] = [{ pk: `EMAIL#${user.email}`, sk: "LOOKUP", userId: user.id }];
    if (user.matric) lookups.push({ pk: `MATRIC#${user.matric}`, sk: "LOOKUP", userId: user.id });
    try {
      await this.table.db.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: this.table.name,
                Item: { pk: `USER#${user.id}`, sk: "PROFILE", ...toRow(user) },
              },
            },
            ...lookups.map((Item) => ({
              Put: {
                TableName: this.table.name,
                Item,
                ConditionExpression: "attribute_not_exists(pk)",
              },
            })),
          ],
        }),
      );
    } catch (error) {
      if ((error as Error).name === "TransactionCanceledException") {
        throw new AppError("invalid_input", "That email or matric number already has an account.");
      }
      throw error;
    }
  }

  async get(id: string) {
    const row = await this.table.get(`USER#${id}`, "PROFILE");
    return row && fromRow<User>(row);
  }

  private async byLookup(pk: string) {
    const row = await this.table.get(pk, "LOOKUP");
    return row ? this.get(String(row.userId)) : undefined;
  }

  byEmail(email: string) {
    return this.byLookup(`EMAIL#${email}`);
  }

  byMatric(matric: string) {
    return this.byLookup(`MATRIC#${matric}`);
  }

  async addKarma(id: string, points: number) {
    await this.table.db.send(
      new UpdateCommand({
        TableName: this.table.name,
        Key: { pk: `USER#${id}`, sk: "PROFILE" },
        UpdateExpression: "ADD karma :k",
        ExpressionAttributeValues: { ":k": points },
      }),
    );
  }
}

export class DynamoClaimRepository implements ClaimRepository {
  constructor(private readonly table: DynamoTable) {}

  async create(claim: Claim) {
    const row = toRow(claim);
    await this.table.db.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.table.name,
              Item: { pk: `ITEM#${claim.itemId}`, sk: `CLAIM#${claim.id}`, ...row },
            },
          },
          {
            Put: {
              TableName: this.table.name,
              Item: { pk: `USER#${claim.claimantId}`, sk: `CLAIM#${claim.id}`, ...row },
            },
          },
        ],
      }),
    );
  }

  async forItem(itemId: string) {
    return (await this.table.under(`ITEM#${itemId}`, "CLAIM#"))
      .map((r) => fromRow<Claim>(r))
      .sort(newestFirst);
  }

  async byClaimant(userId: string) {
    return (await this.table.under(`USER#${userId}`, "CLAIM#"))
      .map((r) => fromRow<Claim>(r))
      .sort(newestFirst);
  }

  async addNotice(notice: Notice) {
    await this.table.put({
      pk: `USER#${notice.userId}`,
      sk: `NOTE#${notice.createdAt.toISOString()}#${notice.id}`,
      ...toRow(notice),
    });
  }

  async notices(userId: string) {
    return (await this.table.under(`USER#${userId}`, "NOTE#")).map((r) => fromRow<Notice>(r));
  }
}
