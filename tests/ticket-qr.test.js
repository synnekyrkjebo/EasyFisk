import test from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import { ticketUrl } from '../scripts/shared/ticket-qr.js';

test('each ticket encodes its own canonical URL including the deployment path', () => {
 const first = ticketUrl('11111111-1111-4111-8111-111111111111', 'https://example.com/EasyFisk/fiskekort.html?bestilt=old#list');
 const second = ticketUrl('22222222-2222-4222-8222-222222222222', 'https://example.com/EasyFisk/fiskekort.html');
 assert.equal(first, 'https://example.com/EasyFisk/fiskekort.html?kort=11111111-1111-4111-8111-111111111111');
 const a = QRCode.create(first, {errorCorrectionLevel:'M'});
 const b = QRCode.create(second, {errorCorrectionLevel:'M'});
 const encoded = a.segments.map(segment => typeof segment.data === 'string' ? segment.data : new TextDecoder().decode(segment.data)).join('');
 assert.equal(encoded, first);
 assert.notDeepEqual(a.modules.data, b.modules.data);
 assert.throws(() => ticketUrl('invalid', 'https://example.com/'));
});
