const https = require('https');
const fs = require('fs');

function httpGet(url, cookie='') {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    opts.headers = {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'text/html,application/xhtml+xml',
      ...(cookie ? { Cookie: `__test=${cookie}` } : {})
    };
    https.get(opts, (res) => {
      let data = '';
      res.on('data', (c) => data += c.toString('utf8'));
      res.on('end', () => resolve({status: res.statusCode, data, headers: res.headers, url}));
    }).on('error', reject);
  });
}

(async () => {
  const aes = await httpGet('https://markotechnologies.unaux.com/aes.js');
  eval(aes.data);

  const toNumbers = (d) => { const e=[]; d.replace(/(..)/g, (_,x)=>e.push(parseInt(x,16))); return e; };
  const toHex = (arr) => arr.map(v => (v<16?'0':'') + v.toString(16)).join('').toLowerCase();

  let nextUrl = 'https://markotechnologies.unaux.com/?i=1';
  let cookie = '';

  for (let step = 0; step < 30; step++) {
    const res = await httpGet(nextUrl, cookie);
    const html = res.data;
    console.log(`step ${step+1} url=${nextUrl} len=${html.length}`);

    if (!html.includes('slowAES.decrypt') || !html.includes('location.href')) {
      fs.writeFileSync('c:/xampp/htdocs/kuccp/tmp_marko_final.html', html);
      console.log('FINAL_SAVED');
      return;
    }

    const ma = html.match(/a=toNumbers\("([0-9a-f]+)"\)/i);
    const mb = html.match(/b=toNumbers\("([0-9a-f]+)"\)/i);
    const mc = html.match(/c=toNumbers\("([0-9a-f]+)"\)/i);
    const ml = html.match(/location\.href="([^"]+)"/i);

    if (!ma || !mb || !mc || !ml) {
      fs.writeFileSync('c:/xampp/htdocs/kuccp/tmp_marko_unparsed.html', html);
      console.log('FAILED_PARSE');
      return;
    }

    const a = toNumbers(ma[1]);
    const b = toNumbers(mb[1]);
    const c = toNumbers(mc[1]);
    cookie = toHex(slowAES.decrypt(c, 2, a, b));
    let loc = ml[1];
    if (loc.startsWith('http://sv101.ifastnet.com/cookies.html') || loc.includes('cookies.html')) {
      nextUrl = 'https://markotechnologies.unaux.com/?i=1';
    } else if (loc.startsWith('http://')) {
      nextUrl = 'https://' + loc.slice(7);
    } else {
      nextUrl = loc;
    }
  }

  console.log('MAX_STEPS_REACHED');
})();
