export function fileSlug(name: string): string {
	return name.trim().toLowerCase().replace(/\s+/g, "_") || "schema";
}

export function downloadText(file: string, text: string, type = "text/plain") {
	const url = URL.createObjectURL(new Blob([text], { type }));
	const link = document.createElement("a");

	link.href = url;
	link.download = file;
	link.click();

	URL.revokeObjectURL(url);
}
