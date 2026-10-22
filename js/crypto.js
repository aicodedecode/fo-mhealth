/* FO Mhealth — local encryption.
   Design: AES-256-GCM (authenticated encryption) over the whole data blob,
   key derived from the user's passphrase with PBKDF2-SHA-256 (150,000 iterations).
   Every sealed record carries a SHA-256 fingerprint of its ciphertext, shown to
   the user as the "verified" fingerprint in Settings. AES-GCM's auth tag makes
   tampered or corrupted stores fail closed on unlock instead of loading garbage.
   No keys, no data, leave this device. Ever. */
window.CRYPTO = (function () {
  "use strict";
  var ENC_KEY = "fomhealth.v2.enc";
  var ITER = 150000;
  var cachedKey = null, saltB64 = null, chain = Promise.resolve();
  var te = new TextEncoder(), td = new TextDecoder();

  function b64(buf) {
    var b = new Uint8Array(buf), s = "";
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  }
  function ub64(s) {
    var raw = atob(s), b = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) b[i] = raw.charCodeAt(i);
    return b;
  }
  function randomHex(n) {
    var b = crypto.getRandomValues(new Uint8Array(n)), s = "";
    for (var i = 0; i < b.length; i++) s += ("0" + b[i].toString(16)).slice(-2);
    return s;
  }
  function hex(buf) {
    var b = new Uint8Array(buf), s = "";
    for (var i = 0; i < b.length; i++) s += ("0" + b[i].toString(16)).slice(-2);
    return s;
  }
  function deriveKey(pass, saltBytes) {
    return crypto.subtle.importKey("raw", te.encode(pass), "PBKDF2", false, ["deriveKey"]).then(function (km) {
      return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: saltBytes, iterations: ITER, hash: "SHA-256" },
        km, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    });
  }

  /* Set up a key. existingSaltB64 reuses an old salt so the same passphrase
     can open an existing store (used by change-passphrase verification). */
  function init(pass, existingSaltB64) {
    var salt = existingSaltB64 ? ub64(existingSaltB64) : crypto.getRandomValues(new Uint8Array(16));
    saltB64 = b64(salt);
    return deriveKey(pass, salt).then(function (k) {
      cachedKey = k;
      return saltB64;
    });
  }
  function ready() { return cachedKey !== null; }
  function forget() { cachedKey = null; saltB64 = null; }

  /* Seal the whole state. GCM authenticates: any later tamper breaks open(). */
  function seal(obj) {
    if (!cachedKey) return Promise.reject(new Error("locked"));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv, tagLength: 128 },
      cachedKey, te.encode(JSON.stringify(obj))
    ).then(function (ct) {
      return crypto.subtle.digest("SHA-256", ct).then(function (dg) {
        var store = { v: 2, iter: ITER, salt: saltB64, iv: b64(iv), ct: b64(ct), fp: hex(dg), updated: Date.now() };
        localStorage.setItem(ENC_KEY, JSON.stringify(store));
        return store;
      });
    });
  }

  /* Serialize writes so a rapid burst of saves can never interleave. */
  function write(obj) {
    chain = chain.then(function () { return seal(obj); }).catch(function (e) { console.error("save failed", e); });
    return chain;
  }

  /* Open an existing store. Throws on wrong passphrase or any tamper. */
  function open(store, pass) {
    return deriveKey(pass, ub64(store.salt)).then(function (k) {
      return crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ub64(store.iv), tagLength: 128 },
        k, ub64(store.ct));
    }).then(function (pt) {
      cachedKey = null; saltB64 = store.salt;
      return deriveKey(pass, ub64(store.salt)).then(function (k2) {
        cachedKey = k2;
        return JSON.parse(td.decode(pt));
      });
    });
  }

  function store() {
    try { return JSON.parse(localStorage.getItem(ENC_KEY)); } catch (e) { return null; }
  }
  function hasEnc() { return !!localStorage.getItem(ENC_KEY); }
  function wipe() { localStorage.removeItem(ENC_KEY); forget(); }
  function fingerprint() {
    var s = store();
    return s ? s.fp : null;
  }
  function lastUpdated() {
    var s = store();
    return s ? s.updated : null;
  }
  /* Verify only: recompute the ciphertext fingerprint without decrypting.
     Cheap integrity check you can run anytime, even while locked. */
  function verify() {
    var s = store();
    if (!s) return Promise.resolve(null);
    return crypto.subtle.digest("SHA-256", ub64(s.ct)).then(function (dg) {
      return { ok: hex(dg) === s.fp, stored: s.fp, computed: hex(dg), updated: s.updated };
    });
  }
  return {
    init: init, ready: ready, forget: forget, write: write, open: open,
    store: store, hasEnc: hasEnc, wipe: wipe, fingerprint: fingerprint,
    lastUpdated: lastUpdated, verify: verify, ITER: ITER
  };
})();
