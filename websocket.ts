import { WebSocket as WebSocketType } from 'ws';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness'
import * as syncProtocol from 'y-protocols/sync';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { setIfUndefined } from 'lib0/map';

// const CALLBACK_DEBOUNCE_WAIT = parseInt(process.env.CALLBACK_DEBOUNCE_WAIT || '2000');
// const CALLBACK_DEBOUNCE_MAXWAIT = parseInt(process.env.CALLBACK_DEBOUNCE_MAXWAIT || '10000');

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;

// Message Types
const messageSync = 0;
const messageAwareness = 1;

// Disable gc when using snapshots!
const gcEnabled = process.env.GC !== 'false' && process.env.GC !== '0';

const docs = new Map<string, WSSharedDoc>();

class WSSharedDoc extends Y.Doc {
  name: string;
  conns: Map<WebSocketType, Set<number>>;
  awareness: awarenessProtocol.Awareness;

  constructor(name: string) {
    super({ gc: gcEnabled });
    this.name = name;
    this.conns = new Map();
    this.awareness = new awarenessProtocol.Awareness(this);
    this.awareness.setLocalState(null);

    const awarenessChangeHandler = (
      { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
      conn: WebSocketType | null
    ) => {
      const changedClients = added.concat(updated, removed);
      if (conn !== null) {
        const connControlledIDs = this.conns.get(conn);
        if (connControlledIDs !== undefined) {
          added.forEach(clientID => { connControlledIDs.add(clientID); });
          removed.forEach(clientID => { connControlledIDs.delete(clientID); });
        }
      }

      // Broadcast awareness update
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
      );
      const buff = encoding.toUint8Array(encoder);
      this.conns.forEach((_, c) => send(this, c, buff));
    };

    this.awareness.on('update', awarenessChangeHandler);
    this.on('update', updateHandler);
  }
}

const updateHandler = (update: Uint8Array, doc: WSSharedDoc) => {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeUpdate(encoder, update);
  const message = encoding.toUint8Array(encoder);
  doc.conns.forEach((_, conn) => send(doc, conn, message));
};

const getYDoc = (docname: string, gc = true): WSSharedDoc =>
  setIfUndefined(docs, docname, () => {
    const doc = new WSSharedDoc(docname);
    doc.gc = gc;
    docs.set(docname, doc);
    return doc;
  });

const messageListener = (conn: WebSocketType, doc: WSSharedDoc, message: Uint8Array) => {
  try {
    const encoder = encoding.createEncoder();
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case messageSync:
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.readSyncMessage(decoder, encoder, doc, conn);

        if (encoding.length(encoder) > 1) {
          send(doc, conn, encoding.toUint8Array(encoder));
        }
        break;
      case messageAwareness: {
        awarenessProtocol.applyAwarenessUpdate(
          doc.awareness,
          decoding.readVarUint8Array(decoder),
          conn
        );
        break;
      }
    }
  } catch (err) {
    // console.error(err);
  }
};

const closeConn = (doc: WSSharedDoc, conn: WebSocketType) => {
  if (doc.conns.has(conn)) {
    const controlledIds = doc.conns.get(conn)!;
    doc.conns.delete(conn);
    awarenessProtocol.removeAwarenessStates(
      doc.awareness,
      Array.from(controlledIds),
      null
    );
    if (doc.conns.size === 0) {
      docs.delete(doc.name);
    }
  }
  conn.close();
};

const send = (doc: WSSharedDoc, conn: WebSocketType, m: Uint8Array) => {
  if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
    closeConn(doc, conn);
  }
  try {
    conn.send(m, (err) => {
      if (err) closeConn(doc, conn);
    });
  } catch (e) {
    // console.error(e)
    closeConn(doc, conn);
  }
};

const pingTimeout = 30000;

export const setupWSConnection = (
  conn: WebSocketType,
  { docName = '', gc = true } = {}
) => {
  conn.binaryType = 'arraybuffer';
  const doc = getYDoc(docName, gc);
  doc.conns.set(conn, new Set());

  conn.on('message', (message: ArrayBuffer) =>
    messageListener(conn, doc, new Uint8Array(message))
  );

  // Check if connection is still alive
  let pongReceived = true;
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      if (doc.conns.has(conn)) {
        closeConn(doc, conn);
      }
      clearInterval(pingInterval);
    } else if (doc.conns.has(conn)) {
      pongReceived = false;
      try {
        conn.ping();
      } catch (e) {
        // console.error(e)
        closeConn(doc, conn);
        clearInterval(pingInterval);
      }
    }
  }, pingTimeout);

  conn.on('close', () => {
    closeConn(doc, conn);
    clearInterval(pingInterval);
  });

  conn.on('pong', () => {
    pongReceived = true;
  });

  // Send initial sync
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, doc);
  send(doc, conn, encoding.toUint8Array(encoder));

  const awarenessStates = doc.awareness.getStates();
  if (awarenessStates.size > 0) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(
        doc.awareness,
        Array.from(awarenessStates.keys())
      )
    );
    send(doc, conn, encoding.toUint8Array(encoder));
  }
};