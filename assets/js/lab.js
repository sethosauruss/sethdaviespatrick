/* Interactive home lab diagram. Everything shown comes from the home lab as built
   described on projects/homelab.html. Nodes are keyboard-focusable buttons. */
(() => {
  const root = document.querySelector('[data-lab]');
  if (!root) return;
  const base = root.dataset.base || '';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';

  const NODES = {
    internet: { title: 'Internet', sub: 'upstream', kind: 'Upstream',
      text: 'The upstream connection. Uplink cables in the rack are grey.' },
    fw: { title: 'pfSense firewall', sub: 'EliteDesk 800 G3', kind: 'Firewall',
      text: 'pfSense 2.7.2 on an HP EliteDesk 800 G3 Mini, using router-on-a-stick off one onboard network port. Every zone is firewalled default-deny. DNS runs on Unbound, access-listed per subnet. No ports are forwarded except a Plex forward restricted to a source.',
      href: 'projects/homelab.html#built' },
    sw: { title: 'TL-SG108E', sub: 'managed switch', kind: 'Switch',
      text: 'A TP-Link TL-SG108E managed switch carrying the VLANs, with a 12-port labelled patch panel. An 802.1Q audit of the switch caught and fixed a couple of leftover VLAN memberships.',
      href: 'projects/homelab.html#segmentation' },
    trusted: { title: 'VLAN 10 Trusted', sub: 'Raspberry Pi 5', kind: 'VLAN', bar: 'trusted',
      text: 'Everyday devices and the Raspberry Pi 5. The Pi runs Raspberry Pi OS Lite with Docker Compose: Plex, Samba, Tailscale, Vaultwarden, Uptime Kuma and Seerr. SSH is key-only.',
      href: 'projects/homelab.html#built' },
    lab: { title: 'VLAN 20 Lab', sub: 'Kali, DVWA', kind: 'VLAN', bar: 'lab',
      text: 'A Kali VM and a DVWA target VM, both hosted on Proxmox and kept away from every other zone. This is where the attack testing happens, with snapshots to reset each machine.',
      href: 'projects/homelab.html#attack' },
    iot: { title: 'VLAN 30 IoT/DMZ', sub: 'smart, low-trust devices', kind: 'VLAN', bar: 'iot',
      text: 'Smart and low-trust devices, separated from the Trusted zone. Cables for this zone are orange.',
      href: 'projects/homelab.html#segmentation' },
    mgmt: { title: 'VLAN 99 Management', sub: 'Proxmox host, JetKVM', kind: 'VLAN', bar: 'mgmt',
      text: 'The Proxmox VE 9 host, with SSH verified in both directions, and a JetKVM that gives out-of-band console and BIOS access.',
      href: 'projects/homelab.html#built' }
  };
  const ORDER = ['internet', 'fw', 'sw', 'trusted', 'lab', 'iot', 'mgmt'];
  const LINKS = [['internet', 'fw'], ['fw', 'sw'], ['sw', 'trusted'], ['sw', 'lab'], ['sw', 'iot'], ['sw', 'mgmt']];

  const LAYOUT = {
    wide: { vb: [960, 430], trunk: 640, pos: {
      internet: [10, 177, 150, 76], fw: [200, 177, 220, 76], sw: [460, 177, 150, 76],
      trusted: [680, 10, 270, 80], lab: [680, 120, 270, 80], iot: [680, 230, 270, 80], mgmt: [680, 340, 270, 80] } },
    tall: { vb: [360, 670], trunk: 28, pos: {
      internet: [40, 10, 300, 66], fw: [40, 104, 300, 66], sw: [40, 198, 300, 66],
      trusted: [70, 300, 270, 76], lab: [70, 390, 270, 76], iot: [70, 480, 270, 76], mgmt: [70, 570, 270, 76] } }
  };

  const el = (name, attrs = {}, parent) => {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  const host = root.querySelector('.lab-host');
  const panel = root.querySelector('.lab-panel');
  let mode = null, pinned = null, svg = null;

  function path(mode_, a, b) {
    const L = LAYOUT[mode_], pa = L.pos[a], pb = L.pos[b];
    if (mode_ === 'wide') {
      const y1 = pa[1] + pa[3] / 2, y2 = pb[1] + pb[3] / 2;
      if (a === 'sw') return `M${pa[0] + pa[2]} ${y1} H${L.trunk} V${y2} H${pb[0]}`;
      return `M${pa[0] + pa[2]} ${y1} H${pb[0]}`;
    }
    if (a === 'sw') {
      const y1 = pa[1] + pa[3] / 2, y2 = pb[1] + pb[3] / 2;
      return `M${pa[0]} ${y1} H${L.trunk} V${y2} H${pb[0]}`;
    }
    return `M${pa[0] + pa[2] / 2} ${pa[1] + pa[3]} V${pb[1]}`;
  }

  function render() {
    const w = host.clientWidth || 900;
    const m = w < 640 ? 'tall' : 'wide';
    if (m === mode) return;
    mode = m;
    host.textContent = '';
    const L = LAYOUT[m];
    svg = el('svg', { class: 'lab-svg', viewBox: `0 0 ${L.vb[0]} ${L.vb[1]}`, role: 'group',
      'aria-label': 'Interactive network diagram of the built home lab. Each node is a button.' }, host);

    const linkLayer = el('g', {}, svg);
    LINKS.forEach(([a, b], i) => {
      const g = el('g', { class: 'link', 'data-a': a, 'data-b': b, style: `--i:${i}` }, linkLayer);
      const d = path(m, a, b);
      el('path', { class: 'link-base', d, pathLength: 1 }, g);
      el('path', { class: 'link-flow', d }, g);
    });

    ORDER.forEach((id, i) => {
      const n = NODES[id], [x, y, w2, h] = L.pos[id];
      const g = el('g', { class: 'node' + (n.alone ? ' alone' : ''), 'data-id': id, tabindex: 0, role: 'button',
        'aria-label': `${n.title}, ${n.sub}. Show details.`, 'aria-pressed': 'false', style: `--i:${i}` }, svg);
      el('rect', { class: 'box', x, y, width: w2, height: h, rx: 10 }, g);
      if (n.bar) el('rect', { class: 'bar', x, y, width: 7, height: h, rx: 3, fill: `var(--c-${n.bar})` }, g);
      const tx = x + (n.bar ? 22 : 16);
      const t = el('text', { class: 't', x: tx, y: y + h / 2 - 3 }, g); t.textContent = n.title;
      const s = el('text', { class: 's', x: tx, y: y + h / 2 + 17 }, g); s.textContent = n.sub;

      g.addEventListener('pointerenter', () => show(id));
      g.addEventListener('pointerleave', () => show(pinned));
      g.addEventListener('focus', () => show(id));
      g.addEventListener('blur', () => show(pinned));
      g.addEventListener('click', () => { pinned = pinned === id ? null : id; show(pinned); });
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pinned = pinned === id ? null : id; show(pinned); }
      });
    });
    show(pinned);
  }

  function show(id) {
    if (!svg) return;
    root.classList.toggle('has-active', !!id);
    const near = new Set();
    svg.querySelectorAll('.link').forEach((l) => {
      const hit = id && (l.dataset.a === id || l.dataset.b === id);
      l.classList.toggle('is-hl', !!hit);
      if (hit) { near.add(l.dataset.a); near.add(l.dataset.b); }
    });
    svg.querySelectorAll('.node').forEach((n) => {
      n.classList.toggle('is-active', n.dataset.id === id);
      n.classList.toggle('is-near', !!id && near.has(n.dataset.id) && n.dataset.id !== id);
      n.setAttribute('aria-pressed', String(n.dataset.id === pinned));
    });
    if (!id) {
      panel.innerHTML = '<p class="lab-hint">Hover, tap or focus a node to see what it does. Select it to keep it open.</p>';
      return;
    }
    const n = NODES[id];
    panel.textContent = '';
    const left = document.createElement('div');
    const h = document.createElement('h3'); h.textContent = n.title;
    const k = document.createElement('span'); k.className = 'k'; k.textContent = `${n.kind} · ${n.sub}`;
    left.append(h, k);
    const right = document.createElement('div');
    const p = document.createElement('p'); p.textContent = n.text; right.appendChild(p);
    if (n.href) {
      const a = document.createElement('a'); a.href = base + n.href; a.textContent = 'Read the details'; right.appendChild(a);
    }
    panel.append(left, right);
  }

  // Draw-in when scrolled into view
  const start = () => root.classList.add('drawn');
  render();
  if (reduce || !('IntersectionObserver' in window)) start();
  else {
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { start(); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(root);
  }
  let t;
  new ResizeObserver(() => { clearTimeout(t); t = setTimeout(render, 120); }).observe(host);
})();
