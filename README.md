## This repository is a demonstration of a collaborative canvas using [React Flow](https://reactflow.dev/) and [Yjs](https://docs.yjs.dev/getting-started/introduction).

## Prerequisites

- Node.js 20.x
- npm (pnpm is better)
- Docker
- OpenAI API key

## How to use

1. Clone this repository
2. Create `.env` file
3. Add your OpenAI API key to `.env` under `OPENAI_API_KEY=`
4. Add your WebSocket server URL to `.env` under
   `NEXT_PUBLIC_WEBSOCKET_SERVER_URL=` for dev use `ws://localhost:1234` by
   default.
5. Run `npm install`
6. Run `npm dev`
7. Open [http://localhost:3000](http://localhost:3000)
8. Enter a name to join a canvas.
9. Open the URL in another separate session.

## Notes

Almost all the code is in the `components` folder. The app folder is the routing
and layout specific to Next.js. But the components can be easily used in any
React project.
