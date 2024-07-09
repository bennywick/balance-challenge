import { test, expect } from "@playwright/test";
import { Page } from "@playwright/test";

test("find the fake gold bar", async ({ page }) => {
	const coinsEl = page.locator('.coins button')
	await page.goto("http://sdetchallenge.fetch.com/");
	// Returns a list of coins with their text contents as strings. ex: ['0', '1', '2', '4']
	const coinsArray = await coinsEl.allInnerTexts()
	// Set the initial left bowl and right bowl. This allows for dynamic inputs.
	const leftBowl = coinsArray.slice(0, Math.floor(coinsArray.length / 2));
	const rightBowl = coinsArray.slice(Math.floor(coinsArray.length / 2), coinsArray.length - (coinsArray.length % 2));
    const goldIndex = await findGoldIndex(page, leftBowl, rightBowl, coinsArray.length);
	await clickAnswer(page, goldIndex)
	await printWeighings(page, goldIndex)
});

async function findGoldIndex(page: Page, leftBowl, rightBowl, lastIndex?) {
	const possibleAnswers = [...leftBowl, ...rightBowl]
	await fillBowl(page, 'left', leftBowl);
	await fillBowl(page, 'right', rightBowl);
	await clickWeigh(page);

	const result = await evaluateResult(page);
	
	if (result === 'equal') {
		// We got lucky! Gold bar is at the last index.
		return lastIndex;
	} else if (possibleAnswers.length === 2) {
		// Last weighing for final two
		await fillBowl(page, 'left', leftBowl);
		await fillBowl(page, 'right', rightBowl);
		return await evaluateResult(page) === 'left' ? possibleAnswers[0] : possibleAnswers[1]
	}
	else {
		await clickReset(page);
        // Determine which side to split further
        let nextLeftBowl, nextRightBowl;
        if (result === 'left') {
            nextLeftBowl = leftBowl.slice(0, Math.ceil(leftBowl.length / 2));
            nextRightBowl = leftBowl.slice(Math.ceil(leftBowl.length / 2));
        } else {
            nextLeftBowl = rightBowl.slice(0, Math.ceil(rightBowl.length / 2));
            nextRightBowl = rightBowl.slice(Math.ceil(rightBowl.length / 2));
        }
		return findGoldIndex(page, nextLeftBowl, nextRightBowl);
	}
}

async function fillBowl(page: Page, bowlSide: string, values: Array<string>) {
	for (let i = 0; i < values.length; i++) {
		await page.locator(`input[data-side="${bowlSide}"][data-index="${i}"]`).fill(values[i])
	}
}

async function clickWeigh(page: Page) {
	await page.getByRole('button', { name: 'Weigh' }).click()
}

async function clickReset(page: Page, ) {
	await page.getByRole('button', { name: 'Reset' }).click()
}

async function clickAnswer(page: Page, answer: any) {
	page.on('dialog', dialog => {
		const message = dialog.message()
		console.log('Dialog Message: ', message)
		expect(message).toBe('Yay! You find it!')
		dialog.accept()
	})
	await page.locator('.coins').getByRole('button', { name: answer }).click()
}

async function evaluateResult(page: Page) {
	await expect(page.locator('text=?')).toBeHidden()
	const result = await page.locator('.result button').innerText()
	switch (result) {
		case '>':
			return 'right'
		case '<':
			return 'left'
		case '=':
			return 'equal'
	}
}

async function printWeighings(page: Page, goldIndex) {
	const weighings = await page.locator('.game-info li').all()
	console.log('* * * * * RESULTS * * * * *')
	console.log(`Number of weighings: ${weighings.length}`)
	console.log(`Index of fake gold bar: ${goldIndex}`)
	for (let i = 0; i < weighings.length; i++) {
		console.log(await weighings[i].textContent())
	}
	console.log('* * * * * * * * * * * * * *')

}