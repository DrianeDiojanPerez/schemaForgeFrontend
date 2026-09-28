export const PROTO_OPTIONS = {
	// Field names arrive as `fromEntityId` rather than `from_entity_id`, which
	// is what the browser types expect.
	keepCase: false,
	// Enum names rather than magic numbers.
	enums: String,
	longs: Number,
	defaults: true,
	// Off: proto3 optional fields are synthetic oneofs, and the markers they add
	// (`_length` next to `length`) are noise. Outbound oneofs still encode.
	oneofs: false,
} as const;
