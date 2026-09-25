import { sanitizeEvidenceWebP } from '../supabase/functions/_shared/webp-sanitizer.js';
const u32=v=>new Uint8Array([v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]);
const chunk=(name,p)=>{const o=new Uint8Array(8+p.length+(p.length%2));o.set([...name].map(c=>c.charCodeAt(0)),0);o.set(u32(p.length),4);o.set(p,8);return o;};
const join=a=>{const o=new Uint8Array(a.reduce((n,x)=>n+x.length,0));let k=0;for(const x of a){o.set(x,k);k+=x.length;}return o;};
const vp8x=new Uint8Array(10);vp8x[0]=0x3c;
const vp8=new Uint8Array([0,0,0,0x9d,0x01,0x2a,0x01,0x00,0x01,0x00]);
const gps=new TextEncoder().encode('GPSLatitude=23.8103;GPSLongitude=90.4125;Device=QA-Camera');
const chunks=[chunk('VP8X',vp8x),chunk('ICCP',new TextEncoder().encode('icc')),chunk('EXIF',gps),chunk('XMP ',new TextEncoder().encode('xmp')),chunk('ZZZZ',new TextEncoder().encode('hidden')),chunk('VP8 ',vp8)];
const body=join([new TextEncoder().encode('WEBP'),...chunks]);
const riff=join([new TextEncoder().encode('RIFF'),u32(body.length),body]);
const result=sanitizeEvidenceWebP(riff);
const output=new TextDecoder('latin1').decode(result.bytes);
for(const s of ['EXIF','XMP ','ICCP','GPSLatitude','GPSLongitude','QA-Camera','ZZZZ','hidden']){
  if(output.includes(s))throw new Error('Metadata retained: '+s);
}
for(const s of ['EXIF','XMP','ICCP','ZZZZ']){
  if(!result.removedChunks.includes(s))throw new Error('Removal not reported: '+s);
}
let animationRejected=false;
try{
  const b=join([new TextEncoder().encode('WEBP'),chunk('ANIM',new Uint8Array(6)),chunk('VP8 ',vp8)]);
  sanitizeEvidenceWebP(join([new TextEncoder().encode('RIFF'),u32(b.length),b]));
}catch{animationRejected=true;}
if(!animationRejected)throw new Error('Animated WebP accepted');
console.log('Evidence metadata sanitization audit passed: EXIF/GPS/XMP/ICC/unknown chunks stripped; animation rejected.');
