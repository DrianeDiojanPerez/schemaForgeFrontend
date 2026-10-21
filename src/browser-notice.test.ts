import { expect, test } from "vitest";

import { isChromium } from "@/lib/browser-notice";

const CHROME =
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const EDGE = `${CHROME} Edg/130.0.0.0`;
const SAFARI =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
const FIREFOX = "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0";

test("chromium browsers pass and the others do not", () => {
	expect(isChromium(CHROME)).toBe(true);
	expect(isChromium(EDGE)).toBe(true);
	expect(isChromium(SAFARI)).toBe(false);
	expect(isChromium(FIREFOX)).toBe(false);
});
