"use client"

import { useCallback, useEffect, useState, useId } from 'react'
import { experimental_useObject as useObject } from 'ai/react';

import {
  Node,
  useReactFlow,
  Position,
  Handle,
  NodeProps,
} from '@xyflow/react';

import { ArrowRightIcon } from '@radix-ui/react-icons'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@radix-ui/react-label';
import { useDocumentStore } from '@/components/canvas/store';
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