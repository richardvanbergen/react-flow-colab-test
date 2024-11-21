import { Position, Node, InternalNode } from '@xyflow/react';

// returns the position (top,right,bottom or right) passed node compared to
export function getParams<NodeType extends Node = Node>(nodeA: InternalNode<NodeType>, nodeB: InternalNode<NodeType>, type: 'source' | 'target') {
  const centerA = getNodeCenter(nodeA);
  const centerB = getNodeCenter(nodeB);

  const horizontalDiff = Math.abs(centerA.x - centerB.x);
  const verticalDiff = Math.abs(centerA.y - centerB.y);

  let position: Position;

  // when the horizontal difference between the nodes is bigger, we use Position.Left or Position.Right for the handle
  if (horizontalDiff > verticalDiff) {
    position = centerA.x > centerB.x ? Position.Left : Position.Right;
  } else {
    // here the vertical difference between the nodes is bigger, so we use Position.Top or Position.Bottom for the handle
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

  // this is a tiny detail to make the markerEnd of an edge visible.
  // The handle position that gets calculated has the origin top-left, so depending which side we are using, we add a little offset
  // when the handlePosition is Position.Right for example, we need to add an offset as big as the handle itself in order to get the correct position
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