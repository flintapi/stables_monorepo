import { Transform } from "node:stream";

import db from "@/db";
import { events } from "@/db/schema";

// Database Writer - Transform stream that persists events
export class DatabaseWriter extends Transform {
  private db: any;

  constructor() {
    super({
      objectMode: true,
      highWaterMark: 10,
    });

    this.db = db;
  }

  async _transform(event: any, encoding: string, callback: Function) {
    try {
      // Extract relevant data from blockchain event
      const data = {
        listenerId: event.listenerId as string || "unknown" ,
        name: event.eventName || event.topics?.[0] || "unknown",
        blockNumber: event.blockNumber ? Number(event.blockNumber) : 0,
        transactionHash: event.transactionHash,
        contractAddress: event.address,
        rawData: JSON.stringify(event),
        organizationId: event?.organizationId,
        transactionId: event?.transactionId,
      };

      // Insert with prepared statement (faster)
      const [newEvent] = await db.insert(events)
        .values({
          id: data.listenerId,
          listenerId: data.listenerId,
          name: data.name as string,
          blockNumber: data.blockNumber,
          transactionHash: data.transactionHash as string,
          contractAddress: data.contractAddress as string,
          data: data.rawData,
          organizationId: data.organizationId,
          transactionId: data.transactionId,
        })
        .returning();

      console.log("New event inserted to db", newEvent)

      // Pass event to next stage
      callback(null, event);
    }
    catch (error) {
      console.error("Database write error:", error);
      // Don't fail the pipeline, just log and continue
      callback(null, event);
    }
  }

  _final(callback: Function) {
    // Cleanup on stream end
    this.db.close();
    callback();
  }
}
