"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import slugify from "slugify";
import { useRouter } from "next/navigation";
export function EntryForm() {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    setSlug(slugify(e.target.value, { lower: true }))
  }

  const handleJoin = () => {
    router.push(`/canvas/${slug}`)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome to Colab</CardTitle>
        <CardDescription>
          Enter a name to join a canvas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Input value={name} onChange={handleChange} />

          <p className="text-sm text-muted-foreground">
            {`/canvas/${slug}`}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button disabled={!slug} onClick={handleJoin}>Join</Button>
      </CardFooter>
    </Card>
  )
}
