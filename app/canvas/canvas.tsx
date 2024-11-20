"use client"

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useCallback, useMemo, useEffect, useState } from 'react'

import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  addEdge,
  Edge,
  Node,
  OnNodesChange,
  OnConnect,
  ControlButton,
  useReactFlow,
  ReactFlowProvider,
  applyEdgeChanges,
  OnEdgesChange,
  Position,
  Handle,
} from '@xyflow/react';

import { PlusCircledIcon, ResetIcon } from '@radix-ui/react-icons'
import '@xyflow/react/dist/style.css';

const port = process.env.NEXT_PUBLIC_WS_PORT || 3000

const useWebSocket = () => {
  const doc = new Y.Doc()
  const wsProvider = new WebsocketProvider(`ws://localhost:${port}`, 'my-roomname', doc)

  return {
    doc,
    wsProvider
  }
}

const handleStyle = { left: 10 };

function TextUpdaterNode({ data }: { data: any }) {
  const onChange = useCallback((evt: any) => {
    console.log(evt.target.value);
  }, []);

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div>
        <label htmlFor="text">Text:</label>
        <input id="text" name="text" onChange={onChange} className="nodrag" />
      </div>
      <Handle type="source" position={Position.Bottom} id="a" />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        style={handleStyle}
      />
    </>
  );
}

export function Canvas<NodeType extends Node = Node, EdgeType extends Edge = Edge>() {
  const { doc, wsProvider } = useMemo(() => useWebSocket(), [])

  const { screenToFlowPosition, addNodes } = useReactFlow();

  const initialNodes = [
  ] as unknown as NodeType[];

  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [edges, setEdges] = useState<EdgeType[]>([]);

  const getId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  const nodeOrigin = [0.5, 0];

  const yNodesMap = doc.getMap('nodes');
  const yEdgesMap = doc.getMap('edges');

  useEffect(() => {
    return () => {
      wsProvider.disconnect()
    }
  }, [])

  useEffect(() => {
    const syncNodes = (event: Y.YMapEvent<unknown>) => {
      setNodes(nds => {
        let newNodes = nds.map(n => {
          const node = yNodesMap.get(n.id) as NodeType | undefined;
          return node ? node : n;
        });

        for (const key of event.keysChanged) {
          const node = yNodesMap.get(key) as NodeType | undefined;
          if (node) {
            if (!nds.some(n => n.id === key)) {
              newNodes.push(node);
            }
          } else {
            newNodes = newNodes.filter(n => n.id !== key);
          }
        }

        return newNodes;
      });

    };
    yNodesMap.observe(syncNodes);

    return () => {
      yNodesMap.unobserve(syncNodes);
    };
  }, [])

  useEffect(() => {
    const syncEdges = (event: Y.YMapEvent<unknown>) => {
      setEdges(eds => {
        let newEdges = eds.map(e => {
          const edge = yEdgesMap.get(e.id) as EdgeType | undefined;
          return edge ? edge : e;
        });

        for (const key of event.keysChanged) {
          const edge = yEdgesMap.get(key) as EdgeType | undefined;
          if (edge) {
            if (!eds.some(e => e.id === key)) {
              newEdges.push(edge);
            }
          } else {
            newEdges = newEdges.filter(e => e.id !== key);
          }
        }

        return newEdges;
      });
    };
    yEdgesMap.observe(syncEdges);

    return () => {
      yEdgesMap.unobserve(syncEdges);
    };
  }, []);

  function handleCreateNewNode() {
    const id = getId();

    const newNode = {
      id,
      position: screenToFlowPosition({
        x: 100,
        y: 100,
      }),
      type: 'textUpdater',
      data: { label: `Node ${id}` },
      origin: nodeOrigin,
    } as unknown as NodeType;

    addNodes([newNode])
  }

  const handleReset = () => {
    doc.transact(() => {
      yNodesMap.clear();
      yEdgesMap.clear();
    });
    setNodes(initialNodes);
    setEdges([]);
  }

  const onNodesChange: OnNodesChange<NodeType> = useCallback(
    (changes) => {
      setNodes(nds => {
        const newNodes = applyNodeChanges(changes, nds)

        doc.transact(() => {
          changes.forEach(change => {
            if (change.type === 'remove') {
              yNodesMap.delete(change.id)
            } else {
              const id = change.type === 'add' ? change.item.id : change.id
              const node = newNodes.find(n => n.id === id)
              if (node) {
                yNodesMap.set(id, node)
              }
            }
          })
        })

        return newNodes
      });
    },
    [],
  );

  const onEdgesChange: OnEdgesChange<EdgeType> = useCallback(
    (changes) => {
      setEdges(eds => {
        const newEdges = applyEdgeChanges(changes, eds)

        doc.transact(() => {
          changes.forEach(change => {
            if (change.type === 'remove') {
              yEdgesMap.delete(change.id)
            }
          })
        })

        return newEdges
      })
    },
    [],
  )

  const onConnect: OnConnect = useCallback(
    (params) => {
      setEdges(eds => {
        const newEdges = addEdge(params, eds);

        doc.transact(() => {
          const edge = newEdges.find(
            e => e.source === params.source && e.target === params.target
          );

          if (edge) {
            yEdgesMap.set(edge.id, edge);
          }
        });

        return newEdges;
      });
    },
    [],
  );

  const nodeTypes = useMemo(() => ({ textUpdater: TextUpdaterNode }), []);

  return (
    <div className="h-screen w-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Background />
        <Controls>
          <ControlButton onClick={handleCreateNewNode}>
            <PlusCircledIcon />
          </ControlButton>
          <ControlButton onClick={handleReset}>
            <ResetIcon />
          </ControlButton>
        </Controls>
      </ReactFlow>
    </div>
  )
}

export function CanvasWithProvider() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  )
}
