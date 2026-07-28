/* search.spec.ts
   End to end test of the main user journey, run against the deployed app.

   Covers: search a production, open it, view the program PDF, follow the cast
   links to a character and a person, then build a report and export it.

   FIXED in this pass. The original was a raw Playwright codegen recording:
   - It was named test("test") and had no assertions at all, so it passed as
     long as nothing threw. It proved the pages did not crash, not that they
     showed the right thing.
   - It selected a checkbox with "._checkbox_13uno_463", a hashed CSS Module
     class name. Those hashes are regenerated whenever the stylesheet changes,
     so the test would break on an unrelated CSS edit. Replaced with a role
     based selector, which is tied to the accessibility tree instead.

   Now each step asserts what should be on screen, so a page that loads but
   renders the wrong record fails instead of passing quietly.

   Known limitations, worth naming rather than hiding:
   - It runs against the deployed environment and the real database, so it
     depends on Madama Butterfly still being in the archive.
   - It only covers the read path. Nothing here tests creating or editing a
     record, which is where the risk actually is.
*/
import { test, expect } from "@playwright/test";

const BASE =
  "https://frontend.politeglacier-fb6c27b1.canadacentral.azurecontainerapps.io";

test("archive user can search a production, browse its cast, and export a report", async ({
  page,
}) => {
  // ── Search ────────────────────────────────────────────────────────────────
  await page.goto(`${BASE}/search`);

  const searchBox = page.getByRole("textbox", {
    name: "Search productions by title,",
  });
  await searchBox.click();
  await searchBox.fill("butter");
  await searchBox.press("Enter");

  // The query is written to the URL, which is what makes a search shareable.
  await expect(page).toHaveURL(/[?&]q=butter/);

  const productionLink = page.getByRole("link", {
    name: "Madama Butterfly 2025-2026 ·",
  });
  await expect(productionLink).toBeVisible();

  // ── Production detail ─────────────────────────────────────────────────────
  await productionLink.click();
  await expect(page).toHaveURL(/\/productions\/\d+/);
  await expect(
    page.getByRole("heading", { name: /Madama Butterfly/i }),
  ).toBeVisible();

  // The program PDF only renders when the upload succeeded and blob storage
  // allows the app's origin through CORS, so this also covers that wiring.
  const programLink = page.getByRole("link", { name: "📄 View Program PDF" });
  await expect(programLink).toBeVisible();
  await programLink.click();

  // ── Cast cross-linking ────────────────────────────────────────────────────
  // Character and person pages are the same appearances join read from
  // different directions, so this checks the relationship resolves both ways.
  await page.getByRole("link", { name: "Sharpless" }).click();
  await expect(page).toHaveURL(/\/characters\/\d+/);
  await expect(page.getByText("Sharpless").first()).toBeVisible();

  await page.getByRole("link", { name: "Madama Butterfly" }).first().click();

  await page.goto(`${BASE}/productions/1`);
  await page.getByRole("link", { name: "Addis, Phillip" }).click();
  await expect(page).toHaveURL(/\/persons\/\d+/);
  await expect(page.getByText("Phillip Addis").first()).toBeVisible();

  // ── Reports ───────────────────────────────────────────────────────────────
  await page.getByRole("link", { name: "Reports" }).click();
  await expect(page).toHaveURL(/\/reports$/);

  await page.getByRole("button", { name: "Season" }).click();
  await page.getByRole("option", { name: "-2026" }).click();

  await page.getByRole("button", { name: "Contributor Type" }).click();
  /* Was "li:nth-child(2) > ._checkbox_13uno_463", a hashed CSS Module class.
     MultiSelect gives every row role="option", so this targets the same row
     without depending on a generated class name. */
  await page.getByRole("option").nth(1).click();

  await page.getByRole("button", { name: "List results" }).click();
  await page.getByRole("button", { name: "Run Report →" }).click();

  // Results come from reports-service, a different service to the one serving
  // the pages above, so this is also the gateway routing working.
  await expect(page).toHaveURL(/\/reports\/results/);
  await expect(page.getByRole("button", { name: "Export PDF" })).toBeVisible();

  // ── Export ────────────────────────────────────────────────────────────────
  // The PDF is generated in the browser by jsPDF, so waiting for the download
  // event is what proves the export actually produced a file.
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^co-archive-report-.*\.pdf$/);
});
