"use client"

import * as Y from 'yjs'
import { useCallback, useMemo, useEffect, useState, startTransition, useId } from 'react'
import { experimental_useObject as useObject } from 'ai/react';

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
} from '@xyflow/react';

import { ArrowRightIcon, InputIcon, RocketIcon } from '@radix-ui/react-icons'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@radix-ui/react-label';
import { SimpleFloatingEdge } from './floating-edge';
import { useDocumentStore } from './store';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { outputSchema } from '@/app/api/chat/outputSchema';

type CardNode = Node<{
  label: string
}, string>

export function InputCard(props: NodeProps<CardNode>) {
  const { id } = props;
  const reactId = useId()
  const name = useDocumentStore(state => state.name)
  const yContentMap = useDocumentStore(state => state.yContentMap)
  const [value, setValue] = useState('')

  useEffect(() => {
    const syncContent = () => {
      const content = yContentMap?.get(`${name}-${id}`)
      setValue(content || '')
    }

    yContentMap?.observe(syncContent)
    syncContent()

    return () => {
      yContentMap?.unobserve(syncContent)
    }
  }, [name])

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    yContentMap?.set(`${name}-${id}`, value)
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
                <Label htmlFor={`${reactId}-data`}>Input Data</Label>
                <Textarea rows={5} id={`${reactId}-data`} placeholder="Name of your project" value={value} onChange={handleChange} />
              </div>
              <div className="flex flex-col space-y-1.5">
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Handle type="source" position={Position.Top} className="border-blue-500" id="top" />
      <Handle type="source" position={Position.Right} className="border-blue-500" id="right" />
      <Handle type="source" position={Position.Bottom} className="border-blue-500" id="bottom" />
      <Handle type="source" position={Position.Left} className="border-blue-500" id="left" />
    </>
  )
}

export function OutputCard(props: NodeProps<CardNode>) {
  const { id } = props;
  const { getEdges } = useReactFlow();
  const reactId = useId()
  const name = useDocumentStore(state => state.name)
  const yContentMap = useDocumentStore(state => state.yContentMap)
  const [prompt, setPrompt] = useState('')
  const [output, setOutput] = useState('')

  const { object, submit } = useObject({
    api: '/api/chat',
    schema: outputSchema,
  });

  const getActiveConnections = useCallback(() => {
    const edges = getEdges();
    return edges.filter(edge => edge.source === id || edge.target === id);
  }, [id, getEdges]);

  const handleGenerate = () => {
    const activeConnections = getActiveConnections();

    const inputData = []
    for (const edge of activeConnections) {
      const source = edge.source
      const content = yContentMap?.get(`${name}-${source}`)
      inputData.push(content)
    }

    const submissionInput = `
    Input Data: ${inputData.join('\n')}

    Prompt: ${prompt}
    `

    submit(submissionInput)
  }

  useEffect(() => {
    if (object?.output) {
      yContentMap?.set(`${name}-${id}`, object.output)
    }
  }, [object])

  useEffect(() => {
    const syncContent = () => {
      const prompt = yContentMap?.get(`${name}-${id}-prompt`)
      const output = yContentMap?.get(`${name}-${id}`)
      setPrompt(prompt || '')
      setOutput(output || '')
    }

    yContentMap?.observe(syncContent)
    syncContent()

    return () => {
      yContentMap?.unobserve(syncContent)
    }
  }, [name])

  function handlePromptChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    yContentMap?.set(`${name}-${id}-prompt`, value)
  }

  return (
    <>
      <Card className="w-[350px] card-node">
        <CardHeader>
          <CardTitle>Output</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor={`${reactId}-prompt`}>Prompt</Label>
              <Textarea rows={5} id={`${reactId}-prompt`} placeholder="Tell the AI what to do" name="prompt" value={prompt} onChange={handlePromptChange} />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor={`${reactId}-output`}>Output</Label>
              <Textarea rows={5} id={`${reactId}-output`} name="output" disabled value={output} />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleGenerate}>
            Generate
            <ArrowRightIcon />
          </Button>
        </CardFooter>
      </Card>

      <Handle type="target" position={Position.Top} className="border-red-500" id="top" style={{ transform: 'translate(-20px, 0)' }} />
      <Handle type="target" position={Position.Right} className="border-red-500" id="right" style={{ transform: 'translate(0, -20px)' }} />
      <Handle type="target" position={Position.Bottom} className="border-red-500" id="bottom" style={{ transform: 'translate(-20px, 0)' }} />
      <Handle type="target" position={Position.Left} className="border-red-500" id="left" style={{ transform: 'translate(0, -20px)' }} />

      <Handle type="source" position={Position.Top} className="border-blue-500" id="top-source" style={{ transform: 'translate(20px, 0)' }} />
      <Handle type="source" position={Position.Right} className="border-blue-500" id="right-source" style={{ transform: 'translate(0, 20px)' }} />
      <Handle type="source" position={Position.Bottom} className="border-blue-500" id="bottom-source" style={{ transform: 'translate(20px, 0)' }} />
      <Handle type="source" position={Position.Left} className="border-blue-500" id="left-source" style={{ transform: 'translate(0, 20px)' }} />
    </>
  )
}



export function Canvas<NodeType extends Node = Node, EdgeType extends Edge = Edge>() {
  const doc = useDocumentStore(state => state.doc)
  const yNodesMap = useDocumentStore(state => state.yNodesMap)
  const yEdgesMap = useDocumentStore(state => state.yEdgesMap)

  const { screenToFlowPosition, addNodes } = useReactFlow();

  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [edges, setEdges] = useState<EdgeType[]>([]);

  const getId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  const nodeOrigin = [0.5, 0];

  useEffect(() => {
    const syncNodes = (event: Y.YMapEvent<Node>) => {
      setNodes(nds => {
        let newNodes = nds.map(n => {
          const node = yNodesMap?.get(n.id) as NodeType | undefined;
          return node ? node : n;
        });

        for (const key of event.keysChanged) {
          const node = yNodesMap?.get(key) as NodeType | undefined;
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

    yNodesMap?.observe(syncNodes);

    return () => {
      yNodesMap?.unobserve(syncNodes);
    };
  })

  useEffect(() => {
    const syncEdges = (event: Y.YMapEvent<Edge>) => {
      setEdges(eds => {
        let newEdges = eds.map(e => {
          const edge = yEdgesMap?.get(e.id) as EdgeType | undefined;
          return edge ? edge : e;
        });

        for (const key of event.keysChanged) {
          const edge = yEdgesMap?.get(key) as EdgeType | undefined;
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

    yEdgesMap?.observe(syncEdges);

    return () => {
      yEdgesMap?.unobserve(syncEdges);
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

  const onNodesChange: OnNodesChange<NodeType> = useCallback(
    (changes) => {

      startTransition(() => {
        setNodes(nds => {
          const newNodes = applyNodeChanges(changes, nds)

          doc?.transact(() => {
            changes.forEach(change => {
              if (change.type === 'remove') {
                yNodesMap?.delete(change.id)
              } else {
                const id = change.type === 'add' ? change.item.id : change.id
                const node = newNodes.find(n => n.id === id)
                if (node) {
                  yNodesMap?.set(id, node)
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

        doc?.transact(() => {
          changes.forEach(change => {
            if (change.type === 'remove') {
              yEdgesMap?.delete(change.id)
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

        doc?.transact(() => {
          const edge = newEdges.find(
            e => e.source === params.source && e.target === params.target
          );

          if (edge) {
            yEdgesMap?.set(edge.id, edge);
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

          {/* <ControlButton onClick={handleReset}>
            <ResetIcon />
          </ControlButton> */}
        </Controls>
      </ReactFlow>
    </div>
  )
}

export function CanvasWithProvider({ name }: { name: string }) {
  const wsProvider = useDocumentStore(state => state.wsProvider)
  const connect = useDocumentStore(state => state.connect)

  useEffect(() => {
    const port = 1234
    connect(`ws://localhost:${port}`, name)

    return () => {
      wsProvider?.disconnect()
    }
  }, [connect, name])

  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  )
}
