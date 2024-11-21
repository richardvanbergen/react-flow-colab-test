"use client"

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useCallback, useMemo, useEffect, useState, startTransition } from 'react'

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
  MarkerType,
  ConnectionMode,
  NodeProps,
  // useHandleConnections,
  // NodeProps,
} from '@xyflow/react';

import { InputIcon, PlusCircledIcon, ResetIcon, RocketIcon } from '@radix-ui/react-icons'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@radix-ui/react-label';
import { Button } from '@/components/ui/button';
import { SimpleFloatingEdge } from './floating-edge';

const port = 1234

const useWebSocket = (name: string) => {
  const doc = new Y.Doc()
  const wsProvider = new WebsocketProvider(`ws://localhost:${port}`, name, doc)

  const yNodesMap = doc.getMap('nodes');
  const yEdgesMap = doc.getMap('edges');

  return {
    doc,
    yNodesMap,
    yEdgesMap,
    wsProvider
  }
}

type CardNode = Node<{
  label: string
}, string>

export function InputCard(props: NodeProps<CardNode>) {
  const { id, selected } = props;
  const { getEdges } = useReactFlow();

  const getActiveConnections = useCallback(() => {
    const edges = getEdges();
    return edges.filter(edge => edge.source === id || edge.target === id);
  }, [id, getEdges]);

  if (selected) {
    const activeConnections = getActiveConnections();

    console.log('activeConnections', activeConnections);
  }

  return (
    <>
      <Card className="w-[350px] card-node">
        <CardHeader>
          <CardTitle>Input</CardTitle>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Name of your project" />
              </div>
              <div className="flex flex-col space-y-1.5">
              </div>
            </div>
          </form>
        </CardContent>
        {/* <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button>Deploy</Button>
        </CardFooter> */}
      </Card>

      <Handle type="source" position={Position.Top} className="border-blue-500" id="top" />
      <Handle type="source" position={Position.Right} className="border-blue-500" id="right" />
      <Handle type="source" position={Position.Bottom} className="border-blue-500" id="bottom" />
      <Handle type="source" position={Position.Left} className="border-blue-500" id="left" />
    </>
  )
}

export function OutputCard(props: NodeProps<CardNode>) {
  const { id, selected } = props;
  const { getEdges } = useReactFlow();

  const getActiveConnections = useCallback(() => {
    const edges = getEdges();
    return edges.filter(edge => edge.source === id || edge.target === id);
  }, [id, getEdges]);

  if (selected) {
    const activeConnections = getActiveConnections();

    console.log('activeConnections', activeConnections);
  }

  return (
    <>
      <Card className="w-[350px] card-node">
        <CardHeader>
          <CardTitle>Output</CardTitle>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Name of your project" />
              </div>
              <div className="flex flex-col space-y-1.5">
              </div>
            </div>
          </form>
        </CardContent>
        {/* <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button>Deploy</Button>
        </CardFooter> */}
      </Card>

      <Handle type="target" position={Position.Top} className="border-red-500" id="top" />
      <Handle type="target" position={Position.Right} className="border-red-500" id="right" />
      <Handle type="target" position={Position.Bottom} className="border-red-500" id="bottom" />
      <Handle type="target" position={Position.Left} className="border-red-500" id="left" />
    </>
  )
}



export function Canvas<NodeType extends Node = Node, EdgeType extends Edge = Edge>(props: { doc: Y.Doc, yNodesMap: Y.Map<unknown>, yEdgesMap: Y.Map<unknown> }) {
  const { doc, yNodesMap, yEdgesMap } = props

  const { screenToFlowPosition, addNodes } = useReactFlow();

  const initialNodes = [] as unknown as NodeType[];
  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [edges, setEdges] = useState<EdgeType[]>([]);

  const getId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  const nodeOrigin = [0.5, 0];

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
  })

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
  })

  function handleCreateNewInputNode() {
    const id = getId();

    const newNode = {
      id,
      position: screenToFlowPosition({
        x: 100,
        y: 100,
      }),
      type: 'input-card',
      data: { label: `Node ${id}` },
      origin: nodeOrigin,
    } as unknown as NodeType;

    addNodes([newNode])
  }

  function handleCreateNewOutputNode() {
    const id = getId();

    const newNode = {
      id,
      position: screenToFlowPosition({
        x: 100,
        y: 100,
      }),
      type: 'output-card',
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

      startTransition(() => {
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
      });
    },
    [doc, yNodesMap],
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
    [doc, yEdgesMap],
  )

  const onConnect: OnConnect = useCallback(
    (params) => {
      setEdges(eds => {
        const newEdges = addEdge(
          {
            ...params,
            type: 'floating',
            markerEnd: { type: MarkerType.ArrowClosed },
          } as EdgeType, eds);

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
    [doc, yEdgesMap],
  );

  const nodeTypes = useMemo(() => ({ 'input-card': InputCard, 'output-card': OutputCard }), []);
  const edgeTypes = useMemo(() => ({ floating: SimpleFloatingEdge, }), []);

  return (
    <div className="h-screen w-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Strict}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Background />
        <Controls>
          <ControlButton onClick={handleCreateNewInputNode}>
            <InputIcon />
          </ControlButton>

          <ControlButton onClick={handleCreateNewOutputNode}>
            <RocketIcon />
          </ControlButton>

          <ControlButton onClick={handleReset}>
            <ResetIcon />
          </ControlButton>
        </Controls>
      </ReactFlow>
    </div>
  )
}

export function CanvasWithProvider({ name }: { name: string }) {
  const { doc, yNodesMap, yEdgesMap, wsProvider } = useWebSocket(name)

  useEffect(() => {
    return () => {
      wsProvider.disconnect()
    }
  }, [wsProvider])

  return (
    <ReactFlowProvider>
      <Canvas doc={doc} yNodesMap={yNodesMap} yEdgesMap={yEdgesMap} />
    </ReactFlowProvider>
  )
}
