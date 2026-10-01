import "fake-indexeddb/auto";
import { webcrypto } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { enqueue, pending, remove } from "./secure-outbox";

beforeAll(() => {
  if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, "crypto", { value: webcrypto });
});

function rawRecords(): Promise<Array<{ data: ArrayBuffer }>> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("camino-offline");
    req.onsuccess = () => {
      const r = req.result.transaction("outbox", "readonly").objectStore("outbox").getAll();
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    };
  });
}

describe("encrypted offline outbox", () => {
  it("stores private text encrypted and returns it decrypted to its owner only", async () => {
    await enqueue({ id: "e1", kind: "journal", userId: "u1", createdAt: 1, payload: { body: "Algo muy personal" } });

    const stored = await rawRecords();
    const bytes = new TextDecoder().decode(new Uint8Array(stored[0].data));
    expect(bytes).not.toContain("personal");

    expect((await pending<{ body: string }>("journal", "u1"))[0].payload.body).toBe("Algo muy personal");
    expect(await pending("journal", "otra-persona")).toEqual([]);

    await remove("e1");
    expect(await pending("journal", "u1")).toEqual([]);
  });
});
