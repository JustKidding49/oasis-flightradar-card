// Sélecteur propre au dashboard : aucune écriture avant validation utilisateur.
class OasisFr24Selector extends HTMLElement {
  _t(key,params){return oasisTranslate(this._language||oasisLanguage(this._hass),key,params);}

  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;color:#f4cf39;font-family:Arial,sans-serif}
        *{box-sizing:border-box}button,input{font:inherit}button{cursor:pointer}
        button:focus-visible,input:focus-visible{outline:2px solid #f4cf39;outline-offset:3px}
        .launch{width:100%;min-height:56px;display:flex;align-items:center;gap:12px;text-align:start;padding:9px 16px;background:#11110f;color:#f4cf39;border:1px solid #37372c;border-radius:12px;box-shadow:0 5px 18px #0003}
        .icon{display:grid;place-items:center;background:#28271c;border-radius:50%;width:36px;height:36px;font-size:22px}
        .label{font-size:14px;letter-spacing:.5px}.code{display:table;font:700 12px 'Courier New',monospace;letter-spacing:3px;padding:2px 6px;margin-top:3px;background:repeating-linear-gradient(90deg,#27271f 0 6px,#20201a 6px 7px)}
        .change{margin-inline-start:auto;font-size:10px;letter-spacing:1.4px;color:#c4b878}
        dialog{width:min(620px,calc(100vw - 28px));max-height:calc(100dvh - 28px);padding:0;background:#11110f;color:#f4cf39;border:1px solid #514829;border-radius:20px;box-shadow:0 24px 100px #000b;overflow:auto;color-scheme:dark}
        dialog::backdrop{background:#000a;backdrop-filter:blur(5px)}
        form{margin:0;padding:24px}header{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}
        .eyebrow{font-size:10px;letter-spacing:2px;color:#aa9d6b;margin:0 0 8px}h2{font-size:24px;font-weight:500;margin:0;letter-spacing:-.3px}
        .close{flex-shrink:0;width:36px;height:36px;border:1px solid #37372c;border-radius:50%;color:#f4cf39;background:#22221b;font-size:23px}
        .current{font-size:12px;color:#c4b878;margin:14px 0 20px}.current strong{color:#f4cf39}
        label{display:block;font-size:11px;letter-spacing:1px;color:#c4b878;margin-bottom:7px}
        input{width:100%;height:44px;border-radius:9px;border:1px solid #464330;background:#20201a;color:#fff4c1;padding:0 12px}
        input::placeholder{color:#a69e7e}.search{margin-bottom:10px}.count{font-size:11px;color:#aa9d6b;margin:10px 0}
        .results{max-height:32dvh;min-height:100px;overflow:auto;scrollbar-color:#aa8d30 #20201a;display:grid;align-content:start;gap:5px;padding-inline-end:5px}
        .more{padding:12px;color:#f4cf39;background:#20201a;border:1px solid #514829;border-radius:8px}
        .airport{display:grid;grid-template-columns:1fr auto;gap:4px 12px;width:100%;text-align:start;padding:11px 12px;border-radius:8px;border:1px solid #2e2e23;background:#1a1a16;color:#f4cf39}
        .airport:hover{background:#29271c;border-color:#78652a}.airport[aria-pressed=true]{border-color:#f4cf39;background:#33301c}
        .airport .name{font-size:13px}.airport .country{grid-column:1;font-size:10px;color:#b1a578}.airport .icao{grid-column:2;grid-row:1/3;align-self:center;direction:ltr;font:700 17px 'Courier New',monospace;letter-spacing:2px}
        .empty{font-size:12px;color:#c4b878;padding:18px 8px;margin:0}
        .manual{border-top:1px solid #37372c;padding-top:16px;margin-top:18px;display:grid;grid-template-columns:120px 1fr;gap:14px;align-items:end}
        .manual input{font:700 21px 'Courier New',monospace;letter-spacing:3px;text-transform:uppercase}.selection{font-size:12px;color:#c4b878;line-height:1.6;margin:0 0 3px;overflow-wrap:anywhere}
        .message{min-height:16px;font-size:12px;color:#f5be72;margin:10px 0}
        footer{display:flex;justify-content:flex-end;gap:10px}footer button{border-radius:9px;padding:12px 16px;font-size:12px;border:1px solid #514829}
        .cancel{background:transparent;color:#c4b878}.apply{background:#f4cf39;color:#16160f;font-weight:700}.apply:disabled{background:#383322;color:#998b56;cursor:default}
        @media(max-width:480px){form{padding:18px}h2{font-size:21px}.change{font-size:9px;letter-spacing:.5px}.results{max-height:29dvh}footer button{padding:12px 10px}}
      </style>
      <button class="launch" type="button" aria-label="Choisir un aéroport" aria-haspopup="dialog"><span class="icon" aria-hidden="true">✈</span><span><span class="label">AÉROPORT</span><span class="code">—</span></span><span class="change">CHOISIR ›</span></button>
      <dialog aria-labelledby="selector-title"><form>
        <header><div><p class="eyebrow">OASIS · SUIVI AÉRIEN</p><h2 id="selector-title">Choisir un aéroport</h2></div><button class="close" type="button" aria-label="Fermer">×</button></header>
        <p class="current"></p>
        <label for="airport-search">VILLE, AÉROPORT, PAYS, CODE OACI OU IATA</label>
        <input class="search" id="airport-search" type="search" placeholder="Ex. Nantes, Tokyo, KJFK, DXB…" autocomplete="off">
        <p class="count" aria-live="polite"></p><div class="results" role="group" aria-label="Aéroports proposés"></div>
        <div class="manual"><div><label for="airport-code">CODE OACI</label><input id="airport-code" class="manual-code" type="text" maxlength="4" pattern="[A-Za-z]{4}" autocomplete="off" spellcheck="false" aria-describedby="selection"></div><p class="selection" id="selection"></p></div>
        <p class="message" role="status" aria-live="polite"></p>
        <footer><button class="cancel" type="button">Annuler</button><button class="apply" type="submit" disabled>Suivre cet aéroport</button></footer>
      </form></dialog>`;
    const q = selector => this.shadowRoot.querySelector(selector);
    this._dialog = q('dialog'); this._form = q('form'); this._search = q('.search');
    this._input = q('.manual-code'); this._apply = q('.apply');
    q('.launch').addEventListener('click',()=>this._open());
    for(const name of ['.close','.cancel']) q(name).addEventListener('click',()=>this._close());
    this._dialog.addEventListener('click',event=>{if(event.target===this._dialog){const r=this._dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)this._close();}});
    this._dialog.addEventListener('close',()=>q('.launch').focus());
    this._dialog.addEventListener('cancel',event=>{if(this._busy)event.preventDefault();});
    this._search.addEventListener('input',()=>{this._limit=80;this._renderResults();});
    this._search.addEventListener('keydown',event=>{if(event.key==='Enter')event.preventDefault();});
    this._input.addEventListener('input',()=>this._select(this._input.value));
    this._form.addEventListener('submit',event=>{event.preventDefault();this._save();});
  }
  _translateStatic(){oasisStaticText(this,[[".launch","Choisir un aéroport","aria-label"],[".label","AÉROPORT"],[".change","CHOISIR ›"],[".eyebrow","OASIS · SUIVI AÉRIEN"],["h2","Choisir un aéroport"],[".close","Fermer","aria-label"],["label[for=\"airport-search\"]","VILLE, AÉROPORT, PAYS, CODE OACI OU IATA"],[".search","Ex. Nantes, Tokyo, KJFK, DXB…","placeholder"],[".results","Aéroports proposés","aria-label"],["label[for=\"airport-code\"]","CODE OACI"],[".cancel","Annuler"],[".apply","Suivre cet aéroport"]]);}
  setConfig(config) {
    if (!/^(text|input_text)\.[a-z0-9_]+$/.test(config.entity || '')) throw new Error('Une entité text ou input_text est requise');
    this._config = config;
    this._airports = Array.isArray(config.airports) ? config.airports : [];
    this._localizedCatalog=new Map();
    if(this._hass) this.hass=this._hass;
  }
  set hass(value) {
    const language=oasisLanguage(value),changed=language!==this._language;this._language=language;this.lang=language;this.dir=['ar','ur'].includes(language)?'rtl':'ltr';
    this._hass=value;this._translateStatic();this._input.dir='ltr';
    if(!this._config)return;
    const entity=value.states[this._config.entity];
    this._available=!!entity&&entity.state!=='unavailable';
    const state=entity?.state ?? 'unavailable';
    this._current=String(state).trim().toUpperCase();
    this.shadowRoot.querySelector('.code').textContent=/^[A-Z]{4}$/.test(this._current)?this._current:'—';
    const current=this.shadowRoot.querySelector('.current');
    const airport=this._airports.find(a=>a.code===this._current);
    current.textContent=this._t("Actuellement suivi : ")+this._current+(airport?' · '+oasisAirportLocation(airport,this._language).name:'');
    if(this._dialog.open){if(changed){this._select(this._draft);this._renderResults();}this._updateApply();}
  }
  disconnectedCallback(){if(this._dialog.open)this._dialog.close();}
  getCardSize(){return 1;}
  getGridOptions(){return {columns:'full',rows:1};}
  static normalize(value){return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
  static matches(airport,query,language='en'){const haystack=OasisFr24Selector.normalize(oasisAirportLocation(airport,language).aliases.join(' '));return OasisFr24Selector.normalize(query.trim()).split(/\s+/).every(word=>haystack.includes(word));}
  _open(){
    if(!this._config)return;
    this._search.value='';this._limit=80;this.shadowRoot.querySelector('.message').textContent='';
    this._select(/^[A-Z]{4}$/.test(this._current)?this._current:'');
    this._renderResults();this._dialog.showModal();this._search.focus();
  }
  _close(){if(!this._busy)this._dialog.close();}
  _select(value){
    this._draft=String(value).trim().toUpperCase();this._input.value=this._draft;
    const airport=this._airports.find(a=>a.code===this._draft);
    const location=airport?oasisAirportLocation(airport,this._language):null;
    this.shadowRoot.querySelector('.selection').textContent=location?location.name+' · '+location.country:/^[A-Z]{4}$/.test(this._draft)?this._t("Code personnalisé · vérifie qu’il correspond à un aéroport."):this._t("Sélectionne un aéroport ou saisis ses 4 lettres.");
    this.shadowRoot.querySelector('.message').textContent='';
    this._updateApply();
    for(const b of this.shadowRoot.querySelectorAll('.airport')) b.setAttribute('aria-pressed',String(b.dataset.code===this._draft));
  }
  _updateApply(){this._apply.disabled=this._config.read_only===true||!this._available||!!this._busy||!/^[A-Z]{4}$/.test(this._draft || '')||this._draft===this._current;}
  _renderResults(){
    const language=this._language||'en';
    if(!this._localizedCatalog.has(language)){
      const localized=this._airports.map(airport=>{const location=oasisAirportLocation(airport,language);return {airport,location,search:OasisFr24Selector.normalize(location.aliases.join(' '))};});
      localized.sort((a,b)=>a.location.country.localeCompare(b.location.country,language)||a.location.name.localeCompare(b.location.name,language)||a.airport.code.localeCompare(b.airport.code));
      this._localizedCatalog.set(language,localized);
    }
    const words=OasisFr24Selector.normalize(this._search.value.trim()).split(/\s+/);
    const rows=this._localizedCatalog.get(language).filter(a=>words.every(word=>a.search.includes(word)));
    const list=this.shadowRoot.querySelector('.results');list.replaceChildren();
    const visible=rows.slice(0,this._limit||80);
    this.shadowRoot.querySelector('.count').textContent=this._t(rows.length===1?'{count} aéroport':'{count} aéroports',{count:rows.length})+(visible.length<rows.length?this._t(' · {count} affichés — affine ta recherche',{count:visible.length}):'');
    for(const {airport,location} of visible){
      const button=document.createElement('button');button.type='button';button.className='airport';button.dataset.code=airport.code;button.setAttribute('aria-pressed',String(airport.code===this._draft));button.setAttribute('aria-label',location.name+', '+airport.code);button.title=airport.name;
      for(const [cls,text] of [['name',location.name],['country',location.country+(airport.iata?' · IATA '+airport.iata:'')],['icao',airport.code]]){const span=document.createElement('span');span.className=cls;span.textContent=text;button.append(span);}
      button.addEventListener('click',()=>this._select(airport.code));list.append(button);
    }
    if(visible.length<rows.length){const more=document.createElement('button');more.type='button';more.className='more';more.textContent=this._t("Afficher davantage");more.addEventListener('click',()=>{this._limit=(this._limit||80)+80;this._renderResults();});list.append(more);}
    if(!rows.length){const p=document.createElement('p');p.className='empty';p.textContent=this._t("Aucun résultat. Tu peux saisir un autre code OACI ci-dessous.");list.append(p);}
  }
  async _save(){
    if(this._apply.disabled||!this._hass||!this._form.reportValidity())return;
    // Unique écriture : appelée exclusivement par la validation du formulaire.
    const code=this._draft;this._busy=true;this._updateApply();this._apply.textContent=this._t("Enregistrement…");
    try{await this._hass.callService(this._config.entity.split('.')[0],'set_value',{entity_id:this._config.entity,value:code});this._dialog.close();}
    catch(_){this.shadowRoot.querySelector('.message').textContent=this._t("Impossible de modifier le suivi. Vérifie ta connexion et tes droits, puis réessaie.");}
    finally{this._busy=false;this._apply.textContent=this._t("Suivre cet aéroport");this._updateApply();}
  }
}
if(!customElements.get('oasis-fr24-internal-selector'))customElements.define('oasis-fr24-internal-selector',OasisFr24Selector);
