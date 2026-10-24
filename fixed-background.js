(async () => {
    const status = document.getElementById('satellite-status');
    const toggle = document.getElementById('satellite-visible');
    try {
        const response = await fetch('./basemap/survey-background.json?v=20clouds-20261015');
        if (!response.ok) throw new Error('Background metadata unavailable');
        const info = await response.json();
        const T = Potree.BasemapThree;
        const [west, south, east, north] = info.boundsUtm;
        const texture = await new Promise((resolve, reject) =>
            new T.TextureLoader().load('./basemap/' + info.image + '?v=20clouds-20261015', resolve, undefined, reject));
        const limit = viewer.renderer.capabilities.maxTextureSize;
        if (Math.max(texture.image.width, texture.image.height) > limit) {
            const ratio = limit / Math.max(texture.image.width, texture.image.height);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(texture.image.width * ratio);
            canvas.height = Math.round(texture.image.height * ratio);
            canvas.getContext('2d').drawImage(texture.image, 0, 0, canvas.width, canvas.height);
            texture.image = canvas;
        }
        texture.anisotropy = Math.min(8, viewer.renderer.capabilities.getMaxAnisotropy());
        texture.needsUpdate = true;
        const mesh = new T.Mesh(new T.PlaneBufferGeometry(east - west, north - south),
            new T.MeshBasicMaterial({map: texture, side: T.DoubleSide}));
        mesh.name = 'Fixed rectangular survey background';
        mesh.position.set((west + east) / 2, (south + north) / 2, info.referenceElevationMeters);
        viewer.scene.scene.add(mesh);
        mesh.visible = toggle.checked;
        toggle.disabled = false;
        toggle.addEventListener('change', () => { mesh.visible = toggle.checked; });
        status.textContent = 'Sentinel-2 · 2024';
        status.title = 'One fixed, colour-matched Sentinel-2 image. No supplied aerial imagery. Tight rectangular crop with 25 m margin; not Google imagery or a terrain model.';
        status.dataset.imageWidth = String(texture.image.width);
        status.dataset.imageHeight = String(texture.image.height);
    } catch (error) {
        status.textContent = 'Background image unavailable';
        toggle.disabled = true;
        console.error('Fixed background:', error);
    }
})();
