import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decryptInstagramToken, encryptInstagramToken } from "../server/instagram-crypto";

const secret = "secreto-de-prueba-de-mas-de-treinta-y-dos-bytes";

describe("Token privado de Instagram", () => {
  it("guarda el token cifrado y lo recupera solo con el secreto correcto", () => {
    const token = "IGAA-token-de-prueba-largo-y-privado";
    const stored = encryptInstagramToken(token, "conexion-1", 12345, secret);
    assert.equal(JSON.stringify(stored).includes(token), false);
    assert.equal(decryptInstagramToken(stored, secret), token);
    assert.equal(decryptInstagramToken(stored, `${secret}-distinto`), null);
  });

  it("rechaza modificaciones del contenido cifrado", () => {
    const stored = encryptInstagramToken("IGAA-otro-token", "conexion-2", 12345, secret);
    assert.equal(decryptInstagramToken({ ...stored, token: "AA" }, secret), null);
  });
});
