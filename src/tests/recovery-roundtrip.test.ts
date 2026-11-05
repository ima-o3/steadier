import { it, expect, vi } from "vitest";
import type { DatabaseSync } from "node:sqlite";
const memory = vi.hoisted(() => ({ dbs: new Map<string, DatabaseSync>(), keys: new Map<string,string>() }));
vi.mock("expo-file-system", () => ({File: class { constructor(_root:string, private name:string) {} get exists() { return memory.dbs.has(this.name); } }}));
vi.mock("expo-secure-store", () => ({WHEN_UNLOCKED_THIS_DEVICE_ONLY:1,getItemAsync:async (k:string)=>memory.keys.get(k)||null,setItemAsync:async(k:string,v:string)=>{memory.keys.set(k,v);}}));
vi.mock("expo-crypto", () => ({getRandomBytesAsync:async(n:number)=>new Uint8Array(n).fill(17),randomUUID:()=>"abc-123"}));
vi.mock("expo-sqlite", async () => {
 const {DatabaseSync}=await import("node:sqlite");
 return {defaultDatabaseDirectory:"file:///db",openDatabaseAsync:async(name:string)=>{
  if(!memory.dbs.has(name)) memory.dbs.set(name,new DatabaseSync(":memory:"));
  const db=memory.dbs.get(name)!;
  return {closeAsync:async()=>{},execAsync:async(sql:string)=>db.exec(sql),getFirstAsync:async(sql:string)=>sql==="PRAGMA cipher_version"?{cipher_version:"test-only"}:db.prepare(sql).get(),getAllAsync:async(sql:string)=>db.prepare(sql).all(),runAsync:async(sql:string,...args:(string|null)[])=>db.prepare(sql).run(...args)};
 }};
});
import {defaultState,openStore,saveState,restoreBackup} from "../database/repositories/store";
import {demoState} from "../features/demo";
it("round trips a populated export through recovery and restart while retaining the old database",async()=>{
 await openStore();
 await saveState({...defaultState,onboarded:true});
 const original=memory.dbs.get("steadier.db")!;
 const originalKey=memory.keys.get("steadier.database.key");
 const state=demoState(defaultState);
 const restored=await restoreBackup(JSON.stringify({...state,formatVersion:1,exportedAt:"2026-11-05T00:00:00Z"}));
 expect(restored).toEqual(state);
 expect(await openStore()).toEqual(state);
 expect(memory.keys.get("steadier.database.key")).toBe(originalKey);
 expect(original.prepare("SELECT count(*) AS n FROM goals").get()?.n).toBe(0);
 expect(memory.dbs.size).toBe(2);
 for(const db of memory.dbs.values()) db.close();
});
