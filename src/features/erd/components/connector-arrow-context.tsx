import { createContext, use } from "react"

import {
  DEFAULT_CONNECTOR_ARROW,
  connectorArrows,
} from "../lib/connector-arrows"
import type { ConnectorArrow } from "../lib/connector-arrows"

/**
 * A context rather than node data, for the same reason the problems are: the
 * setting belongs to the canvas, and writing it onto every node would rewrite
 * each one whenever it changed.
 */
const ConnectorArrowContext = createContext<ConnectorArrow>(
  DEFAULT_CONNECTOR_ARROW
)

export const ConnectorArrowProvider = ConnectorArrowContext.Provider

export function useConnectorArrows() {
  return connectorArrows(use(ConnectorArrowContext))
}
