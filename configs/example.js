/* ============================================================================
   Example scene — a five-machine home lab. Start here.
   ----------------------------------------------------------------------------
   This file is pure data. The renderer (app/app.js) draws whatever is here.
   To make your own diagram: copy this file to configs/<name>.js, edit,
   then open  index.html?scene=<name>
   ============================================================================ */

window.SCENE = {
  meta: {
    pageTitle: "The Home AI Lab",
    kicker: "Home Lab — Network Map",
    title: 'THE HOME <em>AI</em> LAB',            // <em> renders in the hero color
    badge: "TEMPLATE · EDIT configs/example.js",
    tagline: "five machines · one gateway · nothing leaves the house",
  },

  /* the three faint radial glows behind the stage */
  backdropGlows: ["#67a400", "#d55181", "#9085e9"],

  /* ------------------------------------------------------------------
     Machines. One entry = one card. `hero: true` marks the big center
     card (gets the pulse ring, stat chips, and is the wire hub).
     x/y are stage coordinates on the fixed 1920x1080 canvas.
     `key` is the spotlight hotkey. Order controls the intro cascade.
     ------------------------------------------------------------------ */
  machines: [
    {
      id: "server", hero: true, key: "1", color: "#67a400",
      x: 738, y: 356,
      name: "GPU SERVER",
      sub: "THE MACHINE THIS DIAGRAM IS ABOUT",
      focusTag: "★ MAIN FOCUS",
      stats: [
        { value: "96 GB", label: "VRAM" },
        { value: "8 TB",  label: "NVME" },
        { value: "10 GbE", label: "NETWORK" },
      ],
      chips: ["Ollama", "vLLM", "ComfyUI", "local agents"],
      foot: ["Linux", "runs the big models"],
    },
    {
      id: "workstation", key: "2", color: "#3987e5",
      x: 108, y: 178,
      name: "WORKSTATION", role: "DAILY DRIVER",
      spec: "RTX 4080 · 16 GB VRAM · 64 GB RAM",
      chips: ["Ollama", "LM Studio", "Open WebUI"],
      foot: ["Windows 11", "sleeps · wakes on LAN"],
    },
    {
      id: "laptop", key: "4", color: "#9085e9",
      x: 1456, y: 178,
      name: "MACBOOK", role: "PORTABLE",
      spec: "Apple Silicon · unified memory",
      chips: ["LM Studio", "MLX", "vision models"],
      foot: ["macOS", "on-device dictation"],
    },
    {
      id: "node", key: "3", color: "#d95926",
      x: 108, y: 566,
      name: "GPU NODE", role: "SPARE COMPUTE",
      spec: "RTX 3060 · 12 GB VRAM",
      chips: ["Ollama", "whisper.cpp", "embeddings"],
      foot: ["Windows 11", "sleeps · wakes on LAN"],
    },
    {
      id: "nas", key: "5", color: "#d55181",
      x: 1456, y: 566,
      name: "NAS", role: "ALWAYS-ON",
      spec: "storage + VMs · the lab's front door",
      chips: ["API gateway", "Open WebUI", "reverse proxy", "DNS"],
      foot: ["Linux VMs", "never sleeps"],
    },
  ],

  /* ------------------------------------------------------------------
     Wires. `from: <id>` auto-routes a curve from that card to the hero
     and inherits the card's color. Add `path: "M ... C ..."` to draw a
     custom route instead (like the Wake-on-LAN arc below), `to: null`
     to detach it from the hero, and `lightsFor: [ids]` to control which
     spotlights light it up (default: its own card).
     Each packet is a moving dot: dur = seconds per lap, begin = offset.
     ------------------------------------------------------------------ */
  links: [
    { from: "workstation", packets: [{ dur: 4.2, begin: 0,   r: 4 },
                                     { dur: 4.2, begin: 2.1, r: 3 }] },
    { from: "laptop",      packets: [{ dur: 4.8, begin: 1.3, r: 4 }] },
    { from: "node",        packets: [{ dur: 4.5, begin: 0.7, r: 4 }] },
    { from: "nas",         opacity: 0.6,
                           packets: [{ dur: 3.6, begin: 0.3, r: 4 },
                                     { dur: 3.6, begin: 1.8, r: 3 }] },
    { id: "wol", to: null, color: "#d95926", opacity: 0.45,
      path: "M 1500 748 C 1200 822 720 822 420 748",
      lightsFor: ["nas", "node"],
      packets: [{ dur: 5, begin: 1, r: 4 }] },
  ],

  /* floating labels; litWhen = spotlight ids that keep them bright */
  labels: [
    { x: 1216, y: 558, litWhen: ["nas", "server"],
      html: '<b style="color:#d55181">the gateway</b> · all requests' },
    { x: 788, y: 798, litWhen: ["nas", "node"],
      html: '<b style="color:#d95926">⚡ Wake-on-LAN</b> · wakes sleeping nodes' },
  ],

  /* bottom comparison panel; omit this key entirely to drop the panel */
  memory: {
    title: "Memory available to one model",
    max: 96, unit: "GB",
    bars: [
      { m: "server",      name: "GPU Server",  sub: "VRAM", value: 96 },
      { m: "workstation", name: "Workstation", sub: "VRAM", value: 16 },
      { m: "node",        name: "GPU Node",    sub: "VRAM", value: 12 },
    ],
  },
};
