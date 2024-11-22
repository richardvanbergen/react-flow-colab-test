"use client";

import { useDocumentStore } from "@/components/canvas/store";
import { InputIcon, RocketIcon } from "@radix-ui/react-icons";
import { Node, Edge, useReactFlow, OnNodesChange, applyNodeChanges, OnEdgesChange, applyEdgeChanges, OnConnect, addEdge, MarkerType, ReactFlow, ConnectionMode, Background, Controls, ControlButton } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { InputCard, OutputCard } from "./cards";
import { SimpleFloatingEdge } from "./edges";

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
        </Controls>
      </ReactFlow>
    </div>
  )
}
