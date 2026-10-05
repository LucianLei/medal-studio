import { unzipSync, zipSync, strFromU8, strToU8 } from 'three/addons/libs/fflate.module.js';

// Animate the exported root so the relief, texture and back inscription move together.
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
  text = text.replace('defaultPrim = "Root"', `startTimeCode = 0\n\tendTimeCode = ${frames}\n\ttimeCodesPerSecond = ${fps}\n\tframesPerSecond = ${fps}\n\tdefaultPrim = "Root"`);
  const root = /def Xform "Root"\s*\{/;
  if (!root.test(text)) throw new Error('USDZ 根节点格式不支持动画');
  text = text.replace(root, `$&\n\tdouble3 xformOp:translate.timeSamples = {\n\t\t${translation.join(',\n\t\t')}\n\t}\n\tdouble xformOp:rotateY.timeSamples = {\n\t\t${rotation.join(',\n\t\t')}\n\t}\n\tuniform token[] xformOpOrder = ["xformOp:translate", "xformOp:rotateY"]\n`);
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
