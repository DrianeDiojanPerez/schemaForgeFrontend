export type PostgresTypeGroup = {
  label: string
  types: string[]
}

// Values are stored on the column as-is. The SQL exporters uppercase them,
// so keep them lowercase here.
export const postgresTypeGroups: PostgresTypeGroup[] = [
  {
    label: "Numeric",
    types: [
      "smallint",
      "integer",
      "bigint",
      "decimal",
      "numeric",
      "real",
      "double precision",
      "smallserial",
      "serial",
      "bigserial",
      "money",
    ],
  },
  {
    label: "Character",
    types: ["char", "varchar", "text", "name"],
  },
  {
    label: "Binary",
    types: ["bytea"],
  },
  {
    label: "Date / Time",
    types: ["date", "time", "timetz", "timestamp", "timestamptz", "interval"],
  },
  {
    label: "Boolean",
    types: ["boolean"],
  },
  {
    label: "UUID",
    types: ["uuid"],
  },
  {
    label: "JSON",
    types: ["json", "jsonb"],
  },
  {
    label: "XML",
    types: ["xml"],
  },
  {
    label: "Network Address",
    types: ["cidr", "inet", "macaddr", "macaddr8"],
  },
  {
    label: "Bit String",
    types: ["bit", "varbit"],
  },
  {
    label: "Text Search",
    types: ["tsvector", "tsquery"],
  },
  {
    label: "Geometric",
    types: ["point", "line", "lseg", "box", "path", "polygon", "circle"],
  },
  {
    label: "Range",
    types: [
      "int4range",
      "int8range",
      "numrange",
      "tsrange",
      "tstzrange",
      "daterange",
    ],
  },
  {
    label: "Array",
    types: ["array"],
  },
  {
    label: "Object Identifier",
    types: ["oid", "pg_lsn"],
  },
]

export const allPostgresTypes: string[] = postgresTypeGroups.flatMap(
  (g) => g.types
)
