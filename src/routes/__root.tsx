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

import { NotFound } from "@/components/not-found"
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
        title: "SchemaForge",
      },
      {
        name: "description",
        content:
          "Draw a database schema as a diagram, check it, and turn it into SQL.",
      },
      {
        name: "theme-color",
        content: "#009869",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  notFoundComponent: NotFound,
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
