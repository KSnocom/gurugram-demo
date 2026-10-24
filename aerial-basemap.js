// View-dependent quadtree: keep at most 48 small aerial textures in GPU memory.
// The full 129 GB source collection is never loaded by the browser.
(async () => {
    const response = await fetch('./basemap/aerial/manifest.json');
    if (!response.ok) throw new Error('Aerial imagery catalogue unavailable');
    const info = await response.json();
    const T = Potree.BasemapThree;
    const toggle = document.getElementById('satellite-visible');
    const status = document.getElementById('satellite-status');
    const cache = new Map(), pending = new Set(), failed = new Set();
    let wanted = new Set(), queue = [], lastUpdate = -Infinity;
    const z = info.referenceElevationMeters;
    const frustum = new T.Frustum(), matrix = new T.Matrix4();
    const nearest = new T.Vector3();
    const bounds = key => {
        const [level, col, row] = key.split('/').map(Number);
        const span = info.size / 2 ** level;
        return {level, col, row, span, x: info.origin[0] + col * span,
            y: info.origin[1] + info.size - (row + 1) * span};
    };
    function collect(key, camera, height, threshold, result) {
        if (!info.nodes[key]) return;
        const b = bounds(key);
        const box = new T.Box3(new T.Vector3(b.x, b.y, z), new T.Vector3(b.x + b.span, b.y + b.span, z));
        if (!frustum.intersectsBox(box)) return;
        result.add(key);
        nearest.copy(camera.position).clamp(box.min, box.max);
        const distance = Math.max(camera.position.distanceTo(nearest), 1);
        const pixels = camera.isOrthographicCamera ? b.span * height / (camera.top - camera.bottom) :
            b.span * height / (2 * Math.tan(camera.fov * Math.PI / 360) * distance);
        if (pixels > threshold && b.level < info.maxLevel) {
            for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++)
                collect(`${b.level + 1}/${b.col * 2 + dx}/${b.row * 2 + dy}`, camera, height, threshold, result);
        }
    }
    function evict() {
        const old = [...cache].filter(([key]) => !wanted.has(key)).sort((a, b) => a[1].used - b[1].used);
        while (cache.size > 48 && old.length) {
            const [key, entry] = old.shift();
            viewer.scene.scene.remove(entry.mesh);
            entry.mesh.geometry.dispose(); entry.mesh.material.dispose(); entry.texture.dispose();
            cache.delete(key);
        }
    }
    function pump() {
        while (pending.size < 3 && queue.length) {
            const key = queue.shift();
            if (cache.has(key) || pending.has(key) || failed.has(key)) continue;
            pending.add(key);
            new T.TextureLoader().load(`./basemap/aerial/${key}.webp`, texture => {
                pending.delete(key);
                texture.anisotropy = Math.min(8, viewer.renderer.capabilities.getMaxAnisotropy());
                const b = bounds(key);
                const material = new T.MeshBasicMaterial({map: texture, transparent: true, alphaTest: .02,
                    side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -b.level, polygonOffsetUnits: -b.level});
                gradeBasemapMaterial(material, info.colourMatch);
                const mesh = new T.Mesh(new T.PlaneBufferGeometry(b.span, b.span), material);
                mesh.position.set(b.x + b.span / 2, b.y + b.span / 2, z);
                mesh.name = 'Aerial survey ' + key;
                mesh.renderOrder = b.level;
                mesh.visible = toggle.checked && wanted.has(key);
                viewer.scene.scene.add(mesh);
                cache.set(key, {mesh, texture, used: performance.now()});
                status.dataset.aerial = 'true';
                status.textContent = 'Aerial survey · 2025';
                status.title = 'Local aerial imagery, up to 1 m/pixel displayed from approximately 5 cm survey originals. More detail loads as you zoom. Sentinel-2 fills areas without aerial coverage. Flat reference planes, not terrain.';
                evict(); pump();
            }, undefined, error => {
                pending.delete(key); failed.add(key); pump();
                console.error('Aerial imagery tile unavailable:', key, error);
            });
        }
    }
    function update() {
        const now = performance.now();
        if (now - lastUpdate < 400) return;
        lastUpdate = now;
        if (!toggle.checked) {
            cache.forEach(entry => entry.mesh.visible = false);
            queue = [];
            return;
        }
        const camera = viewer.scene.getActiveCamera();
        matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(matrix);
        let threshold = 400;
        do {
            wanted = new Set();
            collect('0/0/0', camera, viewer.renderer.domElement.clientHeight, threshold, wanted);
            threshold *= 1.5;
        } while (wanted.size > 40);
        cache.forEach((entry, key) => {
            entry.mesh.visible = wanted.has(key);
            if (entry.mesh.visible) entry.used = now;
        });
        status.dataset.loadedTiles = String(cache.size);
        const levels = [...cache].filter(([, entry]) => entry.mesh.visible).map(([key]) => Number(key.split('/')[0]));
        status.dataset.finestResolution = String(info.size / 2 ** Math.max(0, ...levels) / info.tileSize);
        // Coarse parents appear first, then sharper children replace their detail.
        queue = [...wanted].filter(key => !cache.has(key) && !pending.has(key) && !failed.has(key));
        evict(); pump();
    }
    viewer.addEventListener('update', update);
    toggle.addEventListener('change', () => { lastUpdate = -Infinity; update(); });
    update();
})().catch(error => console.error('Aerial basemap:', error));
