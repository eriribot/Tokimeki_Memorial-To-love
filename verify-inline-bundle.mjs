import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const DEFAULT_HTML = String.raw`D:\webgame\tavern_helper_template-main\dist\webgame-ui\index.html`;
const LEGACY_ENTITIES = Object.fromEntries(
  Object.entries({
    AElig: 198, AMP: 38, Aacute: 193, Acirc: 194, Agrave: 192, Aring: 197, Atilde: 195, Auml: 196,
    COPY: 169, Ccedil: 199, ETH: 208, Eacute: 201, Ecirc: 202, Egrave: 200, Euml: 203, GT: 62,
    Iacute: 205, Icirc: 206, Igrave: 204, Iuml: 207, LT: 60, Ntilde: 209, Oacute: 211, Ocirc: 212,
    Ograve: 210, Oslash: 216, Otilde: 213, Ouml: 214, QUOT: 34, REG: 174, THORN: 222, Uacute: 218,
    Ucirc: 219, Ugrave: 217, Uuml: 220, Yacute: 221, aacute: 225, acirc: 226, acute: 180, aelig: 230,
    agrave: 224, amp: 38, aring: 229, atilde: 227, auml: 228, brvbar: 166, ccedil: 231, cedil: 184,
    cent: 162, copy: 169, curren: 164, deg: 176, divide: 247, eacute: 233, ecirc: 234, egrave: 232,
    eth: 240, euml: 235, frac12: 189, frac14: 188, frac34: 190, gt: 62, iacute: 237, icirc: 238,
    iexcl: 161, igrave: 236, iquest: 191, iuml: 239, laquo: 171, lt: 60, macr: 175, micro: 181,
    middot: 183, nbsp: 160, not: 172, ntilde: 241, oacute: 243, ocirc: 244, ograve: 242, ordf: 170,
    ordm: 186, oslash: 248, otilde: 245, ouml: 246, para: 182, plusmn: 177, pound: 163, quot: 34,
    raquo: 187, reg: 174, sect: 167, shy: 173, sup1: 185, sup2: 178, sup3: 179, szlig: 223,
    thorn: 254, times: 215, uacute: 250, ucirc: 251, ugrave: 249, uml: 168, uuml: 252, yacute: 253,
    yen: 165, yuml: 255,
  }).map(([name, codePoint]) => [name, String.fromCodePoint(codePoint)]),
);
const legacyNames = Object.keys(LEGACY_ENTITIES).sort((a, b) => b.length - a.length).join('|');
const legacyEntityPattern = new RegExp(`&(${legacyNames})(;?)`, 'g');
const replacementSpecialPattern = /\$(?:\$|&|`|'|[1-9][0-9]?|<[A-Za-z_$][\w$]*>)/g;

function count(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function simulateReplacement(html) {
  const boundary = new RegExp(`(?<name>${'()'.repeat(99)}<tavern-slot>)`);
  return '__TAVERN_LEFT__<tavern-slot>__TAVERN_RIGHT__'.replace(boundary, html);
}

function decodeLegacyEntities(html) {
  let legacyEntityPrefix = 0;
  const decoded = html
    .replace(legacyEntityPattern, (entity, name, semicolon) => {
      legacyEntityPrefix += semicolon ? 0 : 1;
      return LEGACY_ENTITIES[name];
    })
    .replace(/&#(?:x([\da-f]+)|(\d+));?/gi, (entity, hex, decimal) => {
      const codePoint = Number.parseInt(hex ?? decimal, hex ? 16 : 10);
      return codePoint === 0 || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)
        ? '\ufffd'
        : String.fromCodePoint(codePoint);
    });
  return { decoded, legacyEntityPrefix };
}

function inlineScripts(html) {
  const scripts = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attributes = match[1];
    if (/\bsrc\s*(?:=|\s|$)/i.test(attributes)) continue;
    const typeMatch = attributes.match(/\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const type = typeMatch?.slice(1).find(Boolean) ?? '';
    if (/(?:^|[+/])json(?:\s*;|$)/i.test(type)) continue;
    scripts.push(match[2]);
  }
  return scripts;
}

function syntaxFailureCount(html) {
  return inlineScripts(html).reduce((errors, source, index) => {
    try {
      new vm.Script(source, { filename: `inline-script-${index + 1}.js` });
      return errors;
    } catch {
      return errors + 1;
    }
  }, 0);
}

function analyze(html, checkedPath) {
  const scripts = inlineScripts(html);
  const simulated = simulateReplacement(html);
  const { decoded, legacyEntityPrefix } = decodeLegacyEntities(simulated);
  const transformedScripts = inlineScripts(decoded);
  return {
    legacyEntityPrefix,
    currencySign: count(decoded, /\u00a4/g),
    replacementChar: count(decoded, /\ufffd/g),
    replacementSpecial: count(html, replacementSpecialPattern),
    syntaxErrors:
      syntaxFailureCount(html) +
      syntaxFailureCount(decoded) +
      Math.abs(scripts.length - transformedScripts.length),
    scriptCount: scripts.length,
    checkedPath,
  };
}

function selfTest() {
  const clean = analyze('<script>const ok = 1;</script><script type="application/json">{"ok":true}</script>', '<self-test>');
  const hazardous = analyze('<script>const current = 1; if (ok &&current) value = "$&";\ufffd</script>', '<self-test>');
  const specials = ['$$', '$&', '$' + '`', "$'", '$1', '$99', '$<missing>'].join(' ');
  if (clean.scriptCount !== 1 || Object.values(clean).slice(0, 5).some(Boolean)) throw new Error('clean fixture failed');
  if (count(specials, replacementSpecialPattern) !== 7 || simulateReplacement(specials).includes('$99')) {
    throw new Error('replacement fixture failed');
  }
  if (!hazardous.legacyEntityPrefix || !hazardous.currencySign || !hazardous.replacementChar || !hazardous.replacementSpecial || !hazardous.syntaxErrors) {
    throw new Error('hazard fixture failed');
  }
  console.log(JSON.stringify({ selfTest: 'ok' }));
}

if (process.argv[2] === '--self-test') {
  selfTest();
} else {
  const checkedPath = resolve(process.argv[2] ?? DEFAULT_HTML);
  const result = analyze(readFileSync(checkedPath, 'utf8'), checkedPath);
  console.log(JSON.stringify(result, null, 2));
  if (Object.values(result).slice(0, 5).some(value => value !== 0)) process.exitCode = 1;
}
