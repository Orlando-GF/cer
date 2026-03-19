"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { type ActionResponse } from "@/types"

export async function signIn(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { success: false, error: "E-mail e senha são obrigatórios." }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: "Credenciais inválidas ou erro no servidor." }
  }

  revalidatePath("/", "layout")
  redirect("/")
}

export async function signOut(): Promise<ActionResponse> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/", "layout")
  redirect("/login")
}
