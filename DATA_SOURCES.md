# Data Sources

Every selectable structure is an **authentic PubChem computed 3D conformer**
(MDL SDF, `record_type=3d`), taken verbatim — atomic coordinates, elements,
connectivity, bond orders, formal charges and hydrogens are preserved exactly;
none are guessed from a 2D diagram or hand-edited. Files live in
`src/data/sdf/<id>.sdf` (glob-loaded at build time) and the app never fetches at
runtime, so it works fully offline.

Metadata (formula, weight, InChIKey, SMILES, IUPAC name) and the SDFs are pulled
from PubChem by the reproducible scripts in [`scripts/`](scripts/README.md).
Each structure is validated before rendering: its atom composition must match
the authoritative PubChem molecular formula exactly (derived into
`expectedCounts` by `parseFormula`), and flagship molecules additionally assert
detected structural features.

Retrieval endpoint (per CID):
`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/<CID>/record/SDF?record_type=3d`

## Provenance — all compounds

MW in g/mol. All coordinates are 3D conformers.

### Tryptamines

| Compound | PubChem CID | Formula | MW | InChIKey |
| --- | --- | --- | --- | --- |
| 5-MeO-DMT | 1832 | C13H18N2O | 218.29 | ZSTKHSQDNIGFLM-UHFFFAOYSA-N |
| DMT | 6089 | C12H16N2 | 188.27 | DMULVCHRPCFFGV-UHFFFAOYSA-N |
| Psilocybin | 10624 | C12H17N2O4P | 284.25 | QVDSEJDULKLHCG-UHFFFAOYSA-N |
| Psilocin | 4980 | C12H16N2O | 204.27 | SPCIYGNTAMCTRO-UHFFFAOYSA-N |
| Bufotenin | 10257 | C12H16N2O | 204.27 | VTTONGPRPXSUTJ-UHFFFAOYSA-N |
| DET | 6090 | C14H20N2 | 216.32 | LSSUMOWDTKZHHT-UHFFFAOYSA-N |
| DPT | 6091 | C16H24N2 | 244.37 | BOOQTIHIKDDPRW-UHFFFAOYSA-N |
| MET | 824845 | C13H18N2 | 202.30 | MYEGVMLMDWYPOA-UHFFFAOYSA-N |
| MiPT | 29935323 | C14H20N2 | 216.32 | KTQJVAJLJZIKKD-UHFFFAOYSA-N |
| DiPT | 26903 | C16H24N2 | 244.37 | ZRVAAGAZUWXRIP-UHFFFAOYSA-N |
| 4-AcO-DMT | 15429212 | C14H18N2O2 | 246.30 | RTLRUOSYLFOFHV-UHFFFAOYSA-N |
| 4-HO-MET | 21786582 | C13H18N2O | 218.29 | ORWQBKPSGDRPPA-UHFFFAOYSA-N |
| 4-HO-MiPT | 10082683 | C14H20N2O | 232.32 | RXKGHZCQFXXWFQ-UHFFFAOYSA-N |

### Lysergamides

| Compound | PubChem CID | Formula | MW | InChIKey |
| --- | --- | --- | --- | --- |
| LSD | 5761 | C20H25N3O | 323.4 | VAYOSLLFUXYJDT-RDTXWAMCSA-N |
| LSA | 442072 | C16H17N3O | 267.33 | GENAHGKEFJLNJB-QMTHXVAHSA-N |
| AL-LAD | 15227511 | C22H27N3O | 349.5 | JCQLEPDZFXGHHQ-OXQOHEQNSA-N |
| ETH-LAD | 44457783 | C21H27N3O | 337.5 | MYNOUXJLOHVSMQ-DNVCBOLYSA-N |
| PRO-LAD | 44457803 | C22H29N3O | 351.5 | HZKYLVLOBYNKKM-OXQOHEQNSA-N |
| 1P-LSD | 119025985 | C23H29N3O2 | 379.5 | JSMQOVGXBIDBIE-OXQOHEQNSA-N |
| 1cP-LSD | 155884675 | C24H29N3O2 | 391.5 | RAFUPYYDHPFASC-DYESRHJHSA-N |
| 1V-LSD | 162368540 | C25H33N3O2 | 407.5 | GIIBVGJWUZNECE-XMSQKQJNSA-N |

### Phenethylamines

| Compound | PubChem CID | Formula | MW | InChIKey |
| --- | --- | --- | --- | --- |
| Mescaline | 4076 | C11H17NO3 | 211.26 | RHCSKNNOAZULRK-UHFFFAOYSA-N |
| 2C-B | 98527 | C10H14BrNO2 | 260.13 | YMHOBZXQZVXHBM-UHFFFAOYSA-N |
| 2C-C | 29979100 | C10H14ClNO2 | 215.67 | CGKQFIWIPSIVAS-UHFFFAOYSA-N |
| 2C-D | 135740 | C11H17NO2 | 195.26 | UNQQFDCVEMVQHM-UHFFFAOYSA-N |
| 2C-E | 24729233 | C12H19NO2 | 209.28 | VDRGNAMREYBIHA-UHFFFAOYSA-N |
| 2C-I | 10267191 | C10H14INO2 | 307.13 | PQHQBRJAAZQXHL-UHFFFAOYSA-N |
| 2C-P | 44350080 | C13H21NO2 | 223.31 | PZJOKFZGPTVNBF-UHFFFAOYSA-N |
| 2C-T-2 | 12074193 | C12H19NO2S | 241.35 | HCWQGDLBIKOJPM-UHFFFAOYSA-N |
| 2C-T-7 | 24728635 | C13H21NO2S | 255.38 | OLEVEPDJOFPJTF-UHFFFAOYSA-N |
| DOM | 85875 | C12H19NO2 | 209.28 | NTJQREUGJKIARY-UHFFFAOYSA-N |
| DOB | 62065 | C11H16BrNO2 | 274.15 | FXMWUTGUCAKGQL-UHFFFAOYSA-N |
| DOC | 542036 | C11H16ClNO2 | 229.70 | ACRITBNCBMTINK-UHFFFAOYSA-N |
| DOI | 1229 | C11H16INO2 | 321.15 | BGMZUEKZENQUJY-UHFFFAOYSA-N |
| 25I-NBOMe | 10251906 | C18H22INO3 | 427.3 | ZFUOLNAKPBFDIJ-UHFFFAOYSA-N |
| 25B-NBOMe | 9977044 | C18H22BrNO3 | 380.3 | SUXGNJVVBGJEFB-UHFFFAOYSA-N |
| 25C-NBOMe | 46856354 | C18H22ClNO3 | 335.8 | FJFPOGCVVLUYAQ-UHFFFAOYSA-N |

### Dissociatives

| Compound | PubChem CID | Formula | MW | InChIKey |
| --- | --- | --- | --- | --- |
| Ketamine | 3821 | C13H16ClNO | 237.72 | YQEZLKZALYSWHR-UHFFFAOYSA-N |
| Esketamine | 182137 | C13H16ClNO | 237.72 | YQEZLKZALYSWHR-ZDUSSCGKSA-N |
| PCP | 6468 | C17H25N | 243.4 | JTJMJGYZQZDUJJ-UHFFFAOYSA-N |
| MXE | 52911279 | C15H21NO2 | 247.33 | LPKTWLVEGBNOOX-UHFFFAOYSA-N |
| DXM | 5360696 | C18H25NO | 271.4 | MKXZASYAUGDDCJ-NJAFHUGGSA-N |

### Entactogens

| Compound | PubChem CID | Formula | MW | InChIKey |
| --- | --- | --- | --- | --- |
| MDMA | 1615 | C11H15NO2 | 193.24 | SHXWCVYOXRDMCX-UHFFFAOYSA-N |
| MDA | 1614 | C10H13NO2 | 179.22 | NGBBVGZWCFBOGO-UHFFFAOYSA-N |
| MDEA | 105039 | C12H17NO2 | 207.27 | PVXVWWANJIWJOO-UHFFFAOYSA-N |
| MBDB | 124844 | C12H17NO2 | 207.27 | USWVWJSAJAEEHQ-UHFFFAOYSA-N |

### Other

| Compound | PubChem CID | Formula | MW | InChIKey |
| --- | --- | --- | --- | --- |
| Salvinorin A | 128563 | C23H28O8 | 432.5 | OBSYBRPAKCASQB-AGQYDFLVSA-N |
| Muscimol | 4266 | C4H6N2O2 | 114.10 | ZJQHPWUVQPJPQT-UHFFFAOYSA-N |
| Ibotenic Acid | 1233 | C5H6N2O4 | 158.11 | IRJCBFDCFXCWGO-UHFFFAOYSA-N |

## Element reference data

Rendering radii, colours, and atomic weights are drawn from standard tabulated
values (see [`src/data/elements.ts`](src/data/elements.ts)):

- **CPK / Jmol colour convention** for the base palette (carbon rendered as a
  refined dark charcoal for the museum aesthetic, as specified).
- **Covalent radii** — Cordero et al., *Dalton Trans.*, 2008 (used for
  ball-and-stick, licorice, and wireframe modes).
- **Van der Waals radii** — Bondi, *J. Phys. Chem.*, 1964 (used for the
  space-filling mode).
- **Standard atomic weights** — IUPAC conventional values.

## Rendering libraries

- [Three.js](https://threejs.org/) r0.169 — WebGL scene, procedural sphere and
  cylinder geometry, `OrbitControls`, `CSS2DRenderer`, `GLTFExporter`,
  `RoomEnvironment` (procedurally generated studio environment map).
- [React](https://react.dev/) 18 + [Vite](https://vitejs.dev/) 5 — application
  shell and build tooling.
- [Vitest](https://vitest.dev/) — unit tests.
