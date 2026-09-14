import {
  ArrowBigLeftIcon,
  ArrowBigRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleArrowLeftIcon,
  CircleArrowRightIcon,
  MoveLeftIcon,
  MoveRightIcon,
  SquareArrowLeftIcon,
  SquareArrowRightIcon,
} from "lucide-react"

/**
 * The arrow a column shows on hover to say a relationship can be dragged from
 * it. They are drawn at nine pixels, where a filled shape holds up better than
 * a thin stroke, which is why the heavier ones are worth offering at all.
 */
export const CONNECTOR_ARROWS = [
  {
    id: "arrow",
    label: "Arrow",
    left: ArrowLeftIcon,
    right: ArrowRightIcon,
    filled: false,
  },
  {
    id: "block",
    label: "Block",
    left: ArrowBigLeftIcon,
    right: ArrowBigRightIcon,
    filled: false,
  },
  {
    id: "block-fill",
    label: "Block fill",
    left: ArrowBigLeftIcon,
    right: ArrowBigRightIcon,
    filled: true,
  },
  {
    id: "chevron",
    label: "Chevron",
    left: ChevronLeftIcon,
    right: ChevronRightIcon,
    filled: false,
  },
  {
    id: "line",
    label: "Line",
    left: MoveLeftIcon,
    right: MoveRightIcon,
    filled: false,
  },
  {
    id: "circle",
    label: "Circle",
    left: CircleArrowLeftIcon,
    right: CircleArrowRightIcon,
    filled: false,
  },
  {
    id: "square",
    label: "Square",
    left: SquareArrowLeftIcon,
    right: SquareArrowRightIcon,
    filled: false,
  },
] as const

export type ConnectorArrow = (typeof CONNECTOR_ARROWS)[number]["id"]

export const DEFAULT_CONNECTOR_ARROW: ConnectorArrow = "arrow"

export function connectorArrows(id: ConnectorArrow) {
  return (
    CONNECTOR_ARROWS.find((arrow) => arrow.id === id) ?? CONNECTOR_ARROWS[0]
  )
}
