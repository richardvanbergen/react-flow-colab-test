import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { WebSocketServer } from 'ws'
import { setupWSConnection } from './websocket'
const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev, turbo: true })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  }).listen(port)

  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const docName = new URL(req.url || '', `http://localhost:${port}`).pathname.slice(1);
    setupWSConnection(ws, { docName });
  });

  wss.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  console.log(
    `> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV
    }`
  )
})
