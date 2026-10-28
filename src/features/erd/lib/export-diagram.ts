import type { Rect } from "@xyflow/react";
import { toSvg } from "html-to-image";

/** Clear space round the tables, so nothing sits on the edge of the picture. */
const MARGIN = 48;

const PREFIX = "data:image/svg+xml;charset=utf-8,";

const STYLE_PROPERTIES = [
	"display",
	"position",
	"top",
	"right",
	"bottom",
	"left",
	"inset",
	"width",
	"height",
	"min-width",
	"min-height",
	"max-width",
	"max-height",
	"margin-top",
	"margin-right",
	"margin-bottom",
	"margin-left",
	"padding-top",
	"padding-right",
	"padding-bottom",
	"padding-left",
	"border-top-width",
	"border-right-width",
	"border-bottom-width",
	"border-left-width",
	"border-top-style",
	"border-right-style",
	"border-bottom-style",
	"border-left-style",
	"border-top-color",
	"border-right-color",
	"border-bottom-color",
	"border-left-color",
	"border-top-left-radius",
	"border-top-right-radius",
	"border-bottom-right-radius",
	"border-bottom-left-radius",
	"box-sizing",
	"box-shadow",
	"outline-width",
	"outline-style",
	"outline-color",
	"outline-offset",
	"background-color",
	"background-image",
	"background-size",
	"background-position",
	"background-repeat",
	"color",
	"opacity",
	"visibility",
	"pointer-events",
	"overflow",
	"overflow-x",
	"overflow-y",
	"z-index",
	"font-family",
	"font-size",
	"font-weight",
	"font-style",
	"font-variant-numeric",
	"line-height",
	"letter-spacing",
	"text-align",
	"text-transform",
	"text-decoration-line",
	"text-overflow",
	"white-space",
	"word-break",
	"overflow-wrap",
	"vertical-align",
	"tab-size",
	"flex-direction",
	"flex-wrap",
	"flex-grow",
	"flex-shrink",
	"flex-basis",
	"order",
	"align-items",
	"align-self",
	"align-content",
	"justify-content",
	"justify-items",
	"justify-self",
	"gap",
	"row-gap",
	"column-gap",
	"grid-template-columns",
	"grid-template-rows",
	"grid-column-start",
	"grid-column-end",
	"grid-row-start",
	"grid-row-end",
	"transform",
	"transform-origin",
	"translate",
	"scale",
	"rotate",
	"fill",
	"fill-opacity",
	"stroke",
	"stroke-width",
	"stroke-dasharray",
	"stroke-linecap",
	"stroke-linejoin",
	"stroke-opacity",
	"clip-path",
	"filter",
	"backdrop-filter",
	"mix-blend-mode",
	"object-fit",
	"aspect-ratio",
	"list-style-type",
	"table-layout",
	"border-collapse",
	"border-spacing",
	"text-indent",
];

/**
 * The canvas as an SVG document, framed round the tables at the scale they
 * are drawn at rather than at whatever zoom the window happens to be on.
 *
 * It is the drawn canvas that is captured, so the picture is what the person
 * sees: the same table cards, colours, lines, labels and background. Only
 * what is there for editing is left out.
 */
export async function diagramSvg(flow: HTMLElement, bounds: Rect, zoom: number): Promise<string> {
	const viewport = flow.querySelector<HTMLElement>(".react-flow__viewport");

	if (!viewport || bounds.width === 0) throw new Error("There is nothing on the canvas to export.");

	const width = Math.ceil(bounds.width + MARGIN * 2);
	const height = Math.ceil(bounds.height + MARGIN * 2);
	const shift = { x: MARGIN - bounds.x, y: MARGIN - bounds.y };

	// Hidden on the live canvas for the capture, not filtered out of the copy,
	// so the cards close up round what is left instead of keeping the space.
	flow.setAttribute("data-exporting", "");
	await new Promise(requestAnimationFrame);

	let url: string;

	try {
		url = await toSvg(viewport, {
			width,
			height,
			skipFonts: true,
			// Only what shapes the picture. Left to itself the capture writes all
			// three hundred computed properties onto every element.
			includeStyleProperties: STYLE_PROPERTIES,
			// Hidden above so the layout closes up; dropped here so the copy
			// does not carry them invisibly.
			filter: (element) =>
				!(
					element instanceof Element &&
					(element.classList.contains("react-flow__handle") ||
						["chrome", "blank"].includes(element.getAttribute("data-export") ?? ""))
				),
			style: {
				width: `${width}px`,
				height: `${height}px`,
				transform: `translate(${shift.x}px, ${shift.y}px) scale(1)`,
			},
		});
	} finally {
		flow.removeAttribute("data-exporting");
	}

	const picture = withVariables(decodeURIComponent(url.slice(PREFIX.length)), flow);

	return picture.replace(/^(<svg[^>]*>)/, `$1${backdrop(flow, shift, zoom)}`);
}

/** How far into a tile the first line falls, as a positive offset. */
const phase = (shift: number, gap: number) => ((shift % gap) + gap) % gap;

/**
 * The canvas colour, and over it the pattern the person has the canvas on,
 * rebuilt at scale one from the live pattern so the dots line up with the
 * tables the way they do on screen.
 */
function backdrop(flow: HTMLElement, shift: { x: number; y: number }, zoom: number): string {
	const base = getComputedStyle(flow).getPropertyValue("--canvas").trim() || "#ffffff";
	const floor = `<rect width="100%" height="100%" fill="${base}"/>`;

	const live = flow.querySelector<SVGPatternElement>(".react-flow__background pattern");
	const mark = live?.firstElementChild;
	if (!live || !mark) return floor;

	const gap = Number(live.getAttribute("width")) / zoom;
	const paint = getComputedStyle(mark);
	const opacity = getComputedStyle(live.ownerSVGElement ?? live).opacity;
	let tile: string;

	if (mark.tagName === "circle") {
		const r = Number(mark.getAttribute("r")) / zoom;
		tile = `<circle cx="${r}" cy="${r}" r="${r}" fill="${paint.fill}"/>`;
	} else {
		const d = (mark.getAttribute("d") ?? "").replace(/-?\d+(\.\d+)?/g, (n) =>
			String(Number(n) / zoom),
		);
		tile = `<path d="${d}" fill="none" stroke="${paint.stroke}" stroke-width="${Number.parseFloat(paint.strokeWidth) / zoom}"/>`;
	}

	return `${floor}<defs><pattern id="canvas-pattern" patternUnits="userSpaceOnUse" width="${gap}" height="${gap}" x="${phase(shift.x, gap)}" y="${phase(shift.y, gap)}">${tile}</pattern></defs><rect width="100%" height="100%" fill="url(#canvas-pattern)" opacity="${opacity}"/>`;
}

/**
 * The lines and markers are coloured through custom properties, and those
 * are not among the properties the capture copies. Each one the picture
 * uses is read off the canvas and set on the outermost element, where
 * everything below inherits it.
 */
function withVariables(svg: string, flow: HTMLElement): string {
	const names = new Set([...svg.matchAll(/var\((--[\w-]+)/g)].map((match) => match[1]));
	if (names.size === 0) return svg;

	const computed = getComputedStyle(flow);
	const values = [...names]
		.map((name) => [name, computed.getPropertyValue(name).trim()])
		.filter(([, value]) => value !== "")
		.map(([name, value]) => `${name}: ${value}`)
		.join("; ");

	return svg.replace(/ style="/, ` style="${values}; `);
}
