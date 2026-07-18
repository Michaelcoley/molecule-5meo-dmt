# Original Prompt

This is the verbatim specification this project was built to fulfill.

---

Act as a senior front-end engineer, computational chemist, molecular-visualization specialist, and UI/UX designer.

Build a complete, production-quality HTML web application that displays a scientifically accurate, fully interactive three-dimensional model of 5-MeO-DMT, also known as 5-methoxy-N,N-dimethyltryptamine.

The application is intended to serve as a museum-quality digital molecular display for a home office. Scientific accuracy, visual quality, smooth interaction, and high-resolution rendering are more important than development simplicity.

## Molecular identity

Use the neutral free-base form of 5-MeO-DMT.

Reference information:

* Common name: 5-MeO-DMT
* Full name: 5-methoxy-N,N-dimethyltryptamine
* Preferred systematic name: 2-(5-methoxy-1H-indol-3-yl)-N,N-dimethylethanamine
* Molecular formula: C13H18N2O
* Molecular weight: approximately 218.30 g/mol
* PubChem CID: 1832
* Canonical SMILES: COc1ccc2c(c1)c(CCN(C)C)c[nH]2
* InChIKey: ZSTKHSQDNIGFLM-UHFFFAOYSA-N

Do not manually guess the molecular coordinates from a two-dimensional diagram.

Obtain or embed a reliable three-dimensional conformer derived from an authoritative chemical structure source. Prefer an energy-minimized SDF or MOL structure associated with PubChem CID 1832. Preserve the original atomic coordinates, element identities, connectivity, formal charges, bond orders, and hydrogen placement.

If external retrieval is unavailable at runtime, include a validated molecular structure file locally in the application.

## Chemical accuracy requirements

The model must contain exactly:

* 13 carbon atoms
* 18 hydrogen atoms
* 2 nitrogen atoms
* 1 oxygen atom
* 34 total atoms

The geometry must accurately represent:

* A nearly planar indole ring system
* Eight trigonal-planar sp2 carbon atoms in the indole framework
* Five tetrahedral sp3 carbon atoms
* One approximately planar pyrrolic indole nitrogen bearing hydrogen
* One trigonal-pyramidal tertiary amine nitrogen
* One bent ether oxygen
* A methoxy group attached at the 5-position
* A two-carbon ethylamine side chain at the 3-position
* Two methyl groups attached to the terminal nitrogen
* Correct covalent bond connectivity
* Chemically reasonable bond lengths and bond angles
* A physically reasonable, energy-minimized molecular conformation

Do not incorrectly make the indole ring puckered. Do not add a hydrogen to the terminal tertiary amine in the neutral free-base model. Do not omit the hydrogen attached to the indole nitrogen.

Represent aromaticity accurately. Provide two selectable aromatic-bond modes:

1. Conventional Kekulé representation with four alternating double bonds
2. Delocalized aromatic representation with uniform aromatic bonds

Clearly state that alternating double bonds are a conventional representation of a delocalized aromatic system.

## Rendering architecture

Create the app using:

* Semantic HTML5
* Modern CSS
* JavaScript or TypeScript
* Three.js for interactive 3D rendering
* WebGL for dynamically rendered, resolution-independent 3D geometry
* OrbitControls for mouse, trackpad, and touch interaction

A React implementation is acceptable, but the final project must be easy to run locally. A Vite-based React and TypeScript architecture is preferred for a modular production build.

Do not use a flat image, prerendered video, animated GIF, or low-resolution texture as the molecular model.

Construct atoms as true procedural sphere geometry and bonds as true cylinder geometry. The model must remain visually sharp during zooming because the geometry is rerendered at the current display resolution.

Support high-DPI and Retina displays using the device pixel ratio, with a sensible performance cap.

## Required interaction

Users must be able to:

* Click and drag to rotate the molecule freely
* Use a mouse wheel or trackpad to zoom
* Pan the camera
* Use touch gestures on mobile devices
* Double-click an atom to center the camera on it
* Click an atom to display its information
* Click a bond to display bond information
* Reset the camera
* Fit the entire molecule into view
* Toggle automatic rotation
* Adjust automatic-rotation speed
* Pause all motion
* Switch between orthographic and perspective cameras
* View the molecule from front, back, left, right, top, and bottom
* Toggle atom labels
* Toggle bond labels
* Toggle hydrogen visibility
* Toggle the display base
* Toggle the molecular information plaque
* Toggle the background between dark, light, transparent, and gradient modes
* Enter full-screen presentation mode

Use smooth damping and natural camera controls.

## Molecular display modes

Provide these selectable rendering styles:

1. Ball-and-stick
2. Space-filling using van der Waals radii
3. Licorice or stick
4. Wireframe
5. Museum display mode
6. Educational hybridization mode

Museum display mode should use refined materials, realistic lighting, polished bond rods, subtle reflections, and premium presentation styling.

Educational hybridization mode should visually distinguish:

* sp2 aromatic atoms
* sp3 tetrahedral atoms
* The planar indole nitrogen
* The pyramidal tertiary amine nitrogen
* The bent oxygen geometry

## Atom appearance

Use conventional CPK-inspired colors:

* Carbon: dark charcoal or black
* Hydrogen: white
* Nitrogen: blue
* Oxygen: red

Provide an optional accessibility palette with higher contrast.

Scale atoms proportionally using recognized covalent or van der Waals radii, depending on the selected display mode. Do not render every atom at the same size.

Use physically based materials where appropriate. Provide controls for:

* Atom roughness
* Atom metallic appearance
* Bond thickness
* Atom scale
* Bond scale
* Environmental reflection intensity
* Ambient lighting
* Directional lighting
* Shadow intensity

## Bond rendering

Render bonds as cylinders precisely aligned between atomic coordinates.

For multiple bonds:

* Display double bonds as two parallel cylinders
* Calculate a stable perpendicular offset vector
* Prevent the parallel cylinders from rotating unpredictably as the camera moves
* Keep the double bonds visually aligned with the molecular plane where chemically appropriate

Provide an alternative aromatic style using subtly differentiated or uniform aromatic connectors.

Do not represent a double bond merely by making one cylinder thicker.

## Scientific information panel

Include a collapsible information panel showing:

* 5-MeO-DMT
* 5-methoxy-N,N-dimethyltryptamine
* Molecular formula: C13H18N2O
* Molecular weight: 218.30 g/mol
* PubChem CID: 1832
* InChIKey
* Canonical SMILES
* Total atom count
* Elemental composition
* Selected atom information
* Selected bond information
* Atom index
* Element
* Atomic number
* Hybridization
* Approximate geometry
* Bond order
* Bond length calculated from the embedded coordinates

Include a disclaimer explaining that a displayed conformer is one energetically reasonable three-dimensional conformation and that flexible side-chain bonds allow multiple conformations in physical reality.

## Atom labels and annotations

Allow the user to display:

* Element symbols
* Atom numbers
* Full atom labels
* Hybridization labels
* Partial charge labels, only if reliable charge data is provided
* Bond lengths
* Bond angles
* Selected dihedral angles

Labels must remain readable and should not overlap excessively. Use HTML or CSS overlay labels projected from 3D coordinates, or use high-quality signed-distance-field text.

## Measurement tools

Include an optional scientific measurement mode.

The user should be able to select:

* Two atoms to calculate distance
* Three atoms to calculate bond angle
* Four atoms to calculate dihedral angle

Display measurement guides directly in the 3D scene.

Use angstroms for molecular distances and degrees for angles.

## Display base and plaque

Create an optional virtual museum base beneath the molecule.

Provide base styles:

* Clear acrylic
* Matte black
* Brushed aluminum
* Dark walnut
* White gallery pedestal

Add a professional plaque with:

5-MeO-DMT
5-Methoxy-N,N-dimethyltryptamine
C13H18N2O · 218.30 g/mol
PubChem CID 1832

The molecule should appear supported without adding fake chemical bonds. Use minimal transparent display supports or an invisible scene anchor.

## Vector and high-resolution output

Because a realistic interactive 3D scene is rendered through WebGL rather than native SVG, implement both high-resolution rendering and vector export.

Required export options:

* Export the current view as SVG line art
* Export a clean 2D vector projection as SVG
* Export a transparent-background PNG
* Export a high-resolution PNG at 2×, 4×, and 8× the viewport resolution
* Export the molecule as GLB or glTF
* Export atom and bond data as JSON
* Export or download the embedded SDF or MOL structure
* Print a museum-style information sheet
* Copy the canonical SMILES

The SVG export should recreate the current camera projection using vector circles, gradients where practical, bond lines or vector polygons, labels, and depth sorting.

Do not simply embed a raster screenshot inside an SVG file.

For true three-dimensional model export, use GLB or glTF because SVG is fundamentally a two-dimensional vector format.

## Visual design

Use a premium, modern museum-interface aesthetic.

The default experience should include:

* Deep charcoal background
* Soft neutral lighting
* Subtle environmental reflections
* Smooth shadows
* Clean typography
* Spacious layout
* Minimal control clutter
* Responsive side panel
* Refined animations
* No unnecessary visual effects
* No bright gaming-style interface
* No cartoon styling

The molecular model should remain the visual focus.

## Lighting

Use a professional three-point lighting setup:

* Soft key light
* Lower-intensity fill light
* Subtle rim light
* Ambient or hemispheric light
* Optional HDR-style environment reflections

Use contact shadows or a subtle shadow catcher under the model when the display base is enabled.

Avoid excessive bloom, lens flares, or unrealistic glow.

## Camera and framing

Automatically calculate the molecule's bounding box and center it correctly.

Set the default camera so the complete molecule fills approximately 65 to 75 percent of the visible canvas without clipping.

Use near and far clipping planes appropriate to the molecular scale.

Provide smooth animated transitions between saved camera views.

Store the user's preferred view and settings in local storage.

## Performance

Target:

* Smooth interaction at 60 frames per second on modern desktop systems
* Responsive performance on tablets and current mobile phones
* Efficient geometry reuse
* Instanced meshes where beneficial
* Proper cleanup of Three.js resources
* No memory leaks
* No unnecessary rerenders
* Lazy loading for optional features
* Graceful fallback when WebGL is unavailable

Use adaptive sphere and cylinder segment counts so export mode can use higher geometry detail than interactive mode.

## Accessibility

Include:

* Keyboard-accessible controls
* ARIA labels
* Visible keyboard focus
* Reduced-motion support
* High-contrast mode
* Screen-reader descriptions of the molecule
* Controls that do not rely only on color
* Responsive support for desktop, tablet, and mobile

## Project structure

Do not place the entire application in one oversized file.

Use a modular structure similar to:

* App shell
* Molecule loader
* Molecular data validator
* Three.js scene
* Atom renderer
* Bond renderer
* Camera controls
* Lighting system
* Measurement tools
* Information panel
* Settings panel
* Export utilities
* SVG projection exporter
* Museum base
* Plaque component
* Accessibility utilities
* Unit tests

## Validation requirements

Before rendering, programmatically validate that the embedded molecule contains:

* 13 carbon atoms
* 18 hydrogen atoms
* 2 nitrogen atoms
* 1 oxygen atom
* 34 total atoms

Validate the expected molecular graph and identify the following structural features:

* Indole fused-ring system
* Methoxy substituent
* Ethylamine side chain
* Two terminal N-methyl groups
* Indole N-H
* Neutral terminal tertiary amine

Show a clear developer error if the molecular structure does not pass validation.

Include automated tests for:

* Element counts
* Total atom count
* Bond connectivity
* Double-bond rendering
* Aromatic-mode switching
* Camera fitting
* Measurement calculations
* SVG export
* High-resolution PNG export
* Responsive controls

## Deliverables

Provide:

1. Complete source code
2. All required HTML, CSS, TypeScript, and configuration files
3. The validated local molecular structure file
4. Installation instructions
5. Development commands
6. Production build commands
7. A README explaining the scientific and rendering decisions
8. A list of data sources used
9. Tests
10. A working production build

The app must run with:

```
npm install
npm run dev
```

It must build with:

```
npm run build
```

Do not use placeholder molecular coordinates, fake chemical data, or a generic molecule substituted for 5-MeO-DMT.

Do not stop after creating a mockup. Implement the actual functional application.

Begin by creating the complete project architecture, then implement the validated molecular-data layer, and then build the interactive Three.js visualization.
