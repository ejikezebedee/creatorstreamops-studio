import { promises as fs } from "node:fs";
import path from "node:path";
import { v4 as uuid } from "uuid";
import type { AppData, AuditEvent, BaseRecord } from "./types.js";

export const emptyData = (): AppData => ({
  creatorProfiles: [],
  videoIdeas: [],
  scripts: [],
  captions: [],
  calendarItems: [],
  livePlans: [],
  analytics: [],
  reports: [],
  auditLog: [],
});

export class JsonStore {
  private filePath: string;

  constructor(dataDir = process.env.DATA_DIR || "./data") {
    this.filePath = path.join(dataDir, "creatorstreamops.json");
  }

  async read(): Promise<AppData> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      return { ...emptyData(), ...JSON.parse(raw) };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT")
        return emptyData();
      throw error;
    }
  }

  async write(data: AppData): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const temp = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    await fs.rename(temp, this.filePath);
  }

  async mutate<T>(fn: (data: AppData) => T | Promise<T>): Promise<T> {
    const data = await this.read();
    const result = await fn(data);
    await this.write(data);
    return result;
  }
}

export const now = () => new Date().toISOString();

export function withBase<T extends object>(record: T): T & BaseRecord {
  const timestamp = now();
  return { ...record, id: uuid(), createdAt: timestamp, updatedAt: timestamp };
}

export function audit(
  eventType: string,
  summary: string,
  entityId?: string,
): AuditEvent {
  return withBase({ eventType, actor: "local-admin", summary, entityId });
}
