const Lead     = require('../models/Lead');
const Activity = require('../models/Activity');
const https    = require('https');
const http     = require('http');

function extractSheetId(url) {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!m) throw new Error('Invalid Google Sheets URL. Copy the full link from your browser.');
  return m[1];
}
function extractGid(url) {
  const m = url.match(/[#&?]gid=(\d+)/);
  return m ? m[1] : '0';
}
function buildCsvUrl(sheetId, gid) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid||'0'}`;
}

// Handles ALL redirect types: 301,302,303,307,308 + cookie passing
function fetchUrl(url, redirects=0, cookies='') {
  return new Promise((resolve, reject) => {
    if (redirects > 10) return reject(new Error('Too many redirects from Google.'));
    const finalUrl = url.startsWith('http://') ? url.replace('http://','https://') : url;
    const lib = finalUrl.startsWith('https') ? https : http;
    const headers = {
      'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language':'en-US,en;q=0.5',
      'Accept-Encoding':'identity',
    };
    if (cookies) headers['Cookie'] = cookies;

    const req = lib.get(finalUrl, { headers }, (res) => {
      // Collect cookies
      const setCookie = res.headers['set-cookie'];
      const newCookies = setCookie ? setCookie.map(c=>c.split(';')[0]).join('; ') : cookies;

      // Handle ALL redirect codes including 307
      if ([301,302,303,307,308].includes(res.statusCode)) {
        const location = res.headers.location;
        if (!location) return reject(new Error('Redirect with no location'));
        res.resume(); // drain
        const next = location.startsWith('http') ? location : `https://docs.google.com${location}`;
        return fetchUrl(next, redirects+1, newCookies).then(resolve).catch(reject);
      }
      if (res.statusCode===401||res.statusCode===403)
        return reject(new Error('Access denied. Set the sheet to "Anyone with the link → Viewer" and try again.'));
      if (res.statusCode===404)
        return reject(new Error('Sheet not found (404). Check that the link is correct.'));
      if (res.statusCode!==200)
        return reject(new Error(`Google returned status ${res.statusCode}. Make sure the sheet is publicly shared.`));

      let data=''; res.setEncoding('utf8');
      res.on('data', c => data+=c);
      res.on('end', () => {
        if (data.trim().startsWith('<!DOCTYPE')||data.trim().startsWith('<html'))
          return reject(new Error('Google returned a login page. The sheet is not public. Set sharing to "Anyone with the link → Viewer".'));
        resolve(data);
      });
    });
    req.on('error', e => reject(new Error('Network error: '+e.message)));
    req.setTimeout(25000, () => { req.destroy(); reject(new Error('Request timed out (25s)')); });
  });
}

function parseCsv(text) {
  const rows=[]; let row=[],cell='',inQ=false;
  for(let i=0;i<text.length;i++){
    const c=text[i],nx=text[i+1];
    if(c==='"'){if(inQ&&nx==='"'){cell+='"';i++;}else inQ=!inQ;}
    else if(c===','&&!inQ){row.push(cell.trim());cell='';}
    else if((c==='\n'||(c==='\r'&&nx==='\n'))&&!inQ){if(c==='\r')i++;row.push(cell.trim());rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(cell||row.length){row.push(cell.trim());rows.push(row);}
  return rows.filter(r=>r.some(c=>c));
}

exports.previewSheet = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url?.trim()) return res.status(400).json({success:false,message:'Please provide a Google Sheets URL'});
    if (!url.includes('docs.google.com/spreadsheets'))
      return res.status(400).json({success:false,message:'This does not look like a Google Sheets link'});
    const sheetId = extractSheetId(url.trim());
    const gid     = extractGid(url.trim());
    const csvText = await fetchUrl(buildCsvUrl(sheetId,gid));
    const rows    = parseCsv(csvText);
    if(!rows.length) return res.status(400).json({success:false,message:'Sheet is empty'});
    const headers = rows[0].filter(h=>h.trim());
    if(!headers.length) return res.status(400).json({success:false,message:'No column headers found in first row'});
    const sampleRows = rows.slice(1,4).map(row=>Object.fromEntries(headers.map((h,i)=>[h,row[i]||''])));
    res.json({success:true, columns:headers, rowCount:rows.length-1, sheetId, gid, sampleRows});
  } catch(e) { res.status(400).json({success:false,message:e.message}); }
};

exports.importSheet = async (req, res) => {
  try {
    const { sheetId, gid, mapping } = req.body;
    if (!sheetId) return res.status(400).json({success:false,message:'sheetId required'});
    if (!mapping?.name) return res.status(400).json({success:false,message:'Name column mapping is required'});
    const csvText = await fetchUrl(buildCsvUrl(sheetId,gid||'0'));
    const rows    = parseCsv(csvText);
    if(rows.length<2) return res.status(400).json({success:false,message:'Sheet has no data rows'});
    const headers  = rows[0];
    const dataRows = rows.slice(1);
    const colIdx   = Object.fromEntries(headers.map((h,i)=>[h,i]));
    const leads=[]; let skipped=0;
    for(const row of dataRows){
      const get=col=>col&&colIdx[col]!==undefined?(row[colIdx[col]]||'').trim():'';
      const name=get(mapping.name);
      if(!name){skipped++;continue;}
      leads.push({name, contactNo:get(mapping.contactNo), emailId:get(mapping.emailId),
        address:get(mapping.address), product:get(mapping.product), service:get(mapping.service),
        organization:req.user.organization._id, uploadedBy:req.user._id, uploadDate:new Date()});
    }
    if(!leads.length) return res.status(400).json({success:false,message:`All ${skipped} rows skipped — Name was empty`});
    const inserted = await Lead.insertMany(leads);
    await Activity.create({user:req.user._id, organization:req.user.organization._id,
      action:'upload', description:`Imported ${inserted.length} leads from Google Sheets`,
      meta:{source:'google_sheets',sheetId,count:inserted.length,skipped}});
    res.json({success:true, count:inserted.length, skipped, message:`${inserted.length} leads imported${skipped?` (${skipped} skipped)`:''}`});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
