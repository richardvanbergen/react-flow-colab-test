import dynamic from 'next/dynamic'

const CanvasWithProvider = dynamic(() => import('./canvas').then(mod => mod.CanvasWithProvider))

export default function CanvasPage() {
  return <CanvasWithProvider />
}
