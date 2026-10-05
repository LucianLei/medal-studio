import { unzipSync, zipSync, strFromU8, strToU8 } from 'three/addons/libs/fflate.module.js';

// Keep animation inside the active Apple scene, below its anchoring transform.
export function animateUSDZ(buffer) {
  const files = unzipSync(new Uint8Array(buffer));
  if (!files['model.usda']) throw new Error('USDZ 缺少主场景');
  let text = strFromU8(files['model.usda']);
  const fps = 24, frames = 216;
  const rotation = [], translation = [];
  for (let frame = 0; frame <= frames; frame++) {
    rotation.push(`${frame}: ${(360 * frame / frames).toFixed(6)}`);
    const y = .045 + .003 * Math.sin(frame / frames * Math.PI * 6);
    translation.push(`${frame}: (0, ${y.toFixed(7)}, 0)`);
  }
  text = text.replace('defaultPrim = "Root"', `startTimeCode = 0\n\tendTimeCode = ${frames}\n\ttimeCodesPerSecond = ${fps}\n\tframesPerSecond = ${fps}\n\tautoPlay = true\n\tplaybackMode = "loop"\n\tdefaultPrim = "Root"`);
  const scene = /def Xform "Scene"\s*\([\s\S]*?\)\s*\{/;
  const match = scene.exec(text);
  if (!match) throw new Error('USDZ 缺少可播放的场景');
  const opening = match.index + match[0].length;
  let closing = opening, depth = 1;
  for (; closing < text.length && depth; closing++) {
    if (text[closing] === '{') depth++;
    if (text[closing] === '}') depth--;
  }
  if (depth) throw new Error('USDZ 场景结构不完整');
  closing--;
  // The scene-library container is imported separately by Apple viewers; animate
  // a child of its active scene rather than the external document root.
  const track = `\n\t\t\tdef Xform "MedalAnimation"\n\t\t\t{\n\t\t\t\tdouble3 xformOp:translate.timeSamples = {\n${translation.join(',\n')}\n}\n\t\t\t\tfloat xformOp:rotateY.timeSamples = {\n${rotation.join(',\n')}\n}\n\t\t\t\tuniform token[] xformOpOrder = ["xformOp:translate", "xformOp:rotateY"]\n`;
  text = text.slice(0, opening) + track + text.slice(opening, closing) + '\n\t\t\t}\n' + text.slice(closing);
  files['model.usda'] = strToU8(text);
  // USDZ requires uncompressed entries and 64-byte aligned file payloads.
  const packed = {};
  let offset = 0;
  for (const name of ['model.usda', ...Object.keys(files).filter(n => n !== 'model.usda')]) {
    const data = files[name];
    const header = 30 + strToU8(name).length;
    const padding = (64 - ((offset + header + 4) % 64)) % 64;
    packed[name] = [data, { extra: { 12345: new Uint8Array(padding) } }];
    offset += header + 4 + padding + data.length;
  }
  return zipSync(packed, { level: 0 });
}
