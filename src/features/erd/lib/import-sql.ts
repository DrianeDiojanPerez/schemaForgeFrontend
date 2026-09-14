import type {
  ColumnIndex,
  ErdEdge,
  ErdNode,
  RelationshipType,
  SchemaAccent,
  ErdSchemaNode,
  TableColumn,
  ErdTableNode,
} from "../types/erd"

/**
 * Parse SQL produced by buildSQL. The directives it leaves behind carry the
 * layout, so a diagram exported and imported again comes back in the same
 * shape:
 *
 *   -- @node id=table-123 x=100 y=200
 *   -- Table: public.users
 *   CREATE TABLE public.users (
 *     -- @col id=col-abc
 *     id UUID PRIMARY KEY,
 *     ...
 *   );
 *
 *   -- @edge id=e1 type=one-to-many sourceHandle=col-abc-right targetHandle=col-xyz-left
 *   ALTER TABLE public.orders
 *     ADD CONSTRAINT fk_orders_user_id
 *     FOREIGN KEY (user_id)
 *     REFERENCES public.users(id)
 *     ON DELETE CASCADE;
 *
 * SQL without the directives still imports, it just lands on a generated
 * grid instead of the saved positions.
 */
export type ParsedSQL = {
  nodes: ErdNode[]
  edges: ErdEdge[]
}

const NODE_RE =
  /^--\s*@node\s+id=(\S+)\s+x=([-\d.]+)\s+y=([-\d.]+)(?:\s+parent=(\S+))?/
const COL_RE = /^--\s*@col\s+id=(\S+)/
const EDGE_RE =
  /^--\s*@edge\s+id=(\S+)\s+type=(\S+)\s+sourceHandle=(\S+)\s+targetHandle=(\S+)/
const SCHEMA_RE =
  /^--\s*@schema\s+id=(\S+)\s+x=([-\d.]+)\s+y=([-\d.]+)\s+w=([-\d.]+)\s+h=([-\d.]+)\s+accent=(\S+)\s+name=(.+)$/
const CREATE_TABLE_RE = /^CREATE\s+TABLE\s+([\w.]+)\s*\(/i
const CREATE_INDEX_RE =
  /^CREATE\s+INDEX\s+(\w+)\s+ON\s+([\w.]+)\s+USING\s+(\w+)\s*\(([^)]+)\)/i
const ALTER_TABLE_RE = /^ALTER\s+TABLE\s+([\w.]+)/i
const REFERENCES_RE = /REFERENCES\s+([\w.]+)/i

const splitQualified = (qualified: string): [string, string] => {
  const parts = qualified.split(".")
  return parts.length >= 2
    ? [parts[0], parts.slice(1).join(".")]
    : ["public", qualified]
}

const stripHandleSide = (handle: string): string =>
  handle.replace(/-(left|right|top|bottom)$/, "")

const randomId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

const parseColumn = (
  rawLine: string,
  pendingId: string | null
): TableColumn | null => {
  const cleaned = rawLine.replace(/,$/, "").trim()
  if (!cleaned) return null

  const tokens = cleaned.split(/\s+/)
  if (tokens.length < 2) return null

  const [name, rawFormat] = tokens
  const upper = cleaned.toUpperCase()

  const isPrimary = /\bPRIMARY\s+KEY\b/.test(upper)
  const isNotNull = /\bNOT\s+NULL\b/.test(upper)
  const isUnique = /\bUNIQUE\b/.test(upper)
  const isIdentity =
    /\bGENERATED\s+(ALWAYS|BY\s+DEFAULT)\s+AS\s+IDENTITY\b/.test(upper)

  return {
    id: pendingId ?? randomId("col"),
    name,
    format: rawFormat.toLowerCase(),
    isPrimary,
    isNullable: !isPrimary && !isNotNull,
    isUnique,
    isIdentity,
  }
}

export const parseSQL = (sql: string): ParsedSQL => {
  const lines = sql.split(/\r?\n/)
  const nodes: ErdNode[] = []
  const edges: ErdEdge[] = []
  const nodesByQualifiedName = new Map<string, ErdTableNode>()
  const pendingIndexes = new Map<string, ColumnIndex[]>()

  let i = 0
  let pendingNodeMeta: {
    id: string
    x: number
    y: number
    parent?: string
  } | null = null
  let pendingEdgeMeta: {
    id: string
    type: RelationshipType
    sourceHandle: string
    targetHandle: string
  } | null = null

  while (i < lines.length) {
    const line = lines[i].trim()

    const schemaMatch = line.match(SCHEMA_RE)
    if (schemaMatch) {
      const [, sid, sx, sy, sw, sh, accent, name] = schemaMatch
      const schemaNode: ErdSchemaNode = {
        id: sid,
        type: "schema",
        position: { x: parseFloat(sx), y: parseFloat(sy) },
        zIndex: -1,
        style: { width: parseFloat(sw), height: parseFloat(sh) },
        dragHandle: ".schema-drag-handle",
        data: { name: name.trim(), accent: accent as SchemaAccent },
      }
      nodes.push(schemaNode)
      i++
      continue
    }

    const nodeMatch = line.match(NODE_RE)
    if (nodeMatch) {
      pendingNodeMeta = {
        id: nodeMatch[1],
        x: parseFloat(nodeMatch[2]),
        y: parseFloat(nodeMatch[3]),
        parent: nodeMatch[4] || undefined,
      }
      i++
      continue
    }

    const edgeMatch = line.match(EDGE_RE)
    if (edgeMatch) {
      pendingEdgeMeta = {
        id: edgeMatch[1],
        type: edgeMatch[2] as RelationshipType,
        sourceHandle: edgeMatch[3],
        targetHandle: edgeMatch[4],
      }
      i++
      continue
    }

    const createMatch = line.match(CREATE_TABLE_RE)
    if (createMatch) {
      const qualified = createMatch[1]
      const [schema, name] = splitQualified(qualified)
      const columns: TableColumn[] = []
      let pendingColId: string | null = null

      let k = i + 1
      while (k < lines.length) {
        const colLine = lines[k].trim()
        if (colLine.startsWith(");") || colLine === ")") break

        const colIdMatch = colLine.match(COL_RE)
        if (colIdMatch) {
          pendingColId = colIdMatch[1]
          k++
          continue
        }
        if (colLine.startsWith("--") || colLine === "") {
          k++
          continue
        }

        const col = parseColumn(colLine, pendingColId)
        if (col) columns.push(col)
        pendingColId = null
        k++
      }

      const meta = pendingNodeMeta
      const node: ErdTableNode = {
        id: meta?.id ?? randomId("table"),
        type: "table",
        position: {
          x: meta?.x ?? 100 + nodes.length * 240,
          y: meta?.y ?? 100,
        },
        ...(meta?.parent
          ? { parentId: meta.parent, extent: "parent" as const }
          : {}),
        data: {
          id: nodes.length,
          schema,
          name,
          columns,
        },
      }
      nodes.push(node)
      nodesByQualifiedName.set(`${schema}.${name}`, node)
      pendingNodeMeta = null
      i = k + 1
      continue
    }

    // Indexes show up before we have parsed their table, so park them and
    // hand them out once every CREATE TABLE has been read.
    const indexMatch = line.match(CREATE_INDEX_RE)
    if (indexMatch) {
      const [, idxName, qualified, idxType, colsRaw] = indexMatch
      const idx: ColumnIndex = {
        name: idxName,
        type: idxType.toLowerCase() as ColumnIndex["type"],
        columns: colsRaw.split(",").map((c) => c.trim()),
      }
      const list = pendingIndexes.get(qualified) ?? []
      list.push(idx)
      pendingIndexes.set(qualified, list)
      i++
      continue
    }

    const alterMatch = line.match(ALTER_TABLE_RE)
    if (alterMatch && pendingEdgeMeta) {
      const targetQualified = alterMatch[1]
      let m = i + 1
      let referencedQualified: string | null = null
      while (m < lines.length) {
        const subline = lines[m].trim()
        if (subline.endsWith(";")) {
          const ref =
            subline.match(REFERENCES_RE) ?? lines[m].match(REFERENCES_RE)
          if (ref) referencedQualified = ref[1]
          break
        }
        const ref = subline.match(REFERENCES_RE)
        if (ref) referencedQualified = ref[1]
        m++
      }

      if (referencedQualified) {
        const sourceNode = nodesByQualifiedName.get(referencedQualified)
        const targetNode = nodesByQualifiedName.get(targetQualified)
        if (sourceNode && targetNode) {
          edges.push({
            id: pendingEdgeMeta.id,
            source: sourceNode.id,
            target: targetNode.id,
            sourceHandle: pendingEdgeMeta.sourceHandle,
            targetHandle: pendingEdgeMeta.targetHandle,
            type: "relationship",
            animated: true,
            data: { relationshipType: pendingEdgeMeta.type },
            style: { stroke: "var(--primary)", strokeWidth: 1.5 },
          })

          const targetColId = stripHandleSide(pendingEdgeMeta.targetHandle)
          const targetCol = targetNode.data.columns.find(
            (c) => c.id === targetColId
          )
          if (targetCol) targetCol.isForeignKey = true
        }
      }
      pendingEdgeMeta = null
      i = m + 1
      continue
    }

    i++
  }

  for (const [qualified, indexes] of pendingIndexes) {
    const node = nodesByQualifiedName.get(qualified)
    if (node) node.data.indexes = indexes
  }

  return { nodes, edges }
}
