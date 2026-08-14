import { expect, test } from "@playwright/test";

test("driver can open the booking map after demo login", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Driver" }).click();
  await expect(page.getByRole("heading", { name: "Parking dashboard" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Find a parking zone" })).toBeVisible();
  await page.getByRole("button", { name: "Skip tutorial" }).click();
  await page.getByRole("link", { name: "Map", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Choose a parking zone" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Map", exact: true })).toHaveAttribute("aria-current", "page");
});

test("warden can open dashboard and scanner", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Warden" }).click();
  await expect(page.getByRole("heading", { name: "Parking dashboard" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Review the live dashboard" })).toBeVisible();
  await page.getByRole("button", { name: "Skip tutorial" }).click();
  await page.getByRole("link", { name: "Open scanner", exact: true }).click();
  await expect(page.getByRole("heading", { name: "QR scanner" })).toBeVisible();
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
