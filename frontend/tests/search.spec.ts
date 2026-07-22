import { test } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto(
    "https://frontend.politeglacier-fb6c27b1.canadacentral.azurecontainerapps.io/search",
  );
  await page
    .getByRole("textbox", { name: "Search productions by title," })
    .click();
  await page
    .getByRole("textbox", { name: "Search productions by title," })
    .fill("butter");
  await page
    .getByRole("textbox", { name: "Search productions by title," })
    .press("Enter");
  await page
    .getByRole("link", { name: "Madama Butterfly 2025-2026 ·" })
    .click();
  await page.getByRole("link", { name: "📄 View Program PDF" }).click();
  await page.getByRole("link", { name: "Sharpless" }).click();
  await page.getByRole("link", { name: "Madama Butterfly" }).click();
  await page.getByText("Phillip Addis").click();
  await page.getByText("Phillip Addis").dblclick();
  await page.goto(
    "https://frontend.politeglacier-fb6c27b1.canadacentral.azurecontainerapps.io/productions/1",
  );
  await page.getByRole("link", { name: "Addis, Phillip" }).click();
  await page.getByRole("link", { name: "Reports" }).click();
  await page.getByRole("button", { name: "Season" }).click();
  await page.getByRole("option", { name: "-2026" }).locator("span").click();
  await page.getByRole("button", { name: "Contributor Type" }).click();
  await page.locator("li:nth-child(2) > ._checkbox_13uno_463").click();
  await page.getByRole("button", { name: "List results" }).click();
  await page.getByRole("button", { name: "Run Report →" }).click();
  await page.getByRole("button", { name: "Export PDF" }).click();
});
