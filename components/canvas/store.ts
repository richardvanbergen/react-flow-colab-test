import { WebsocketProvider } from 'y-websocket'
import { create } from 'zustand'
import * as Y from 'yjs'
import { Edge, Node } from '@xyflow/react'

type DocumentStore = {
  name?: string
  doc?: Y.Doc
  wsProvider?: WebsocketProvider
  yContentMap?: Y.Map<string>
  yNodesMap?: Y.Map<Node>
  yEdgesMap?: Y.Map<Edge>
  resetDocument: () => void
  connect: (url: string, name: string) => void
  disconnect: () => void
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  name: undefined,
  doc: undefined,
  wsProvider: undefined,
  yContentMap: undefined,
  yNodesMap: undefined,
  yEdgesMap: undefined,

  resetDocument: () => {
    const { doc, yNodesMap, yEdgesMap, yContentMap } = get()

    doc?.transact(() => {
      yNodesMap?.clear()
      yEdgesMap?.clear()
      yContentMap?.clear()
    })

    set({ yContentMap: undefined, yNodesMap: undefined, yEdgesMap: undefined })
  },

  connect: (url: string, name: string) => {
    const doc = new Y.Doc()
    const wsProvider = new WebsocketProvider(url, name, doc)

    set({
      name,
      doc,
      wsProvider,
      yContentMap: doc.getMap('content'),
      yNodesMap: doc.getMap('nodes'),
      yEdgesMap: doc.getMap('edges')
    })
  },

  disconnect: () => {
    const { wsProvider } = get()
    wsProvider?.disconnect()
    set({ wsProvider: undefined, yContentMap: undefined, yNodesMap: undefined, yEdgesMap: undefined })
  }
}))