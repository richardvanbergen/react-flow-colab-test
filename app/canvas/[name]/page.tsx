import { CanvasWithProvider } from '@/components/canvas/canvas-provider'

export default async function CanvasPage(props: { params: Promise<{ name: string }> }) {
  const { name } = await props.params

  return <CanvasWithProvider name={name} />
}
