import { Transform } from 'stream';

// Database Writer - Transform stream that persists events
export class DatabaseWriter extends Transform {
  private db: any;
  private insertStmt: any;

  constructor(dbPath = './events.db') {
    super({
      objectMode: true,
      highWaterMark: 10
    });

    // this.db = new Database(dbPath);
    this.initializeSchema();

    // Prepared statement for performance
    this.insertStmt = this.db.prepare(`
      INSERT INTO events (
        listener_id,
        event_name,
        block_number,
        transaction_hash,
        address,
        data,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
  }

  private initializeSchema() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        listener_id TEXT NOT NULL,
        event_name TEXT NOT NULL,
        block_number BIGINT,
        transaction_hash TEXT,
        address TEXT,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_listener (listener_id),
        INDEX idx_block (block_number)
      )
    `);
  }

  async _transform(event: any, encoding: string, callback: Function) {
    try {
      // Extract relevant data from blockchain event
      const data = {
        listenerId: event.listenerId || 'unknown',
        eventName: event.eventName || event.topics?.[0] || 'unknown',
        blockNumber: event.blockNumber ? Number(event.blockNumber) : null,
        transactionHash: event.transactionHash,
        address: event.address,
        rawData: JSON.stringify(event)
      };

      // Insert with prepared statement (faster)
      this.insertStmt.run(
        data.listenerId,
        data.eventName,
        data.blockNumber,
        data.transactionHash,
        data.address,
        data.rawData,
        new Date().toISOString()
      );

      // Pass event to next stage
      callback(null, event);
    } catch (error) {
      console.error('Database write error:', error);
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
