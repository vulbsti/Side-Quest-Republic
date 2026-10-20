// Paste into an https://indown.io/en5 tab. Submits only the public reel URL (no Instagram
// cookies go to indown), then saves the video as ~/Downloads/sqr-reel-<code>.mp4.
window.sqrDown = async function (code, server = 1) {
  const form = document.querySelector('#link').form;
  const fd = new FormData(form);
  fd.set('link', `https://www.instagram.com/reel/${code}/`);
  const html = await (await fetch(form.action, { method: 'POST', body: fd, credentials: 'include' })).text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const links = [...doc.querySelectorAll('a')].filter(a => /Download Server/i.test(a.textContent));
  const a = links.find(x => x.textContent.includes(String(server))) || links[0];
  if (!a) return { code, ok: false, why: /error|private|not found|invalid/i.exec(doc.body.innerText)?.[0] || 'no download link' };
  const r = await fetch(a.getAttribute('href'));
  if (!r.ok) return { code, ok: false, why: 'fetch ' + r.status };
  const blob = await r.blob();
  if (!/video|octet/.test(blob.type) || blob.size < 50000) return { code, ok: false, why: `bad blob ${blob.type} ${blob.size}` };
  const x = document.createElement('a');
  x.href = URL.createObjectURL(blob); x.download = `sqr-reel-${code}.mp4`;
  document.body.appendChild(x); x.click(); x.remove();
  setTimeout(() => URL.revokeObjectURL(x.href), 60000);
  return { code, ok: true, size: blob.size, type: blob.type };
};
'sqrDown ready';
