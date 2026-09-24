import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getInitialMockData, MockDataStore } from "./mock-data";

const IS_SERVERLESS = process.env.VERCEL === "1" || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_DIR = IS_SERVERLESS ? "/tmp" : path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "mock-store.json");

function generateId(prefix: string = ""): string {
  const rand = crypto.randomBytes(6).toString("hex");
  return prefix ? `${prefix}_${rand}` : rand;
}

class MockDatabase {
  private store: MockDataStore;

  constructor() {
    this.store = this.loadStore();
  }

  private loadStore(): MockDataStore {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        // Deserialisasi tanggal
        this.restoreDates(parsed);
        return parsed;
      }
    } catch (e) {
      console.warn("Gagal membaca mock-store.json, inisialisasi ulang dengan data awal:", e);
    }
    const initial = getInitialMockData();
    this.saveStore(initial);
    return initial;
  }

  private restoreDates(obj: any) {
    if (!obj || typeof obj !== "object") return;
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
        obj[key] = new Date(val);
      } else if (typeof val === "object") {
        this.restoreDates(val);
      }
    }
  }

  private saveStore(data?: MockDataStore) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(data || this.store, null, 2), "utf-8");
    } catch (e) {
      console.warn("Gagal menyimpan ke mock-store.json:", e);
    }
  }

  private matchesFilter(item: any, where: any): boolean {
    if (!where) return true;

    for (const [key, filterVal] of Object.entries(where)) {
      if (key === "OR" && Array.isArray(filterVal)) {
        const anyMatch = filterVal.some((subWhere) => this.matchesFilter(item, subWhere));
        if (!anyMatch) return false;
        continue;
      }

      if (key === "AND" && Array.isArray(filterVal)) {
        const allMatch = filterVal.every((subWhere) => this.matchesFilter(item, subWhere));
        if (!allMatch) return false;
        continue;
      }

      // Handle compound keys like shiftId_userId or companyId_accountCode
      if (key.includes("_") && typeof filterVal === "object" && filterVal !== null && !Array.isArray(filterVal)) {
        const compoundMatched = Object.entries(filterVal).every(([subKey, subVal]) => item[subKey] === subVal);
        if (!compoundMatched) return false;
        continue;
      }

      const itemVal = item[key];

      if (filterVal === undefined) continue;

      if (filterVal === null) {
        if (itemVal !== null) return false;
        continue;
      }

      if (typeof filterVal === "object" && !(filterVal instanceof Date)) {
        // Operators: contains, in, lte, gte, gt, lt, not
        if ("contains" in filterVal) {
          const query = String(filterVal.contains).toLowerCase();
          const target = String(itemVal ?? "").toLowerCase();
          if (!target.includes(query)) return false;
        }
        if ("in" in filterVal && Array.isArray(filterVal.in)) {
          if (!filterVal.in.includes(itemVal)) return false;
        }
        if ("lte" in filterVal) {
          let max: any = (filterVal as any).lte;
          if (max && typeof max === "object" && "minStock" in max) {
            max = item.minStock;
          } else if (typeof max === "string" && max in item) {
            max = item[max];
          }
          if (itemVal > max) return false;
        }
        if ("gte" in filterVal) {
          const min: any = (filterVal as any).gte instanceof Date ? (filterVal as any).gte.getTime() : (filterVal as any).gte;
          const current: any = itemVal instanceof Date ? itemVal.getTime() : itemVal;
          if (current < min) return false;
        }
        if ("gt" in filterVal) {
          const min: any = (filterVal as any).gt instanceof Date ? (filterVal as any).gt.getTime() : (filterVal as any).gt;
          const current: any = itemVal instanceof Date ? itemVal.getTime() : itemVal;
          if (current <= min) return false;
        }
        if ("lt" in filterVal) {
          const max: any = (filterVal as any).lt instanceof Date ? (filterVal as any).lt.getTime() : (filterVal as any).lt;
          const current: any = itemVal instanceof Date ? itemVal.getTime() : itemVal;
          if (current >= max) return false;
        }
        if ("not" in filterVal) {
          if (itemVal === filterVal.not) return false;
        }
      } else {
        // Direct equality
        if (filterVal instanceof Date) {
          if (!(itemVal instanceof Date) || itemVal.getTime() !== filterVal.getTime()) {
            return false;
          }
        } else if (itemVal !== filterVal) {
          return false;
        }
      }
    }
    return true;
  }

  private applySort(list: any[], orderBy: any): any[] {
    if (!orderBy) return list;
    const sorted = [...list];
    const [field, direction] = Object.entries(orderBy)[0] as [string, "asc" | "desc"];
    sorted.sort((a, b) => {
      let valA = a[field];
      let valB = b[field];
      if (valA instanceof Date) valA = valA.getTime();
      if (valB instanceof Date) valB = valB.getTime();
      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }

  private applyInclude(tableName: keyof MockDataStore, item: any, include: any): any {
    if (!item || !include) return item;
    const copy = { ...item };

    if (tableName === "product") {
      if (include.category) {
        copy.category = this.store.category.find((c) => c.id === item.categoryId) || null;
      }
      if (include.outletStocks) {
        copy.outletStocks = this.store.productStock.filter((ps) => ps.productId === item.id);
      }
    } else if (tableName === "productStock") {
      if (include.product) {
        copy.product = this.applyInclude("product", this.store.product.find((p) => p.id === item.productId), include.product === true ? {} : include.product);
      }
      if (include.outlet) {
        copy.outlet = this.store.outlet.find((o) => o.id === item.outletId) || null;
      }
    } else if (tableName === "salesOrder") {
      if (include.items) {
        let orderItems = this.store.salesOrderItem.filter((soi) => soi.salesOrderId === item.id);
        if (typeof include.items === "object" && include.items.include) {
          orderItems = orderItems.map((oi) => this.applyInclude("salesOrderItem", oi, include.items.include));
        }
        copy.items = orderItems;
      }
      if (include.cashier) {
        const cashier = this.store.user.find((u) => u.id === item.cashierId) || null;
        if (cashier && include.cashier.select) {
          const selected: any = {};
          for (const key of Object.keys(include.cashier.select)) {
            if (include.cashier.select[key]) selected[key] = cashier[key];
          }
          copy.cashier = selected;
        } else {
          copy.cashier = cashier;
        }
      }
      if (include.outlet) {
        const outlet = this.store.outlet.find((o) => o.id === item.outletId) || null;
        if (outlet && typeof include.outlet === "object" && include.outlet.include) {
          copy.outlet = this.applyInclude("outlet", outlet, include.outlet.include);
        } else {
          copy.outlet = outlet;
        }
      }
    } else if (tableName === "salesOrderItem") {
      if (include.product) {
        copy.product = this.applyInclude("product", this.store.product.find((p) => p.id === item.productId), typeof include.product === "object" ? include.product : {});
      }
    } else if (tableName === "shift") {
      if (include.cashier) {
        const cashier = this.store.user.find((u) => u.id === item.cashierId) || null;
        if (cashier && include.cashier.select) {
          const selected: any = {};
          for (const key of Object.keys(include.cashier.select)) {
            if (include.cashier.select[key]) selected[key] = cashier[key];
          }
          copy.cashier = selected;
        } else {
          copy.cashier = cashier;
        }
      }
      if (include.outlet) {
        const outlet = this.store.outlet.find((o) => o.id === item.outletId) || null;
        if (outlet && typeof include.outlet === "object" && include.outlet.include) {
          copy.outlet = this.applyInclude("outlet", outlet, include.outlet.include);
        } else {
          copy.outlet = outlet;
        }
      }
      if (include.assignments) {
        let assignments = this.store.shiftCashier.filter((sc) => sc.shiftId === item.id);
        if (typeof include.assignments === "object" && include.assignments.where) {
          assignments = assignments.filter((sc) => this.matchesFilter(sc, include.assignments.where));
        }
        if (typeof include.assignments === "object" && include.assignments.include?.user) {
          assignments = assignments.map((sc) => {
            const user = this.store.user.find((u) => u.id === sc.userId);
            const userCopy = user && include.assignments.include.user.select ? {
              id: user.id,
              name: user.name,
              username: user.username,
              role: user.role,
            } : user;
            return { ...sc, user: userCopy };
          });
        }
        copy.assignments = assignments;
      }
      if (include.salesOrders) {
        let orders = this.store.salesOrder.filter((o) => o.shiftId === item.id);
        if (typeof include.salesOrders === "object" && include.salesOrders.include) {
          orders = orders.map((o) => this.applyInclude("salesOrder", o, include.salesOrders.include));
        }
        if (typeof include.salesOrders === "object" && include.salesOrders.orderBy) {
          orders = this.applySort(orders, include.salesOrders.orderBy);
        }
        copy.salesOrders = orders;
      }
    } else if (tableName === "outlet") {
      if (include.company) {
        copy.company = this.store.company.find((c) => c.id === item.companyId) || null;
      }
    } else if (tableName === "journalEntry") {
      if (include.journalLines) {
        let lines = this.store.journalLine.filter((jl) => jl.journalEntryId === item.id);
        if (typeof include.journalLines === "object" && include.journalLines.include) {
          lines = lines.map((jl) => this.applyInclude("journalLine", jl, include.journalLines.include));
        }
        copy.journalLines = lines;
      }
    } else if (tableName === "journalLine") {
      if (include.account) {
        copy.account = this.store.chartOfAccount.find((coa) => coa.id === item.accountId) || null;
      }
    } else if (tableName === "purchase") {
      if (include.items) {
        let items = this.store.purchaseItem.filter((pi) => pi.purchaseId === item.id);
        if (typeof include.items === "object" && include.items.include) {
          items = items.map((pi) => this.applyInclude("purchaseItem", pi, include.items.include));
        }
        copy.items = items;
      }
      if (include.outlet) {
        copy.outlet = this.store.outlet.find((o) => o.id === item.outletId) || null;
      }
      if (include.user) {
        copy.user = this.store.user.find((u) => u.id === item.userId) || null;
      }
    } else if (tableName === "purchaseItem") {
      if (include.product) {
        copy.product = this.applyInclude("product", this.store.product.find((p) => p.id === item.productId), typeof include.product === "object" ? include.product : {});
      }
    } else if (tableName === "expense") {
      if (include.outlet) {
        copy.outlet = this.store.outlet.find((o) => o.id === item.outletId) || null;
      }
      if (include.user) {
        copy.user = this.store.user.find((u) => u.id === item.userId) || null;
      }
    }

    return copy;
  }

  private applySelect(item: any, select: any): any {
    if (!item || !select) return item;
    const res: any = {};
    for (const [key, val] of Object.entries(select)) {
      if (val) res[key] = item[key];
    }
    return res;
  }

  createModelHandlers<T = any>(tableName: keyof MockDataStore, idPrefix: string = "") {
    return {
      fields: {
        minStock: "minStock",
        currentStock: "currentStock",
      },
      findMany: async (args?: { where?: any; include?: any; select?: any; orderBy?: any; take?: number; skip?: number }): Promise<T[]> => {
        let list = this.store[tableName] || [];
        if (args?.where) {
          list = list.filter((item) => this.matchesFilter(item, args.where));
        }
        if (args?.orderBy) {
          list = this.applySort(list, args.orderBy);
        }
        if (args?.skip) {
          list = list.slice(args.skip);
        }
        if (args?.take !== undefined) {
          list = list.slice(0, args.take);
        }
        return list.map((item) => {
          let res = this.applyInclude(tableName, item, args?.include);
          if (args?.select) res = this.applySelect(res, args.select);
          return res;
        });
      },

      findFirst: async (args?: { where?: any; include?: any; select?: any; orderBy?: any }): Promise<T | null> => {
        let list = this.store[tableName] || [];
        if (args?.where) {
          list = list.filter((item) => this.matchesFilter(item, args.where));
        }
        if (args?.orderBy) {
          list = this.applySort(list, args.orderBy);
        }
        const item = list[0] || null;
        if (!item) return null;
        let res = this.applyInclude(tableName, item, args?.include);
        if (args?.select) res = this.applySelect(res, args.select);
        return res;
      },

      findUnique: async (args: { where: any; include?: any; select?: any }): Promise<T | null> => {
        const list = this.store[tableName] || [];
        const item = list.find((it) => this.matchesFilter(it, args.where)) || null;
        if (!item) return null;
        let res = this.applyInclude(tableName, item, args?.include);
        if (args?.select) res = this.applySelect(res, args.select);
        return res;
      },

      create: async (args: { data: any; include?: any; select?: any }): Promise<T> => {
        const item: any = { ...args.data };
        if (!item.id) {
          item.id = generateId(idPrefix || tableName.slice(0, 3));
        }
        if (!item.createdAt) item.createdAt = new Date();
        if (!item.updatedAt) item.updatedAt = new Date();

        // Handle nested creates
        if (tableName === "salesOrder" && args.data.items?.create) {
          delete item.items;
          const createdItems: any[] = [];
          for (const rawItem of args.data.items.create) {
            const soi = {
              id: generateId("soi"),
              salesOrderId: item.id,
              ...rawItem,
              createdAt: new Date(),
            };
            this.store.salesOrderItem.push(soi);
            createdItems.push(soi);
          }
        }

        if (tableName === "purchase" && args.data.items?.create) {
          delete item.items;
          for (const rawItem of args.data.items.create) {
            const pi = {
              id: generateId("pi"),
              purchaseId: item.id,
              ...rawItem,
              createdAt: new Date(),
            };
            this.store.purchaseItem.push(pi);
          }
        }

        if (tableName === "journalEntry" && args.data.journalLines?.create) {
          delete item.journalLines;
          for (const rawLine of args.data.journalLines.create) {
            const accountId = rawLine.account?.connect?.id || rawLine.accountId;
            const jl = {
              id: generateId("jl"),
              journalEntryId: item.id,
              accountId,
              debitAmount: rawLine.debitAmount || 0,
              creditAmount: rawLine.creditAmount || 0,
              createdAt: new Date(),
            };
            this.store.journalLine.push(jl);
          }
        }

        this.store[tableName].push(item);
        this.saveStore();

        let res = this.applyInclude(tableName, item, args?.include);
        if (args?.select) res = this.applySelect(res, args.select);
        return res;
      },

      update: async (args: { where: any; data: any; include?: any; select?: any }): Promise<T> => {
        const list = this.store[tableName] || [];
        const index = list.findIndex((it) => this.matchesFilter(it, args.where));
        if (index === -1) {
          throw new Error(`Record to update not found in ${String(tableName)}`);
        }
        const existing = list[index];
        const updated = { ...existing };

        for (const [key, val] of Object.entries(args.data)) {
          if (val && typeof val === "object" && !(val instanceof Date)) {
            if ("increment" in val && typeof (val as any).increment === "number") {
              updated[key] = (Number(updated[key]) || 0) + (val as any).increment;
            } else if ("decrement" in val && typeof (val as any).decrement === "number") {
              updated[key] = (Number(updated[key]) || 0) - (val as any).decrement;
            } else {
              updated[key] = val;
            }
          } else {
            updated[key] = val;
          }
        }
        updated.updatedAt = new Date();
        this.store[tableName][index] = updated;
        this.saveStore();

        let res = this.applyInclude(tableName, updated, args?.include);
        if (args?.select) res = this.applySelect(res, args.select);
        return res;
      },

      upsert: async (args: { where: any; create: any; update: any; include?: any; select?: any }): Promise<T> => {
        const list = this.store[tableName] || [];
        const existing = list.find((it) => this.matchesFilter(it, args.where));
        if (existing) {
          return this.createModelHandlers(tableName, idPrefix).update({
            where: args.where,
            data: args.update,
            include: args.include,
            select: args.select,
          });
        } else {
          return this.createModelHandlers(tableName, idPrefix).create({
            data: { ...args.create },
            include: args.include,
            select: args.select,
          });
        }
      },

      delete: async (args: { where: any }): Promise<T> => {
        const list = this.store[tableName] || [];
        const index = list.findIndex((it) => this.matchesFilter(it, args.where));
        if (index === -1) {
          throw new Error(`Record to delete not found in ${String(tableName)}`);
        }
        const removed = list.splice(index, 1)[0];
        this.saveStore();
        return removed;
      },

      deleteMany: async (args?: { where?: any }): Promise<{ count: number }> => {
        if (!args?.where) {
          const count = this.store[tableName].length;
          this.store[tableName] = [];
          this.saveStore();
          return { count };
        }
        const initialCount = this.store[tableName].length;
        this.store[tableName] = this.store[tableName].filter((it) => !this.matchesFilter(it, args.where));
        const deleted = initialCount - this.store[tableName].length;
        this.saveStore();
        return { count: deleted };
      },

      count: async (args?: { where?: any }): Promise<number> => {
        let list = this.store[tableName] || [];
        if (args?.where) {
          list = list.filter((it) => this.matchesFilter(it, args.where));
        }
        return list.length;
      },
    };
  }

  // Collections
  get company() { return this.createModelHandlers("company", "comp"); }
  get outlet() { return this.createModelHandlers("outlet", "out"); }
  get user() { return this.createModelHandlers("user", "usr"); }
  get category() { return this.createModelHandlers("category", "cat"); }
  get product() { return this.createModelHandlers("product", "prod"); }
  get productStock() { return this.createModelHandlers("productStock", "ps"); }
  get stockMutation() { return this.createModelHandlers("stockMutation", "sm"); }
  get shift() { return this.createModelHandlers("shift", "shift"); }
  get shiftCashier() { return this.createModelHandlers("shiftCashier", "sc"); }
  get salesOrder() { return this.createModelHandlers("salesOrder", "so"); }
  get salesOrderItem() { return this.createModelHandlers("salesOrderItem", "soi"); }
  get expense() { return this.createModelHandlers("expense", "exp"); }
  get purchase() { return this.createModelHandlers("purchase", "po"); }
  get purchaseItem() { return this.createModelHandlers("purchaseItem", "pi"); }
  get chartOfAccount() { return this.createModelHandlers("chartOfAccount", "coa"); }
  get journalEntry() { return this.createModelHandlers("journalEntry", "jv"); }
  get journalLine() { return this.createModelHandlers("journalLine", "jl"); }
  get customer() { return this.createModelHandlers("customer", "cust"); }
  get supplier() { return this.createModelHandlers("supplier", "sup"); }

  async $transaction<R>(fn: (tx: MockDatabase) => Promise<R>): Promise<R> {
    return await fn(this);
  }

  async $disconnect(): Promise<void> {
    // No-op for mock store
  }
}

const globalForMock = globalThis as unknown as {
  mockDbInstance: MockDatabase | undefined;
};

export const mockDb = globalForMock.mockDbInstance ?? new MockDatabase();
globalForMock.mockDbInstance = mockDb;

export default mockDb;
