import { Transform } from "node:stream";

import db from "@/db";
import { events } from "@/db/schema";
import { ListenerConfig } from "@/lib/types";

// Database Writer - Transform stream that persists events
export class DatabaseWriter extends Transform {
  private config: ListenerConfig & {
    transactionId?: string;
    organizationId?: string;
  };
  private listenerId: string;

  constructor(
    config: ListenerConfig & {
      transactionId?: string;
      organizationId?: string;
    },
    listenerId: string,
  ) {
    super({
      objectMode: true,
      highWaterMark: 10,
    });

    this.config = config;
    this.listenerId = listenerId;
  }

  async _transform(event: any, encoding: string, callback: Function) {
    try {
      // Extract relevant data from blockchain event
      const data = {
        listenerId: (this.listenerId as string) || "unknown",
        name: event.eventName || event.topics?.[0] || "unknown",
        blockNumber: event.blockNumber ? Number(event.blockNumber) : 0,
        transactionHash: event.transactionHash,
        contractAddress: event.address,
        rawData: JSON.stringify(event, (k, v) =>
          typeof v === "bigint" ? v.toString() : v,
        ),
        organizationId: this.config.organizationId,
        transactionId: this.config.transactionId,
      };

      // Insert with prepared statement (faster)
      const [newEvent] = await db
        .insert(events)
        .values({
          id: data.listenerId,
          listenerId: data.listenerId,
          name: data.name as string,
          chainId: this.config.chainId.toString(),
          blockNumber: data.blockNumber,
          transactionHash: data.transactionHash as string,
          contractAddress: data.contractAddress as string,
          data: data.rawData,
          organizationId: data.organizationId,
          transactionId: data.transactionId,
        })
        .returning();

      console.log("New event inserted to db", newEvent);

      if (!this.config.persistent) {
        this.emit("shutdown", this.listenerId);
      }

      // Pass event to next stage
      callback(null, event);
    } catch (error) {
      console.error("Database write error:", error);
      // Don't fail the pipeline, just log and continue
      callback(error);
    }
  }

  _final(callback: Function) {
    // Cleanup on stream end
    callback();
  }
}
