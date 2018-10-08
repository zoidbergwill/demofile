import { EventEmitter } from "events";
import { DemoFile } from "./demo";
import { ICMsg_CVars } from "./protobufs/cstrike15_usermessages";
import { ICNETMsg_SetConVar } from "./protobufs/netmessages";

interface IConVarChangeEvent {
  name: string;
  value: string;
  oldValue?: string;
}

export declare interface ConVars {
  /**
   * Fired when any console variable is changed (e.g., 'mp_buytime').
   */
  on(event: "change", listener: (event: IConVarChangeEvent) => void): this;
  emit(name: "change", event: IConVarChangeEvent): boolean;

  /**
   * Fired when a specific console variable is changed (e.g., 'mp_buytime').
   */
  on(event: string, listener: (event: IConVarChangeEvent) => void): this;
  emit(name: string, event: IConVarChangeEvent): boolean;
}

/**
 * Manages console variables.
 */
export class ConVars extends EventEmitter {
  public readonly vars: ReadonlyMap<string, string> = this._vars;
  private _vars: Map<string, string> = new Map();

  public listen(demo: DemoFile) {
    demo.on("net_SetConVar", (msg: RequiredNonNullable<ICNETMsg_SetConVar>) => {
      const convars = msg.convars as RequiredNonNullable<ICMsg_CVars>;
      for (const cvar of convars.cvars) {
        if (cvar.name == null || cvar.value == null) {
          continue;
        }

        const oldValue = this.vars.get(cvar.name);
        this._vars.set(cvar.name, cvar.value);

        const args = {
          name: cvar.name,
          value: cvar.value,
          oldValue,
        };

        this.emit(cvar.name, args);
        this.emit("change", args);
      }
    });
  }
}
