// Display-only RGB grade. Original imagery and point colours remain unchanged.
window.gradeBasemapMaterial = function (material, grade) {
    if (!grade) return;
    const T = Potree.BasemapThree;
    const gain = new T.Vector3(1, 1, 1);
    const offset = new T.Vector3();
    const update = () => {
        const enabled = colourMode === 'rgba' && document.getElementById('match-basemap-colour').checked;
        gain.set(...(enabled ? grade.gain : [1, 1, 1]));
        offset.set(...(enabled ? grade.offset : [0, 0, 0]));
    };
    update();
    document.addEventListener('cloud-colour-mode', update);
    document.getElementById('match-basemap-colour').addEventListener('change', update);
    material.onBeforeCompile = shader => {
        shader.uniforms.basemapGain = {value: gain};
        shader.uniforms.basemapOffset = {value: offset};
        shader.fragmentShader = 'uniform vec3 basemapGain;\nuniform vec3 basemapOffset;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>',
            '#include <map_fragment>\ndiffuseColor.rgb = clamp(diffuseColor.rgb * basemapGain + basemapOffset, 0.0, 1.0);');
    };
    material.customProgramCacheKey = () => 'basemap-rgb-grade-v1';
    material.addEventListener('dispose', () => {
        document.removeEventListener('cloud-colour-mode', update);
        document.getElementById('match-basemap-colour').removeEventListener('change', update);
    });
};
