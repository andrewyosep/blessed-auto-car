import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedBytes, emailAllowed, HttpError } from '../lib/http.ts';
import { whatsappUrl } from '../lib/catalog.ts';
test('Admin fails closed with missing identity, unset allowlist, or another account',()=>{
  assert.equal(emailAllowed(null,'owner@example.com'),false);
  assert.equal(emailAllowed('owner@example.com',undefined),false);
  assert.equal(emailAllowed('visitor@example.com','owner@example.com'),false);
  assert.equal(emailAllowed('Owner@Example.com',' other@example.com, owner@example.com '),true);
});
test('WhatsApp normalizes Indonesian mobile numbers and encodes messages',()=>{
  assert.equal(whatsappUrl('081234567890','Halo & tanya?'),'https://wa.me/6281234567890?text=Halo%20%26%20tanya%3F');
  assert.equal(whatsappUrl('+6281234567890','tes'),'https://wa.me/6281234567890?text=tes');
  assert.equal(whatsappUrl('','tes'),null);
  assert.equal(whatsappUrl('javascript:alert(1)','tes'),null);
});
test('Upload reads normal content without losing bytes',async()=>{
  const result=await boundedBytes(new Request('https://example.com/api/upload',{method:'POST',body:new Uint8Array([1,2,3])}),3);
  assert.deepEqual([...result],[1,2,3]);
});
test('Upload rejects an oversized body even without a Content-Length header',async()=>{
  const request=new Request('https://example.com/api/upload',{method:'POST',body:new ReadableStream({start(c){c.enqueue(new Uint8Array([1,2]));c.enqueue(new Uint8Array([3,4]));c.close();}}),duplex:'half'});
  await assert.rejects(boundedBytes(request,3), e=>e instanceof HttpError&&e.status===413);
});
