import { LoginForm } from "@/components/auth/login-form"
import { ShieldCheck } from "lucide-react"

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-clinico-900 overflow-hidden relative">
      {/* Elementos decorativos de fundo para sensação premium */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      
      <div className="z-10 w-full px-4 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 text-white">
          <div className="bg-white/10 p-3 rounded-none border border-white/20 backdrop-blur-md">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tighter text-white uppercase italic">
              CER II <span className="font-light not-italic">TEAcolhe</span>
            </h1>
            <p className="text-white/60 text-xs font-medium tracking-[0.2em] uppercase">
              Centro de Especialidade e Reabilitação
            </p>
          </div>
        </div>

        <LoginForm />

        <div className="text-white/40 text-[10px] uppercase tracking-widest font-bold">
          © {new Date().getFullYear()} CER - Gestão em Saúde Pública
        </div>
      </div>
    </main>
  )
}
