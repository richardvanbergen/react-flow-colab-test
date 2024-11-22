"use client";

import { Node, InternalNode, Edge, EdgeProps, getBezierPath, Position, useInternalNode } from '@xyflow/react';

export function getParams<NodeType extends Node = Node>(nodeA: InternalNode<NodeType>, nodeB: InternalNode<NodeType>, type: 'source' | 'target') {
  const centerA = getNodeCenter(nodeA);
  const centerB = getNodeCenter(nodeB);

  const horizontalDiff = Math.abs(centerA.x - centerB.x);
  const verticalDiff = Math.abs(centerA.y - centerB.y);

  let position: Position;

  if (horizontalDiff > verticalDiff) {
    position = centerA.x > centerB.x ? Position.Left : Position.Right;
  } else {
    position = centerA.y > centerB.y ? Position.Top : Position.Bottom;
  }

  const [x, y] = getHandleCoordsByPosition(nodeA, position, type);
  return [x, y, position];
}

export function getHandleCoordsByPosition<NodeType extends Node = Node>(node: InternalNode<NodeType>, handlePosition: Position, type: 'source' | 'target') {
  const handleBounds = node.internals.handleBounds?.[type];

  const handle = handleBounds?.find(
    (h) => h.position === handlePosition,
  );

  if (!handle) {
    return [0, 0];
  }

  let offsetX = handle.width / 2;
  let offsetY = handle.height / 2;

  switch (handlePosition) {
    case Position.Left:
      offsetX = 0;
      break;
    case Position.Right:
      offsetX = handle.width;
      break;
    case Position.Top:
      offsetY = 0;
      break;
    case Position.Bottom:
      offsetY = handle.height;
      break;
  }

  const x = node.internals.positionAbsolute.x + handle.x + offsetX;
  const y = node.internals.positionAbsolute.y + handle.y + offsetY;

  return [x, y];
}

export function getNodeCenter<NodeType extends Node = Node>(node: InternalNode<NodeType>) {
  if (!node.measured.width || !node.measured.height) {
    return { x: 0, y: 0 };
  }

  return {
    x: node.internals.positionAbsolute.x + node.measured.width / 2,
    y: node.internals.positionAbsolute.y + node.measured.height / 2,
  };
}

// returns the parameters (sx, sy, tx, ty, sourcePos, targetPos) you need to create an edge
export function getEdgeParams<NodeType extends Node = Node>(source: InternalNode<NodeType>, target: InternalNode<NodeType>) {
  const [sx, sy, sourcePos] = getParams(source, target, 'source');
  const [tx, ty, targetPos] = getParams(target, source, 'target');

  return {
    sx,
    sy,
    tx,
    ty,
    sourcePos,
    targetPos,
  };
}

export function SimpleFloatingEdge({ id, source, target, markerEnd, style }: EdgeProps<Edge>) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode,
  );

  const [edgePath] = getBezierPath({
    sourceX: sx as number,
    sourceY: sy as number,
    sourcePosition: sourcePos as Position,
    targetPosition: targetPos as Position,
    targetX: tx as number,
    targetY: ty as number,
  });

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      strokeWidth={5}
      markerEnd={markerEnd}
      style={style}
    />
  );
}