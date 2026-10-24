// Image coordinates are geographic; every grid vertex is reprojected into the
// survey's UTM 43N frame. No cloud positions or source coordinates are changed.
(async () => {
    const status = document.getElementById('satellite-status');
    const toggle = document.getElementById('satellite-visible');
    try {
        const response = await fetch('./basemap/sentinel-2.json?v=2');
        if (!response.ok) throw new Error('Satellite metadata unavailable');
        const info = await response.json();
        const T = Potree.BasemapThree;
        const projection = proj4('EPSG:4326', '+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs');
        const [west, south, east, north] = info.boundsWgs84;
        const center = projection.forward([(west + east) / 2, (south + north) / 2]);
        const geometry = new T.PlaneBufferGeometry(1, 1, 48, 48);
        const positions = geometry.attributes.position;
        const uv = geometry.attributes.uv;
        for (let i = 0; i < positions.count; i++) {
            const lon = west + uv.getX(i) * (east - west);
            const lat = south + uv.getY(i) * (north - south);
            const xy = projection.forward([lon, lat]);
            positions.setXYZ(i, xy[0] - center[0], xy[1] - center[1], 0);
        }
        positions.needsUpdate = true;
        geometry.computeBoundingSphere();
        const texture = await new Promise((resolve, reject) => {
            new T.TextureLoader().load('./basemap/' + info.image, resolve, undefined, reject);
        });
        texture.anisotropy = Math.min(8, viewer.renderer.capabilities.getMaxAnisotropy());
        const material = new T.MeshBasicMaterial({map: texture, side: T.DoubleSide});
        gradeBasemapMaterial(material, info.colourMatch);
        const mesh = new T.Mesh(geometry, material);
        mesh.name = 'Sentinel-2 satellite reference plane';
        mesh.position.set(center[0], center[1], info.referenceElevationMeters);
        mesh.visible = toggle.checked;
        viewer.scene.scene.add(mesh);
        toggle.disabled = false;
        toggle.addEventListener('change', () => { mesh.visible = toggle.checked; });
        if (!status.dataset.aerial) {
            status.textContent = 'Sentinel-2 · 2024';
            status.title = 'Cloud-free satellite mosaic, about 10 m source resolution. Flat reference plane at ' + info.referenceElevationMeters + ' m; not a terrain elevation model.';
        }
    } catch (error) {
        status.textContent = 'Satellite imagery unavailable';
        toggle.checked = false;
        toggle.disabled = true;
        console.error('Sentinel-2 basemap:', error);
    }
})();
