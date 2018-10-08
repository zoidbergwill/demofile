import * as assert from "assert";
import { EventEmitter } from "events";
import * as _ from "lodash";
import { DemoFile } from "./demo";
import { CSVCMsg_GameEventList, ICSVCMsg_GameEvent, ICSVCMsg_GameEventList } from "./protobufs/netmessages";

class GameEvent {
  public name: string;
  public id: number;
  public keyNames: string[];

  constructor(descriptor: RequiredNonNullable<CSVCMsg_GameEventList.Idescriptor_t>) {
    this.name = descriptor.name;
    this.id = descriptor.eventid;
    this.keyNames = descriptor.keys.map((key) => key.name);
  }

  public messageToObject(eventMsg: RequiredNonNullable<ICSVCMsg_GameEvent>) {
    assert(eventMsg.eventid === this.id);

    return _.zipObject(
      this.keyNames,
      eventMsg.keys.map((key) => {
        return _.find(key, (value, name) => value !== null && name !== "type");
      }),
    );
  }
}

interface GameEventEvent<T> {
  name: string;
  event: T;
}

/**
 * Manages game events for a demo file.
 */
export class GameEvents extends EventEmitter {
  public gameEventList: GameEvent[] = [];
  private _tickEvents: Array<GameEventEvent<any>> = [];

  public listen(demo: DemoFile) {
    demo.on("svc_GameEventList", this._handleGameEventList.bind(this));

    demo.on("svc_GameEvent", (msg) => {
      const event = this.gameEventList[msg.eventid];
      if (!event) {
        return;
      }

      const eventVars = event.messageToObject(msg);

      // buffer game events until the end of the tick
      this._tickEvents.push({
        name: event.name,
        event: eventVars,
      });
    });

    demo.on("tickend", () => {
      this._tickEvents.forEach((event) => {
        this.emit(event.name, event.event);

        this.emit("event", {
          name: event.name,
          event: event.event,
        });
      });

      this._tickEvents = [];
    });
  }

  public _handleGameEventList(msg: RequiredNonNullable<ICSVCMsg_GameEventList>) {
    for (const descriptor of msg.descriptors) {
      this.gameEventList[descriptor.eventid] = new GameEvent(descriptor);
    }
  }
}
