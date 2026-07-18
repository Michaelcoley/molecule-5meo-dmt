import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SDF_DIR = join(HERE, '..', 'src', 'data', 'sdf');
const PROPS_OUT = join(HERE, 'molecule-props.json');
mkdirSync(SDF_DIR, { recursive: true });

// id, display name, full name, category, candidate PubChem names (tried in order)
const LIST = [
  // Tryptamines
  ['5meo-dmt','5-MeO-DMT','5-methoxy-N,N-dimethyltryptamine','Tryptamines',['5-MeO-DMT','1832']],
  ['dmt','DMT','N,N-dimethyltryptamine','Tryptamines',['N,N-Dimethyltryptamine','6089']],
  ['psilocybin','Psilocybin','psilocybin','Tryptamines',['Psilocybin','10624']],
  ['psilocin','Psilocin','4-hydroxy-N,N-dimethyltryptamine','Tryptamines',['Psilocin','4980']],
  ['bufotenin','Bufotenin','5-hydroxy-N,N-dimethyltryptamine','Tryptamines',['Bufotenin','5-HO-DMT','10257']],
  ['det','DET','N,N-diethyltryptamine','Tryptamines',['N,N-Diethyltryptamine','Diethyltryptamine']],
  ['dpt','DPT','N,N-dipropyltryptamine','Tryptamines',['N,N-Dipropyltryptamine','Dipropyltryptamine']],
  ['met','MET','N-methyl-N-ethyltryptamine','Tryptamines',['N-ethyl-N-methyltryptamine','Methylethyltryptamine']],
  ['mipt','MiPT','N-methyl-N-isopropyltryptamine','Tryptamines',['N-methyl-N-isopropyltryptamine','N-isopropyl-N-methyltryptamine']],
  ['dipt','DiPT','N,N-diisopropyltryptamine','Tryptamines',['N,N-Diisopropyltryptamine','Diisopropyltryptamine']],
  ['4aco-dmt','4-AcO-DMT','O-acetylpsilocin','Tryptamines',['O-Acetylpsilocin','4-Acetoxy-DMT','4-AcO-DMT']],
  ['4ho-met','4-HO-MET','4-hydroxy-N-methyl-N-ethyltryptamine','Tryptamines',['Metocin','4-hydroxy-N-ethyl-N-methyltryptamine','4-HO-MET']],
  ['4ho-mipt','4-HO-MiPT','4-hydroxy-N-methyl-N-isopropyltryptamine','Tryptamines',['Miprocin','4-hydroxy-N-methyl-N-isopropyltryptamine','4-HO-MiPT']],
  // Lysergamides
  ['lsd','LSD','lysergic acid diethylamide','Lysergamides',['Lysergide','LSD','5761']],
  ['lsa','LSA','ergine','Lysergamides',['Ergine','Lysergic acid amide','442133']],
  ['al-lad','AL-LAD','6-allyl-6-nor-LSD','Lysergamides',['AL-LAD','6-allyl-6-nor-lysergic acid diethylamide']],
  ['eth-lad','ETH-LAD','6-ethyl-6-nor-LSD','Lysergamides',['ETH-LAD','6-ethyl-6-nor-lysergic acid diethylamide']],
  ['pro-lad','PRO-LAD','6-propyl-6-nor-LSD','Lysergamides',['PRO-LAD','6-propyl-6-nor-lysergic acid diethylamide']],
  ['1p-lsd','1P-LSD','1-propionyl-LSD','Lysergamides',['1P-LSD','1-propionyl-lysergic acid diethylamide']],
  ['1cp-lsd','1cP-LSD','1-cyclopropanoyl-LSD','Lysergamides',['1cP-LSD','1-cyclopropanoyl-lysergic acid diethylamide']],
  ['1v-lsd','1V-LSD','1-valeroyl-LSD','Lysergamides',['1V-LSD','1-valeroyl-lysergic acid diethylamide']],
  // Phenethylamines
  ['mescaline','Mescaline','3,4,5-trimethoxyphenethylamine','Phenethylamines',['Mescaline','4076']],
  ['2c-b','2C-B','4-bromo-2,5-dimethoxyphenethylamine','Phenethylamines',['2C-B','4-Bromo-2,5-dimethoxyphenethylamine','98527']],
  ['2c-c','2C-C','4-chloro-2,5-dimethoxyphenethylamine','Phenethylamines',['2C-C','4-Chloro-2,5-dimethoxyphenethylamine']],
  ['2c-d','2C-D','4-methyl-2,5-dimethoxyphenethylamine','Phenethylamines',['2C-D','2,5-Dimethoxy-4-methylphenethylamine']],
  ['2c-e','2C-E','4-ethyl-2,5-dimethoxyphenethylamine','Phenethylamines',['2C-E','2,5-Dimethoxy-4-ethylphenethylamine']],
  ['2c-i','2C-I','4-iodo-2,5-dimethoxyphenethylamine','Phenethylamines',['2C-I','4-Iodo-2,5-dimethoxyphenethylamine']],
  ['2c-p','2C-P','4-propyl-2,5-dimethoxyphenethylamine','Phenethylamines',['2C-P','2,5-Dimethoxy-4-propylphenethylamine']],
  ['2c-t-2','2C-T-2','2,5-dimethoxy-4-ethylthiophenethylamine','Phenethylamines',['2C-T-2']],
  ['2c-t-7','2C-T-7','2,5-dimethoxy-4-propylthiophenethylamine','Phenethylamines',['2C-T-7']],
  ['dom','DOM','2,5-dimethoxy-4-methylamphetamine','Phenethylamines',['DOM','STP','2,5-Dimethoxy-4-methylamphetamine']],
  ['dob','DOB','2,5-dimethoxy-4-bromoamphetamine','Phenethylamines',['DOB','Brolamfetamine','2,5-Dimethoxy-4-bromoamphetamine']],
  ['doc','DOC','2,5-dimethoxy-4-chloroamphetamine','Phenethylamines',['542036','2,5-Dimethoxy-4-chloroamphetamine']],
  ['doi','DOI','2,5-dimethoxy-4-iodoamphetamine','Phenethylamines',['DOI','2,5-Dimethoxy-4-iodoamphetamine']],
  ['25i-nbome','25I-NBOMe','2C-I-NBOMe','Phenethylamines',['25I-NBOMe','2C-I-NBOMe']],
  ['25b-nbome','25B-NBOMe','2C-B-NBOMe','Phenethylamines',['25B-NBOMe','2C-B-NBOMe']],
  ['25c-nbome','25C-NBOMe','2C-C-NBOMe','Phenethylamines',['25C-NBOMe','2C-C-NBOMe']],
  // Other
  ['salvinorin-a','Salvinorin A','salvinorin A','Other',['Salvinorin A','128563']],
  ['muscimol','Muscimol','muscimol','Other',['Muscimol','4266']],
  ['ibotenic-acid','Ibotenic Acid','ibotenic acid','Other',['Ibotenic acid','1990']],
  // Dissociatives
  ['ketamine','Ketamine','ketamine','Dissociatives',['Ketamine','3821']],
  ['esketamine','Esketamine','(S)-ketamine','Dissociatives',['Esketamine','182137']],
  ['pcp','PCP','phencyclidine','Dissociatives',['Phencyclidine','6468']],
  ['mxe','MXE','methoxetamine','Dissociatives',['Methoxetamine','MXE']],
  ['dxm','DXM','dextromethorphan','Dissociatives',['Dextromethorphan','5360696','5462331']],
  // Entactogens
  ['mdma','MDMA','3,4-methylenedioxymethamphetamine','Entactogens',['MDMA','3,4-Methylenedioxymethamphetamine','1615']],
  ['mda','MDA','3,4-methylenedioxyamphetamine','Entactogens',['3,4-Methylenedioxyamphetamine','MDA','1614']],
  ['mdea','MDEA','3,4-methylenedioxy-N-ethylamphetamine','Entactogens',['105039','3,4-Methylenedioxy-N-ethylamphetamine']],
  ['mbdb','MBDB','methylbenzodioxolylbutanamine','Entactogens',['MBDB','Methyl-MDMA','N-methyl-1,3-benzodioxolylbutanamine']],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

async function jget(url) {
  const r = await fetch(url);
  if (!r.ok) return null;
  return r.json();
}
async function tget(url) {
  const r = await fetch(url);
  if (!r.ok) return null;
  return r.text();
}

async function resolveCID(candidates) {
  for (const c of candidates) {
    if (/^\d+$/.test(c)) return Number(c);
    const j = await jget(`${BASE}/compound/name/${encodeURIComponent(c)}/cids/JSON`);
    await sleep(220);
    const cid = j?.IdentifierList?.CID?.[0];
    if (cid) return cid;
  }
  return null;
}

const results = [];
for (const [id, name, full, cat, cands] of LIST) {
  const row = { id, name, full, cat, cid: null, formula: null, mw: null, inchikey: null, smiles: null, iupac: null, source: null, status: 'FAILED' };
  try {
    const cid = await resolveCID(cands);
    if (!cid) { results.push(row); console.log(`✗ ${name}: no CID`); continue; }
    row.cid = cid;
    const props = await jget(`${BASE}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,InChIKey,SMILES,IUPACName/JSON`);
    await sleep(220);
    const p = props?.PropertyTable?.Properties?.[0];
    if (p) { row.formula = p.MolecularFormula; row.mw = p.MolecularWeight; row.inchikey = p.InChIKey; row.smiles = p.SMILES; row.iupac = p.IUPACName; }
    // try 3D then 2D
    let sdf = await tget(`${BASE}/compound/cid/${cid}/record/SDF?record_type=3d`);
    await sleep(220);
    let src = '3d';
    if (!sdf || !/V2000/.test(sdf)) { sdf = await tget(`${BASE}/compound/cid/${cid}/record/SDF?record_type=2d`); src = '2d'; await sleep(220); }
    if (!sdf || !/V2000/.test(sdf)) { results.push(row); console.log(`✗ ${name} (CID ${cid}): no SDF`); continue; }
    writeFileSync(`${SDF_DIR}/${id}.sdf`, sdf);
    row.source = src; row.status = 'OK';
    console.log(`${src === '3d' ? '✓' : '~'} ${name} (CID ${cid}) ${row.formula} [${src}]`);
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`);
  }
  results.push(row);
}

writeFileSync(PROPS_OUT, JSON.stringify(results, null, 2));
const ok = results.filter(r => r.status === 'OK');
const d2 = ok.filter(r => r.source === '2d');
const fail = results.filter(r => r.status !== 'OK');
console.log(`\nSUMMARY: ${ok.length}/${results.length} ok, ${d2.length} used 2D, ${fail.length} failed`);
if (d2.length) console.log('2D fallback:', d2.map(r => r.name).join(', '));
if (fail.length) console.log('FAILED:', fail.map(r => r.name).join(', '));
