// Shared controls for the city and the original-RGB close-up view.
const panel = document.querySelector('.viewer-panel');
document.getElementById('collapse-panel').onclick = () => {
    const collapsed = panel.classList.toggle('collapsed');
    document.getElementById('collapse-panel').textContent = collapsed ? '+' : '−';
    document.getElementById('collapse-panel').setAttribute('aria-expanded', String(!collapsed));
};
const originalColourMode = window.setColourMode;
window.setColourMode = mode => {
    originalColourMode(mode);
    document.querySelectorAll('[data-colour]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.colour === mode)));
    document.getElementById('class-legend').hidden = mode !== 'classification';
    document.getElementById('rgb-note').hidden = mode !== 'rgba';
    document.dispatchEvent(new CustomEvent('cloud-colour-mode', {detail: mode}));
};
setColourMode(colourMode);

document.getElementById('cloud-search').oninput = event => {
    const query = event.target.value.trim().toLowerCase();
    document.querySelectorAll('#cloud-list label').forEach(row => row.hidden = !row.textContent.toLowerCase().includes(query));
};
