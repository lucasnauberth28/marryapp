import { test } from "node:test";
import assert from "node:assert/strict";
import { isOptimizableImage, storageRemotePattern } from "../image-source.ts";

const SUPA = "https://abc123.supabase.co";

test("aceita foto do storage público do Supabase", () => {
  assert.equal(isOptimizableImage(`${SUPA}/storage/v1/object/public/gifts/site/a.webp`, SUPA), true);
});

test("recusa link externo, data URL, caminho de outro bucket privado e lixo", () => {
  assert.equal(isOptimizableImage("https://exemplo.com/foto.jpg", SUPA), false);
  assert.equal(isOptimizableImage("data:image/png;base64,AAAA", SUPA), false);
  assert.equal(isOptimizableImage(`${SUPA}/storage/v1/object/sign/x/a.png`, SUPA), false);
  assert.equal(isOptimizableImage("http://abc123.supabase.co/storage/v1/object/public/a.png", SUPA), false);
  assert.equal(isOptimizableImage("não é url", SUPA), false);
  assert.equal(isOptimizableImage(null, SUPA), false);
});

test("sem Supabase configurado nada é otimizado", () => {
  assert.equal(isOptimizableImage(`${SUPA}/storage/v1/object/public/a.png`, undefined), false);
  assert.equal(isOptimizableImage(`${SUPA}/storage/v1/object/public/a.png`, ""), false);
  assert.equal(storageRemotePattern(""), null);
});

test("remotePattern restringe ao caminho público do storage", () => {
  assert.deepEqual(storageRemotePattern(SUPA), {
    protocol: "https",
    hostname: "abc123.supabase.co",
    pathname: "/storage/v1/object/public/**",
  });
});
