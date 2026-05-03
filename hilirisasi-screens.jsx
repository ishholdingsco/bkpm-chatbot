/* global React, Avatar, TopBar, BKPM, Cite, DATA */
// Pohon Hilirisasi — commodity industry tree page

const { useState: useHil, useRef: useHilRef, useEffect: useHilEffect } = React;

// ─── Layout constants ───
const HT = { PANEL_W: 192, NODE_W: 148, NODE_H: 62, COL_SPAN: 244, ROW_SPAN: 62, HDR: 44 };
const CANVAS_W = HT.PANEL_W + 5 * HT.COL_SPAN + 12;
const CANVAS_H = HT.HDR + 14 * HT.ROW_SPAN + 60;
const nx = n => HT.PANEL_W + n.s * HT.COL_SPAN + 4;
const ny = n => HT.HDR + n.r * HT.ROW_SPAN;

const EXP_COLOR = '#16a34a';
const IMP_COLOR = '#dc2626';

// ─── Helper: commodity trees with full dummy data ───
// Each node: { id, s, r, label, exp, imp, expPct(0-100 share of exports), balance, mult, type, mkt? }
const COMMODITY_TREES = {

  Nikel: {
    stageLabels:   ['Bijah', 'Peleburan / Pemrosesan', 'Pembentukan', 'Barang Jadi', 'Aplikasi'],
    stageLabelsEN: ['Raw Ore', 'Smelting / Processing', 'Forming', 'Finished Goods', 'Applications'],
    summary: { ekspor:'USD 18 M', impor:'USD 591.8 Jt', surplus:'> USD 17 M', tahun:'2021' },
    nodes: [
      { id:'sulphide',    s:0, r:1.4, label:'Sulphide ores',               exp:'—',     imp:'—',      expPct:null, balance:null,       mult:null, type:'source' },
      { id:'laterite',    s:0, r:5.8, label:'Lateritic ores',              exp:'0',     imp:'10K',    expPct:0,    balance:'defisit',   mult:1,    type:'source' },
      { id:'ni-scrap',    s:1, r:0.2, label:'Ni Scrap',                    exp:'5.9M',  imp:'0.4M',   expPct:94,   balance:'surplus',   mult:null, type:'normal' },
      { id:'npi',         s:1, r:1.4, label:'NPI\n(4–15% Ni)',             exp:'7.1B',  imp:'1.6M',   expPct:100,  balance:'surplus',   mult:2,    type:'hilirisasi' },
      { id:'feni',        s:1, r:2.6, label:'FeNi\n(16–30% Ni)',           exp:'7.1B',  imp:'1.6M',   expPct:100,  balance:'surplus',   mult:4,    type:'hilirisasi' },
      { id:'ni-matte',    s:1, r:3.8, label:'Nickel Matte\n(40–70% Ni)',   exp:'953M',  imp:'18M',    expPct:98,   balance:'surplus',   mult:2.8,  type:'hilirisasi' },
      { id:'sulph-conc',  s:1, r:5.1, label:'Sulphide\nconcentrate',       exp:'6.7M',  imp:'8.1M',   expPct:45,   balance:'balanced',  mult:null, type:'normal' },
      { id:'mhp',         s:1, r:6.4, label:'Mixed Hydroxide\nPrecipitate',exp:'2.1B',  imp:'0.3M',   expPct:100,  balance:'surplus',   mult:4,    type:'hilirisasi-key' },
      { id:'msp',         s:1, r:7.8, label:'Mixed Sulfide\nPrecipitate',  exp:'0.8B',  imp:'0.1B',   expPct:89,   balance:'surplus',   mult:null, type:'hilirisasi' },
      { id:'ss-slab',     s:2, r:0.9, label:'Stainless Steel Slab',        exp:'3.7B',  imp:'21M',    expPct:99,   balance:'surplus',   mult:3.8,  type:'normal' },
      { id:'ss-billet',   s:2, r:2.5, label:'Stainless Steel Billet',      exp:'0.4B',  imp:'0.2B',   expPct:67,   balance:'surplus',   mult:null, type:'normal' },
      { id:'ni-so4',      s:2, r:4.3, label:'Ni SO₄',                     exp:'0.8B',  imp:'0.1B',   expPct:89,   balance:'surplus',   mult:8,    type:'normal' },
      { id:'ni-metal',    s:2, r:5.4, label:'Ni Metal',                    exp:'45.1M', imp:'8.2M',   expPct:85,   balance:'surplus',   mult:null, type:'normal' },
      { id:'ni-powder',   s:2, r:6.6, label:'Ni Powder',                   exp:'12.3M', imp:'1.4M',   expPct:90,   balance:'surplus',   mult:null, type:'normal' },
      { id:'batteries',   s:2, r:7.8, label:'Batteries',                   exp:'0.1B',  imp:'2.4B',   expPct:4,    balance:'defisit',   mult:67,   type:'hilirisasi-key' },
      { id:'ss-hrc',      s:3, r:0.4, label:'Stainless Steel HRC',         exp:'4.6B',  imp:'187M',   expPct:96,   balance:'surplus',   mult:4.9,  type:'normal' },
      { id:'ss-crc',      s:3, r:1.6, label:'Stainless Steel CRC',         exp:'2.0B',  imp:'200M',   expPct:91,   balance:'surplus',   mult:7.9,  type:'normal' },
      { id:'ss-rod',      s:3, r:2.8, label:'Stainless Steel\nRod/Bar',    exp:'3.4M',  imp:'128M',   expPct:3,    balance:'defisit',   mult:null, type:'normal' },
      { id:'ss-ptube',    s:3, r:3.9, label:'Stainless Steel\nPipe/Tube',  exp:'1.3M',  imp:'22.7M',  expPct:5,    balance:'defisit',   mult:null, type:'normal' },
      { id:'ss-seamless', s:3, r:5.0, label:'SS Seamless Pipe',            exp:'64.6M', imp:'68.6M',  expPct:49,   balance:'balanced',  mult:null, type:'normal' },
      { id:'ss-bolt',     s:3, r:6.1, label:'SS Bolt & Nut',               exp:'25.6M', imp:'76.8M',  expPct:25,   balance:'defisit',   mult:null, type:'normal' },
      { id:'ss-wire',     s:3, r:7.2, label:'SS Wire',                     exp:'8.5M',  imp:'76.8M',  expPct:10,   balance:'defisit',   mult:null, type:'normal' },
      { id:'ni-alloy',    s:3, r:8.3, label:'Nickel-based Alloy',          exp:'1.0M',  imp:'46.8M',  expPct:2,    balance:'defisit',   mult:null, type:'normal' },
      { id:'plating',     s:3, r:9.5, label:'Plating',                     exp:'12M',   imp:'0.8B',   expPct:1,    balance:'defisit',   mult:null, type:'normal' },
      { id:'welded',      s:4, r:0.2, label:'SS Welded Pipe',              exp:'7.7M',  imp:'25.9M',  expPct:23,   balance:'defisit',   mult:9.5,  type:'hilirisasi' },
      { id:'app-rail',    s:4, r:1.3, label:'Rel Kereta Api',               exp:'93.6M', imp:'198.6M', expPct:32,   balance:'defisit',   mult:null, type:'application', mkt:'USD 2.8B' },
      { id:'app-oilgas',  s:4, r:2.4, label:'Transportasi\nMinyak & Gas',  exp:'0.4B',  imp:'0.9B',   expPct:31,   balance:'defisit',   mult:null, type:'application', mkt:'USD 6.4B' },
      { id:'app-auto',    s:4, r:3.5, label:'Otomotif',                    exp:'1.2B',  imp:'2.8B',   expPct:30,   balance:'defisit',   mult:null, type:'application', mkt:'USD 8.2B' },
      { id:'app-ev',      s:4, r:4.6, label:'EV',                          exp:'0.3B',  imp:'1.4B',   expPct:18,   balance:'defisit',   mult:null, type:'application-key', mkt:'USD 4.1B' },
      { id:'app-kapal',   s:4, r:5.7, label:'Kapal',                       exp:'0.6B',  imp:'0.8B',   expPct:43,   balance:'defisit',   mult:null, type:'application', mkt:'USD 1.2B' },
      { id:'app-konstr',  s:4, r:6.8, label:'Konstruksi',                  exp:'2.1B',  imp:'1.4B',   expPct:60,   balance:'surplus',   mult:null, type:'application', mkt:'USD 12.4B' },
      { id:'app-tani',    s:4, r:7.9, label:'Pertanian',                   exp:'0.2B',  imp:'0.1B',   expPct:67,   balance:'surplus',   mult:null, type:'application', mkt:'USD 0.8B' },
      { id:'app-ecase',   s:4, r:9.0, label:'Electronic\nCasing',          exp:'0.4B',  imp:'1.2B',   expPct:25,   balance:'defisit',   mult:null, type:'application-key', mkt:'USD 3.6B' },
      { id:'app-def',     s:4, r:10.1,label:'Industri\nPertahanan',        exp:'0.1B',  imp:'0.6B',   expPct:14,   balance:'defisit',   mult:null, type:'application', mkt:'USD 2.1B' },
      { id:'app-rumah',   s:4, r:11.2,label:'Rumah Tangga',                exp:'0.8B',  imp:'0.5B',   expPct:62,   balance:'surplus',   mult:null, type:'application', mkt:'USD 5.3B' },
      { id:'app-medis',   s:4, r:12.3,label:'Alat Kesehatan',              exp:'0.2B',  imp:'0.4B',   expPct:33,   balance:'defisit',   mult:null, type:'application', mkt:'USD 1.7B' },
    ],
    edges: [
      ['sulphide','sulph-conc'],
      ['laterite','npi'],['laterite','feni'],['laterite','ni-matte'],['laterite','mhp'],['laterite','msp'],
      ['ni-scrap','ss-slab'],['npi','ss-slab'],['npi','ss-billet'],['feni','ss-slab'],['ni-matte','ss-billet'],
      ['sulph-conc','ni-so4'],['mhp','ni-so4'],['mhp','ni-metal'],['mhp','ni-powder'],['mhp','batteries'],['msp','batteries'],
      ['ss-slab','ss-hrc'],['ss-slab','ss-rod'],['ss-slab','ss-ptube'],['ss-billet','ss-hrc'],
      ['ni-so4','batteries'],['ni-metal','ni-alloy'],['ni-metal','plating'],['ni-powder','batteries'],
      ['ss-hrc','welded'],['ss-hrc','ss-crc'],['ss-crc','welded'],['ss-crc','ss-seamless'],
      ['ss-ptube','ss-seamless'],['ss-ptube','ss-bolt'],['ss-rod','app-rail'],
      ['welded','app-oilgas'],['welded','app-kapal'],['welded','app-konstr'],
      ['ss-seamless','app-oilgas'],['ss-bolt','app-auto'],['ss-bolt','app-kapal'],
      ['ss-wire','app-rumah'],['ni-alloy','app-def'],['ni-alloy','app-medis'],
      ['plating','app-ecase'],['plating','app-rumah'],['batteries','app-ev'],['batteries','app-kapal'],
      ['ss-hrc','app-auto'],['ss-hrc','app-tani'],
    ],
  },

  Sawit: {
    stageLabels:   ['Kebun / Bijah', 'Pengolahan Primer', 'Pemurnian & Fraksinasi', 'Produk Turunan', 'Aplikasi'],
    stageLabelsEN: ['Plantation / Raw', 'Primary Processing', 'Refining & Fractionation', 'Derivatives', 'Applications'],
    summary: { ekspor:'USD 27.8 M', impor:'USD 2.1 M', surplus:'USD 25.7 M', tahun:'2023' },
    nodes: [
      { id:'tbs',          s:0, r:1.5, label:'Tandan Buah\nSegar (TBS)',  exp:'—',     imp:'—',    expPct:null, balance:null,      mult:1,   type:'source' },
      { id:'biji-sawit',   s:0, r:4.5, label:'Biji / Inti Sawit',         exp:'0.4B',  imp:'0.1B', expPct:80,   balance:'surplus', mult:null,type:'source' },
      { id:'cpo',          s:1, r:0.8, label:'CPO\n(Crude Palm Oil)',      exp:'8.2B',  imp:'0.1M', expPct:100,  balance:'surplus', mult:2,   type:'hilirisasi' },
      { id:'pko',          s:1, r:2.2, label:'PKO\n(Palm Kernel Oil)',     exp:'1.4B',  imp:'0.1M', expPct:100,  balance:'surplus', mult:2.5, type:'hilirisasi' },
      { id:'pkm',          s:1, r:3.8, label:'Palm Kernel Meal',           exp:'0.3B',  imp:'0.02M',expPct:94,   balance:'surplus', mult:1.5, type:'normal' },
      { id:'pkc',          s:1, r:5.2, label:'Palm Kernel Cake',           exp:'0.2B',  imp:'0.05B',expPct:80,   balance:'surplus', mult:null,type:'normal' },
      { id:'rbdolein',     s:2, r:0.4, label:'RBD Palm Olein',             exp:'12.4B', imp:'0.5M', expPct:100,  balance:'surplus', mult:3.8, type:'hilirisasi' },
      { id:'rbdstearin',   s:2, r:1.7, label:'RBD Palm Stearin',           exp:'2.1B',  imp:'0.1M', expPct:100,  balance:'surplus', mult:3.5, type:'hilirisasi' },
      { id:'pfad',         s:2, r:3.0, label:'PFAD',                       exp:'0.4B',  imp:'0.05M',expPct:89,   balance:'surplus', mult:2.8, type:'normal' },
      { id:'rbdpko',       s:2, r:4.3, label:'RBD PKO',                    exp:'1.8B',  imp:'0.2M', expPct:90,   balance:'surplus', mult:4,   type:'hilirisasi' },
      { id:'pks',          s:2, r:5.6, label:'Palm Kernel Stearin',        exp:'0.6B',  imp:'0.1M', expPct:86,   balance:'surplus', mult:3.5, type:'normal' },
      { id:'minyak-goreng',s:3, r:0.2, label:'Minyak Goreng',              exp:'3.2B',  imp:'0.8B', expPct:80,   balance:'surplus', mult:5,   type:'hilirisasi-key' },
      { id:'margarin',     s:3, r:1.5, label:'Margarin &\nShortening',     exp:'0.8B',  imp:'0.6B', expPct:57,   balance:'surplus', mult:5.5, type:'normal' },
      { id:'biodiesel',    s:3, r:2.8, label:'Biodiesel B100',             exp:'2.2B',  imp:'0.1B', expPct:96,   balance:'surplus', mult:6,   type:'hilirisasi-key' },
      { id:'oleokimia',    s:3, r:4.1, label:'Oleokimia Dasar',            exp:'1.8B',  imp:'0.3B', expPct:86,   balance:'surplus', mult:8,   type:'hilirisasi' },
      { id:'surfaktan',    s:3, r:5.4, label:'Surfaktan',                  exp:'0.5B',  imp:'0.4B', expPct:56,   balance:'balanced',mult:10,  type:'hilirisasi' },
      { id:'sabun-sawit',  s:3, r:6.7, label:'Sabun & Deterjen',           exp:'0.6B',  imp:'1.2B', expPct:33,   balance:'defisit', mult:8,   type:'normal' },
      { id:'kos-sawit',    s:3, r:8.0, label:'Kosmetik Base',              exp:'0.4B',  imp:'2.1B', expPct:16,   balance:'defisit', mult:12,  type:'hilirisasi-key' },
      { id:'app-pangan',   s:4, r:0.5, label:'Industri Pangan',            exp:'4.2B',  imp:'1.8B', expPct:70,   balance:'surplus', mult:null, type:'application', mkt:'USD 18.4B' },
      { id:'app-b30',      s:4, r:2.0, label:'Program B30/B40\n(Biofuel)',  exp:'2.2B',  imp:'0.1B', expPct:96,   balance:'surplus', mult:null, type:'application-key', mkt:'USD 3.1B' },
      { id:'app-personal', s:4, r:3.5, label:'Personal Care',              exp:'0.8B',  imp:'2.4B', expPct:25,   balance:'defisit', mult:null, type:'application', mkt:'USD 6.8B' },
      { id:'app-farma',    s:4, r:5.0, label:'Farmasi',                    exp:'0.3B',  imp:'1.2B', expPct:20,   balance:'defisit', mult:null, type:'application', mkt:'USD 4.2B' },
      { id:'app-kimia',    s:4, r:6.5, label:'Industri Kimia',             exp:'1.4B',  imp:'0.8B', expPct:64,   balance:'surplus', mult:null, type:'application', mkt:'USD 7.6B' },
      { id:'app-teks',     s:4, r:8.0, label:'Tekstil & Material',         exp:'0.6B',  imp:'1.1B', expPct:35,   balance:'defisit', mult:null, type:'application', mkt:'USD 5.2B' },
    ],
    edges: [
      ['tbs','cpo'],['tbs','pko'],
      ['biji-sawit','pko'],['biji-sawit','pkm'],['biji-sawit','pkc'],
      ['cpo','rbdolein'],['cpo','rbdstearin'],['cpo','pfad'],
      ['pko','rbdpko'],['pko','pks'],['pkm','app-pangan'],['pkc','app-pangan'],
      ['rbdolein','minyak-goreng'],['rbdolein','margarin'],
      ['rbdstearin','margarin'],['rbdstearin','biodiesel'],
      ['pfad','oleokimia'],['rbdpko','sabun-sawit'],['rbdpko','kos-sawit'],['pks','surfaktan'],
      ['minyak-goreng','app-pangan'],['margarin','app-pangan'],['biodiesel','app-b30'],
      ['oleokimia','surfaktan'],['oleokimia','app-kimia'],
      ['surfaktan','sabun-sawit'],['surfaktan','kos-sawit'],
      ['sabun-sawit','app-personal'],['kos-sawit','app-personal'],['kos-sawit','app-farma'],
      ['oleokimia','app-teks'],
    ],
  },

  Kelapa: {
    stageLabels:   ['Kebun / Bijah', 'Pengolahan', 'Pemurnian', 'Produk Jadi', 'Aplikasi'],
    stageLabelsEN: ['Plantation / Raw', 'Processing', 'Refining', 'Finished Products', 'Applications'],
    summary: { ekspor:'USD 1.8 M', impor:'USD 0.18 M', surplus:'USD 1.62 M', tahun:'2023' },
    nodes: [
      { id:'kelapa-segar', s:0, r:1.5, label:'Kelapa Segar',              exp:'—',    imp:'—',    expPct:null, balance:null,      mult:1,   type:'source' },
      { id:'kelapa-tua',   s:0, r:4.5, label:'Kelapa Tua / Sabut',        exp:'0.1B', imp:'0.02B',expPct:83,   balance:'surplus', mult:null,type:'source' },
      { id:'kopra',        s:1, r:0.5, label:'Kopra',                      exp:'0.6B', imp:'0.02B',expPct:97,   balance:'surplus', mult:2,   type:'hilirisasi' },
      { id:'santan',       s:1, r:1.8, label:'Santan Segar',               exp:'0.3B', imp:'0.01B',expPct:97,   balance:'surplus', mult:3,   type:'normal' },
      { id:'arang',        s:1, r:3.2, label:'Arang Tempurung',            exp:'0.2B', imp:'0.01B',expPct:95,   balance:'surplus', mult:1.8, type:'normal' },
      { id:'sabut',        s:1, r:4.6, label:'Serat Sabut\n(Coco Fiber)',  exp:'0.1B', imp:'0.005B',expPct:95,  balance:'surplus', mult:1.5, type:'normal' },
      { id:'nira',         s:1, r:6.0, label:'Nira Kelapa',                exp:'0.05B',imp:'0.01B',expPct:83,   balance:'surplus', mult:null,type:'normal' },
      { id:'minyak-rbd',   s:2, r:0.5, label:'Minyak Kelapa RBD',         exp:'0.8B', imp:'0.1B', expPct:89,   balance:'surplus', mult:4,   type:'hilirisasi' },
      { id:'vco',          s:2, r:1.8, label:'VCO\n(Virgin Coconut Oil)',  exp:'1.4B', imp:'0.3B', expPct:82,   balance:'surplus', mult:8,   type:'hilirisasi-key' },
      { id:'karbon-aktif', s:2, r:3.2, label:'Karbon Aktif',               exp:'0.9B', imp:'0.2B', expPct:82,   balance:'surplus', mult:6,   type:'hilirisasi' },
      { id:'tepung-kelapa',s:2, r:4.6, label:'Tepung Kelapa',              exp:'0.5B', imp:'0.1B', expPct:83,   balance:'surplus', mult:4,   type:'normal' },
      { id:'gula-kelapa',  s:2, r:6.0, label:'Gula Kelapa Kristal',       exp:'0.3B', imp:'0.02B',expPct:94,   balance:'surplus', mult:5,   type:'hilirisasi' },
      { id:'cocopeat',     s:2, r:7.4, label:'Cocopeat',                   exp:'0.2B', imp:'0.01B',expPct:95,   balance:'surplus', mult:3,   type:'normal' },
      { id:'suplemen-vco', s:3, r:0.5, label:'Suplemen VCO',               exp:'0.6B', imp:'1.1B', expPct:35,   balance:'defisit', mult:15,  type:'hilirisasi-key' },
      { id:'kos-kelapa',   s:3, r:1.8, label:'Kosmetik Kelapa',            exp:'0.3B', imp:'0.8B', expPct:27,   balance:'defisit', mult:12,  type:'hilirisasi-key' },
      { id:'sabun-kelapa', s:3, r:3.2, label:'Sabun & Deterjen Kelapa',   exp:'0.4B', imp:'0.6B', expPct:40,   balance:'defisit', mult:8,   type:'normal' },
      { id:'pangan-kelapa',s:3, r:4.6, label:'Produk Pangan\nFungsional', exp:'0.5B', imp:'0.3B', expPct:63,   balance:'surplus', mult:7,   type:'normal' },
      { id:'gula-produk',  s:3, r:6.0, label:'Gula Organik & Syrup',      exp:'0.4B', imp:'0.1B', expPct:80,   balance:'surplus', mult:9,   type:'hilirisasi' },
      { id:'media-tanam',  s:3, r:7.4, label:'Media Tanam Coco',           exp:'0.3B', imp:'0.05B',expPct:86,   balance:'surplus', mult:5,   type:'normal' },
      { id:'kap-wellness', s:4, r:0.5, label:'Kesehatan &\nWellness',      exp:'0.8B', imp:'1.4B', expPct:36,   balance:'defisit', mult:null, type:'application-key', mkt:'USD 4.2B' },
      { id:'kap-kec',      s:4, r:2.0, label:'Kecantikan',                 exp:'0.5B', imp:'1.1B', expPct:31,   balance:'defisit', mult:null, type:'application', mkt:'USD 3.8B' },
      { id:'kap-pangan',   s:4, r:3.5, label:'Pangan Fungsional',          exp:'0.9B', imp:'0.4B', expPct:69,   balance:'surplus', mult:null, type:'application', mkt:'USD 6.1B' },
      { id:'kap-pertanian',s:4, r:5.0, label:'Pertanian',                  exp:'0.4B', imp:'0.2B', expPct:67,   balance:'surplus', mult:null, type:'application', mkt:'USD 2.3B' },
      { id:'kap-energi',   s:4, r:6.5, label:'Energi Hijau',               exp:'0.2B', imp:'0.1B', expPct:67,   balance:'surplus', mult:null, type:'application-key', mkt:'USD 1.8B' },
      { id:'kap-lingk',    s:4, r:8.0, label:'Lingkungan',                 exp:'0.3B', imp:'0.1B', expPct:75,   balance:'surplus', mult:null, type:'application', mkt:'USD 1.4B' },
    ],
    edges: [
      ['kelapa-segar','kopra'],['kelapa-segar','santan'],['kelapa-segar','nira'],
      ['kelapa-tua','arang'],['kelapa-tua','sabut'],
      ['kopra','minyak-rbd'],['kopra','vco'],
      ['santan','tepung-kelapa'],['santan','pangan-kelapa'],
      ['arang','karbon-aktif'],['sabut','cocopeat'],['nira','gula-kelapa'],
      ['minyak-rbd','sabun-kelapa'],['minyak-rbd','kos-kelapa'],
      ['vco','suplemen-vco'],['vco','kos-kelapa'],
      ['karbon-aktif','kap-pertanian'],['tepung-kelapa','pangan-kelapa'],
      ['gula-kelapa','gula-produk'],['cocopeat','media-tanam'],
      ['suplemen-vco','kap-wellness'],['kos-kelapa','kap-kec'],['sabun-kelapa','kap-kec'],
      ['pangan-kelapa','kap-pangan'],['gula-produk','kap-pangan'],
      ['media-tanam','kap-pertanian'],['karbon-aktif','kap-lingk'],['gula-kelapa','kap-energi'],
    ],
  },

  'Rumput Laut': {
    stageLabels:   ['Budidaya / Bijah', 'Pascapanen', 'Pemrosesan', 'Produk Jadi', 'Aplikasi'],
    stageLabelsEN: ['Cultivation / Raw', 'Post-Harvest', 'Processing', 'Finished Products', 'Applications'],
    summary: { ekspor:'USD 0.74 M', impor:'USD 0.04 M', surplus:'USD 0.70 M', tahun:'2023' },
    nodes: [
      { id:'ecottonii',   s:0, r:1.0, label:'E. cottonii\n(Kappaphycus)', exp:'—',    imp:'—',    expPct:null, balance:null,      mult:1,   type:'source' },
      { id:'espinusom',   s:0, r:2.8, label:'E. spinosum',                 exp:'—',    imp:'—',    expPct:null, balance:null,      mult:null,type:'source' },
      { id:'gracilaria',  s:0, r:4.6, label:'Gracilaria sp.',              exp:'—',    imp:'—',    expPct:null, balance:null,      mult:null,type:'source' },
      { id:'rl-kering',   s:1, r:0.5, label:'Rumput Laut Kering',          exp:'0.2B', imp:'0.01B',expPct:95,   balance:'surplus', mult:2,   type:'normal' },
      { id:'atc',         s:1, r:2.0, label:'ATC\n(Alkali Treated)',        exp:'0.5B', imp:'0.02B',expPct:96,   balance:'surplus', mult:4,   type:'hilirisasi' },
      { id:'src',         s:1, r:3.6, label:'SRC (Semi-Refined\nCarrageenan)', exp:'0.8B', imp:'0.05B', expPct:94, balance:'surplus', mult:8, type:'hilirisasi-key' },
      { id:'agar-kasar',  s:1, r:5.2, label:'Agar Kasar',                  exp:'0.3B', imp:'0.01B',expPct:97,   balance:'surplus', mult:3,   type:'normal' },
      { id:'rc',          s:2, r:0.5, label:'Refined Carrageenan\n(RC)',    exp:'1.4B', imp:'0.3B', expPct:82,   balance:'surplus', mult:12,  type:'hilirisasi-key' },
      { id:'kappa',       s:2, r:2.0, label:'Karagenan Kappa',              exp:'0.9B', imp:'0.2B', expPct:82,   balance:'surplus', mult:10,  type:'hilirisasi' },
      { id:'iota',        s:2, r:3.5, label:'Karagenan Iota',               exp:'0.6B', imp:'0.1B', expPct:86,   balance:'surplus', mult:9,   type:'hilirisasi' },
      { id:'agar-fg',     s:2, r:5.0, label:'Agar Food Grade',              exp:'0.6B', imp:'0.1B', expPct:86,   balance:'surplus', mult:10,  type:'normal' },
      { id:'agar-bio',    s:2, r:6.6, label:'Agar Bakteriologis',           exp:'0.4B', imp:'0.4B', expPct:50,   balance:'balanced',mult:14,  type:'hilirisasi-key' },
      { id:'kara-fb',     s:3, r:0.5, label:'Karagenan F&B',                exp:'0.9B', imp:'0.5B', expPct:64,   balance:'surplus', mult:14,  type:'normal' },
      { id:'kara-pharma', s:3, r:1.8, label:'Karagenan Farmasi',            exp:'0.7B', imp:'0.3B', expPct:70,   balance:'surplus', mult:18,  type:'hilirisasi-key' },
      { id:'kara-kos',    s:3, r:3.2, label:'Karagenan Kosmetik',           exp:'0.3B', imp:'0.2B', expPct:60,   balance:'surplus', mult:16,  type:'hilirisasi' },
      { id:'agar-prem',   s:3, r:4.6, label:'Agar Gel Premium',             exp:'0.5B', imp:'0.3B', expPct:63,   balance:'surplus', mult:18,  type:'normal' },
      { id:'biopolimer',  s:3, r:6.0, label:'Biopolimer Industri',          exp:'0.4B', imp:'0.2B', expPct:67,   balance:'surplus', mult:20,  type:'hilirisasi-key' },
      { id:'rl-pangan',   s:4, r:0.5, label:'Industri Pangan',              exp:'1.1B', imp:'0.6B', expPct:65,   balance:'surplus', mult:null, type:'application', mkt:'USD 8.4B' },
      { id:'rl-farma',    s:4, r:2.0, label:'Farmasi & Medis',              exp:'0.6B', imp:'1.2B', expPct:33,   balance:'defisit', mult:null, type:'application-key', mkt:'USD 5.6B' },
      { id:'rl-kos',      s:4, r:3.5, label:'Kosmetik',                     exp:'0.4B', imp:'0.8B', expPct:33,   balance:'defisit', mult:null, type:'application', mkt:'USD 3.2B' },
      { id:'rl-biotek',   s:4, r:5.0, label:'Bioteknologi',                 exp:'0.2B', imp:'0.5B', expPct:29,   balance:'defisit', mult:null, type:'application-key', mkt:'USD 2.8B' },
      { id:'rl-teks',     s:4, r:6.5, label:'Tekstil & Kertas',             exp:'0.3B', imp:'0.2B', expPct:60,   balance:'surplus', mult:null, type:'application', mkt:'USD 1.6B' },
    ],
    edges: [
      ['ecottonii','rl-kering'],['ecottonii','atc'],
      ['espinusom','atc'],['espinusom','src'],
      ['gracilaria','agar-kasar'],['gracilaria','rl-kering'],
      ['rl-kering','atc'],['atc','src'],['atc','rc'],
      ['src','rc'],['src','kappa'],['src','iota'],
      ['agar-kasar','agar-fg'],['agar-kasar','agar-bio'],
      ['rc','kara-fb'],['rc','kara-pharma'],['rc','kara-kos'],
      ['kappa','kara-fb'],['kappa','kara-pharma'],
      ['iota','kara-kos'],['iota','biopolimer'],
      ['agar-fg','agar-prem'],['agar-bio','rl-farma'],['agar-bio','rl-biotek'],
      ['kara-fb','rl-pangan'],['kara-pharma','rl-farma'],
      ['kara-kos','rl-kos'],['agar-prem','rl-pangan'],['agar-prem','rl-kos'],
      ['biopolimer','rl-biotek'],['biopolimer','rl-teks'],
    ],
  },
};

// ─── English node label overrides ───
const LABELS_EN = {
  'app-rail':'Railway Tracks','app-oilgas':'Oil & Gas\nTransport','app-auto':'Automotive',
  'app-kapal':'Marine /\nShipbuilding','app-konstr':'Construction','app-tani':'Agriculture',
  'app-def':'Defense\nIndustry','app-rumah':'Household Appliances','app-medis':'Medical Devices',
  'tbs':'Fresh Fruit\nBunches (FFB)','biji-sawit':'Palm Kernel','minyak-goreng':'Cooking Oil',
  'oleokimia':'Basic Oleochemicals','surfaktan':'Surfactants','sabun-sawit':'Soap & Detergent',
  'kos-sawit':'Cosmetic Base','app-pangan':'Food Industry','app-b30':'B30/B40 Program\n(Biofuel)',
  'app-farma':'Pharmaceuticals','app-kimia':'Chemical Industry','app-teks':'Textile & Materials',
  'kelapa-segar':'Fresh Coconut','kelapa-tua':'Mature Coconut /\nHusk','kopra':'Copra',
  'santan':'Fresh Coconut Milk','arang':'Coconut Shell\nCharcoal','nira':'Coconut Sap',
  'minyak-rbd':'RBD Coconut Oil','karbon-aktif':'Activated Carbon','tepung-kelapa':'Coconut Flour',
  'gula-kelapa':'Coconut Crystal\nSugar','suplemen-vco':'VCO Supplements','kos-kelapa':'Coconut Cosmetics',
  'sabun-kelapa':'Coconut Soap\n& Detergent','pangan-kelapa':'Functional Food\nProducts',
  'gula-produk':'Organic Sugar & Syrup','media-tanam':'Coco Growing Media',
  'kap-wellness':'Health &\nWellness','kap-kec':'Beauty','kap-pangan':'Functional Food',
  'kap-pertanian':'Agriculture','kap-energi':'Green Energy','kap-lingk':'Environment',
  'rl-kering':'Dried Seaweed','agar-kasar':'Raw Agar','kappa':'Kappa Carrageenan',
  'iota':'Iota Carrageenan','agar-fg':'Food Grade Agar','agar-bio':'Bacteriological Agar',
  'kara-fb':'F&B Carrageenan','kara-pharma':'Pharma\nCarrageenan','kara-kos':'Cosmetic Carrageenan',
  'agar-prem':'Premium Agar Gel','biopolimer':'Industrial Biopolymers',
  'rl-pangan':'Food Industry','rl-farma':'Pharmaceuticals\n& Medical',
  'rl-kos':'Cosmetics','rl-biotek':'Biotechnology','rl-teks':'Textile & Paper',
};

// ─── UI string translations ───
const UI = {
  id: {
    commodity:'Komoditas', legend:'Legenda',
    legendItems:['Tersedia di Indonesia','Belum Tersedia','Industri Aplikasi','Produk Hilirisasi','Hilirisasi Utama'],
    valueAdd:'Nilai Tambah', exportRatio:'Rasio Ekspor/Impor',
    from:'DARI', to:'KE', export:'EKSPOR', import:'IMPOR', surplus:'SURPLUS',
    nodes:'node', connections:'koneksi', market:'Pasar', globalMarket:'Pasar global',
    commNames:{ Nikel:'Nikel', Sawit:'Sawit', Kelapa:'Kelapa', 'Rumput Laut':'Rumput Laut' },
    navLabel:'Hilirisasi',
    valueAddFrom:'nilai tambah dari bahan mentah',
    askTree:'Tanya tentang pohon ini', chatTitle:'Tanya Nusantara',
    popularQ:'Pertanyaan populer investor',
    chatPlaceholder:'Tanya nilai tambah, ekspor-impor, atau peluang investasi…',
    saveAnalysis:'+ simpan analisis', openWorkspace:'↗ buka workspace',
    loading:'● Membaca pohon hilirisasi…', searchPlaceholder:'Cari komoditas, tahap, produk…',
    context:'Pohon Hilirisasi',
  },
  en: {
    commodity:'Commodity', legend:'Legend',
    legendItems:['Available in Indonesia','Not Yet Available','Application Industry','Downstream Product','Key Downstream'],
    valueAdd:'Value Add', exportRatio:'Export / Import Ratio',
    from:'FROM', to:'TO', export:'EXPORT', import:'IMPORT', surplus:'SURPLUS',
    nodes:'nodes', connections:'connections', market:'Market', globalMarket:'Global market',
    commNames:{ Nikel:'Nickel', Sawit:'Palm Oil', Kelapa:'Coconut', 'Rumput Laut':'Seaweed' },
    navLabel:'Value Chain',
    valueAddFrom:'value-add from raw material',
    askTree:'Ask about this chain', chatTitle:'Ask Nusantara',
    popularQ:'Top investor questions',
    chatPlaceholder:'Ask about value-add, trade balance, or investment opportunities…',
    saveAnalysis:'+ save analysis', openWorkspace:'↗ open workspace',
    loading:'● Reading value chain…', searchPlaceholder:'Search commodity, stage, product…',
    context:'Value Chain',
  },
};

// ─── Node color tokens ───
function getNodeColors(type) {
  if (type === 'source')          return { bg:'var(--bkpm-blue-soft)',  border:'1.5px solid var(--bkpm-blue-tint)',  color:'var(--bkpm-blue-deep)' };
  if (type === 'hilirisasi')      return { bg:'var(--surface)',         border:'2px dashed var(--warn)',             color:'var(--ink)' };
  if (type === 'hilirisasi-key')  return { bg:'var(--warm-soft)',       border:'2px dashed var(--warn)',             color:'var(--ink)' };
  if (type === 'application')     return { bg:'var(--bkpm-green-soft)', border:'1.5px solid var(--bkpm-green-tint)',color:'var(--bkpm-green-deep)' };
  if (type === 'application-key') return { bg:'var(--bkpm-green-soft)', border:'2px dashed var(--warn)',             color:'var(--bkpm-green-deep)' };
  return                                 { bg:'var(--surface)',          border:'1px solid var(--line)',              color:'var(--ink)' };
}

// ─── Balance label + color ───
const BAL = {
  surplus:  { color:'var(--ok)',       label:'↑ net export' },
  defisit:  { color:'var(--err)',      label:'↓ net import' },
  balanced: { color:'var(--ink-4)',    label:'≈ seimbang'  },
};

// ─── Single tree node — combined display (exp/imp + nilai tambah) ───
function TreeNode({ node, hovered, onHover, lang = 'id' }) {
  const colors = getNodeColors(node.type);
  const isHov  = hovered === node.id;
  const rawLabel = (lang === 'en' && LABELS_EN[node.id]) ? LABELS_EN[node.id] : node.label;
  const lines  = rawLabel.split('\n');
  const bal    = node.balance ? BAL[node.balance] : null;
  const u      = UI[lang];

  return (
    <div
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        position: 'absolute', left: nx(node), top: ny(node),
        width: HT.NODE_W, minHeight: HT.NODE_H,
        background: colors.bg, border: colors.border,
        borderRadius: 'var(--radius-sm)',
        padding: '5px 8px 5px', boxSizing: 'border-box',
        cursor: 'default',
        boxShadow: isHov ? 'var(--shadow-2)' : 'var(--shadow-1)',
        transition: 'box-shadow 0.15s',
        zIndex: isHov ? 4 : 2,
        display: 'flex', flexDirection: 'column', gap: 2,
      }}
    >
      {/* Label */}
      <div style={{ fontSize: 10.5, fontWeight: 600, lineHeight: 1.3, color: colors.color }}>
        {lines.map((l, i) => <div key={i}>{l}</div>)}
      </div>

      {/* Exp/Imp values row */}
      {node.exp && node.exp !== '—' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
          <span className="mono" style={{ fontSize: 9, color: EXP_COLOR, lineHeight: 1 }}>▲ {node.exp}</span>
          {node.imp && node.imp !== '—' && (
            <span className="mono" style={{ fontSize: 9, color: IMP_COLOR, lineHeight: 1 }}>▼ {node.imp}</span>
          )}
          {bal && (
            <span className="mono" style={{ fontSize: 8, color: bal.color, marginLeft: 'auto', fontWeight: 700 }}>
              {node.balance === 'surplus' ? '↑' : node.balance === 'defisit' ? '↓' : '≈'}
            </span>
          )}
        </div>
      )}

      {/* Mini stacked trade bar */}
      {node.expPct != null && (
        <div style={{ display: 'flex', height: 3, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${node.expPct}%`, background: EXP_COLOR, minWidth: node.expPct > 0 ? 2 : 0 }} />
          <div style={{ flex: 1, background: IMP_COLOR, minWidth: node.expPct < 100 ? 2 : 0 }} />
        </div>
      )}

      {/* Market size */}
      {node.mkt && (
        <div className="mono" style={{ fontSize: 8, color: 'var(--ink-4)', lineHeight: 1, marginTop: 1 }}>
          {u.market}: {node.mkt}
        </div>
      )}

      {/* Nilai tambah badge */}
      {node.mult && (
        <div style={{
          position: 'absolute', top: -10, right: -10,
          width: 26, height: 26, borderRadius: '50%',
          background: 'var(--warn)', color: '#fff',
          fontSize: node.mult >= 10 ? 8 : 9.5, fontWeight: 700,
          fontFamily: 'IBM Plex Mono, monospace',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(200,115,26,0.45)', zIndex: 5,
        }}>{node.mult}X</div>
      )}
    </div>
  );
}

// ─── SVG connections ───
function TreeConnections({ nodes, edges, hovered }) {
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: CANVAS_W, height: CANVAS_H, pointerEvents: 'none', zIndex: 1 }}>
      {edges.map(([fId, tId]) => {
        const src = nodeMap[fId], tgt = nodeMap[tId];
        if (!src || !tgt) return null;
        const sx = nx(src) + HT.NODE_W, sy = ny(src) + HT.NODE_H / 2;
        const tx = nx(tgt),             ty = ny(tgt) + HT.NODE_H / 2;
        const cx = (sx + tx) / 2;
        const active = hovered === fId || hovered === tId;
        return (
          <path key={fId+'-'+tId}
            d={`M ${sx} ${sy} C ${cx} ${sy} ${cx} ${ty} ${tx} ${ty}`}
            fill="none"
            stroke={active ? 'var(--bkpm-blue)' : 'var(--line-strong)'}
            strokeWidth={active ? 2 : 1} opacity={active ? 1 : 0.6}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

// ─── Tooltip ───
function NodeTooltip({ nodeId, nodes, edges, stageLabels, lang = 'id' }) {
  if (!nodeId) return null;
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return null;
  const x = nx(node) + HT.NODE_W + 8, y = ny(node);
  const bal = node.balance ? BAL[node.balance] : null;
  const u = UI[lang];
  const getL = n => ((lang === 'en' && LABELS_EN[n.id]) ? LABELS_EN[n.id] : n.label).split('\n').join(' ');
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const parents  = edges.filter(([, t]) => t === nodeId).map(([s]) => nodeMap[s] ? getL(nodeMap[s]) : null).filter(Boolean);
  const children = edges.filter(([s]) => s === nodeId).map(([, t]) => nodeMap[t] ? getL(nodeMap[t]) : null).filter(Boolean);
  return (
    <div className="map-tooltip" style={{ left: x, top: y, minWidth: 200, maxWidth: 260, zIndex: 10 }}>
      <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', marginBottom: 3 }}>{stageLabels[node.s].toUpperCase()}</div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, lineHeight: 1.3, color: 'var(--ink)' }}>{getL(node)}</div>
      {node.exp && node.exp !== '—' && <div className="mono" style={{ fontSize: 10.5, color: EXP_COLOR, marginBottom: 2 }}>▲ {lang==='en'?'Export':'Ekspor'}: {node.exp}</div>}
      {node.imp && node.imp !== '—' && <div className="mono" style={{ fontSize: 10.5, color: IMP_COLOR, marginBottom: 2 }}>▼ {lang==='en'?'Import':'Impor'}: {node.imp}</div>}
      {bal && <div className="mono" style={{ fontSize: 10, color: bal.color, marginTop: 2 }}>{bal.label}</div>}
      {node.mult && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--warn)', color: '#fff', fontSize: 9, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{node.mult}X</div>
        <span style={{ fontSize: 11, color: 'var(--ink-2)' }}>{u.valueAddFrom}</span>
      </div>}
      {node.mkt && <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', marginTop: 4 }}>{u.globalMarket}: {node.mkt}</div>}
      {(parents.length > 0 || children.length > 0) && <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {parents.length > 0 && (
          <div>
            <div className="mono" style={{ fontSize: 8, color: 'var(--ink-4)', marginBottom: 3 }}>{u.from}</div>
            {parents.map(p => <div key={p} style={{ fontSize: 10.5, color: 'var(--ink-2)', lineHeight: 1.3 }}>← {p}</div>)}
          </div>
        )}
        {children.length > 0 && (
          <div>
            <div className="mono" style={{ fontSize: 8, color: 'var(--ink-4)', marginBottom: 3 }}>{u.to}</div>
            {children.map(c => <div key={c} style={{ fontSize: 10.5, color: 'var(--ink-2)', lineHeight: 1.3 }}>→ {c}</div>)}
          </div>
        )}
      </div>}
    </div>
  );
}

// ─── Zoom controls ───
function TreeControls({ onZoomIn, onZoomOut, onReset }) {
  return (
    <div onMouseDown={e => e.stopPropagation()} style={{ position: 'absolute', top: 16, right: 16, zIndex: 5, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="map-control"><button onClick={onZoomIn}>＋</button><button onClick={onZoomOut}>−</button></div>
      <div className="map-control"><button onClick={onReset} style={{ fontSize: 11 }}>⌖</button></div>
    </div>
  );
}

// ─── Left panel ───
function HilirisasiPanel({ commodity, setCommodity, lang = 'id' }) {
  const u = UI[lang];
  const COMMODITIES = ['Nikel', 'Sawit', 'Kelapa', 'Rumput Laut'];
  const COMM_COLOR  = { Nikel:'#7aabda', Sawit:'#e8a020', Kelapa:'#c8a13a', 'Rumput Laut':'#51b749' };
  const LEGEND = [
    { bg:'var(--bkpm-blue-soft)',  border:'1.5px solid var(--bkpm-blue-tint)',  label:'Tersedia di Indonesia' },
    { bg:'var(--surface-3)',       border:'1.5px dashed var(--line-strong)',     label:'Belum Tersedia' },
    { bg:'var(--bkpm-green-soft)', border:'1.5px solid var(--bkpm-green-tint)', label:'Industri Aplikasi' },
    { bg:'var(--surface)',         border:'2px dashed var(--warn)',              label:'Produk Hilirisasi' },
    { bg:'var(--warm-soft)',       border:'2px dashed var(--warn)',              label:'Hilirisasi Utama' },
  ];
  return (
    <div onMouseDown={e => e.stopPropagation()} style={{
      position: 'absolute', top: 0, left: 0, bottom: 0, width: HT.PANEL_W - 8,
      padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 14,
      background: 'var(--surface)', borderRight: '1px solid var(--line)', zIndex: 3, overflowY: 'auto',
    }}>
      <div>
        <div style={{ display:'flex', alignItems:'center', marginBottom:6 }}>
          <span className="label">{u.commodity}</span>
        </div>
        {COMMODITIES.map(c => (
          <div key={c} className={'layer-pill ' + (c === commodity ? 'active' : '')} onClick={() => setCommodity(c)}>
            <div className="layer-swatch" style={{ background: COMM_COLOR[c], opacity: c === commodity ? 1 : 0.35, borderRadius: 3 }} />
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ fontSize:12, fontWeight:500, lineHeight:1.2 }}>{u.commNames[c] || c}</div>
            </div>
            {c === commodity && <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--bkpm-blue)', flexShrink:0 }} />}
          </div>
        ))}
      </div>
      <div>
        <div className="label" style={{ marginBottom:8 }}>{u.legend}</div>
        {LEGEND.map((l, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
            <div style={{ width:20, height:14, borderRadius:3, flexShrink:0, background:l.bg, border:l.border }} />
            <span style={{ fontSize:11, color:'var(--ink-2)', lineHeight:1.3 }}>{u.legendItems[i]}</span>
          </div>
        ))}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
          <div style={{ width:20, height:20, borderRadius:'50%', background:'var(--warn)', color:'#fff', fontSize:8, fontWeight:700, fontFamily:'IBM Plex Mono, monospace', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>Nx</div>
          <span style={{ fontSize:11, color:'var(--ink-2)' }}>{u.valueAdd}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', height:6, width:20, borderRadius:2, overflow:'hidden', flexShrink:0 }}>
            <div style={{ flex:1, background: EXP_COLOR }} /><div style={{ flex:1, background: IMP_COLOR }} />
          </div>
          <span style={{ fontSize:11, color:'var(--ink-2)' }}>{u.exportRatio}</span>
        </div>
      </div>
      <div style={{ flex:1 }} />
      <div style={{ borderTop:'1px solid var(--line)' }}>
        <div style={{ padding:'10px 0', display:'flex', alignItems:'center', gap:8 }}>
          <Avatar name={DATA.user.short} color={DATA.user.color} size="sm" />
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:11, fontWeight:500 }}>{DATA.user.name}</div>
            <div className="mono" style={{ fontSize:9, color:'var(--ink-3)' }}>{DATA.user.role}</div>
          </div>
          <span className="mono" style={{ fontSize:12, color:'var(--ink-3)', marginLeft:'auto' }}>⌄</span>
        </div>
      </div>
    </div>
  );
}

// ─── Pan/zoom canvas ───
function HilirisasiTree({ commodity, setCommodity, lang = 'id' }) {
  const tree = COMMODITY_TREES[commodity] || COMMODITY_TREES['Nikel'];
  const u = UI[lang];
  const [hovered, setHovered] = useHil(null);
  const [pan,   setPan]   = useHil({ x: 0, y: 0 });
  const [scale, setScale] = useHil(0.86);
  const dragging = useHilRef(false);
  const lastXY   = useHilRef({ x: 0, y: 0 });
  const wrapRef  = useHilRef(null);

  useHilEffect(() => {
    const onMove = e => {
      if (!dragging.current) return;
      const dx = e.clientX - lastXY.current.x, dy = e.clientY - lastXY.current.y;
      lastXY.current = { x: e.clientX, y: e.clientY };
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    };
    const onUp = () => { if (!dragging.current) return; dragging.current = false; if (wrapRef.current) wrapRef.current.style.cursor = 'grab'; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  function onMouseDown(e) { if (e.button !== 0) return; dragging.current = true; lastXY.current = { x: e.clientX, y: e.clientY }; wrapRef.current.style.cursor = 'grabbing'; }
  function onWheel(e) {
    e.preventDefault();
    const rect = wrapRef.current.getBoundingClientRect(), mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.91;
    setScale(s => { const ns = Math.min(Math.max(s * factor, 0.3), 2.5); setPan(p => ({ x: mx - (mx - p.x) * (ns / s), y: my - (my - p.y) * (ns / s) })); return ns; });
  }
  function handleHover(id) { if (!dragging.current) setHovered(id); }

  const { nodes, edges, summary } = tree;
  const stageLabels = (lang === 'en' && tree.stageLabelsEN) ? tree.stageLabelsEN : tree.stageLabels;

  return (
    <div ref={wrapRef} onMouseDown={onMouseDown} onWheel={onWheel}
      style={{ position:'absolute', inset:0, overflow:'hidden', cursor:'grab', background:'var(--bg)', backgroundImage:'radial-gradient(var(--line-strong) 1px, transparent 1px)', backgroundSize:'28px 28px', userSelect:'none' }}
    >
      <div style={{ position:'absolute', top:0, left:0, width:CANVAS_W, height:CANVAS_H, transform:`translate(${pan.x}px,${pan.y}px) scale(${scale})`, transformOrigin:'0 0', willChange:'transform' }}>
        <TreeConnections nodes={nodes} edges={edges} hovered={hovered} />
        {stageLabels.map((label, i) => (
          <div key={i} style={{ position:'absolute', top:8, left: HT.PANEL_W + i * HT.COL_SPAN + 4, width:HT.NODE_W, textAlign:'center', fontSize:9, fontWeight:600, fontStyle:'italic', color: i === 4 ? 'var(--bkpm-green-deep)' : 'var(--warn)', fontFamily:'IBM Plex Mono, monospace', lineHeight:1.3 }}>{label}</div>
        ))}
        {nodes.map(node => <TreeNode key={node.id} node={node} hovered={hovered} onHover={handleHover} lang={lang} />)}
        <NodeTooltip nodeId={hovered} nodes={nodes} edges={edges} stageLabels={stageLabels} lang={lang} />
      </div>

      <HilirisasiPanel commodity={commodity} setCommodity={setCommodity} lang={lang} />
      <TreeControls onZoomIn={() => setScale(s => Math.min(s*1.18, 2.5))} onZoomOut={() => setScale(s => Math.max(s*0.85, 0.3))} onReset={() => { setPan({x:0,y:0}); setScale(0.86); }} />

      {/* Compact single-row stats card */}
      <div onMouseDown={e => e.stopPropagation()} style={{ position:'absolute', top:12, left:`calc(${HT.PANEL_W}px + (100% - ${HT.PANEL_W}px) / 2)`, transform:'translateX(-50%)', zIndex:5 }}>
        <div className="card" style={{ padding:'6px 14px', display:'flex', gap:0, alignItems:'stretch', boxShadow:'var(--shadow-2)', whiteSpace:'nowrap' }}>
          {/* Identity */}
          <div style={{ paddingRight:12, marginRight:12, borderRight:'1px solid var(--line)', display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <div className="mono" style={{ fontSize:9, color:'var(--ink-3)', letterSpacing:'0.08em' }}>{commodity.toUpperCase()} · {summary.tahun}</div>
            <div className="mono" style={{ fontSize:11, fontWeight:600, color:'var(--ink)' }}>{nodes.length} {u.nodes} · {edges.length} {u.connections}</div>
          </div>
          {/* Ekspor/Export */}
          <div style={{ paddingRight:12, marginRight:12, borderRight:'1px solid var(--line)', display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <div className="mono" style={{ fontSize:8, color: EXP_COLOR, letterSpacing:'0.06em' }}>▲ {u.export}</div>
            <div className="mono" style={{ fontSize:13, fontWeight:700, color: EXP_COLOR }}>{summary.ekspor}</div>
          </div>
          {/* Impor/Import */}
          <div style={{ paddingRight:12, marginRight:12, borderRight:'1px solid var(--line)', display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <div className="mono" style={{ fontSize:8, color: IMP_COLOR, letterSpacing:'0.06em' }}>▼ {u.import}</div>
            <div className="mono" style={{ fontSize:13, fontWeight:700, color: IMP_COLOR }}>{summary.impor}</div>
          </div>
          {/* Surplus */}
          <div style={{ paddingRight:12, marginRight:12, borderRight:'1px solid var(--line)', display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <div className="mono" style={{ fontSize:8, color:'var(--terracotta)', letterSpacing:'0.06em' }}>{u.surplus}</div>
            <div className="mono" style={{ fontSize:13, fontWeight:700, color:'var(--terracotta)' }}>{summary.surplus}</div>
          </div>
          {/* Commodity chip */}
          <div style={{ display:'flex', alignItems:'center' }}>
            <span className="chip chip-jade" style={{ fontSize:9 }}>● {u.commNames[commodity] || commodity}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Chat sidebar ───
function HilirisasiChat({ open, onToggle, hifi, commodity, lang = 'id' }) {
  const u = UI[lang];
  if (!open) {
    return (
      <button className={'btn ' + (hifi ? 'hifi' : '')} onClick={onToggle}
        style={{ position:'absolute', bottom:20, right:20, zIndex:4, background:'#1a1a2e', color:'#fff', borderColor:'#1a1a2e', padding:'10px 14px', borderRadius:24, boxShadow:'0 6px 16px rgba(20,20,40,0.2)' }}>
        💬 {u.askTree}
      </button>
    );
  }
  const context = `${u.context} · ${u.commNames[commodity] || commodity}`;
  const CHATS_EN = {
    Nikel: { q1:'At which stage is the nickel value-add highest?', a1:<>Highest value-add is in the <b>EV battery chain (67×)</b>. MHP is the critical inflection — from there value jumps to Ni-SO₄ (8×) and Batteries (67×).<div style={{display:'flex',gap:6,marginTop:8}}><Cite>Kemenperin 2021</Cite><Cite>BKPM Hilirisasi 2024</Cite></div></>, q2:'Which products are still heavily imported?', a2:'SS Rod/Bar (deficit USD 125M), SS Bolt & Nut (deficit USD 51M), and Batteries (deficit USD 2.3B) — clear import-substitution opportunities.', suggests:['Total nickel surplus in 2021?','Which special economic zones focus on nickel downstream?','NPI vs FeNi — which is better for investment?'] },
    Sawit: { q1:'Which palm oil product has the highest value-add?', a1:<>Cosmetic Base reaches <b>12×</b> value-add from FFB, followed by surfactants (10×) and oleochemicals (8×). Indonesia still dominates CPO exports — oleochemicals is the big downstream opportunity.<div style={{display:'flex',gap:6,marginTop:8}}><Cite>Kemenperin 2023</Cite><Cite>GAPKI 2023</Cite></div></>, q2:'What is the outlook for palm biodiesel?', a2:'The B30/B40 program guarantees domestic absorption. Exports USD 2.2B, minimal import deficit. Attractive margins backed by strong government policy.', suggests:['Indonesia CPO export value 2023?','Top destinations for RBD Palm Olein?','Investment incentives for oleochemicals?'] },
    Kelapa: { q1:'Which coconut product has the most potential?', a1:<>VCO delivers <b>8×</b> value-add and its derivative VCO Supplements reaches <b>15×</b>. Indonesia is the world\'s largest producer yet lags the Philippines in processed exports — a significant gap for investors.<div style={{display:'flex',gap:6,marginTop:8}}><Cite>Kemenperin 2023</Cite><Cite>BPS 2023</Cite></div></>, q2:'What is the activated carbon opportunity from coconut shells?', a2:'Indonesian coconut shell activated carbon serves water filtration, pharma, and environmental industries. Exports USD 0.9B with 6× value-add — market growing with global environmental regulation.', suggests:['Top coconut-producing regions?','Investment opportunities in organic VCO?','Export potential to European markets?'] },
    'Rumput Laut': { q1:'Why is refined carrageenan more attractive than SRC?', a1:<>RC delivers <b>12×</b> value-add from raw material — nearly 1.5× more than SRC (8×). Price: RC USD 15–25/kg vs SRC USD 3–6/kg. Indonesia dominates SRC but is small in RC — a clear white space.<div style={{display:'flex',gap:6,marginTop:8}}><Cite>KKP 2023</Cite><Cite>BKPM Seaweed</Cite></div></>, q2:'How large is the global carrageenan market?', a2:'Global carrageenan market USD 1.2B (2023), growing 5.8% CAGR. Indonesia supplies 40% of world raw seaweed but holds only 15% of processed market share — a large gap to fill.', suggests:['Top seaweed farming regions?','EU export quality standards?','Bacteriological agar opportunities in research?'] },
  };
  const CHATS = {
    Nikel: { q1:'Di tahap mana nilai tambah nikel tertinggi?', a1:<>Nilai tambah tertinggi di rantai <b>baterai EV (67×)</b>. MHP adalah titik kritis—setelah sini nilai melonjak drastis ke Ni-SO₄ (8×) dan akhirnya Batteries (67×).<div style={{display:'flex',gap:6,marginTop:8}}><Cite>Kemenperin 2021</Cite><Cite>BKPM Hilirisasi 2024</Cite></div></>, q2:'Produk mana yang masih banyak diimpor?', a2:'SS Rod/Bar (defisit USD 125M), SS Bolt & Nut (defisit USD 51M), dan Batteries (defisit USD 2.3B). Ini peluang substitusi impor yang sangat jelas.', suggests:['Berapa surplus total nikel 2021?','KEK mana yang fokus hilirisasi nikel?','Perbandingan NPI vs FeNi untuk investasi?'] },
    Sawit: { q1:'Produk sawit mana yang nilai tambahnya paling tinggi?', a1:<>Kosmetik Base mencapai <b>12×</b> nilai tambah dari TBS, diikuti surfaktan (10×) dan oleokimia (8×). Indonesia masih dominan ekspor CPO mentah—hilirisasi ke oleokimia adalah peluang besar.<div style={{display:'flex',gap:6,marginTop:8}}><Cite>Kemenperin 2023</Cite><Cite>GAPKI 2023</Cite></div></>, q2:'Bagaimana peluang biodiesel sawit?', a2:'Program B30/B40 menjamin penyerapan domestik. Ekspor USD 2.2B, defisit impor minimal. Margin menarik dengan policy support yang kuat dari pemerintah.', suggests:['Nilai ekspor CPO Indonesia 2023?','Negara tujuan RBD Palm Olein terbesar?','Insentif investasi oleokimia?'] },
    Kelapa: { q1:'Produk kelapa mana yang paling potensial?', a1:<>VCO memiliki nilai tambah <b>8×</b> dan turunannya suplemen VCO mencapai <b>15×</b>. Indonesia penghasil terbesar tapi masih kalah Filipina di ekspor produk olahan—gap besar untuk investor.<div style={{display:'flex',gap:6,marginTop:8}}><Cite>Kemenperin 2023</Cite><Cite>BPS 2023</Cite></div></>, q2:'Potensi karbon aktif dari tempurung kelapa?', a2:'Karbon aktif dari tempurung kelapa Indonesia digunakan industri filter air, farmasi, dan lingkungan. Ekspor USD 0.9B dengan nilai tambah 6×—pasar tumbuh seiring regulasi lingkungan global.', suggests:['Daerah produksi kelapa terbesar?','Peluang investasi VCO organik?','Potensi ekspor ke pasar Eropa?'] },
    'Rumput Laut': { q1:'Mengapa refined carrageenan lebih menarik dari SRC?', a1:<>RC memiliki nilai tambah <b>12×</b> dari bahan mentah—hampir 1.5× dari SRC (8×). Harga RC USD 15–25/kg vs SRC USD 3–6/kg. Indonesia dominan di SRC tapi masih kecil di RC.<div style={{display:'flex',gap:6,marginTop:8}}><Cite>KKP 2023</Cite><Cite>BKPM Seaweed</Cite></div></>, q2:'Berapa besar pasar carrageenan global?', a2:'Pasar carrageenan global USD 1.2B (2023), tumbuh 5.8% CAGR. Indonesia 40% produksi bahan baku dunia tapi hanya 15% market share produk olahan—gap besar untuk diisi.', suggests:['Daerah budidaya rumput laut terbesar?','Standar kualitas ekspor Eropa?','Peluang agar bakteriologis untuk riset?'] },
  };
  const chatData = lang === 'en' ? CHATS_EN : CHATS;
  const chat = chatData[commodity] || chatData['Nikel'];
  return (
    <div className={'col ' + (hifi ? 'hifi' : '')} style={{ width:340, borderLeft:'1px solid var(--line)', background:'var(--surface)', flexShrink:0 }}>
      <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', gap:8 }}>
        <Avatar name="AI" color="#1a1a2e" size="sm" status="online" />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:600 }}>{u.chatTitle}</div>
          <div className="mono" style={{ fontSize:9, color:'var(--ink-3)' }}>{context}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onToggle} style={{ padding:4 }}>›</button>
      </div>
      <div className="scroll col grow" style={{ padding:14, gap:14 }}>
        <div style={{ background:'var(--surface-2)', border:'1px solid var(--line)', borderRadius:8, padding:12 }}>
          <div className="label" style={{ marginBottom:6 }}>{u.popularQ}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {chat.suggests.map(s => <div key={s} style={{ fontSize:11.5, padding:'6px 8px', background:'#fff', borderRadius:6, border:'1px solid var(--line)', cursor:'pointer', lineHeight:1.4 }}>↗ {s}</div>)}
          </div>
        </div>
        <div style={{ alignSelf:'flex-end', background:'var(--surface-3)', padding:'8px 12px', borderRadius:10, fontSize:13, maxWidth:'85%' }}>{chat.q1}</div>
        <div style={{ fontSize:13, lineHeight:1.6 }}>{chat.a1}</div>
        <div style={{ alignSelf:'flex-end', background:'var(--surface-3)', padding:'8px 12px', borderRadius:10, fontSize:13, maxWidth:'85%' }}>{chat.q2}</div>
        <div style={{ fontSize:13, lineHeight:1.6 }}>{chat.a2}</div>
        <div style={{ fontSize:13, color:'var(--ink-3)' }}>{u.loading}</div>
      </div>
      <div style={{ borderTop:'1px solid var(--line)', padding:12 }}>
        <div className="card" style={{ padding:'8px 10px' }}>
          <div style={{ fontSize:12, color:'var(--ink-4)' }}>{u.chatPlaceholder}</div>
        </div>
        <div style={{ display:'flex', gap:6, marginTop:6 }}>
          <span className="chip">{u.saveAnalysis}</span>
          <span className="chip chip-terra">{u.openWorkspace}</span>
        </div>
      </div>
    </div>
  );
}

// ─── HILIRISASI PAGE ───
function HilirisasiPage({ hifi = false, chatOpen, setChatOpen, lang = 'id' }) {
  const [commodity, setCommodity] = useHil('Nikel');
  const u = UI[lang];
  return (
    <div className={'frame col ' + (hifi ? 'hifi' : '')}>
      <TopBar
        showOrg={false}
        left={
          <div style={{ display:'flex', gap:4 }}>
            {['Map', u.navLabel, 'Sectors','Opportunities','Analysts'].map((t, i) => (
              <span key={t} style={{ padding:'6px 10px', fontSize:12.5, fontWeight: i===1 ? 600 : 500, color: i===1 ? 'var(--terracotta)' : 'var(--ink-2)', borderBottom: i===1 ? '2px solid var(--terracotta)' : '2px solid transparent', cursor:'pointer' }}>{t}</span>
            ))}
          </div>
        }
        right={
          <>
            <div className="card" style={{ display:'flex', alignItems:'center', padding:'4px 10px', gap:8, background:'var(--surface-2)', minWidth:240 }}>
              <span style={{ fontSize:13, color:'var(--ink-4)' }}>🔍</span>
              <span style={{ fontSize:12.5, color:'var(--ink-4)' }}>{u.searchPlaceholder}</span>
              <div className="grow" />
              <span className="kbd">⌘K</span>
            </div>
            <button className="btn btn-sm btn-ghost">{lang === 'en' ? 'EN' : 'ID'}</button>
            <button className="btn btn-sm btn-primary">{u.startProject || 'Start a project →'}</button>
          </>
        }
      />
      <div className="row grow" style={{ minHeight:0 }}>
        <div className="grow" style={{ position:'relative', overflow:'hidden' }}>
          <HilirisasiTree commodity={commodity} setCommodity={setCommodity} lang={lang} />
        </div>
        <HilirisasiChat open={chatOpen} onToggle={() => setChatOpen(!chatOpen)} hifi={hifi} commodity={commodity} lang={lang} />
      </div>
    </div>
  );
}

function HilirisasiPageEN({ hifi, chatOpen, setChatOpen }) {
  return <HilirisasiPage hifi={hifi} chatOpen={chatOpen} setChatOpen={setChatOpen} lang="en" />;
}

Object.assign(window, { HilirisasiPage, HilirisasiPageEN });
