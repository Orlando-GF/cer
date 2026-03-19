"use client"

import * as React from "react"
import { useTransition } from "react"
import { signIn } from "@/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, LogIn } from "lucide-react"

export function LoginForm() {
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await signIn(formData)
      if (result && !result.success) {
        toast.error(result.error)
      }
    })
  }

  return (
    <Card className="w-full max-w-sm border-none shadow-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-primary-900 uppercase">Acesso ao Sistema</CardTitle>
        <CardDescription>
          Insira suas credenciais para acessar o CER.
        </CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail ou CPF</Label>
            <Input
              id="email"
              name="email"
              placeholder="seu@email.com"
              required
              disabled={isPending}
              autoComplete="username"
              className="h-11 font-bold focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={isPending}
              autoComplete="current-password"
              className="h-11 font-bold focus-visible:ring-primary"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full h-12 uppercase font-bold tracking-widest text-[13px]" 
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AUTENTICANDO...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                ENTRAR NO SISTEMA
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
