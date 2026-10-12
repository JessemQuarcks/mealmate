/**
 * In-memory stand-in for the Mongoose Order model, used by the courier-flow
 * integration test. It implements just the query surface the order/courier
 * routes actually use — create, find, findOne, findById, findOneAndUpdate with
 * $set/$push and a small filter matcher ($eq, $in, $exists) — so the real route
 * handlers can run end to end without a database.
 *
 * It is NOT a *.test.ts file, so vitest does not execute it directly; the test
 * installs it via vi.mock("@/models/order", () => import("@/test/orderStore")).
 */

type AnyRec = Record<string, unknown>;

function getPath(obj: AnyRec, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => {
    if (o && typeof o === "object") return (o as AnyRec)[k];
    return undefined;
  }, obj);
}

function matchesCondition(value: unknown, cond: unknown): boolean {
  if (cond && typeof cond === "object" && !Array.isArray(cond)) {
    const c = cond as AnyRec;
    if ("$exists" in c) return c.$exists ? value !== undefined : value === undefined;
    if ("$in" in c) return (c.$in as unknown[]).includes(value);
  }
  return value === cond;
}

function matches(doc: AnyRec, filter: AnyRec): boolean {
  return Object.entries(filter).every(([key, cond]) => matchesCondition(getPath(doc, key), cond));
}

export class OrderDoc {
  [key: string]: unknown;
  events!: unknown[];
  constructor(data: AnyRec) {
    Object.assign(this, data);
    if (!Array.isArray(this.events)) this.events = [];
  }
  get id(): string {
    return String(this._id);
  }
  async save(): Promise<this> {
    return this;
  }
  toObject(): AnyRec {
    return JSON.parse(JSON.stringify(this));
  }
}

const store = new Map<string, OrderDoc>();
let seq = 1;

function lean(doc: OrderDoc | undefined | null): AnyRec | null {
  return doc ? (JSON.parse(JSON.stringify(doc)) as AnyRec) : null;
}

/** A thenable that also exposes .lean()/.sort()/.limit()/.select(). */
function oneQuery(getDoc: () => OrderDoc | undefined) {
  return {
    lean: () => lean(getDoc() ?? null),
    select() {
      return this;
    },
    then(resolve: (v: OrderDoc | null) => void) {
      resolve(getDoc() ?? null);
    },
  };
}

function manyQuery(getDocs: () => OrderDoc[]) {
  return {
    sort() {
      return this;
    },
    limit() {
      return this;
    },
    select() {
      return this;
    },
    lean: () => getDocs().map((d) => lean(d) as AnyRec),
    then(resolve: (v: OrderDoc[]) => void) {
      resolve(getDocs());
    },
  };
}

function applyUpdate(doc: OrderDoc, update: AnyRec): void {
  const set = update.$set as AnyRec | undefined;
  if (set) for (const [k, v] of Object.entries(set)) doc[k] = v;
  const push = update.$push as AnyRec | undefined;
  if (push)
    for (const [k, v] of Object.entries(push)) {
      if (!Array.isArray(doc[k])) doc[k] = [];
      (doc[k] as unknown[]).push(v);
    }
}

const Order = {
  async create(data: AnyRec): Promise<OrderDoc> {
    return __seed(data);
  },
  find(filter: AnyRec) {
    return manyQuery(() => Array.from(store.values()).filter((d) => matches(d, filter)));
  },
  findOne(filter: AnyRec) {
    return oneQuery(() => Array.from(store.values()).find((d) => matches(d, filter)));
  },
  findById(id: string) {
    return oneQuery(() => store.get(String(id)));
  },
  findOneAndUpdate(filter: AnyRec, update: AnyRec) {
    const doc = Array.from(store.values()).find((d) => matches(d, filter));
    if (doc) applyUpdate(doc, update);
    return oneQuery(() => doc);
  },
};

export default Order;

/** Test controls. */
export function __reset(): void {
  store.clear();
  seq = 1;
}
export function __seed(data: AnyRec): OrderDoc {
  const _id = (data._id as string) || `ord${seq++}`;
  const doc = new OrderDoc({ ...data, _id });
  store.set(_id, doc);
  return doc;
}
export function __get(id: string): OrderDoc | undefined {
  return store.get(id);
}
