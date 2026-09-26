import { formDevtoolsPlugin } from "@tanstack/react-form-devtools"
import { hotkeysDevtoolsPlugin } from "@tanstack/react-hotkeys-devtools"
import type { QueryClient } from "@tanstack/react-query"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { Toaster } from "sileo"

import { TooltipProvider } from "@/components/ui/tooltip"
import { themeScript, useTheme } from "@/lib/theme"
import { useToastPosition } from "@/lib/toast"

import appCss from "../styles.css?url"

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  // The toaster marks itself with this, and `styles.css` hangs the toast text
  // colour off that mark.
  const theme = useTheme()
  const toastPosition = useToastPosition()

  return (
    // The pre-paint script adds the theme class before React hydrates, which
    // is a mismatch by definition.
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position={toastPosition} theme={theme} />
        {import.meta.env.DEV && (
          <TanStackDevtools
            config={{
              position: "bottom-right",
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
              {
                name: "Tanstack Query",
                render: <ReactQueryDevtoolsPanel />,
              },
              formDevtoolsPlugin(),
              hotkeysDevtoolsPlugin(),
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}
