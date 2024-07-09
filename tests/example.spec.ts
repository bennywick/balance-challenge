import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
	await page.goto("http://sdetchallenge.fetch.com/");
	const coinsArray = page.locator(".coins");
	await page.pause();
	console.log(coinsArray);
});
