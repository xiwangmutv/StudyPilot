import type { ResumeState } from "./domain";
import { storageKeys, type StorageEngine } from "./storage-engine";
export class ResumeEngine { constructor(private readonly storage:StorageEngine){} restore():ResumeState|null{return this.storage.get<ResumeState|null>(storageKeys.resume,null);} save(taskId:string|undefined,positionSeconds:number,startedAt?:string,actionIndex=0){this.storage.set(storageKeys.resume,{taskId,actionIndex,positionSeconds,startedAt,updatedAt:new Date().toISOString()});} clear(){this.storage.remove(storageKeys.resume);} }
