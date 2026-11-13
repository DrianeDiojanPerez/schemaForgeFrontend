import { expect, test } from "vitest";

import { accessIn, memberIn, shareRoleIn, shareRoleOut, sharedSchemaIn } from "./lib/wire";

test("a share role loses its proto prefix on the way in and gets it back on the way out", () => {
	expect(shareRoleIn("SHARE_ROLE_EDITOR")).toBe("editor");
	expect(shareRoleIn("SHARE_ROLE_VIEWER")).toBe("viewer");
	expect(shareRoleOut("editor")).toBe("SHARE_ROLE_EDITOR");
	expect(shareRoleOut("viewer")).toBe("SHARE_ROLE_VIEWER");
});

test("a schema with no access named is the drawer's own", () => {
	expect(accessIn("")).toBe("owner");
	expect(accessIn("owner")).toBe("owner");
	expect(accessIn("editor")).toBe("editor");
	expect(accessIn("viewer")).toBe("viewer");
});

test("a member the directory no longer names keeps an empty person rather than none", () => {
	const member = memberIn({
		user: null,
		role: "SHARE_ROLE_VIEWER",
		sharedBy: "owner-id",
		createdAt: "2026-11-04T00:00:00Z",
		updatedAt: "2026-11-04T00:00:00Z",
	});

	expect(member.user).toEqual({ id: "", email: "", name: "", avatarUrl: undefined });
	expect(member.role).toBe("viewer");
});

test("a shared schema carries its summary, the role and who owns it", () => {
	const shared = sharedSchemaIn({
		schema: {
			id: "s1",
			name: "shop",
			description: "",
			entityCount: 3,
			relationshipCount: 2,
			createdAt: "",
			updatedAt: "",
		},
		role: "SHARE_ROLE_EDITOR",
		owner: { id: "u1", email: "ada@example.com", name: "Ada", avatarUrl: "" },
	});

	expect(shared.schema.name).toBe("shop");
	expect(shared.role).toBe("editor");
	expect(shared.owner.name).toBe("Ada");
	expect(() => sharedSchemaIn({ schema: null, role: "SHARE_ROLE_VIEWER", owner: null })).toThrow();
});
