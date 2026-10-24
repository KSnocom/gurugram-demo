# Sentinel-2 reference imagery

## Current viewer: one fixed rectangular image

The city and RGB close-up pages load only `survey-background.jpg`: one 2,025 × 2,048 image, about 1.7 MB, made exclusively from the EOX Sentinel-2 cloudless 2024 image. It retains the display colour grade measured against cloud RGB. No supplied aerial imagery is composited or loaded by the current pages. The crop matches the survey bounding rectangle with 25 m padding per side, reprojected to EPSG:32643. The output pixel spacing is approximately 10.3 m; this resampling does not add detail to the original approximately 14 m/pixel downloaded crop.

`tools/potree/build_fixed_background.py` creates the image and georeferencing metadata without reading the aerial imagery folder or its manifest. The background remains a flat reference surface at 90 m. Point-cloud data and the reduced website are unchanged. Older aerial tile assets are retained but unused by these pages.

This local 2048 × 2048 JPEG is a Gurugram crop from EOX's Sentinel-2 cloudless 2024 mosaic (modified Copernicus Sentinel data). Source and geographic bounds are recorded in sentinel-2.json.

Attribution: Sentinel-2 cloudless — https://s2maps.eu by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2024).

EOX's 2024 mosaic is licensed CC BY-NC-SA 4.0 for non-commercial use: https://cloudless.eox.at/license-non-commercial. Commercial use requires the applicable EOX license. This restriction applies to the EOX mosaic, not to the user's point clouds. Credit remains visible in the viewer.

The image is mapped north-up through a 48 × 48 geographic grid reprojected into WGS84 / UTM 43N (EPSG:32643). Mesh vertices are local to a UTM origin to retain float precision. The flat image reference elevation is 90 m. It is visual context, not a terrain model or an elevation/alignment accuracy claim. Ground may vary above or below this plane, and the satellite mosaic is not contemporaneous with the survey. The raw cloud coordinates are unchanged.

The bundled Potree build exposes its own Three.js mesh primitives via `Potree.BasemapThree`; this avoids downloading or instantiating a second copy of Three.js. Preserve that export if replacing the Potree library.

The existing reduced 20-million-point website is not modified.

## Sharper local aerial layer

The supplied `Orthomosaic` folder contains 62 GeoTIFFs, about 129 GB, in EPSG:32643 with approximately 5–5.7 cm source pixels. `tools/potree/build_aerial_basemap.py` uses their existing overviews to produce a 512-pixel WebP tile pyramid, from 64 m/pixel overview tiles down to 1 m/pixel. Tiles retain alpha outside aerial coverage so the Sentinel mosaic remains visible there. The browser requests detail by camera distance and frustum, with three concurrent loads and a maximum of 48 cached tile textures (about 48 MiB before mipmaps). The source GeoTIFFs and point-cloud binaries are unchanged.

The aerial tiles are flat reference planes at 91 m; they are not a terrain model. Fine alignment in tilted close-ups is limited by the height difference from the ground. A terrain model would be needed to remove that parallax.

The `Match RGB tones` switch applies a reversible shader grade to backgrounds in RGB mode. Coefficients are estimated from average colours in spatially matched 256 m cells of the coarse cloud octree and imagery. It improves overall tone consistency, but does not guarantee seamless boundaries across different survey dates, vegetation, shadows, or viewing angles. The original tile pixel data remains unchanged. The measured coefficients and before/after colour differences are stored in the imagery metadata.

Potree's script-directory resolution also handles version query strings, so cache-busting its bundle does not break worker or sidebar paths.
