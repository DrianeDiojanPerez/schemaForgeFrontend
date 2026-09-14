import { useState } from "react"
import {
  BackgroundVariant,
  useStore,
  useStoreApi,
  useReactFlow,
} from "@xyflow/react"
import {
  GridIcon,
  MaximizeIcon,
  MinusIcon,
  MoonIcon,
  MousePointer2Icon,
  PaletteIcon,
  PlusIcon,
  SettingsIcon,
  SunIcon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { setTheme, useTheme } from "@/lib/theme"
import type { Theme } from "@/lib/theme"

const ZOOM_DURATION = 150
const FIT_DURATION = 300

const TABS = [
  { id: "appearance", label: "Appearance", icon: PaletteIcon },
  { id: "canvas", label: "Canvas", icon: GridIcon },
  { id: "interaction", label: "Interaction", icon: MousePointer2Icon },
] as const

type TabId = (typeof TABS)[number]["id"]

export type BackgroundStyle = BackgroundVariant | "none"

const BACKGROUNDS: { value: BackgroundStyle; label: string }[] = [
  { value: BackgroundVariant.Dots, label: "Dots" },
  { value: BackgroundVariant.Lines, label: "Lines" },
  { value: BackgroundVariant.Cross, label: "Cross" },
  { value: "none", label: "None" },
]

// The preview has to show both themes at once, so it cannot read the tokens
// the page is currently painted with. These mirror styles.css.
const THEMES: {
  value: Theme
  label: string
  icon: LucideIcon
  page: string
  card: string
  border: string
  text: string
  accent: string
}[] = [
  {
    value: "light",
    label: "Light",
    icon: SunIcon,
    page: "oklch(1 0 0)",
    card: "oklch(0.985 0 0)",
    border: "oklch(0.92 0.004 286.32)",
    text: "oklch(0.552 0.016 285.938)",
    accent: "oklch(0.60 0.13 163)",
  },
  {
    value: "dark",
    label: "Dark",
    icon: MoonIcon,
    page: "oklch(0.141 0.005 285.823)",
    card: "oklch(0.21 0.006 285.885)",
    border: "oklch(0.32 0.006 286)",
    text: "oklch(0.705 0.015 286.067)",
    accent: "oklch(0.70 0.15 162)",
  },
]

export type CanvasSettingsProps = {
  showMiniMap: boolean
  onShowMiniMapChange: (show: boolean) => void
  showControls: boolean
  onShowControlsChange: (show: boolean) => void
  background: BackgroundStyle
  onBackgroundChange: (background: BackgroundStyle) => void
  snapToGrid: boolean
  onSnapToGridChange: (snap: boolean) => void
}

// Mirrors what React Flow's own Background draws, so the swatch is the
// pattern rather than a drawing of it.
const PATTERNS: Record<BackgroundVariant, React.ReactNode> = {
  [BackgroundVariant.Dots]: (
    <circle cx={1} cy={1} r={0.9} fill="currentColor" />
  ),
  [BackgroundVariant.Lines]: (
    <path d="M8 0 V8 M0 8 H8" stroke="currentColor" strokeWidth={0.7} />
  ),
  [BackgroundVariant.Cross]: (
    <path d="M4 2.6 v2.8 M2.6 4 h2.8" stroke="currentColor" strokeWidth={0.7} />
  ),
}

function BackgroundPreview({ variant }: { variant: BackgroundStyle }) {
  const patternId = `background-pattern-${variant}`

  return (
    <svg
      aria-hidden
      className="h-[72px] w-full rounded-md border border-border bg-background text-muted-foreground"
    >
      {variant !== "none" && (
        <>
          <pattern
            id={patternId}
            width={8}
            height={8}
            patternUnits="userSpaceOnUse"
          >
            {PATTERNS[variant]}
          </pattern>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </>
      )}
    </svg>
  )
}

function ThemePreview({ theme }: { theme: (typeof THEMES)[number] }) {
  return (
    <span
      className="flex h-[72px] items-center justify-center rounded-md border"
      style={{
        backgroundColor: theme.page,
        backgroundImage: `radial-gradient(color-mix(in oklch, ${theme.text} 40%, transparent) 0.5px, transparent 0.5px)`,
        backgroundSize: "6px 6px",
        borderColor: theme.border,
      }}
    >
      <MiniTable theme={theme} />
      <span
        className="h-px w-4 shrink-0"
        style={{ background: theme.accent }}
        aria-hidden
      />
      <MiniTable theme={theme} />
    </span>
  )
}

function MiniTable({ theme }: { theme: (typeof THEMES)[number] }) {
  return (
    <span
      className="flex w-11 shrink-0 flex-col gap-[3px] rounded-sm border p-[5px]"
      style={{ background: theme.card, borderColor: theme.border }}
    >
      <span
        className="h-[3px] rounded-full"
        style={{ background: theme.accent }}
      />
      {[1, 0.75, 0.55].map((width) => (
        <span
          key={width}
          className="h-[3px] rounded-full opacity-50"
          style={{ background: theme.text, width: `${width * 100}%` }}
        />
      ))}
    </span>
  )
}

function Row({
  htmlFor,
  label,
  hint,
  stacked,
  children,
}: {
  htmlFor?: string
  label: string
  hint: string
  stacked?: boolean
  children: React.ReactNode
}) {
  const text = (
    <span className="flex flex-col gap-0.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="text-xs font-normal text-muted-foreground">{hint}</span>
    </span>
  )

  return (
    <div
      className={cn(
        "flex py-3.5",
        stacked ? "flex-col gap-3" : "items-center justify-between gap-6"
      )}
    >
      {htmlFor ? (
        <Label htmlFor={htmlFor} className="cursor-pointer">
          {text}
        </Label>
      ) : (
        text
      )}
      <div
        className={cn(
          "flex items-center gap-2",
          stacked ? "w-full" : "shrink-0"
        )}
      >
        {children}
      </div>
    </div>
  )
}

function SwitchRow({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  hint: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Row htmlFor={id} label={label} hint={hint}>
      {/* The id lands on Base UI's hidden input, which is what makes the
          label clickable. The visible control needs its own name. */}
      <Switch
        id={id}
        aria-label={label}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </Row>
  )
}

export function CanvasSettings({
  showMiniMap,
  onShowMiniMapChange,
  showControls,
  onShowControlsChange,
  background,
  onBackgroundChange,
  snapToGrid,
  onSnapToGridChange,
}: CanvasSettingsProps) {
  const { zoomIn, zoomOut, zoomTo, fitView } = useReactFlow()
  const store = useStoreApi()
  const theme = useTheme()
  const [tab, setTab] = useState<TabId>("appearance")

  const zoom = useStore((state) => state.transform[2])
  const minZoom = useStore((state) => state.minZoom)
  const maxZoom = useStore((state) => state.maxZoom)
  // React Flow has no single locked flag. The three permissions always move
  // together here, so any one of them answers for the group.
  const locked = useStore((state) => !state.nodesDraggable)

  const setLocked = (next: boolean) => {
    store.setState({
      nodesDraggable: !next,
      nodesConnectable: !next,
      elementsSelectable: !next,
    })
  }

  const percent = Math.round(zoom * 100)
  const activeTab = TABS.find((item) => item.id === tab)!

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Canvas settings"
            className="nodrag nopan"
          >
            <SettingsIcon />
          </Button>
        }
      />
      {/* The row has to be capped, or it grows past the dialog and the h-full
          inside it measures against the overflow rather than the dialog. */}
      <DialogContent className="h-[600px] max-h-[85vh] grid-rows-[minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <Tabs
          orientation="vertical"
          value={tab}
          onValueChange={(value) => setTab(value as TabId)}
          className="h-full gap-0"
        >
          <div className="flex w-52 shrink-0 flex-col border-r border-border bg-muted/40 p-3">
            <span className="px-2.5 pt-1 pb-2 text-xs font-medium text-muted-foreground">
              Settings
            </span>
            <TabsList className="w-full items-stretch gap-0.5 rounded-none bg-transparent p-0">
              {TABS.map((item) => (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  className="h-auto flex-none gap-2.5 px-2.5 py-2 font-normal data-active:font-medium"
                >
                  <item.icon />
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* min-h-0 stops the flex item from growing to fit its content,
              which is what lets it scroll instead. */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <DialogTitle className="pr-10 pb-1 text-base">
              {activeTab.label}
            </DialogTitle>

            <TabsContent value="appearance">
              <div className="flex flex-col divide-y divide-border">
                <Row stacked label="Theme" hint="Applies across the app">
                  <RadioGroup
                    value={theme}
                    onValueChange={(value) => setTheme(value as Theme)}
                    className="grid-cols-2"
                  >
                    {THEMES.map((item) => (
                      <Label
                        key={item.value}
                        htmlFor={`theme-${item.value}`}
                        className="flex cursor-pointer flex-col items-stretch gap-2 rounded-lg border border-border p-2 transition hover:bg-muted/50 has-data-checked:border-primary has-data-checked:ring-1 has-data-checked:ring-primary"
                      >
                        <ThemePreview theme={item} />
                        <span className="flex items-center gap-2 px-0.5">
                          <RadioGroupItem
                            id={`theme-${item.value}`}
                            value={item.value}
                          />
                          <item.icon className="size-3.5 text-muted-foreground" />
                          {item.label}
                        </span>
                      </Label>
                    ))}
                  </RadioGroup>
                </Row>
                <Row
                  stacked
                  label="Background"
                  hint="Pattern behind the tables"
                >
                  <RadioGroup
                    value={background}
                    onValueChange={(value) =>
                      onBackgroundChange(value as BackgroundStyle)
                    }
                    className="grid-cols-2"
                  >
                    {BACKGROUNDS.map((item) => (
                      <Label
                        key={item.value}
                        htmlFor={`background-${item.value}`}
                        className="flex cursor-pointer flex-col items-stretch gap-2 rounded-lg border border-border p-2 transition hover:bg-muted/50 has-data-checked:border-primary has-data-checked:ring-1 has-data-checked:ring-primary"
                      >
                        <BackgroundPreview variant={item.value} />
                        <span className="flex items-center gap-2 px-0.5">
                          <RadioGroupItem
                            id={`background-${item.value}`}
                            value={item.value}
                          />
                          {item.label}
                        </span>
                      </Label>
                    ))}
                  </RadioGroup>
                </Row>
              </div>
            </TabsContent>

            <TabsContent value="canvas">
              <div className="flex flex-col divide-y divide-border">
                <Row label="Zoom" hint="Drag or step through the range">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Zoom out"
                    disabled={zoom <= minZoom}
                    onClick={() => void zoomOut({ duration: ZOOM_DURATION })}
                  >
                    <MinusIcon />
                  </Button>
                  {/* The slider stretches to its parent, so the width has to
                      come from a box around it. */}
                  <div className="w-32">
                    <Slider
                      aria-label="Zoom level"
                      min={minZoom * 100}
                      max={maxZoom * 100}
                      value={[percent]}
                      onValueChange={(value) =>
                        zoomTo((Array.isArray(value) ? value[0] : value) / 100)
                      }
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Zoom in"
                    disabled={zoom >= maxZoom}
                    onClick={() => void zoomIn({ duration: ZOOM_DURATION })}
                  >
                    <PlusIcon />
                  </Button>
                  <span className="min-w-11 text-right text-sm tabular-nums">
                    {percent}%
                  </span>
                </Row>
                <Row label="Fit to screen" hint="Frame every table at once">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void fitView({ duration: FIT_DURATION })}
                  >
                    <MaximizeIcon />
                    Fit
                  </Button>
                </Row>
                <SwitchRow
                  id="setting-mini-map"
                  label="Mini-map"
                  hint="Overview in the bottom-right corner"
                  checked={showMiniMap}
                  onCheckedChange={onShowMiniMapChange}
                />
                <SwitchRow
                  id="setting-controls"
                  label="Control bar"
                  hint="Zoom buttons on the canvas itself"
                  checked={showControls}
                  onCheckedChange={onShowControlsChange}
                />
              </div>
            </TabsContent>

            <TabsContent value="interaction">
              <div className="flex flex-col divide-y divide-border">
                <SwitchRow
                  id="setting-lock"
                  label="Lock canvas"
                  hint="Stop moving and selecting tables"
                  checked={locked}
                  onCheckedChange={setLocked}
                />
                <SwitchRow
                  id="setting-snap"
                  label="Snap to grid"
                  hint="Line tables up as you drag them"
                  checked={snapToGrid}
                  onCheckedChange={onSnapToGridChange}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
