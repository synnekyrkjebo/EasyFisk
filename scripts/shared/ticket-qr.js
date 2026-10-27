import QRCode from 'qrcode';

export function ticketUrl(token, base) {
  if (!/^[a-f0-9-]{36}$/.test(token || '')) throw new Error('Ugyldig kortnummer');
  const url = new URL('fiskekort.html', base);
  url.searchParams.set('kort', token);
  return url.href;
}

export function renderTicketQr(container, token, base = window.location.href) {
  const url = ticketUrl(token, base);
  const section = document.createElement('section');
  section.className = 'ticket-qr';
  const title = document.createElement('h3');
  title.textContent = 'QR-kode for fiskekortet';
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'QR-kode som åpner dette fiskekortet');
  const link = document.createElement('a');
  link.href = url;
  link.className = 'account-button';
  link.textContent = 'Åpne fiskekortet';
  const note = document.createElement('p');
  note.className = 'account-status';
  note.textContent = 'Prototype: Kortet er lagret i denne nettleseren. QR-lenken fungerer foreløpig bare der kortet er lagret.';
  section.append(title, canvas, link, note);
  container.append(section);
  QRCode.toCanvas(canvas, url, { width: 240, margin: 4, errorCorrectionLevel: 'M' }).catch(() => {
    canvas.remove();
    note.textContent = 'QR-koden kunne ikke genereres. Bruk lenken for å åpne fiskekortet.';
  });
  return section;
}
