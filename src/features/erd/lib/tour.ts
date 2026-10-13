export const TOUR = {
	sidebarToggle: "tour-sidebar-toggle",
	schemaPicker: "tour-schema-picker",
	search: "tour-search",
	tableList: "tour-table-list",
	toolbar: "tour-toolbar",
	canvas: "tour-canvas",
} as const;

/** The DOM id a table's card carries, so a tour step can point at it. */
export const nodeAnchor = (nodeId: string) => `node-${nodeId}`;
