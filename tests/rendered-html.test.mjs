import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../out/", import.meta.url);

test("exports only the avatar page for Cloudflare Pages", async () => {
  const avatarHtml = await readFile(new URL("index.html", outputRoot), "utf8");

  assert.match(
    avatarHtml,
    /<title>Whitecaplol&#x27;s Avatar Customizer<\/title>/,
  );
  assert.match(avatarHtml, /href="\/favicon\.svg"/);
  assert.doesNotMatch(avatarHtml, /href="\/banner"/);

  assert.match(avatarHtml, /Become Papa whitecaplol/);
  assert.match(avatarHtml, /Background start/);
  assert.match(avatarHtml, /Left cap end/);
  assert.match(avatarHtml, /Gradient angle/);

  await assert.rejects(access(new URL("banner.html", outputRoot)));
});

test("copies required artwork into the static export", async () => {
  await Promise.all([
    access(new URL("favicon.svg", outputRoot)),
    access(new URL("og.png", outputRoot)),
    access(new URL("examples/whitecaplol-son.svg", outputRoot)),
    access(new URL("banners/discord-original.png", outputRoot)),
    access(new URL("banners/discord-vector-mark.svg", outputRoot)),
  ]);
});
