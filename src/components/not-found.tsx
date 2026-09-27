import { Link, useLocation, useRouter } from "@tanstack/react-router"
import { ArrowLeftIcon, TablePropertiesIcon, UnplugIcon } from "lucide-react"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"

const rise = {
  initial: { opacity: 0, y: 12, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
}

const settle = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }

/** A page nothing is routed to, drawn as a table the diagram does not have. */
export function NotFound() {
  const { pathname } = useLocation()
  const router = useRouter()

  return (
    <main className="relative flex h-svh w-full flex-col items-center justify-center overflow-hidden bg-background px-6 dark:bg-[#141414]">
      {/* The same dots as the canvas, so the page reads as a corner of it. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(var(--color-muted-foreground)_1px,transparent_1px)] bg-size-[16px_16px] opacity-30"
      />

      <div className="relative flex flex-col items-center">
        <motion.div
          {...rise}
          transition={settle}
          className="relative w-56 rounded-lg bg-card text-card-foreground shadow-md ring-1 ring-foreground/10"
        >
          <header className="flex h-8 items-center gap-2 rounded-t-lg bg-muted px-2.5 text-xs font-medium">
            <TablePropertiesIcon className="size-3.5 text-primary" />
            not_found
          </header>
          <dl className="text-[11px] leading-6">
            <div className="flex justify-between gap-3 border-t border-border px-2.5">
              <dt className="text-muted-foreground">status</dt>
              <dd className="font-mono tabular-nums">404</dd>
            </div>
            <div className="flex min-w-0 justify-between gap-3 border-t border-border px-2.5">
              <dt className="shrink-0 text-muted-foreground">path</dt>
              <dd className="truncate font-mono" title={pathname}>
                {pathname}
              </dd>
            </div>
          </dl>

          {/* A relationship drawn from the table to nothing. It draws itself
              in, the way one appears on the canvas. */}
          <svg
            aria-hidden
            viewBox="0 0 96 40"
            className="absolute top-1/2 left-full h-10 w-24 -translate-y-1/2 overflow-visible"
          >
            <motion.path
              d="M0 20 C 32 20, 40 4, 72 4"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ ...settle, duration: 0.9, delay: 0.35 }}
            />
            <motion.g
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...settle, delay: 1.1 }}
              style={{ transformOrigin: "80px 4px" }}
            >
              <circle
                cx="80"
                cy="4"
                r="9"
                className="fill-background stroke-primary/50 dark:fill-[#141414]"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <UnplugIcon
                x="74"
                y="-2"
                width="12"
                height="12"
                className="text-primary"
              />
            </motion.g>
          </svg>
        </motion.div>

        <motion.h1
          {...rise}
          transition={{ ...settle, delay: 0.15 }}
          className="mt-10 text-center text-2xl font-semibold tracking-tight"
        >
          This page isn't on the diagram
        </motion.h1>
        <motion.p
          {...rise}
          transition={{ ...settle, delay: 0.25 }}
          className="mt-2 max-w-sm text-center text-sm text-balance text-muted-foreground"
        >
          Nothing is routed to this address. It may have moved, or the link that
          brought you here is wrong.
        </motion.p>

        <motion.div
          {...rise}
          transition={{ ...settle, delay: 0.35 }}
          className="mt-8 flex items-center gap-2"
        >
          <Button variant="outline" onClick={() => router.history.back()}>
            <ArrowLeftIcon />
            Go back
          </Button>
          <Button nativeButton={false} render={<Link to="/" />}>
            Back to the canvas
          </Button>
        </motion.div>
      </div>
    </main>
  )
}
