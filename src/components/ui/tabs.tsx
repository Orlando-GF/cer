"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

function Tabs({ className, orientation = "horizontal", ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn("group/tabs flex gap-2 data-[orientation=horizontal]:flex-col", className)}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center text-muted-foreground group-data-[orientation=horizontal]/tabs:min-h-11 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "p-1 bg-primary-50 border border-primary-100 rounded-none",
        line: "gap-4 bg-transparent",
        segmented: "p-1 bg-muted/50 border border-border rounded-none gap-1",
        agenda: "p-1 bg-primary-50 border border-primary-100 rounded-none gap-1",
        // Nova variante: barra de navegação com ícone + label empilhados
        nav: "gap-0 bg-background border-b border-border w-full h-auto",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface TabsListProps extends TabsPrimitive.List.Props, VariantProps<typeof tabsListVariants> { }

function TabsList({ className, variant = "default", ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        "group/tabs-list", // Forçar classe de grupo
        tabsListVariants({ variant }), 
        className
      )}
      {...props}
    />
  )
}

interface TabsTriggerProps extends TabsPrimitive.Tab.Props {
  icon?: ReactNode
}

function TabsTrigger({ className, children, icon, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        // Base
        "relative inline-flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",

        // Estado inativo
        "text-muted-foreground hover:text-foreground",

        // default/segmented: bg branco puro + borda + sombra no ativo (Estilo Lyra Sharp)
        // Seletores ultra-resilientes (suporta data-state, data-selected e aria-selected)
        "group-data-[variant=default]/tabs-list:flex-1",
        "group-data-[variant=default]/tabs-list:data-[state=active]:bg-card group-data-[variant=default]/tabs-list:data-[selected]:bg-card group-data-[variant=default]/tabs-list:aria-[selected=true]:bg-card",
        "group-data-[variant=default]/tabs-list:data-[state=active]:text-primary group-data-[variant=default]/tabs-list:data-[selected]:text-primary group-data-[variant=default]/tabs-list:aria-[selected=true]:text-primary",
        "group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=default]/tabs-list:data-[selected]:shadow-sm group-data-[variant=default]/tabs-list:aria-[selected=true]:shadow-sm",
        "group-data-[variant=default]/tabs-list:data-[state=active]:border group-data-[variant=default]/tabs-list:data-[selected]:border group-data-[variant=default]/tabs-list:aria-[selected=true]:border",
        "group-data-[variant=default]/tabs-list:data-[state=active]:border-border group-data-[variant=default]/tabs-list:data-[selected]:border-border group-data-[variant=default]/tabs-list:aria-[selected=true]:border-border",
        "group-data-[variant=default]/tabs-list:data-[state=active]:font-medium group-data-[variant=default]/tabs-list:data-[selected]:font-medium group-data-[variant=default]/tabs-list:aria-[selected=true]:font-medium",
        "group-data-[variant=default]/tabs-list:rounded-none",

        "group-data-[variant=segmented]/tabs-list:flex-1",
        "group-data-[variant=segmented]/tabs-list:data-[state=active]:bg-white group-data-[variant=segmented]/tabs-list:data-[selected]:bg-white group-data-[variant=segmented]/tabs-list:aria-[selected=true]:bg-white",
        "group-data-[variant=segmented]/tabs-list:data-[state=active]:text-primary group-data-[variant=segmented]/tabs-list:data-[selected]:text-primary group-data-[variant=segmented]/tabs-list:aria-[selected=true]:text-primary",
        "group-data-[variant=segmented]/tabs-list:data-[state=active]:shadow-md group-data-[variant=segmented]/tabs-list:data-[selected]:shadow-md group-data-[variant=segmented]/tabs-list:aria-[selected=true]:shadow-md",
        "group-data-[variant=segmented]/tabs-list:data-[state=active]:border group-data-[variant=segmented]/tabs-list:data-[selected]:border group-data-[variant=segmented]/tabs-list:aria-[selected=true]:border",
        "group-data-[variant=segmented]/tabs-list:data-[state=active]:border-slate-200 group-data-[variant=segmented]/tabs-list:data-[selected]:border-slate-200 group-data-[variant=segmented]/tabs-list:aria-[selected=true]:border-slate-200",
        "group-data-[variant=segmented]/tabs-list:data-[state=active]:font-bold group-data-[variant=segmented]/tabs-list:data-[selected]:font-bold group-data-[variant=segmented]/tabs-list:aria-[selected=true]:font-bold",
        "group-data-[variant=segmented]/tabs-list:rounded-none",

        // agenda: fundo primary-50, ativa branca com borda, inativa com cor específica
        "group-data-[variant=agenda]/tabs-list:flex-1",
        "group-data-[variant=agenda]/tabs-list:text-muted-foreground",
        "group-data-[variant=agenda]/tabs-list:data-[state=active]:bg-card group-data-[variant=agenda]/tabs-list:data-[selected]:bg-card group-data-[variant=agenda]/tabs-list:aria-[selected=true]:bg-card",
        "group-data-[variant=agenda]/tabs-list:data-[state=active]:text-primary group-data-[variant=agenda]/tabs-list:data-[selected]:text-primary group-data-[variant=agenda]/tabs-list:aria-[selected=true]:text-primary",
        "group-data-[variant=agenda]/tabs-list:data-[state=active]:border group-data-[variant=agenda]/tabs-list:data-[selected]:border group-data-[variant=agenda]/tabs-list:aria-[selected=true]:border",
        "group-data-[variant=agenda]/tabs-list:data-[state=active]:border-border group-data-[variant=agenda]/tabs-list:data-[selected]:border-border group-data-[variant=agenda]/tabs-list:aria-[selected=true]:border-border",
        "group-data-[variant=agenda]/tabs-list:shadow-none",
        "group-data-[variant=agenda]/tabs-list:rounded-none",

        // nav: ícone empilhado, indicador por borda inferior (Também resiliente)
        "group-data-[variant=nav]/tabs-list:flex-col group-data-[variant=nav]/tabs-list:gap-1",
        "group-data-[variant=nav]/tabs-list:py-3 group-data-[variant=nav]/tabs-list:px-6",
        "group-data-[variant=nav]/tabs-list:text-xs group-data-[variant=nav]/tabs-list:h-auto",
        "group-data-[variant=nav]/tabs-list:aria-[selected=true]:text-foreground group-data-[variant=nav]/tabs-list:data-[state=active]:text-foreground",
        "group-data-[variant=nav]/tabs-list:aria-[selected=true]:font-semibold group-data-[variant=nav]/tabs-list:data-[state=active]:font-semibold",
        "group-data-[variant=nav]/tabs-list:aria-[selected=true]:border-b-2 group-data-[variant=nav]/tabs-list:data-[state=active]:border-b-2",
        "group-data-[variant=nav]/tabs-list:aria-[selected=true]:border-b-foreground group-data-[variant=nav]/tabs-list:data-[state=active]:border-b-foreground",
        "group-data-[variant=nav]/tabs-list:data-[state=active]:mb-[-2px]",

        className
      )}
      {...props}
    >
      {/* Ícone (renderizado apenas se fornecido) */}
      {icon && (
        <span className="relative z-10 [&>svg]:size-4 [&>svg]:stroke-current opacity-70 group-data-[state=active]:opacity-100">
          {icon}
        </span>
      )}

      <span className="relative z-10">{children}</span>

      {/* Indicador animado para variante 'line' */}
      <AnimatePresence>
        <div className="absolute inset-0 z-0 hidden group-data-[variant=line]/tabs-list:block">
          <TabsPrimitive.Indicator className="h-full w-full">
            <motion.div
              layoutId="active-tab-indicator"
              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
          </TabsPrimitive.Indicator>
        </div>
      </AnimatePresence>
    </TabsPrimitive.Tab>
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring mt-2", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
