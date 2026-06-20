"use client";
// Pohon Hilirisasi — commodity value-chain tree page, ported from
// content/hilirisasi-screens.jsx. Interactive pan/zoom canvas with per-commodity
// trees, hover tooltips, and a live DeepSeek analyst chat (useChat) whose context
// tracks the selected commodity (issue #24). Tree data is demo data only; the 8
// language variants tie into the i18n issue (#8).

import { useState as useHil, useRef as useHilRef, useEffect as useHilEffect, useMemo, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import Link from "next/link";
import { Search, MessageCircle, ChevronRight, Plus, Minus, Crosshair, ArrowRight, ArrowUpRight, Loader2 } from "lucide-react";
import { Avatar, TopBar, comingSoon, useI18n, LangToggle } from "@/components/ui";
import { resolveCommodity } from "@/components/hilirisasi/treeActions";
import { useChat } from "@/components/chat/useChat";
import valueChains from "@/data/value-chains.json";
import { useStickToBottom, JumpToLatest } from "@/components/chat/useStickToBottom";
import { ChatTextarea, SendButton } from "@/components/chat/ChatComposer";
import { Markdown } from "@/components/chat/Markdown";

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
    stageLabelsZH: ['原矿', '冶炼 / 加工', '成型', '成品', '应用'],
    stageLabelsFR: ['Minerai brut', 'Fusion / Traitement', 'Formage', 'Produits finis', 'Applications'],
    stageLabelsNO: ['Råmalm', 'Smelting / Prosessering', 'Forming', 'Ferdige produkter', 'Anvendelser'],
    stageLabelsMS: ['Bijih Mentah', 'Peleburan / Pemprosesan', 'Pembentukan', 'Barangan Siap', 'Aplikasi'],
    stageLabelsAR: ['الخام', 'الصهر / المعالجة', 'التشكيل', 'المنتجات النهائية', 'التطبيقات'],
    stageLabelsHI: ['कच्चा अयस्क', 'गलाई / प्रसंस्करण', 'निर्माण', 'तैयार उत्पाद', 'अनुप्रयोग'],
    summary: { ekspor:'USD 18 M', impor:'USD 591.8 M', surplus:'> USD 17 M', tahun:'2021' },
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
    stageLabelsZH: ['种植 / 原料', '初级加工', '精炼与分提', '衍生产品', '应用'],
    stageLabelsFR: ['Plantation / Brut', 'Traitement primaire', 'Raffinage & Fractionnement', 'Dérivés', 'Applications'],
    stageLabelsNO: ['Plantasje / Råvare', 'Primærprosessering', 'Raffinering & Fraksjonering', 'Derivater', 'Anvendelser'],
    stageLabelsMS: ['Ladang / Bahan Mentah', 'Pemprosesan Utama', 'Penapisan & Pecahan', 'Produk Terbitan', 'Aplikasi'],
    stageLabelsAR: ['المزرعة / الخام', 'المعالجة الأولية', 'التكرير والتجزئة', 'المشتقات', 'التطبيقات'],
    stageLabelsHI: ['बागान / कच्चा', 'प्राथमिक प्रसंस्करण', 'शोधन और अंशांकन', 'व्युत्पन्न', 'अनुप्रयोग'],
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
    stageLabelsZH: ['种植 / 原料', '加工', '精炼', '成品', '应用'],
    stageLabelsFR: ['Plantation / Brut', 'Traitement', 'Raffinage', 'Produits finis', 'Applications'],
    stageLabelsNO: ['Plantasje / Råvare', 'Prosessering', 'Raffinering', 'Ferdige produkter', 'Anvendelser'],
    stageLabelsMS: ['Ladang / Bahan Mentah', 'Pemprosesan', 'Penapisan', 'Produk Siap', 'Aplikasi'],
    stageLabelsAR: ['المزرعة / الخام', 'المعالجة', 'التكرير', 'المنتجات النهائية', 'التطبيقات'],
    stageLabelsHI: ['बागान / कच्चा', 'प्रसंस्करण', 'शोधन', 'तैयार उत्पाद', 'अनुप्रयोग'],
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
    stageLabelsZH: ['养殖 / 原料', '采后处理', '加工', '成品', '应用'],
    stageLabelsFR: ['Culture / Brut', 'Post-récolte', 'Traitement', 'Produits finis', 'Applications'],
    stageLabelsNO: ['Dyrking / Råvare', 'Etter-høst', 'Prosessering', 'Ferdige produkter', 'Anvendelser'],
    stageLabelsMS: ['Penanaman / Bahan Mentah', 'Selepas Tuai', 'Pemprosesan', 'Produk Siap', 'Aplikasi'],
    stageLabelsAR: ['الزراعة / الخام', 'ما بعد الحصاد', 'المعالجة', 'المنتجات النهائية', 'التطبيقات'],
    stageLabelsHI: ['खेती / कच्चा', 'कटाई के बाद', 'प्रसंस्करण', 'तैयार उत्पाद', 'अनुप्रयोग'],
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

// ─── Chinese node label overrides ───
const LABELS_ZH = {
  // Nikel — 镍
  'sulphide':'硫化镍矿','laterite':'红土镍矿',
  'ni-scrap':'镍废料','ni-matte':'镍锍\n(40–70% Ni)',
  'sulph-conc':'硫化物精矿','mhp':'混合氢氧化物\n沉淀物','msp':'混合硫化物\n沉淀物',
  'ss-slab':'不锈钢板坯','ss-billet':'不锈钢方坯',
  'ni-metal':'金属镍','ni-powder':'镍粉','batteries':'电池',
  'ss-hrc':'不锈钢热轧板','ss-crc':'不锈钢冷轧板',
  'ss-rod':'不锈钢\n棒材','ss-ptube':'不锈钢\n管材',
  'ss-seamless':'不锈钢无缝管','ss-bolt':'不锈钢\n螺栓螺母',
  'ss-wire':'不锈钢钢丝','ni-alloy':'镍基合金',
  'plating':'电镀','welded':'不锈钢焊接管',
  // Nikel app
  'app-rail':'铁路轨道','app-oilgas':'油气运输','app-auto':'汽车工业',
  'app-kapal':'造船 / 海事','app-konstr':'建筑业','app-tani':'农业',
  'app-def':'国防工业','app-rumah':'家用电器','app-medis':'医疗器械',
  // Sawit — 棕榈油
  'cpo':'CPO\n(毛棕榈油)','pko':'PKO\n(棕榈仁油)',
  'pkm':'棕榈仁粕','pkc':'棕榈仁饼',
  'rbdolein':'RBD棕榈液油','rbdstearin':'RBD棕榈固油',
  'rbdpko':'RBD棕榈仁油','pks':'棕榈仁固油',
  'biodiesel':'生物柴油B100','margarin':'人造黄油\n与起酥油',
  'tbs':'新鲜果串\n(FFB)','biji-sawit':'棕榈仁','minyak-goreng':'食用油',
  'oleokimia':'基础油脂化工','surfaktan':'表面活性剂','sabun-sawit':'肥皂与洗涤剂',
  'kos-sawit':'化妆品基料',
  'app-pangan':'食品工业','app-b30':'B30/B40计划\n(生物燃料)',
  'app-personal':'个人护理','app-farma':'制药行业','app-kimia':'化学工业','app-teks':'纺织与材料',
  // Kelapa — 椰子
  'vco':'VCO\n(初榨椰子油)','cocopeat':'椰糠','sabut':'椰棕纤维',
  'kelapa-segar':'新鲜椰子','kelapa-tua':'老椰子 / 椰壳',
  'kopra':'椰干','santan':'椰奶','arang':'椰壳炭','nira':'椰花汁',
  'minyak-rbd':'精炼椰子油','karbon-aktif':'活性炭',
  'tepung-kelapa':'椰粉','gula-kelapa':'椰糖晶体',
  'suplemen-vco':'初榨椰油\n补充剂','kos-kelapa':'椰子化妆品',
  'sabun-kelapa':'椰子皂\n与洗涤剂','pangan-kelapa':'功能性食品\n产品',
  'gula-produk':'有机糖与糖浆','media-tanam':'椰糠种植基质',
  'kap-wellness':'健康养生','kap-kec':'美容','kap-pangan':'功能性食品',
  'kap-pertanian':'农业','kap-energi':'绿色能源','kap-lingk':'环保',
  // Rumput Laut — 海藻
  'atc':'ATC\n(碱处理)','src':'SRC\n(半精制卡拉胶)','rc':'精制卡拉胶\n(RC)',
  'rl-kering':'干海藻','agar-kasar':'粗琼脂',
  'kappa':'κ-卡拉胶','iota':'ι-卡拉胶',
  'agar-fg':'食品级琼脂','agar-bio':'细菌学琼脂',
  'kara-fb':'食饮用卡拉胶','kara-pharma':'制药级\n卡拉胶',
  'kara-kos':'美容卡拉胶','agar-prem':'高级琼脂凝胶',
  'biopolimer':'工业生物聚合物',
  'rl-pangan':'食品工业','rl-farma':'制药与医疗',
  'rl-kos':'化妆品','rl-biotek':'生物技术','rl-teks':'纺织与造纸',
};

// ─── French node label overrides ───
const LABELS_FR = {
  // Nikel — Nickel
  'sulphide':'Minerai sulfuré','laterite':'Minerai latéritique',
  'ni-scrap':'Ferraille nickel','ni-matte':'Matte de nickel\n(40–70% Ni)',
  'sulph-conc':'Concentré sulfuré','mhp':'Précipité hydroxyde\nmixte','msp':'Précipité sulfure\nmixte',
  'ss-slab':'Bramme inox','ss-billet':'Billette inox',
  'ni-metal':'Nickel métal','ni-powder':'Poudre de nickel','batteries':'Batteries',
  'ss-hrc':'Inox HRC\n(laminé chaud)','ss-crc':'Inox CRC\n(laminé froid)',
  'ss-rod':'Barre / Rond\ninox','ss-ptube':'Tube inox soudé',
  'ss-seamless':'Tube inox\nsans soudure','ss-bolt':'Boulons &\nécrous inox',
  'ss-wire':'Fil inox','ni-alloy':'Alliage nickel',
  'plating':'Nickelage','welded':'Tube inox\nsoudé',
  // Nikel app
  'app-rail':'Voies ferrées','app-oilgas':'Transport\npétrolier','app-auto':'Automobile',
  'app-kapal':'Construction\nnavale','app-konstr':'Construction','app-tani':'Agriculture',
  'app-def':'Industrie de\ndéfense','app-rumah':'Électroménager','app-medis':'Dispositifs\nmédicaux',
  // Sawit — Huile de palme
  'cpo':'CPO\n(Huile de palme brute)','pko':'PKO\n(Huile de palmiste)',
  'pkm':'Tourteau de palmiste','pkc':'Farine de palmiste',
  'rbdolein':'Oléine RBD','rbdstearin':'Stéarine RBD',
  'rbdpko':'PKO RBD','pks':'Stéarine de palmiste',
  'biodiesel':'Biodiesel B100','margarin':'Margarine &\nShortening',
  'tbs':'Régimes de\nfruits frais','biji-sawit':'Palmiste','minyak-goreng':'Huile de cuisson',
  'oleokimia':'Oléochimiques\nde base','surfaktan':'Tensioactifs','sabun-sawit':'Savon & détergent',
  'kos-sawit':'Base cosmétique',
  'app-pangan':'Industrie\nalimentaire','app-b30':'Programme B30/B40\n(Biocarburant)',
  'app-personal':'Soins personnels','app-farma':'Pharmacie','app-kimia':'Industrie chimique','app-teks':'Textile & matériaux',
  // Kelapa — Noix de coco
  'vco':'HVC\n(Huile vierge de coco)','cocopeat':'Coco peat','sabut':'Fibre de coco',
  'kelapa-segar':'Noix de coco\nfraîche','kelapa-tua':'Coco mature /\nBourre',
  'kopra':'Coprah','santan':'Lait de coco\nfrais','arang':'Charbon de\ncoque','nira':'Sève de coco',
  'minyak-rbd':'Huile de coco\nRBD','karbon-aktif':'Charbon actif',
  'tepung-kelapa':'Farine de coco','gula-kelapa':'Sucre cristal\nde coco',
  'suplemen-vco':'Compléments\nHVC','kos-kelapa':'Cosmétiques\nau coco',
  'sabun-kelapa':'Savon & détergent\nau coco','pangan-kelapa':'Aliments\nfonctionnels',
  'gula-produk':'Sucre bio & sirop','media-tanam':'Substrat coco',
  'kap-wellness':'Santé &\nBien-être','kap-kec':'Beauté','kap-pangan':'Aliments\nfonctionnels',
  'kap-pertanian':'Agriculture','kap-energi':'Énergie verte','kap-lingk':'Environnement',
  // Rumput Laut — Algues marines
  'atc':'ATC\n(Traité alcali)','src':'SRC\n(Carraghénane\nsemi-raffiné)','rc':'Carraghénane\nraffiné (RC)',
  'rl-kering':'Algue séchée','agar-kasar':'Agar brut',
  'kappa':'Carraghénane\nkappa','iota':'Carraghénane\niota',
  'agar-fg':'Agar alimentaire','agar-bio':'Agar\nbactériologique',
  'kara-fb':'Carraghénane F&B','kara-pharma':'Carraghénane\npharmaceutique',
  'kara-kos':'Carraghénane\ncosmétique','agar-prem':'Gel d\'agar\npremium',
  'biopolimer':'Biopolymères\nindustriels',
  'rl-pangan':'Industrie\nalimentaire','rl-farma':'Pharmacie & médical',
  'rl-kos':'Cosmétiques','rl-biotek':'Biotechnologie','rl-teks':'Textile & papier',
};

// ─── Norwegian node label overrides ───
const LABELS_NO = {
  'sulphide':'Sulfidmalm','laterite':'Laterittmalm',
  'ni-scrap':'Nikkelskrap','ni-matte':'Nikkelmatte\n(40–70% Ni)',
  'sulph-conc':'Sulfidkonsentrat','mhp':'Blandet hydroksid\nfelling','msp':'Blandet sulfid\nfelling',
  'ss-slab':'Rustfritt stål slab','ss-billet':'Rustfritt stål billet',
  'ni-metal':'Nikkelmetall','ni-powder':'Nikkelpulver','batteries':'Batterier',
  'ss-hrc':'Rustfritt HRC','ss-crc':'Rustfritt CRC',
  'ss-rod':'Rustfri stål\nstenger','ss-ptube':'Rustfri stål\nrør',
  'ss-seamless':'Sømløse rør (SS)','ss-bolt':'Bolter & muttere\n(SS)','ss-wire':'Ståltråd (SS)',
  'ni-alloy':'Nikkelbasert\nlegering','plating':'Belegging','welded':'Sveisede rør (SS)',
  'app-rail':'Jernbaneskinner','app-oilgas':'Olje- og\ngasstransport','app-auto':'Bilindustri',
  'app-kapal':'Skipsbygging','app-konstr':'Konstruksjon','app-tani':'Landbruk',
  'app-def':'Forsvarsindustri','app-rumah':'Husholdningsapparater','app-medis':'Medisinsk utstyr',
  'cpo':'CPO\n(Rå palmeolje)','pko':'PKO\n(Palmekjerneolje)',
  'pkm':'Palmekjernemel','pkc':'Palmekjernekake',
  'rbdolein':'RBD Palmolein','rbdstearin':'RBD Palmestearin',
  'rbdpko':'RBD PKO','pks':'Palmekjernestearin',
  'biodiesel':'Biodiesel B100','margarin':'Margarin &\nShortening',
  'tbs':'Ferske fruktbunter\n(FFB)','biji-sawit':'Palmekjerne','minyak-goreng':'Matolje',
  'oleokimia':'Basiskjemikalier','surfaktan':'Overflateaktive\nstoffer','sabun-sawit':'Såpe & Vaskemiddel',
  'kos-sawit':'Kosmetikkbase',
  'app-pangan':'Matindustri','app-b30':'B30/B40-program\n(Biodrivstoff)',
  'app-personal':'Personlig pleie','app-farma':'Farmasøytisk','app-kimia':'Kjemisk industri','app-teks':'Tekstil & Materialer',
  'vco':'VCO\n(Jomfru kokosolje)','cocopeat':'Kokosmasse','sabut':'Kokosfiber',
  'kelapa-segar':'Fersk kokosnøtt','kelapa-tua':'Moden kokosnøtt /\nSkall',
  'kopra':'Kopra','santan':'Fersk kokosmelk','arang':'Kokosskall-\nkull','nira':'Kokossaft',
  'minyak-rbd':'RBD Kokosolje','karbon-aktif':'Aktivt kull',
  'tepung-kelapa':'Kokosmel','gula-kelapa':'Kokoskristalinnsukker',
  'suplemen-vco':'VCO-tilskudd','kos-kelapa':'Kosmetikk fra kokos',
  'sabun-kelapa':'Kokosnøtt\nSåpe & Vask','pangan-kelapa':'Funksjonell mat',
  'gula-produk':'Organisk sukker & sirup','media-tanam':'Kokosdyrkingsmedium',
  'kap-wellness':'Helse &\nVelvære','kap-kec':'Skjønnhet','kap-pangan':'Funksjonell mat',
  'kap-pertanian':'Landbruk','kap-energi':'Grønn energi','kap-lingk':'Miljø',
  'atc':'ATC\n(Alkalisk behandlet)','src':'SRC\n(Semi-raffinert\nkarragén)','rc':'Raffinert karragén\n(RC)',
  'rl-kering':'Tørket sjøgress','agar-kasar':'Rå agar',
  'kappa':'Kappa-karragén','iota':'Iota-karragén',
  'agar-fg':'Matkvalitets agar','agar-bio':'Bakteriologisk agar',
  'kara-fb':'Mat & drikke\nkarragén','kara-pharma':'Farma-\nkarragén',
  'kara-kos':'Kosmetisk karragén','agar-prem':'Premium Agar gel',
  'biopolimer':'Industrielle biopolymerer',
  'rl-pangan':'Matindustri','rl-farma':'Farmasi & Medisin',
  'rl-kos':'Kosmetikk','rl-biotek':'Bioteknologi','rl-teks':'Tekstil & Papir',
};

// ─── Malay node label overrides ───
const LABELS_MS = {
  'sulphide':'Bijih sulfida','laterite':'Bijih laterit',
  'ni-scrap':'Skrap nikel','ni-matte':'Nikel matte\n(40–70% Ni)',
  'sulph-conc':'Konsentrat\nsulfida','mhp':'Mendakan\nhidroksida campuran','msp':'Mendakan\nsulfida campuran',
  'ss-slab':'Keluli tahan karat\nSlab','ss-billet':'Keluli tahan karat\nBillet',
  'ni-metal':'Logam nikel','ni-powder':'Serbuk nikel','batteries':'Bateri',
  'ss-hrc':'Keluli HRC','ss-crc':'Keluli CRC',
  'ss-rod':'Keluli tahan karat\nBatang','ss-ptube':'Keluli tahan karat\nPaip',
  'ss-seamless':'Paip nirlasan (SS)','ss-bolt':'Bolt & Nat (SS)','ss-wire':'Wayar keluli (SS)',
  'ni-alloy':'Aloi berasas nikel','plating':'Penyepuhan','welded':'Paip kimpalan (SS)',
  'app-rail':'Landasan kereta api','app-oilgas':'Pengangkutan\nMinyak & Gas','app-auto':'Automotif',
  'app-kapal':'Pembinaan kapal','app-konstr':'Pembinaan','app-tani':'Pertanian',
  'app-def':'Industri pertahanan','app-rumah':'Peralatan rumah tangga','app-medis':'Peralatan perubatan',
  'cpo':'CPO\n(Minyak sawit mentah)','pko':'PKO\n(Minyak isirung sawit)',
  'pkm':'Bungkil isirung sawit','pkc':'Kek isirung sawit',
  'rbdolein':'Olein sawit RBD','rbdstearin':'Stearin sawit RBD',
  'rbdpko':'PKO RBD','pks':'Stearin isirung sawit',
  'biodiesel':'Biodiesel B100','margarin':'Marjerin &\nShortening',
  'tbs':'Tandan Buah\nSegar (TBS)','biji-sawit':'Isirung sawit','minyak-goreng':'Minyak masak',
  'oleokimia':'Oleokimia asas','surfaktan':'Surfaktan','sabun-sawit':'Sabun & Detergen',
  'kos-sawit':'Asas kosmetik',
  'app-pangan':'Industri makanan','app-b30':'Program B30/B40\n(Biobahan api)',
  'app-personal':'Penjagaan diri','app-farma':'Farmaseutikal','app-kimia':'Industri kimia','app-teks':'Tekstil & Bahan',
  'vco':'VCO\n(Minyak kelapa dara)','cocopeat':'Sabut kelapa','sabut':'Gentian sabut',
  'kelapa-segar':'Kelapa segar','kelapa-tua':'Kelapa tua / Sabut',
  'kopra':'Kopra','santan':'Santan segar','arang':'Arang tempurung','nira':'Nira kelapa',
  'minyak-rbd':'Minyak kelapa RBD','karbon-aktif':'Karbon aktif',
  'tepung-kelapa':'Tepung kelapa','gula-kelapa':'Gula kelapa kristal',
  'suplemen-vco':'Suplemen VCO','kos-kelapa':'Kosmetik kelapa',
  'sabun-kelapa':'Sabun & detergen\nkelapa','pangan-kelapa':'Produk makanan\nfungsional',
  'gula-produk':'Gula organik & sirap','media-tanam':'Media tanaman kelapa',
  'kap-wellness':'Kesihatan &\nKebajikan','kap-kec':'Kecantikan','kap-pangan':'Makanan fungsional',
  'kap-pertanian':'Pertanian','kap-energi':'Tenaga hijau','kap-lingk':'Alam sekitar',
  'atc':'ATC\n(Rawatan alkali)','src':'SRC\n(Karagenan\nsepara-tulen)','rc':'Karagenan tulen\n(RC)',
  'rl-kering':'Rumpai laut kering','agar-kasar':'Agar kasar',
  'kappa':'Karagenan kappa','iota':'Karagenan iota',
  'agar-fg':'Agar gred makanan','agar-bio':'Agar bakteriologi',
  'kara-fb':'Karagenan\nMakanan & Minuman','kara-pharma':'Karagenan\nfarma',
  'kara-kos':'Karagenan kosmetik','agar-prem':'Gel agar premium',
  'biopolimer':'Biopolimer industri',
  'rl-pangan':'Industri makanan','rl-farma':'Farmaseutikal & Perubatan',
  'rl-kos':'Kosmetik','rl-biotek':'Bioteknologi','rl-teks':'Tekstil & Kertas',
};

// ─── Arabic node label overrides ───
const LABELS_AR = {
  'sulphide':'خام كبريتيدي','laterite':'خام لاتريتي',
  'ni-scrap':'خردة النيكل','ni-matte':'نيكل ماتي\n(40–70% Ni)',
  'sulph-conc':'مركّز كبريتيدي','mhp':'ترسيب هيدروكسيد\nمختلط','msp':'ترسيب كبريتيد\nمختلط',
  'ss-slab':'صفيحة فولاذ\nلا يصدأ','ss-billet':'قضيب فولاذ\nلا يصدأ',
  'ni-metal':'نيكل معدني','ni-powder':'مسحوق النيكل','batteries':'بطاريات',
  'ss-hrc':'فولاذ HRC\nدرفلة ساخنة','ss-crc':'فولاذ CRC\nدرفلة باردة',
  'ss-rod':'قضبان فولاذية','ss-ptube':'أنابيب فولاذية',
  'ss-seamless':'أنابيب بلا لحام','ss-bolt':'براغي وصواميل\nفولاذية','ss-wire':'أسلاك فولاذية',
  'ni-alloy':'سبيكة نيكلية','plating':'الطلاء الكهربائي','welded':'أنابيب ملحومة',
  'app-rail':'قضبان السكك\nالحديدية','app-oilgas':'نقل النفط\nوالغاز','app-auto':'صناعة السيارات',
  'app-kapal':'بناء السفن','app-konstr':'البناء','app-tani':'الزراعة',
  'app-def':'الصناعة الدفاعية','app-rumah':'الأجهزة المنزلية','app-medis':'الأجهزة الطبية',
  'cpo':'CPO\n(زيت نخيل خام)','pko':'PKO\n(زيت نواة النخيل)',
  'pkm':'كسب نواة النخيل','pkc':'كعكة نواة النخيل',
  'rbdolein':'أوليين النخيل RBD','rbdstearin':'ستيارين النخيل RBD',
  'rbdpko':'PKO RBD','pks':'ستيارين نواة النخيل',
  'biodiesel':'وقود حيوي B100','margarin':'مارجرين\nوشورتنينج',
  'tbs':'عناقيد الفاكهة\nالطازجة (FFB)','biji-sawit':'نواة النخيل','minyak-goreng':'زيت الطبخ',
  'oleokimia':'مواد كيميائية دهنية','surfaktan':'مواد فاعلة بالسطح','sabun-sawit':'صابون ومنظفات',
  'kos-sawit':'قاعدة مستحضرات\nتجميل',
  'app-pangan':'الصناعة الغذائية','app-b30':'برنامج B30/B40\n(وقود حيوي)',
  'app-personal':'العناية الشخصية','app-farma':'الصيدلة','app-kimia':'الصناعة الكيميائية','app-teks':'النسيج والمواد',
  'vco':'VCO\n(زيت جوز الهند البكر)','cocopeat':'ألياف جوز الهند','sabut':'ألياف الكوكو',
  'kelapa-segar':'جوز الهند الطازج','kelapa-tua':'جوز الهند الناضج\n/ القشرة',
  'kopra':'كوبرا','santan':'حليب جوز الهند','arang':'فحم قشرة\nجوز الهند','nira':'عصير جوز الهند',
  'minyak-rbd':'زيت جوز الهند RBD','karbon-aktif':'كربون مفعّل',
  'tepung-kelapa':'طحين جوز الهند','gula-kelapa':'سكر جوز الهند',
  'suplemen-vco':'مكملات VCO','kos-kelapa':'مستحضرات تجميل\nجوز الهند',
  'sabun-kelapa':'صابون ومنظفات\nجوز الهند','pangan-kelapa':'أغذية وظيفية',
  'gula-produk':'سكر عضوي وشراب','media-tanam':'وسيط زراعة الكوكو',
  'kap-wellness':'الصحة والعافية','kap-kec':'الجمال','kap-pangan':'الأغذية الوظيفية',
  'kap-pertanian':'الزراعة','kap-energi':'الطاقة الخضراء','kap-lingk':'البيئة',
  'atc':'ATC\n(معالجة قلوية)','src':'SRC\n(كاراجينان\nنصف مكرر)','rc':'كاراجينان مكرر\n(RC)',
  'rl-kering':'عشب البحر المجفف','agar-kasar':'أجار خام',
  'kappa':'كاراجينان كابا','iota':'كاراجينان أيوتا',
  'agar-fg':'أجار غذائي','agar-bio':'أجار بكتيريولوجي',
  'kara-fb':'كاراجينان\nغذاء ومشروبات','kara-pharma':'كاراجينان\nصيدلاني',
  'kara-kos':'كاراجينان تجميلي','agar-prem':'جل أجار ممتاز',
  'biopolimer':'بيوبوليمرات صناعية',
  'rl-pangan':'الصناعة الغذائية','rl-farma':'الصيدلة والطب',
  'rl-kos':'مستحضرات التجميل','rl-biotek':'التكنولوجيا الحيوية','rl-teks':'النسيج والورق',
};

// ─── Hindi node label overrides ───
const LABELS_HI = {
  'sulphide':'सल्फाइड अयस्क','laterite':'लेटराइट अयस्क',
  'ni-scrap':'निकेल स्क्रैप','ni-matte':'निकेल मैट\n(40–70% Ni)',
  'sulph-conc':'सल्फाइड सांद्र','mhp':'मिश्रित हाइड्रॉक्साइड\nअवक्षेप','msp':'मिश्रित सल्फाइड\nअवक्षेप',
  'ss-slab':'स्टेनलेस स्टील\nस्लैब','ss-billet':'स्टेनलेस स्टील\nबिलेट',
  'ni-metal':'निकेल धातु','ni-powder':'निकेल पाउडर','batteries':'बैटरियाँ',
  'ss-hrc':'स्टेनलेस HRC','ss-crc':'स्टेनलेस CRC',
  'ss-rod':'स्टेनलेस\nछड़ / बार','ss-ptube':'स्टेनलेस\nपाइप / ट्यूब',
  'ss-seamless':'सीमलेस पाइप (SS)','ss-bolt':'बोल्ट और नट\n(SS)','ss-wire':'स्टेनलेस तार',
  'ni-alloy':'निकेल मिश्र धातु','plating':'धातुलेपन','welded':'वेल्डेड पाइप',
  'app-rail':'रेलवे ट्रैक','app-oilgas':'तेल और गैस\nपरिवहन','app-auto':'ऑटोमोटिव',
  'app-kapal':'जहाज निर्माण','app-konstr':'निर्माण','app-tani':'कृषि',
  'app-def':'रक्षा उद्योग','app-rumah':'घरेलू उपकरण','app-medis':'चिकित्सा उपकरण',
  'cpo':'CPO\n(कच्चा पाम तेल)','pko':'PKO\n(पाम कर्नेल तेल)',
  'pkm':'पाम कर्नेल मील','pkc':'पाम कर्नेल केक',
  'rbdolein':'RBD पाम ओलिन','rbdstearin':'RBD पाम स्टीयरिन',
  'rbdpko':'RBD PKO','pks':'पाम कर्नेल स्टीयरिन',
  'biodiesel':'बायोडीजल B100','margarin':'मार्जरीन\nएवं शॉर्टनिंग',
  'tbs':'ताजे फल गुच्छे\n(FFB)','biji-sawit':'पाम कर्नेल','minyak-goreng':'खाद्य तेल',
  'oleokimia':'आधार ओलियोकेमिकल','surfaktan':'सर्फेक्टेंट','sabun-sawit':'साबुन और डिटर्जेंट',
  'kos-sawit':'कॉस्मेटिक बेस',
  'app-pangan':'खाद्य उद्योग','app-b30':'B30/B40 कार्यक्रम\n(जैव ईंधन)',
  'app-personal':'व्यक्तिगत देखभाल','app-farma':'फार्मास्यूटिकल','app-kimia':'रासायनिक उद्योग','app-teks':'वस्त्र और सामग्री',
  'vco':'VCO\n(कुंवारी नारियल तेल)','cocopeat':'नारियल पीट','sabut':'नारियल रेशा',
  'kelapa-segar':'ताजा नारियल','kelapa-tua':'परिपक्व नारियल\n/ भूसी',
  'kopra':'कोपरा','santan':'ताजा नारियल दूध','arang':'नारियल खोल\nचारकोल','nira':'नारियल सैप',
  'minyak-rbd':'RBD नारियल तेल','karbon-aktif':'सक्रिय कार्बन',
  'tepung-kelapa':'नारियल आटा','gula-kelapa':'नारियल क्रिस्टल\nशर्करा',
  'suplemen-vco':'VCO पूरक','kos-kelapa':'नारियल सौंदर्य\nप्रसाधन',
  'sabun-kelapa':'नारियल साबुन\nएवं डिटर्जेंट','pangan-kelapa':'कार्यात्मक खाद्य\nउत्पाद',
  'gula-produk':'जैविक चीनी और सिरप','media-tanam':'नारियल उगाने का माध्यम',
  'kap-wellness':'स्वास्थ्य एवं\nकल्याण','kap-kec':'सौंदर्य','kap-pangan':'कार्यात्मक भोजन',
  'kap-pertanian':'कृषि','kap-energi':'हरित ऊर्जा','kap-lingk':'पर्यावरण',
  'atc':'ATC\n(क्षार उपचारित)','src':'SRC\n(अर्ध-शुद्ध\nकैरेजीनन)','rc':'शुद्ध कैरेजीनन\n(RC)',
  'rl-kering':'सूखा समुद्री शैवाल','agar-kasar':'कच्चा अगर',
  'kappa':'कप्पा कैरेजीनन','iota':'आयोटा कैरेजीनन',
  'agar-fg':'खाद्य ग्रेड अगर','agar-bio':'बैक्टीरियोलॉजिकल अगर',
  'kara-fb':'F&B कैरेजीनन','kara-pharma':'फार्मा\nकैरेजीनन',
  'kara-kos':'कॉस्मेटिक\nकैरेजीनन','agar-prem':'प्रीमियम अगर जेल',
  'biopolimer':'औद्योगिक बायोपॉलीमर',
  'rl-pangan':'खाद्य उद्योग','rl-farma':'फार्मास्यूटिकल\nएवं चिकित्सा',
  'rl-kos':'सौंदर्य प्रसाधन','rl-biotek':'जैव प्रौद्योगिकी','rl-teks':'वस्त्र और कागज',
};

const LABELS_BY_LANG = { en: LABELS_EN, zh: LABELS_ZH, fr: LABELS_FR, no: LABELS_NO, ms: LABELS_MS, ar: LABELS_AR, hi: LABELS_HI };
function getLabelForLang(node, lang) {
  const map = LABELS_BY_LANG[lang];
  return (map && map[node.id]) ? map[node.id] : node.label;
}
function getStageLabels(tree, lang) {
  const key = { en:'stageLabelsEN', zh:'stageLabelsZH', fr:'stageLabelsFR', no:'stageLabelsNO', ms:'stageLabelsMS', ar:'stageLabelsAR', hi:'stageLabelsHI' }[lang];
  return (key && tree[key]) ? tree[key] : tree.stageLabels;
}

// ─── UI string translations ───
const UI = {
  id: {
    commodity:'Komoditas', legend:'Legenda',
    legendItems:['Tersedia di Indonesia','Belum Tersedia','Industri Aplikasi','Produk Hilirisasi','Hilirisasi Utama'],
    valueAdd:'Nilai Tambah', exportRatio:'Rasio Ekspor/Impor',
    from:'DARI', to:'KE', export:'EKSPOR', import:'IMPOR', surplus:'SURPLUS',
    exportLabel:'Ekspor', importLabel:'Impor',
    balanceLabels:{ surplus:'↑ net ekspor', defisit:'↓ net impor', balanced:'≈ seimbang' },
    nodes:'node', connections:'koneksi', market:'Pasar', globalMarket:'Pasar global',
    commNames:{ Nikel:'Nikel', Sawit:'Sawit', Kelapa:'Kelapa', 'Rumput Laut':'Rumput Laut' },
    navLabel:'Hilirisasi',
    navItems:['Peta','Hilirisasi','Sektor','Peluang','Analis'],
    langCode:'ID', startProject:'Mulai proyek',
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
    exportLabel:'Export', importLabel:'Import',
    balanceLabels:{ surplus:'↑ net export', defisit:'↓ net import', balanced:'≈ balanced' },
    nodes:'nodes', connections:'connections', market:'Market', globalMarket:'Global market',
    commNames:{ Nikel:'Nickel', Sawit:'Palm Oil', Kelapa:'Coconut', 'Rumput Laut':'Seaweed' },
    navLabel:'Value Chain',
    navItems:['Map','Value Chain','Sectors','Opportunities','Analysts'],
    langCode:'EN', startProject:'Start a project',
    valueAddFrom:'value-add from raw material',
    askTree:'Ask about this chain', chatTitle:'Ask Nusantara',
    popularQ:'Top investor questions',
    chatPlaceholder:'Ask about value-add, trade balance, or investment opportunities…',
    saveAnalysis:'+ save analysis', openWorkspace:'↗ open workspace',
    loading:'● Reading value chain…', searchPlaceholder:'Search commodity, stage, product…',
    context:'Value Chain',
  },
  zh: {
    commodity:'大宗商品', legend:'图例',
    legendItems:['印尼已有','尚未建立','应用行业','下游产品','核心下游'],
    valueAdd:'增值倍数', exportRatio:'出口 / 进口比率',
    from:'来自', to:'去往', export:'出口', import:'进口', surplus:'顺差',
    exportLabel:'出口', importLabel:'进口',
    balanceLabels:{ surplus:'↑ 净出口', defisit:'↓ 净进口', balanced:'≈ 平衡' },
    nodes:'节点', connections:'连接', market:'市场', globalMarket:'全球市场',
    commNames:{ Nikel:'镍', Sawit:'棕榈油', Kelapa:'椰子', 'Rumput Laut':'海藻' },
    navLabel:'价值链',
    navItems:['地图','价值链','行业','投资机会','分析师'],
    langCode:'中', startProject:'开始项目',
    valueAddFrom:'原材料增值',
    askTree:'咨询价值链', chatTitle:'问问努山塔拉',
    popularQ:'投资者热门问题',
    chatPlaceholder:'询问增值、贸易平衡或投资机会…',
    saveAnalysis:'+ 保存分析', openWorkspace:'↗ 打开工作区',
    loading:'● 读取价值链…', searchPlaceholder:'搜索商品、阶段、产品…',
    context:'价值链',
  },
  fr: {
    commodity:'Produit', legend:'Légende',
    legendItems:['Disponible en Indonésie','Pas encore disponible','Industrie d\'application','Produit aval','Aval clé'],
    valueAdd:'Valeur ajoutée', exportRatio:'Ratio Export / Import',
    from:'DE', to:'VERS', export:'EXPORT', import:'IMPORT', surplus:'SURPLUS',
    exportLabel:'Export', importLabel:'Import',
    balanceLabels:{ surplus:'↑ excédent net', defisit:'↓ déficit net', balanced:'≈ équilibré' },
    nodes:'nœuds', connections:'connexions', market:'Marché', globalMarket:'Marché mondial',
    commNames:{ Nikel:'Nickel', Sawit:'Huile de palme', Kelapa:'Noix de coco', 'Rumput Laut':'Algues marines' },
    navLabel:'Chaîne de valeur',
    navItems:['Carte','Chaîne de valeur','Secteurs','Opportunités','Analystes'],
    langCode:'FR', startProject:'Démarrer',
    valueAddFrom:'valeur ajoutée depuis la matière première',
    askTree:'Interroger cette chaîne', chatTitle:'Demander à Nusantara',
    popularQ:'Questions investisseurs',
    chatPlaceholder:'Posez vos questions sur la valeur ajoutée, le commerce ou les opportunités…',
    saveAnalysis:'+ sauvegarder l\'analyse', openWorkspace:'↗ ouvrir l\'espace de travail',
    loading:'● Chargement de la chaîne de valeur…', searchPlaceholder:'Rechercher produit, étape, commodité…',
    context:'Chaîne de valeur',
  },
  no: {
    commodity:'Råvare', legend:'Forklaring',
    legendItems:['Tilgjengelig i Indonesia','Ikke tilgjengelig ennå','Applikasjonsindustri','Nedstrømsprodukt','Nøkkelnedstrøms'],
    valueAdd:'Verdiskapning', exportRatio:'Eksport / Import-forhold',
    from:'FRA', to:'TIL', export:'EKSPORT', import:'IMPORT', surplus:'OVERSKUDD',
    exportLabel:'Eksport', importLabel:'Import',
    balanceLabels:{ surplus:'↑ nettoeksport', defisit:'↓ nettoimport', balanced:'≈ balansert' },
    nodes:'noder', connections:'forbindelser', market:'Marked', globalMarket:'Globalt marked',
    commNames:{ Nikel:'Nikkel', Sawit:'Palmeolje', Kelapa:'Kokosnøtt', 'Rumput Laut':'Sjøgress' },
    navLabel:'Verdikjede',
    navItems:['Kart','Verdikjede','Sektorer','Muligheter','Analytikere'],
    langCode:'NO', startProject:'Start et prosjekt',
    valueAddFrom:'verdiøkning fra råvare',
    askTree:'Spør om denne kjeden', chatTitle:'Spør Nusantara',
    popularQ:'Populære investorspørsmål',
    chatPlaceholder:'Spør om verdiskapning, handelsbalanse eller investeringsmuligheter…',
    saveAnalysis:'+ lagre analyse', openWorkspace:'↗ åpne arbeidsrom',
    loading:'● Leser verdikjede…', searchPlaceholder:'Søk råvare, trinn, produkt…',
    context:'Verdikjede',
  },
  ms: {
    commodity:'Komoditi', legend:'Petunjuk',
    legendItems:['Tersedia di Indonesia','Belum Tersedia','Industri Aplikasi','Produk Hiliran','Hiliran Utama'],
    valueAdd:'Nilai Tambah', exportRatio:'Nisbah Eksport / Import',
    from:'DARI', to:'KE', export:'EKSPORT', import:'IMPORT', surplus:'LEBIHAN',
    exportLabel:'Eksport', importLabel:'Import',
    balanceLabels:{ surplus:'↑ eksport bersih', defisit:'↓ import bersih', balanced:'≈ seimbang' },
    nodes:'nod', connections:'sambungan', market:'Pasaran', globalMarket:'Pasaran global',
    commNames:{ Nikel:'Nikel', Sawit:'Sawit', Kelapa:'Kelapa', 'Rumput Laut':'Rumpai Laut' },
    navLabel:'Rantai Nilai',
    navItems:['Peta','Rantai Nilai','Sektor','Peluang','Analis'],
    langCode:'MY', startProject:'Mulakan projek',
    valueAddFrom:'nilai tambah dari bahan mentah',
    askTree:'Tanya tentang rantai ini', chatTitle:'Tanya Nusantara',
    popularQ:'Soalan popular pelabur',
    chatPlaceholder:'Tanya tentang nilai tambah, imbangan perdagangan, atau peluang pelaburan…',
    saveAnalysis:'+ simpan analisis', openWorkspace:'↗ buka ruang kerja',
    loading:'● Membaca rantai nilai…', searchPlaceholder:'Cari komoditi, peringkat, produk…',
    context:'Rantai Nilai',
  },
  ar: {
    commodity:'السلعة', legend:'المفتاح',
    legendItems:['متوفر في إندونيسيا','غير متوفر بعد','صناعة التطبيقات','منتج مصب','مصب رئيسي'],
    valueAdd:'القيمة المضافة', exportRatio:'نسبة التصدير / الاستيراد',
    from:'من', to:'إلى', export:'تصدير', import:'استيراد', surplus:'فائض',
    exportLabel:'تصدير', importLabel:'استيراد',
    balanceLabels:{ surplus:'↑ صافي التصدير', defisit:'↓ صافي الاستيراد', balanced:'≈ متوازن' },
    nodes:'عقدة', connections:'روابط', market:'السوق', globalMarket:'السوق العالمية',
    commNames:{ Nikel:'النيكل', Sawit:'زيت النخيل', Kelapa:'جوز الهند', 'Rumput Laut':'عشب البحر' },
    navLabel:'سلسلة القيمة',
    navItems:['الخريطة','سلسلة القيمة','القطاعات','الفرص','المحللون'],
    langCode:'AR', startProject:'ابدأ مشروعًا',
    valueAddFrom:'القيمة المضافة من المواد الخام',
    askTree:'استفسر عن هذه السلسلة', chatTitle:'اسأل نوسانتارا',
    popularQ:'أسئلة المستثمرين الشائعة',
    chatPlaceholder:'اسأل عن القيمة المضافة أو التجارة أو فرص الاستثمار…',
    saveAnalysis:'+ حفظ التحليل', openWorkspace:'↗ فتح مساحة العمل',
    loading:'● جارٍ تحميل سلسلة القيمة…', searchPlaceholder:'ابحث عن سلعة، مرحلة، منتج…',
    context:'سلسلة القيمة',
  },
  hi: {
    commodity:'जिंस', legend:'किंवदंती',
    legendItems:['इंडोनेशिया में उपलब्ध','अभी उपलब्ध नहीं','अनुप्रयोग उद्योग','डाउनस्ट्रीम उत्पाद','प्रमुख डाउनस्ट्रीम'],
    valueAdd:'मूल्य वृद्धि', exportRatio:'निर्यात / आयात अनुपात',
    from:'से', to:'तक', export:'निर्यात', import:'आयात', surplus:'अधिशेष',
    exportLabel:'निर्यात', importLabel:'आयात',
    balanceLabels:{ surplus:'↑ निवल निर्यात', defisit:'↓ निवल आयात', balanced:'≈ संतुलित' },
    nodes:'नोड', connections:'संयोजन', market:'बाजार', globalMarket:'वैश्विक बाजार',
    commNames:{ Nikel:'निकेल', Sawit:'पाम तेल', Kelapa:'नारियल', 'Rumput Laut':'समुद्री शैवाल' },
    navLabel:'मूल्य श्रृंखला',
    navItems:['मानचित्र','मूल्य श्रृंखला','क्षेत्र','अवसर','विश्लेषक'],
    langCode:'HI', startProject:'प्रोजेक्ट शुरू करें',
    valueAddFrom:'कच्चे माल से मूल्य वृद्धि',
    askTree:'इस श्रृंखला के बारे में पूछें', chatTitle:'नुसंतारा से पूछें',
    popularQ:'निवेशकों के लोकप्रिय प्रश्न',
    chatPlaceholder:'मूल्य वृद्धि, व्यापार संतुलन या निवेश अवसरों के बारे में पूछें…',
    saveAnalysis:'+ विश्लेषण सहेजें', openWorkspace:'↗ कार्यक्षेत्र खोलें',
    loading:'● मूल्य श्रृंखला पढ़ रहा है…', searchPlaceholder:'जिंस, चरण, उत्पाद खोजें…',
    context:'मूल्य श्रृंखला',
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

// ─── Balance color only (labels come from UI per-lang) ───
const BAL_COLOR = {
  surplus:  'var(--ok)',
  defisit:  'var(--err)',
  balanced: 'var(--ink-4)',
};

// ─── Single tree node — combined display (exp/imp + nilai tambah) ───
function TreeNode({ node, hovered, onHover, lang = 'id' }) {
  const colors = getNodeColors(node.type);
  const isHov  = hovered === node.id;
  const rawLabel = getLabelForLang(node, lang);
  const lines  = rawLabel.split('\n');
  const balColor = node.balance ? BAL_COLOR[node.balance] : null;
  const u      = UI[lang] || UI.en;

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
          {balColor && (
            <span className="mono" style={{ fontSize: 8, color: balColor, marginLeft: 'auto', fontWeight: 700 }}>
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
  const balColor = node.balance ? BAL_COLOR[node.balance] : null;
  const u = UI[lang] || UI.en;
  const getL = n => getLabelForLang(n, lang).split('\n').join(' ');
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const parents  = edges.filter(([, t]) => t === nodeId).map(([s]) => nodeMap[s] ? getL(nodeMap[s]) : null).filter(Boolean);
  const children = edges.filter(([s]) => s === nodeId).map(([, t]) => nodeMap[t] ? getL(nodeMap[t]) : null).filter(Boolean);
  return (
    <div className="map-tooltip" style={{ left: x, top: y, minWidth: 200, maxWidth: 260, zIndex: 10 }}>
      <div className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', marginBottom: 3 }}>{stageLabels[node.s].toUpperCase()}</div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, lineHeight: 1.3, color: 'var(--ink)' }}>{getL(node)}</div>
      {node.exp && node.exp !== '—' && <div className="mono" style={{ fontSize: 10.5, color: EXP_COLOR, marginBottom: 2 }}>▲ {u.exportLabel}: {node.exp}</div>}
      {node.imp && node.imp !== '—' && <div className="mono" style={{ fontSize: 10.5, color: IMP_COLOR, marginBottom: 2 }}>▼ {u.importLabel}: {node.imp}</div>}
      {balColor && node.balance && <div className="mono" style={{ fontSize: 10, color: balColor, marginTop: 2 }}>{u.balanceLabels[node.balance]}</div>}
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
      <div className="map-control"><button onClick={onZoomIn} aria-label="Zoom in"><Plus size={16} strokeWidth={1.75} /></button><button onClick={onZoomOut} aria-label="Zoom out"><Minus size={16} strokeWidth={1.75} /></button></div>
      <div className="map-control"><button onClick={onReset} aria-label="Reset view"><Crosshair size={15} strokeWidth={1.75} /></button></div>
    </div>
  );
}

// ─── Left panel ───
function HilirisasiPanel({ commodity, setCommodity, lang = 'id' }) {
  const u = UI[lang] || UI.en;
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
    </div>
  );
}

// ─── Pan/zoom canvas ───
// forwardRef so the chat (via HilirisasiPage) can drive the diagram the same way
// MapPage drives Mapbox: focus_node pans/zooms onto a product, set_commodity
// swaps the tree (issue #24).
const HilirisasiTree = forwardRef(function HilirisasiTree({ commodity, setCommodity, lang = 'id' }, ref) {
  const tree = COMMODITY_TREES[commodity] || COMMODITY_TREES['Nikel'];
  const u = UI[lang] || UI.en;
  const [hovered, setHovered] = useHil(null);
  const [pan,   setPan]   = useHil({ x: 0, y: 0 });
  const [scale, setScale] = useHil(0.86);
  // True only for AI-driven / button moves so the transform eases smoothly;
  // cleared on the next manual drag/zoom so dragging stays 1:1 with the cursor.
  const [animate, setAnimate] = useHil(false);
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

  function onMouseDown(e) { if (e.button !== 0) return; setAnimate(false); dragging.current = true; lastXY.current = { x: e.clientX, y: e.clientY }; wrapRef.current.style.cursor = 'grabbing'; }
  function onWheel(e) {
    e.preventDefault();
    setAnimate(false);
    const rect = wrapRef.current.getBoundingClientRect(), mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.91;
    setScale(s => { const ns = Math.min(Math.max(s * factor, 0.3), 2.5); setPan(p => ({ x: mx - (mx - p.x) * (ns / s), y: my - (my - p.y) * (ns / s) })); return ns; });
  }
  function handleHover(id) { if (!dragging.current) setHovered(id); }

  // Imperative handle: pan/zoom onto a node (centred in the visible canvas, i.e.
  // to the right of the left panel) and highlight its tooltip; or reset the view.
  // `lookupCommodity` lets a combined set_commodity+focus_node call target the
  // tree we're switching to, even before the prop re-render lands.
  function focusNode(query, lookupCommodity) {
    const cTree = COMMODITY_TREES[lookupCommodity] || tree;
    const q = String(query || '').trim().toLowerCase();
    if (!q) return;
    const flat = s => String(s || '').replace(/\n/g, ' ').trim().toLowerCase();
    const node =
      cTree.nodes.find(n => n.id.toLowerCase() === q) ||
      cTree.nodes.find(n => flat(n.label) === q) ||
      cTree.nodes.find(n => flat(getLabelForLang(n, 'en')) === q) ||
      cTree.nodes.find(n => flat(n.label).includes(q) || q.includes(n.id.toLowerCase())) ||
      cTree.nodes.find(n => flat(getLabelForLang(n, 'en')).includes(q));
    if (!node) return;
    const el = wrapRef.current;
    const vw = el ? el.clientWidth : 960;
    const vh = el ? el.clientHeight : 640;
    const ts = 1.18;
    const cx = nx(node) + HT.NODE_W / 2;
    const cy = ny(node) + HT.NODE_H / 2;
    setAnimate(true);
    setScale(ts);
    setPan({ x: (HT.PANEL_W + vw) / 2 - cx * ts, y: vh / 2 - cy * ts });
    setHovered(node.id);
  }
  function resetView() { setAnimate(true); setPan({ x: 0, y: 0 }); setScale(0.86); setHovered(null); }
  useImperativeHandle(ref, () => ({ focusNode, resetView }), [commodity]);

  const { nodes, edges } = tree;
  // Headline trade comes from sourced data (data/value-chains.json); node-level
  // figures in the tree stay indicative (issue #24).
  const summary = valueChains.commodities[commodity] || tree.summary;
  const stageLabels = getStageLabels(tree, lang);

  return (
    <div ref={wrapRef} onMouseDown={onMouseDown} onWheel={onWheel}
      style={{ position:'absolute', inset:0, overflow:'hidden', cursor:'grab', background:'var(--bg)', backgroundImage:'radial-gradient(var(--line-strong) 1px, transparent 1px)', backgroundSize:'28px 28px', userSelect:'none' }}
    >
      <div style={{ position:'absolute', top:0, left:0, width:CANVAS_W, height:CANVAS_H, transform:`translate(${pan.x}px,${pan.y}px) scale(${scale})`, transformOrigin:'0 0', transition: animate ? 'transform 0.55s cubic-bezier(0.22,1,0.36,1)' : 'none', willChange:'transform' }}>
        <TreeConnections nodes={nodes} edges={edges} hovered={hovered} />
        {stageLabels.map((label, i) => (
          <div key={i} style={{ position:'absolute', top:8, left: HT.PANEL_W + i * HT.COL_SPAN + 4, width:HT.NODE_W, textAlign:'center', fontSize:9, fontWeight:600, fontStyle:'italic', color: i === 4 ? 'var(--bkpm-green-deep)' : 'var(--warn)', fontFamily:'IBM Plex Mono, monospace', lineHeight:1.3 }}>{label}</div>
        ))}
        {nodes.map(node => <TreeNode key={node.id} node={node} hovered={hovered} onHover={handleHover} lang={lang} />)}
        <NodeTooltip nodeId={hovered} nodes={nodes} edges={edges} stageLabels={stageLabels} lang={lang} />
      </div>

      <HilirisasiPanel commodity={commodity} setCommodity={setCommodity} lang={lang} />
      <TreeControls onZoomIn={() => { setAnimate(true); setScale(s => Math.min(s*1.18, 2.5)); }} onZoomOut={() => { setAnimate(true); setScale(s => Math.max(s*0.85, 0.3)); }} onReset={resetView} />

      {/* Compact single-row stats card */}
      <div onMouseDown={e => e.stopPropagation()} style={{ position:'absolute', top:12, left:`calc(${HT.PANEL_W}px + (100% - ${HT.PANEL_W}px) / 2)`, transform:'translateX(-50%)', zIndex:5 }}>
        <div className="card" style={{ padding:'6px 14px', display:'flex', gap:0, alignItems:'stretch', boxShadow:'var(--shadow-2)', whiteSpace:'nowrap' }}>
          {/* Identity (hover for data source) */}
          <div title={summary.source ? `Sumber: ${summary.source}` : undefined} style={{ paddingRight:12, marginRight:12, borderRight:'1px solid var(--line)', display:'flex', flexDirection:'column', justifyContent:'center', cursor: summary.source ? 'help' : 'default' }}>
            <div className="mono" style={{ fontSize:9, color:'var(--ink-3)', letterSpacing:'0.08em' }}>{(u.commNames[commodity] || commodity).toUpperCase()} · {summary.tahun}</div>
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
});

// ─── Popular investor questions (seed prompts for the live chat) ───
// Per language × commodity. These used to head a scripted Q&A; now they just
// pre-fill the composer and fire a real DeepSeek turn (issue #24). The reply
// language is driven by the chat `lang`, so the seed text matches the UI.
const SUGGESTS = {
  id: {
    Nikel:        ['Berapa surplus total nikel 2021?', 'KEK mana yang fokus hilirisasi nikel?', 'Perbandingan NPI vs FeNi untuk investasi?'],
    Sawit:        ['Nilai ekspor CPO Indonesia 2023?', 'Negara tujuan RBD Palm Olein terbesar?', 'Insentif investasi oleokimia?'],
    Kelapa:       ['Daerah produksi kelapa terbesar?', 'Peluang investasi VCO organik?', 'Potensi ekspor ke pasar Eropa?'],
    'Rumput Laut':['Daerah budidaya rumput laut terbesar?', 'Standar kualitas ekspor Eropa?', 'Peluang agar bakteriologis untuk riset?'],
  },
  en: {
    Nikel:        ['Total nickel surplus in 2021?', 'Which special economic zones focus on nickel downstream?', 'NPI vs FeNi — which is better for investment?'],
    Sawit:        ['Indonesia CPO export value 2023?', 'Top destinations for RBD Palm Olein?', 'Investment incentives for oleochemicals?'],
    Kelapa:       ['Top coconut-producing regions?', 'Investment opportunities in organic VCO?', 'Export potential to European markets?'],
    'Rumput Laut':['Top seaweed farming regions?', 'EU export quality standards?', 'Bacteriological agar opportunities in research?'],
  },
  zh: {
    Nikel:        ['2021年镍总顺差是多少？', '哪些经济特区专注镍下游？', 'NPI与FeNi投资对比？'],
    Sawit:        ['2023年印尼CPO出口额？', 'RBD棕榈液油主要目的地？', '油脂化工投资激励措施？'],
    Kelapa:       ['印尼最大椰子产区？', '有机初榨椰子油投资机会？', '向欧洲市场出口潜力？'],
    'Rumput Laut':['最大海藻养殖区域？', '欧盟出口质量标准？', '科研用细菌学琼脂机会？'],
  },
  fr: {
    Nikel:        ['Surplus total nickel 2021 ?', 'Quelles ZES ciblent l\'aval nickel ?', 'NPI vs FeNi — lequel privilégier ?'],
    Sawit:        ['Valeur export CPO indonésien 2023 ?', 'Principales destinations RBD Palm Olein ?', 'Incitations à l\'investissement oléochimique ?'],
    Kelapa:       ['Principales régions productrices de noix de coco ?', 'Opportunités d\'investissement HVC bio ?', 'Potentiel export vers les marchés européens ?'],
    'Rumput Laut':['Principales régions de culture d\'algues ?', 'Normes de qualité export UE ?', 'Opportunités agar bactériologique pour la recherche ?'],
  },
  no: {
    Nikel:        ['Totalt nikkeloverskudd 2021?', 'Hvilke SEZ fokuserer på nikkel nedstrøms?', 'NPI vs FeNi — hva er best for investering?'],
    Sawit:        ['CPO eksportverdi Indonesia 2023?', 'Topp destinasjoner RBD Palm Olein?', 'Investeringsincitamenter oleokjemikalier?'],
    Kelapa:       ['Topp kokosnøttproduserende regioner?', 'Investeringsmuligheter organisk VCO?', 'Eksportpotensial til europeiske markeder?'],
    'Rumput Laut':['Topp sjøgressdyrkingsregioner?', 'EU eksportkvalitetsstandarder?', 'Bakteriologisk agarmuligheter i forskning?'],
  },
  ms: {
    Nikel:        ['Jumlah lebihan nikel 2021?', 'KEZ mana fokus hiliran nikel?', 'NPI vs FeNi — mana lebih baik untuk pelaburan?'],
    Sawit:        ['Nilai eksport CPO Indonesia 2023?', 'Destinasi utama RBD Palm Olein?', 'Insentif pelaburan oleokimia?'],
    Kelapa:       ['Kawasan pengeluaran kelapa terbesar?', 'Peluang pelaburan VCO organik?', 'Potensi eksport ke pasaran Eropah?'],
    'Rumput Laut':['Kawasan penanaman rumpai laut terbesar?', 'Piawaian kualiti eksport EU?', 'Peluang agar bakteriologi untuk penyelidikan?'],
  },
  ar: {
    Nikel:        ['إجمالي فائض النيكل 2021؟', 'أي المناطق الاقتصادية الخاصة تركز على مصب النيكل؟', 'NPI مقابل FeNi — أيهما أفضل للاستثمار؟'],
    Sawit:        ['قيمة صادرات CPO إندونيسيا 2023؟', 'أهم وجهات RBD Palm Olein؟', 'حوافز الاستثمار في الكيماويات الدهنية؟'],
    Kelapa:       ['أبرز مناطق إنتاج جوز الهند؟', 'فرص الاستثمار في VCO العضوي؟', 'إمكانية التصدير إلى الأسواق الأوروبية؟'],
    'Rumput Laut':['أبرز مناطق زراعة عشب البحر؟', 'معايير جودة التصدير الأوروبي؟', 'فرص الأجار البكتيريولوجي للبحوث؟'],
  },
  hi: {
    Nikel:        ['2021 में कुल निकेल अधिशेष?', 'कौन से SEZ निकेल डाउनस्ट्रीम पर ध्यान देते हैं?', 'NPI बनाम FeNi — निवेश के लिए कौन बेहतर?'],
    Sawit:        ['इंडोनेशिया CPO निर्यात मूल्य 2023?', 'RBD Palm Olein के शीर्ष गंतव्य?', 'ओलियोकेमिकल निवेश प्रोत्साहन?'],
    Kelapa:       ['शीर्ष नारियल उत्पादन क्षेत्र?', 'जैविक VCO में निवेश के अवसर?', 'यूरोपीय बाजारों में निर्यात संभावना?'],
    'Rumput Laut':['शीर्ष समुद्री शैवाल खेती क्षेत्र?', 'EU निर्यात गुणवत्ता मानक?', 'अनुसंधान के लिए बैक्टीरियोलॉजिकल अगर अवसर?'],
  },
};

// Build the English grounding context the assistant sees: which commodity tree
// is on screen, its trade summary, and its highest value-add products — so the
// reply stays tied to what the user is looking at. Reply language is handled by
// the API from `lang`, so this stays English like the map context (issue #24).
function buildHilirisasiContext(commodity) {
  const tree = COMMODITY_TREES[commodity] || COMMODITY_TREES['Nikel'];
  const topValueAdd = [...tree.nodes]
    .filter((n) => n.mult)
    .sort((a, b) => b.mult - a.mult)
    .slice(0, 5)
    .map((n) => `${n.label.replace(/\n/g, ' ')} (${n.mult}×)`)
    .join(', ');
  const s = valueChains.commodities[commodity] || tree.summary;
  // id — name list so focus_node can target a real node by id.
  const nodeList = tree.nodes
    .map((n) => `${n.id} — ${n.label.replace(/\n/g, ' ')}`)
    .join("; ");
  return (
    `User is viewing the Wilaya value-chain (hilirisasi/downstreaming) tree for ${commodity}. ` +
    `Trade summary (${s.tahun}${s.source ? `, source: ${s.source}` : ""}): exports ${s.ekspor}, imports ${s.impor}, surplus ${s.surplus}. ` +
    `The tree maps ${tree.nodes.length} products across ${tree.stageLabels.length} stages, from raw material to finished applications. ` +
    `Highest value-add products (multiplier over raw material): ${topValueAdd}. ` +
    `Answer about value-add, downstream processing, trade balance and investment opportunities along this chain; keep numbers consistent with this summary. ` +
    `Nodes you can focus_node on (id — name): ${nodeList}.`
  );
}

// ─── Chat sidebar — LIVE via DeepSeek (issue #24) ───
// Mirrors MapChat: presentational, the chat state lives in HilirisasiPage and is
// passed in as `chat` so the context tracks the selected commodity.
function HilirisasiChat({ open, onToggle, hifi, commodity, lang = 'id', chat }) {
  const u = UI[lang] || UI.en;
  const { t } = useI18n();
  const { messages, input, setInput, send, loading } = chat;
  const { containerRef, onScroll, scrollToBottom, isFollowing } = useStickToBottom(messages);
  const composerRef = useRef(null);
  // Sending (composer or a suggestion) snaps to the bottom and re-engages following.
  const handleSend = (text) => { scrollToBottom(); send(text); };
  const suggests = (SUGGESTS[lang] || SUGGESTS.id)[commodity] || SUGGESTS.id.Nikel;

  if (!open) {
    return (
      <button className={'btn ' + (hifi ? 'hifi' : '')} onClick={onToggle}
        style={{ position:'absolute', bottom:20, right:20, zIndex:4, background:'#1a1a2e', color:'#fff', borderColor:'#1a1a2e', padding:'10px 14px', borderRadius:24, boxShadow:'0 6px 16px rgba(20,20,40,0.2)' }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}><MessageCircle size={15} strokeWidth={1.75} /> {u.askTree}</span>
      </button>
    );
  }

  const contextLabel = `${u.context} · ${u.commNames[commodity] || commodity}`;
  return (
    <div className={'col ' + (hifi ? 'hifi' : '')} style={{ width:340, borderLeft:'1px solid var(--line)', background:'var(--surface)', flexShrink:0, position:'relative' }}>
      <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', gap:8 }}>
        <Avatar name="AI" color="#1a1a2e" size="sm" status="online" />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:600 }}>{u.chatTitle}</div>
          <div className="mono" style={{ fontSize:9, color:'var(--ink-3)' }}>{contextLabel}</div>
        </div>
        <button className="btn btn-ghost btn-sm ui-icon-btn" onClick={onToggle} aria-label="Collapse chat"><ChevronRight size={16} strokeWidth={1.75} /></button>
      </div>

      <div ref={containerRef} onScroll={onScroll} className="scroll col grow" style={{ padding:14, gap:14 }}>
        {messages.length === 0 && (
          <div style={{ background:'var(--surface-2)', border:'1px solid var(--line)', borderRadius:8, padding:12 }}>
            <div className="label" style={{ marginBottom:6 }}>{u.popularQ}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {suggests.map((s) => (
                <div key={s} onClick={() => !loading && handleSend(s)}
                  style={{ display:'flex', alignItems:'flex-start', gap:6, fontSize:11.5, padding:'6px 8px', background:'#fff', borderRadius:6, border:'1px solid var(--line)', cursor: loading ? 'default' : 'pointer', lineHeight:1.4 }}>
                  <ArrowUpRight size={14} strokeWidth={1.75} style={{ flexShrink:0, marginTop:1, color:'var(--ink-3)' }} /> {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} style={{ alignSelf:'flex-end', background:'var(--surface-3)', padding:'8px 12px', borderRadius:10, fontSize:13, maxWidth:'85%', whiteSpace:'pre-wrap' }}>
              {m.content}
            </div>
          ) : (
            <div key={i} style={{ fontSize:13, lineHeight:1.6 }}>
              {m.content ? (
                <Markdown>{m.content}</Markdown>
              ) : loading ? (
                <span style={{ display:'inline-flex', alignItems:'center', gap:7, color:'var(--ink-3)' }}>
                  <Loader2 size={14} strokeWidth={2} className="spin" /> {u.loading}
                </span>
              ) : ''}
            </div>
          )
        )}
      </div>

      <JumpToLatest show={!isFollowing && messages.length > 0} onClick={() => scrollToBottom('smooth')} label={t('chat.toLatest')} anchorRef={composerRef} />

      <div ref={composerRef} style={{ borderTop:'1px solid var(--line)', padding:12 }}>
        <div className="card" style={{ padding:'8px 10px', display:'flex', alignItems:'flex-end', gap:8 }}>
          <ChatTextarea
            value={input}
            onChange={setInput}
            onSend={() => handleSend()}
            submitOn="enter"
            rows={1}
            maxHeight={120}
            placeholder={u.chatPlaceholder}
            style={{ flex:1, border:'none', outline:'none', resize:'none', fontSize:12.5, fontFamily:'Inter, sans-serif', background:'transparent', color:'var(--ink)' }}
          />
          <SendButton className="btn btn-sm btn-primary" loading={loading} input={input} onSend={() => handleSend()} />
        </div>
        <div style={{ display:'flex', gap:6, marginTop:6 }}>
          <span className="chip" style={{ cursor:'pointer' }} onClick={() => comingSoon(u.saveAnalysis)}>{u.saveAnalysis}</span>
          <Link href="/workspace" style={{ textDecoration:'none' }}>
            <span className="chip chip-terra" style={{ cursor:'pointer' }}>{u.openWorkspace}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── HILIRISASI PAGE ───
function HilirisasiPage({ hifi = false, chatOpen: chatOpenProp, setChatOpen: setChatOpenProp, lang: langProp }) {
  const [commodity, setCommodity] = useHil('Nikel');
  // Standalone route: own the chat panel state when no parent controls it.
  const [chatOpenState, setChatOpenState] = useHil(true);
  const chatOpen = chatOpenProp ?? chatOpenState;
  const setChatOpen = setChatOpenProp || setChatOpenState;
  // Follow the global ID/EN/中 toggle unless a parent pins an explicit language
  // (the HilirisasiPageEN/ZH/… wrappers do, for the extra demo locales).
  const { lang: globalLang } = useI18n();
  const lang = langProp || (UI[globalLang] ? globalLang : 'id');
  const u = UI[lang] || UI.en;
  const treeRef = useRef(null);

  // Live DeepSeek chat (issue #24). Context tracks the selected commodity so the
  // assistant's answers stay tied to the value-chain tree on screen.
  const context = useMemo(() => buildHilirisasiContext(commodity), [commodity]);

  // Dispatch the assistant's tool calls onto the real diagram, like MapPage does
  // for the map: set_commodity swaps the tree, focus_node pans/zooms onto a node
  // (in the freshly-switched tree when both are called together).
  const onAction = useCallback((actions) => {
    const batch = Array.isArray(actions) ? actions : [actions];
    const commCall = batch.find((a) => a?.name === "set_commodity");
    const focusCall = batch.find((a) => a?.name === "focus_node");

    let target = null;
    const apply = (raw) => {
      const c = resolveCommodity(raw);
      if (c) { target = c; setCommodity(c); }
    };
    if (commCall) apply(commCall.args?.commodity);
    if (focusCall && focusCall.args?.commodity) apply(focusCall.args.commodity);

    if (focusCall) treeRef.current?.focusNode(focusCall.args?.node, target);
    else if (commCall) treeRef.current?.resetView();
  }, []);

  const chat = useChat({ context, lang, treeTools: true, onAction });
  return (
    <div className={'frame col ' + (hifi ? 'hifi' : '')}>
      <TopBar
        showOrg={false}
        left={
          <div style={{ display:'flex', gap:4 }}>
            {u.navItems.map((t, i) => {
              const style = { padding:'6px 10px', fontSize:12.5, fontWeight: i===1 ? 600 : 500, color: i===1 ? 'var(--terracotta)' : 'var(--ink-2)', borderBottom: i===1 ? '2px solid var(--terracotta)' : '2px solid transparent', cursor:'pointer' };
              if (i === 0) return <Link key={t} href="/map" style={{ ...style, textDecoration:'none' }}>{t}</Link>;
              if (i === 1) return <span key={t} style={style}>{t}</span>;
              return <span key={t} onClick={() => comingSoon(t)} style={style}>{t}</span>;
            })}
          </div>
        }
        right={
          <>
            <div className="card" onClick={() => comingSoon('Search')} style={{ display:'flex', alignItems:'center', padding:'4px 10px', gap:8, background:'var(--surface-2)', minWidth:240, cursor:'pointer' }}>
              <Search size={14} strokeWidth={1.75} style={{ color:'var(--ink-4)' }} />
              <span style={{ fontSize:12.5, color:'var(--ink-4)' }}>{u.searchPlaceholder}</span>
              <div className="grow" />
              <span className="kbd">⌘K</span>
            </div>
            <LangToggle />
            <Link href="/workspace" style={{ textDecoration:'none' }}>
              <button className="btn btn-sm btn-primary">{u.startProject} <ArrowRight size={14} strokeWidth={1.75} /></button>
            </Link>
          </>
        }
      />
      <div className="row grow" style={{ minHeight:0 }}>
        <div className="grow" style={{ position:'relative', overflow:'hidden' }}>
          <HilirisasiTree ref={treeRef} commodity={commodity} setCommodity={setCommodity} lang={lang} />
        </div>
        <HilirisasiChat open={chatOpen} onToggle={() => setChatOpen(!chatOpen)} hifi={hifi} commodity={commodity} lang={lang} chat={chat} />
      </div>
    </div>
  );
}

function HilirisasiPageEN({ hifi, chatOpen, setChatOpen }) {
  return <HilirisasiPage hifi={hifi} chatOpen={chatOpen} setChatOpen={setChatOpen} lang="en" />;
}

function HilirisasiPageZH({ hifi, chatOpen, setChatOpen }) {
  return <HilirisasiPage hifi={hifi} chatOpen={chatOpen} setChatOpen={setChatOpen} lang="zh" />;
}

function HilirisasiPageFR({ hifi, chatOpen, setChatOpen }) {
  return <HilirisasiPage hifi={hifi} chatOpen={chatOpen} setChatOpen={setChatOpen} lang="fr" />;
}

function HilirisasiPageNO({ hifi, chatOpen, setChatOpen }) {
  return <HilirisasiPage hifi={hifi} chatOpen={chatOpen} setChatOpen={setChatOpen} lang="no" />;
}

function HilirisasiPageMS({ hifi, chatOpen, setChatOpen }) {
  return <HilirisasiPage hifi={hifi} chatOpen={chatOpen} setChatOpen={setChatOpen} lang="ms" />;
}

function HilirisasiPageAR({ hifi, chatOpen, setChatOpen }) {
  return <HilirisasiPage hifi={hifi} chatOpen={chatOpen} setChatOpen={setChatOpen} lang="ar" />;
}

function HilirisasiPageHI({ hifi, chatOpen, setChatOpen }) {
  return <HilirisasiPage hifi={hifi} chatOpen={chatOpen} setChatOpen={setChatOpen} lang="hi" />;
}

export { HilirisasiPage, HilirisasiPageEN, HilirisasiPageZH, HilirisasiPageFR, HilirisasiPageNO, HilirisasiPageMS, HilirisasiPageAR, HilirisasiPageHI };
