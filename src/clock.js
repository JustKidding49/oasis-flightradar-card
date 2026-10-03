// Affichage uniquement : lecture facultative du code OACI, aucun service HA.
// Fuseaux : mwgg/Airports (MIT), https://github.com/mwgg/Airports.
// Copyright (c) 2014 mwgg. Permission is hereby granted, free of
// charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use, copy, modify,
// merge, publish, distribute, sublicense, and/or sell copies of the Software,
// and to permit persons to whom the Software is furnished to do so, subject
// to the following conditions: The above copyright notice and this permission
// notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
class OasisFr24Clock extends HTMLElement {
  static airportZones = {
    EDDB:'Europe/Berlin',EDDL:'Europe/Berlin',EDDF:'Europe/Berlin',EDDH:'Europe/Berlin',EDDM:'Europe/Berlin',
    LOWW:'Europe/Vienna',EBBR:'Europe/Brussels',EKCH:'Europe/Copenhagen',
    LEAL:'Europe/Madrid',LEBL:'Europe/Madrid',LEMD:'Europe/Madrid',LEMG:'Europe/Madrid',LEPA:'Europe/Madrid',LEVC:'Europe/Madrid',
    EFHK:'Europe/Helsinki',LFOB:'Europe/Paris',LFBD:'Europe/Paris',LFLL:'Europe/Paris',LFRS:'Europe/Paris',LFMN:'Europe/Paris',
    LFPB:'Europe/Paris',LFPG:'Europe/Paris',LFPO:'Europe/Paris',LFBO:'Europe/Paris',LFOT:'Europe/Paris',
    LGAV:'Europe/Athens',LHBP:'Europe/Budapest',EIDW:'Europe/Dublin',
    LIME:'Europe/Rome',LICC:'Europe/Rome',LIMC:'Europe/Rome',LIRN:'Europe/Rome',LIRF:'Europe/Rome',LIPZ:'Europe/Rome',
    ENGM:'Europe/Oslo',EHAM:'Europe/Amsterdam',EPKK:'Europe/Warsaw',EPWA:'Europe/Warsaw',
    LPPT:'Europe/Lisbon',LPPR:'Europe/Lisbon',LROP:'Europe/Bucharest',
    EGBB:'Europe/London',EGPH:'Europe/London',EGKK:'Europe/London',EGLL:'Europe/London',EGGW:'Europe/London',EGSS:'Europe/London',EGCC:'Europe/London',
    UUEE:'Europe/Moscow',UUDD:'Europe/Moscow',UUWW:'Europe/Moscow',ULLI:'Europe/Moscow',
    ESSA:'Europe/Stockholm',LSGG:'Europe/Paris',LSZH:'Europe/Zurich',LKPR:'Europe/Prague',LTFM:'Europe/Istanbul',
    KJFK:'America/New_York',RJTT:'Asia/Tokyo'
  };
  constructor() {
    super();
    this.attachShadow({mode:"open"});
    this._timers = new Set();
    this._visibility = () => {
      this._stop();
      if (!document.hidden && this.isConnected) this._start();
    };
  }
  set hass(value) {
    this._hass = value;
    if (!this._config?.airport_entity) return;
    const code = String(value.states[this._config.airport_entity]?.state || '').trim().toUpperCase();
    if (code === this._airportCode) return;
    this._airportCode = code;
    this._lookupController?.abort();
    this._airportZone = this._config.airport_timezones?.[code] || OasisFr24Clock.airportZones[code] || null;
    this._airportStatus = this._airportZone ? '' : 'FUSEAU INDISPONIBLE';
    if (!this._airportZone && this._config.online_timezones !== false && /^[A-Z0-9]{4}$/.test(code)) {
      this._airportStatus = 'RECHERCHE DU FUSEAU';
      this._lookupAirport(code);
    }
    if (this._digits) { this._stop(); this._tick(false); if (this.isConnected && !document.hidden) this._start(); }
  }
  setConfig(config) {
    this._config = config;
    this._zone = null;
    this._stop();
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; height:100%; container-type:inline-size; }
        ha-card { box-sizing:border-box; height:100%; min-height:118px; display:flex;
          flex-direction:column; align-items:center; justify-content:center; gap:12px;
          padding:16px 12px; background:#11110f; color:#f4cf39; border:1px solid #37372c;
          border-radius:12px; box-shadow:0 5px 18px #0003; }
        .title { min-height:20px;display:flex;align-items:center;justify-content:center;font:600 10px Arial,sans-serif; letter-spacing:2px; color:#c4b878; text-align:center; overflow-wrap:anywhere; }
        .clock { display:flex; align-items:center; justify-content:center; gap:clamp(4px,1cqi,9px); }
        .group { display:flex; gap:clamp(3px,.6cqi,5px); }
        .digit { --w:clamp(27px,9cqi,36px); --h:calc(var(--w) * 1.45);
          position:relative; width:var(--w); height:var(--h); perspective:320px;
          border:1px solid #3e3d31; border-radius:5px; background:#20201a;
          box-shadow:0 3px 5px #0009; font:400 calc(var(--w) * 1.35) Impact,'Arial Narrow',sans-serif; }
        .seconds .digit { --w:clamp(23px,5.5cqi,29px); color:#d8b936; }
        .half { position:absolute; left:0; width:100%; height:50%; overflow:hidden;
          backface-visibility:hidden; -webkit-backface-visibility:hidden; }
        .half span { display:flex; justify-content:center; align-items:center;
          width:100%; height:var(--h); line-height:1; text-shadow:0 1px 1px #000; }
        .top { top:0; border-radius:4px 4px 0 0; background:linear-gradient(#333329,#292923); }
        .bottom { bottom:0; border-radius:0 0 4px 4px; background:linear-gradient(#20201b,#282822); }
        .bottom span { transform:translateY(-50%); }
        .digit:after { content:""; position:absolute; top:calc(50% - 1px); left:0; right:0;
          height:2px; background:#080807; box-shadow:0 1px 1px #0008; z-index:5; }
        .digit:before { content:""; position:absolute; top:calc(50% - 3px); left:-2px; right:-2px;
          height:6px; border-left:3px solid #74705b; border-right:3px solid #74705b; z-index:6; }
        .flap { z-index:4; visibility:hidden; }
        .flap.top { transform-origin:center bottom; }
        .flap.bottom { transform-origin:center top; transform:rotateX(90deg); }
        .flipping .flap.top { visibility:visible; animation:fall-top 300ms ease-in forwards; }
        .flipping .flap.bottom { visibility:visible; animation:fall-bottom 300ms 300ms ease-out both; }
        @keyframes fall-top { from { transform:rotateX(0); filter:brightness(1); }
          to { transform:rotateX(-90deg); filter:brightness(.55); } }
        @keyframes fall-bottom { from { transform:rotateX(90deg); filter:brightness(.55); }
          to { transform:rotateX(0); filter:brightness(1); } }
        .colon { font:700 25px 'Courier New',monospace; color:#c4a92d; margin-top:-4px; }
        @container(max-width:260px) {
          ha-card { padding:12px 4px; }
          .title { font-size:8px; letter-spacing:1px; }
          .digit { --w:clamp(14px,8cqi,24px); }
          .seconds .digit { --w:clamp(12px,7cqi,20px); }
          .clock,.group { gap:2px; }
          .colon { font-size:18px; }
        }
        @media(prefers-reduced-motion:reduce) { .flap { animation:none !important; visibility:hidden !important; } }
      </style>
      <ha-card>
        <div class="title"></div>
        <div class="clock" role="timer" aria-live="off">
          <div class="group hours"></div><span class="colon" aria-hidden="true">:</span>
          <div class="group minutes"></div><span class="colon" aria-hidden="true">:</span>
          <div class="group seconds"></div>
        </div>
      </ha-card>
    `;
    this._syncZone();
    this._digits = [];
    for (const name of ["hours","minutes","seconds"]) {
      const group = this.shadowRoot.querySelector("." + name);
      for (let i=0;i<2;i++) {
        const digit = document.createElement("div");
        digit.className = "digit";
        digit.setAttribute("aria-hidden","true");
        for (const cls of ["top base","bottom base","top flap","bottom flap"]) {
          const half = document.createElement("div");
          half.className = "half " + cls;
          half.append(document.createElement("span"));
          digit.append(half);
        }
        group.append(digit);
        this._digits.push(digit);
      }
    }
    this._value = "";
    if (this._hass) { this._airportCode = undefined; this.hass = this._hass; }
    this._tick(false);
    if (this.isConnected && !document.hidden) this._start();
  }
  connectedCallback() {
    document.addEventListener("visibilitychange",this._visibility);
    if (this._config?.airport_entity && this._hass && this._airportCode === undefined) this.hass = this._hass;
    if (this._formatter && !document.hidden) this._start();
  }
  disconnectedCallback() {
    this._lookupController?.abort();
    this._airportCode = undefined;
    document.removeEventListener("visibilitychange",this._visibility);
    this._stop();
  }
  getCardSize() { return 2; }
  getGridOptions() { return {columns:12,rows:2,min_columns:6,min_rows:2}; }
  _syncZone() {
    if (!this._config) return false;
    // Le fuseau de chaque appareil reste local : ni GPS ni requête réseau.
    const requested = this._config.time_zone;
    const zone = this._config.airport_entity ? this._airportZone : !requested || requested === "auto"
      ? new Intl.DateTimeFormat().resolvedOptions().timeZone
      : requested;
    const title = this.shadowRoot.querySelector(".title");
    if (this._config.airport_entity) {
      title.textContent = 'AÉROPORT · ' + (this._airportCode || '—') + ' · ' + (zone || this._airportStatus || 'EN ATTENTE').replaceAll('_',' ').toUpperCase();
    }
    if (!zone) { this._formatter = null; this._zone = null; return true; }
    if (zone === this._zone) return false;
    this._formatter = new Intl.DateTimeFormat("fr-FR", {
      timeZone:zone, hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23"
    });
    this._zone = this._formatter.resolvedOptions().timeZone;
    if (!this._config.airport_entity) title.textContent = this._config.title || "HEURE LOCALE · " + this._zone.replaceAll("_"," ").toUpperCase();
    return true;
  }
  async _lookupAirport(code) {
    const controller = new AbortController();
    this._lookupController = controller;
    const timeout = setTimeout(() => controller.abort(),15000);
    try {
      // La base publique est téléchargée sans identifiant HA, ni code suivi dans l'URL.
      const response = await fetch('https://raw.githubusercontent.com/mwgg/Airports/master/airports.json', {
        signal:controller.signal, credentials:'omit', referrerPolicy:'no-referrer'
      });
      if (!response.ok) throw new Error('Base indisponible');
      const data = await response.json();
      const zone = data[code]?.tz;
      if (!zone) throw new Error('Fuseau inconnu');
      new Intl.DateTimeFormat('fr-FR',{timeZone:zone});
      if (controller.signal.aborted || this._airportCode !== code) return;
      for (const [icao,airport] of Object.entries(data)) {
        if (/^[A-Z0-9]{4}$/.test(icao) && typeof airport.tz === 'string') OasisFr24Clock.airportZones[icao] = airport.tz;
      }
      this._airportZone = zone;
      this._airportStatus = '';
    } catch (_) {
      if (this._lookupController !== controller || this._airportCode !== code) return;
      this._airportStatus = 'FUSEAU INDISPONIBLE';
    } finally {
      clearTimeout(timeout);
      if (this._airportCode === code && this._digits) this._tick(false);
    }
  }
  _stop() {
    clearTimeout(this._timer);
    for (const id of this._timers) clearTimeout(id);
    this._timers.clear();
    for (const digit of this._digits || []) {
      digit.classList.remove("flipping");
      for (const span of digit.querySelectorAll("span")) span.textContent = digit.dataset.value || "0";
    }
  }
  _start() {
    clearTimeout(this._timer);
    this._tick(false);
    const schedule = () => {
      this._timer = setTimeout(() => {
        if (!this.isConnected || document.hidden) return;
        this._tick(true);
        schedule();
      },1000 - Date.now()%1000 + 8);
    };
    schedule();
  }
  _tick(animate) {
    const previousZone = this._zone;
    if (this._syncZone()) animate = false;
    if (previousZone !== this._zone) this.dispatchEvent(new CustomEvent('airport-zone-changed'));
    const parts = this._formatter?.formatToParts(new Date());
    const fields = parts ? ["hour","minute","second"].map(k=>parts.find(p=>p.type===k).value) : ['--','--','--'];
    const next = fields.join("");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this._digits.forEach((digit,index) => {
      const value=next[index], old=this._value[index];
      if (value===old) return;
      digit.dataset.value=value;
      digit.classList.remove("flipping");
      digit.querySelector(".top.base span").textContent=value;
      digit.querySelector(".bottom.base span").textContent=old || value;
      digit.querySelector(".top.flap span").textContent=old || value;
      digit.querySelector(".bottom.flap span").textContent=value;
      if (animate && old && !reduced && index < 4) {
        // Relance l'animation uniquement sur les chiffres ayant changé.
        void digit.offsetWidth;
        digit.classList.add("flipping");
        const id=setTimeout(()=>{
          digit.querySelector(".bottom.base span").textContent=value;
          digit.classList.remove("flipping");
          this._timers.delete(id);
        },650);
        this._timers.add(id);
      } else {
        digit.querySelector(".bottom.base span").textContent=value;
      }
    });
    this._value=next;
    this.shadowRoot.querySelector(".clock").setAttribute("aria-label",fields.join(":"));
  }
}
if (!customElements.get("oasis-fr24-internal-clock")) customElements.define("oasis-fr24-internal-clock",OasisFr24Clock);
