"use client"

import { useDocumentStore } from '@/components/canvas/store';

import {
  ReactFlowProvider,
} from '@xyflow/react';

import { useEffect } from 'react';
import { Canvas } from './canvas';

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReactFlowProvider>
      {children}
    </ReactFlowProvider>
  )
}

export function CanvasWithProvider({ name }: { name: string }) {
  const disconnect = useDocumentStore(state => state.disconnect)
  const connect = useDocumentStore(state => state.connect)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WEBSOCKET_SERVER_URL

    if (!url) {
      throw new Error('NEXT_PUBLIC_WEBSOCKET_SERVER_URL is not set')
    }

    connect(url, name)

    return () => {
      disconnect()
    }
  }, [connect, disconnect, name])

  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  )
}
