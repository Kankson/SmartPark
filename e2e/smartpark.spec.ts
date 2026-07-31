import { expect, test } from "@playwright/test";

test("driver can open the booking map after demo login", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Driver" }).click();
  await expect(page.getByRole("heading", { name: "Parking dashboard" })).toBeVisible();
  await page.getByRole("link", { name: "Map" }).click();
  await expect(page.getByRole("heading", { name: "Choose a parking zone" })).toBeVisible();
});

test("warden can open dashboard and scanner", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Warden" }).click();
  await expect(page.getByRole("heading", { name: "Parking dashboard" })).toBeVisible();
  await page.getByRole("link", { name: "Scanner" }).click();
  await expect(page.getByRole("heading", { name: "QR scanner" })).toBeVisible();
});
