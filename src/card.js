const OASIS_FIELDS = {
  departures: {time:'time_scheduled_departure',city:'airport_city',flight:'flight_number',status:'status_text'},
  arrivals: {time:'time_scheduled_arrival',city:'airport_city',flight:'flight_number',status:'status_text'}
};
function oasisValue(record, key) {
  return String(key || '').split('.').reduce((v,k) => v && typeof v === 'object' ? v[k] : undefined, record);
}
function oasisTime(value, zone) {
  if (value === null || value === undefined || value === '' || !zone) return '--:--';
  const date = new Date(typeof value === 'number' ? value * 1000 : value);
  if (!Number.isFinite(date.getTime())) return '--:--';
  try { return new Intl.DateTimeFormat('fr-FR',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date); }
  catch (_) { return '--:--'; }
}
function oasisEntity(value, domains, required = false) {
  if (!value && !required) return;
  if (typeof value !== 'string' || !/^[a-z_]+\.[a-z0-9_]+$/.test(value) || !domains.includes(value.split('.')[0]))
    throw new Error('Entité invalide : '+(value || 'manquante')+' ; domaines attendus : '+domains.join(', '));
}
class OasisFlightradarCard extends HTMLElement {
  _t(key,params){return oasisTranslate(this._language||oasisLanguage(this._hass),key,params);}

  constructor() {
    super(); this.attachShadow({mode:'open'}); this._sources = [];this._boardViews=new Map();this._boardScheduler=new OasisBoardScheduler();
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;container-type:inline-size;color:#f4cf39;font-family:Arial,sans-serif;color-scheme:dark}
      *{box-sizing:border-box}ha-card{display:block;background:#11110f;border:1px solid #37372c;border-radius:24px;overflow:hidden;color:#f4cf39}
      .body{padding:16px;display:grid;gap:16px}.clocks{direction:ltr;display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .boards{direction:ltr;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px}
      .board{border:1px solid #37372c;border-radius:12px;overflow:hidden;min-width:0;container-type:inline-size}
      h3{direction:var(--oasis-direction,ltr);font:600 15px Arial,sans-serif;letter-spacing:.5px;margin:0;padding:16px;background:#11110f}
      .zone-caption{font-size:10px;padding:6px;color:#c4b878;text-align:center;margin:0}
      caption{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%)}
      .scroll{max-height:calc((var(--visible-rows,10) + 1)*32px);overflow:auto;container-type:inline-size;scrollbar-gutter:stable;scrollbar-color:#c6a62b #22221e;overscroll-behavior:contain}
      table{width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0}tr{height:32px}
      th,td{height:32px;padding:5px 4px;line-height:20px;text-align:left;white-space:nowrap}
      th{position:sticky;top:0;z-index:1;background:#292923;color:#f8efd0;font:500 8px Arial,sans-serif;text-transform:uppercase;border-bottom:2px solid #050504;overflow:hidden}
      td{padding:4px;vertical-align:middle;font:700 11px 'Courier New',monospace;text-transform:uppercase;border-right:3px solid #080807;border-bottom:3px solid #080807;background:#181815}
      .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
      .flap-word{display:inline-flex;gap:.5px;vertical-align:middle;overflow:hidden;width:calc(var(--flap-count) * (var(--flap-width,11px) + .5px) - .5px)}
      .flap{position:relative;display:inline-block;width:var(--flap-width,11px);height:calc(var(--flap-width,11px)*1.45);font:400 calc(var(--flap-width,11px)*1.35) Impact,'Arial Narrow',sans-serif;perspective:90px;border-radius:2px;background:#24241e;box-shadow:0 1px 2px #000;flex:none}
      .face{position:absolute;inset:0;text-align:center;backface-visibility:hidden;background:linear-gradient(#2c2c24 49%,#080807 49%,#080807 54%,#22221c 54%);border-radius:2px}
      .flap .face{pointer-events:none}
      .flap::before,.flap::after{content:attr(data-char);position:absolute;inset:0;display:flex;align-items:center;justify-content:center;line-height:1;pointer-events:none}
      .flap::before{clip-path:inset(0 0 50%)}.flap::after{clip-path:inset(50% 0 0)}
      .flip-a::after,.flip-b::after{content:attr(data-old)}
      .fall{clip-path:inset(0 0 50%)}.rise{clip-path:inset(50% 0 0)}
      .fall,.rise{display:none;z-index:2;transform-origin:center}
      .flip-a .fall,.flip-b .fall,.flip-a .rise,.flip-b .rise{display:block}
      .flap .fall{background:none}.flap .rise{background:none}
      .flap .fall::before,.flap .rise::before{content:attr(data-glyph);position:absolute;inset:0;display:flex;align-items:center;justify-content:center;line-height:1;background:linear-gradient(#2c2c24 49%,#080807 49%,#080807 54%,#22221c 54%)}
      .flip-a .fall{animation:flap-fall-a 26ms linear both}.flip-b .fall{animation:flap-fall-b 26ms linear both}
      .flip-a .rise{animation:flap-rise-a 26ms 26ms linear both}.flip-b .rise{animation:flap-rise-b 26ms 26ms linear both}
      @keyframes flap-fall-a{to{transform:rotateX(-90deg)}}@keyframes flap-fall-b{to{transform:rotateX(-90deg)}}
      @keyframes flap-rise-a{from{transform:rotateX(90deg)}to{transform:rotateX(0)}}@keyframes flap-rise-b{from{transform:rotateX(90deg)}to{transform:rotateX(0)}}
      .flap[data-direction=reverse].flip-a::after,.flap[data-direction=reverse].flip-b::after{content:attr(data-char)}
      .flap[data-direction=reverse].flip-a::before,.flap[data-direction=reverse].flip-b::before{content:attr(data-old)}
      .flap[data-direction=reverse] .fall{clip-path:inset(50% 0 0)}.flap[data-direction=reverse] .rise{clip-path:inset(0 0 50%)}
      .flap[data-direction=reverse].flip-a .fall{animation-name:flap-back-fall-a}.flap[data-direction=reverse].flip-b .fall{animation-name:flap-back-fall-b}
      .flap[data-direction=reverse].flip-a .rise{animation-name:flap-back-rise-a}.flap[data-direction=reverse].flip-b .rise{animation-name:flap-back-rise-b}
      @keyframes flap-back-fall-a{to{transform:rotateX(90deg)}}@keyframes flap-back-fall-b{to{transform:rotateX(90deg)}}
      @keyframes flap-back-rise-a{from{transform:rotateX(-90deg)}to{transform:rotateX(0)}}@keyframes flap-back-rise-b{from{transform:rotateX(-90deg)}to{transform:rotateX(0)}}
      .empty{padding:18px;text-align:center;color:#c4b878;font-size:13px;margin:0}.followed{display:grid;gap:8px;max-height:420px;overflow:auto}
      .flight{padding:16px;border:1px solid #37372c;border-radius:12px;display:grid;grid-template-columns:1fr auto;gap:7px;font-size:13px;background:#20201a}
      .flight strong{font:700 18px 'Courier New',monospace}.flight small{color:#c4b878}.route{grid-column:1/-1}
      a{color:#f4cf39}button,input{font:inherit}button{cursor:pointer;min-height:44px;border-radius:12px;padding:12px;border:1px solid #514829;background:#24241f;color:#f8efd0}
      button:focus-visible,input:focus-visible,a:focus-visible{outline:2px solid #f4cf39;outline-offset:3px}
      button:disabled{opacity:.45;cursor:default}.actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.actions button{font-size:12px}
      dialog{width:min(480px,calc(100vw - 28px));max-height:calc(100dvh - 28px);overflow:auto;background:#11110f;color:#f4cf39;border:1px solid #514829;border-radius:20px;padding:24px}
      dialog::backdrop{background:#000a;backdrop-filter:blur(5px)}dialog h2{font-size:23px;margin:0 0 18px}dialog p{line-height:1.5;color:#c4b878;font-size:13px}
      label{display:block;margin-bottom:8px;font-size:12px}input{width:100%;height:44px;padding:10px;background:#20201a;color:#fff4c1;border:1px solid #514829;border-radius:8px}
      footer{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}.submit{background:#f4cf39;color:#16160f}.feedback{min-height:18px;color:#f5be72;font-size:12px}
      .readonly{color:#c4b878;text-align:center;font-size:11px;margin:0}[hidden]{display:none!important}
      @container(max-width:650px){.boards{grid-template-columns:1fr}.body{padding:10px;gap:10px}.clocks{gap:8px}.actions{gap:6px}.actions button{padding:8px 4px;font-size:11px}}
    </style><ha-card>
      <oasis-fr24-internal-banner></oasis-fr24-internal-banner>
      <div class="body"><div class="clocks"><oasis-fr24-internal-clock class="local"></oasis-fr24-internal-clock><oasis-fr24-internal-clock class="airport-clock"></oasis-fr24-internal-clock></div>
      <oasis-fr24-internal-selector></oasis-fr24-internal-selector>
      <div class="boards"></div><div class="followed" aria-label="Vols suivis"></div>
      <div class="actions"><button type="button" data-action="add">✈ Ajouter un vol</button><button type="button" data-action="remove">✈ Retirer un vol</button><button type="button" data-action="clear">✕ Effacer les suivis</button></div>
      <p class="readonly" hidden>Lecture seule — aucune action autorisée</p></div>
      <dialog aria-labelledby="flight-dialog-title"><form><h2 id="flight-dialog-title"></h2><p class="explanation"></p><label for="flight-input">Numéro de vol ou indicatif</label><input id="flight-input" autocomplete="off" maxlength="64" required><p class="feedback" role="status" aria-live="polite"></p><footer><button class="cancel" type="button">Annuler</button><button class="submit" type="submit">Confirmer</button></footer></form></dialog>
    </ha-card>`;
    this._banner = this.shadowRoot.querySelector('oasis-fr24-internal-banner');
    this._localClock = this.shadowRoot.querySelector('.local');
    this._airportClock = this.shadowRoot.querySelector('.airport-clock');
    this._selector = this.shadowRoot.querySelector('oasis-fr24-internal-selector');
    this._dialog = this.shadowRoot.querySelector('dialog');
    this._input = this.shadowRoot.querySelector('#flight-input');
    for (const button of this.shadowRoot.querySelectorAll('[data-action]')) button.addEventListener('click', () => this._openAction(button.dataset.action));
    this.shadowRoot.querySelector('.cancel').addEventListener('click', () => {if(!this._busy)this._dialog.close();});
    this._dialog.addEventListener('cancel', event => {if(this._busy)event.preventDefault();});
    this._dialog.addEventListener('close', () => this._launcher?.focus());
    this.shadowRoot.querySelector('form').addEventListener('submit', event => {event.preventDefault();this._submitAction();});
    this._airportClock.addEventListener('airport-zone-changed', () => this._renderBoards());
  }
  static getStubConfig() { return {airport_entity:'',departures_entity:'',arrivals_entity:'',read_only:true}; }
  static getConfigElement() { return document.createElement('oasis-flightradar-card-editor'); }
  _translateStatic(){oasisStaticText(this,[[".followed","Vols suivis","aria-label"],["[data-action=\"add\"]","✈ Ajouter un vol"],["[data-action=\"remove\"]","✈ Retirer un vol"],["[data-action=\"clear\"]","✕ Effacer les suivis"],[".readonly","Lecture seule — aucune action autorisée"],["label[for=\"flight-input\"]","Numéro de vol ou indicatif"],[".cancel","Annuler"],[".submit","Confirmer"]]);}
  setConfig(config) {
    for(const key of ['read_only','online_images','online_timezones','table_animations']) if(config[key]!==undefined&&typeof config[key]!=='boolean') throw Error(key+' doit être un booléen');
    oasisEntity(config.airport_entity,['text','input_text'],true);
    for(const key of ['departures_entity','arrivals_entity','followed_entity']) oasisEntity(config[key],['sensor']);
    for(const key of ['add_entity','remove_entity']) oasisEntity(config[key],['text','input_text']);
    oasisEntity(config.clear_entity,['button','input_button']);
    if(config.visible_rows !== undefined && (!Number.isInteger(config.visible_rows)||config.visible_rows<1||config.visible_rows>30)) throw Error('visible_rows doit être un entier entre 1 et 30');
    if(config.airports !== undefined && (!Array.isArray(config.airports)||config.airports.some(a=>!a||!/^[A-Z]{4}$/.test(a.code)||typeof a.name!=='string'||typeof a.country!=='string'))) throw Error('airports doit être une liste de codes OACI, noms et pays');
    if(config.airport_timezones){for(const [code,zone] of Object.entries(config.airport_timezones)){if(!/^[A-Z]{4}$/.test(code)||typeof zone!=='string')throw Error('airport_timezones invalide');try{new Intl.DateTimeFormat('fr-FR',{timeZone:zone});}catch(_){throw Error('Fuseau invalide : '+zone);}}}
    for(const kind of ['departures','arrivals']) if(config[kind+'_fields']&&Object.values(config[kind+'_fields']).some(v=>typeof v!=='string'))throw Error('Correspondance de champs invalide');
    if(config.local_images){for(const image of Object.values(config.local_images)){if(!image||typeof image.url!=='string'||!(image.url.startsWith('/')&&!image.url.startsWith('//')||image.url.startsWith('https://')))throw Error('Photo locale : utiliser un chemin /local/… ou une URL HTTPS');}}
    this._config={visible_rows:10,read_only:true,table_animations:true,...config};this._sources=[];this._rendered=false;
    for(const view of this._boardViews.values()){
      view.engine.animate=this._config.table_animations;
      if(!view.engine.animate)view.engine.stop();
    }
    const banner={entity:config.airport_entity,local_images:config.local_images,online_images:config.online_images!==false};
    this._banner.setConfig(banner);
    this._localClock.setConfig({time_zone:'auto'});
    this._airportClock.setConfig({airport_entity:config.airport_entity,airport_timezones:config.airport_timezones,online_timezones:config.online_timezones!==false});
    this._selector.setConfig({entity:config.airport_entity,airports:config.airports||OASIS_AIRPORTS,read_only:this._config.read_only});
    this.shadowRoot.querySelector('.readonly').hidden=!this._config.read_only;
    this.style.setProperty('--visible-rows',this._config.visible_rows);
    if(this._hass)this.hass=this._hass;
  }
  set hass(hass) {
    const language=oasisLanguage(hass),languageChanged=language!==this._language;
    this._language=language;this.lang=language;this.dir=['ar','ur'].includes(language)?'rtl':'ltr';
    this.style.setProperty('--oasis-direction',this.dir);this._hass=hass;if(!this._config)return;
    this._translateStatic();
    for(const child of [this._banner,this._localClock,this._airportClock,this._selector]) child.hass=hass;
    const ids=['airport_entity','departures_entity','arrivals_entity','followed_entity'];
    const sources=ids.map(k=>hass.states[this._config[k]]);
    if(sources.some((s,i)=>s!==this._sources[i])||!this._rendered||languageChanged){this._sources=sources;this._renderBoards();this._renderFollowed();this._rendered=true;}
    if(this._dialog.open){this.shadowRoot.querySelector('#flight-dialog-title').textContent=this._t({add:'Ajouter un vol',remove:'Retirer un vol',clear:'Effacer les suivis'}[this._action]);this.shadowRoot.querySelector('.explanation').textContent=this._t(this._action==='clear'?'Cette action effacera tous les suivis supplémentaires. Confirme pour continuer.':'Le suivi sera modifié uniquement après confirmation.');}
    this._updateButtons();
  }
  getCardSize(){return 18;}
  getGridOptions(){return {columns:'full',min_columns:6};}
  connectedCallback(){this._boardScheduler.enabled=true;for(const view of this._boardViews.values())view.engine.listen();if(this._hass&&this._config)this.hass=this._hass;}
  disconnectedCallback(){this._boardScheduler.stop();for(const view of this._boardViews.values())view.engine.destroy();if(this._dialog.open)this._dialog.close();}
  _flights(key) {
    const entity=this._config[key],state=this._hass?.states[entity];
    if(!entity)return {flights:[],message:this._t("Source non configurée")};
    if(!state||['unknown','unavailable'].includes(state.state))return {flights:[],message:this._t("Données indisponibles")};
    const attribute=this._config.flights_attribute||'flights';
    const flights=state.attributes?.[attribute];
    if(!Array.isArray(flights))return {flights:[],message:this._t("Attribut ")+attribute+this._t(" absent ou incompatible")};
    return {flights:flights.filter(f=>f&&typeof f==='object'),message:this._t("Aucun vol à afficher pour le moment")};
  }
  _renderBoards() {
    if(!this._config)return;
    const airport=String(this._hass?.states[this._config.airport_entity]?.state||'').trim().toUpperCase();
    const airportChanged=this._boardAirport!==undefined&&airport!==this._boardAirport;
    if(airportChanged){
      // Les deux capteurs peuvent recevoir leurs nouvelles données à des instants différents.
      this._airportBoardRefresh={departures:true,arrivals:true};
      this._airportBoardBaseline={...this._boardStateSources};
    }
    this._boardAirport=airport;
    this._boardStateSources ||= {};
    const container=this.shadowRoot.querySelector('.boards');
    const data={};
    for(const kind of ['departures','arrivals']){
      const {flights,message}=this._flights(kind+'_entity'),fields={...OASIS_FIELDS[kind],...this._config[kind+'_fields']};
      const values=flights.map(flight=>[oasisTime(oasisValue(flight,fields.time),this._airportClock._zone),oasisValue(flight,fields.city)||flight.airport_name||'—',oasisValue(flight,fields.flight)||flight.callsign||'—',oasisValue(flight,fields.status)||'—']);
      data[kind]={values,message};
    }
    const combined=[...data.departures.values,...data.arrivals.values];
    const sharedWidths=[5,Math.max(1,...combined.map(v=>oasisFlapText(v[1]).length)),6,Math.max(1,...combined.map(v=>oasisFlapText(v[3]).length))];
    this._boardScheduler.hold=true;
    for(const [kind,title,cityTitle] of [['departures',this._t("DÉPARTS / DEPARTURES"),this._t("Destination")],['arrivals',this._t("ARRIVÉES / ARRIVALS"),this._t("Origine")]]) {
      let view=this._boardViews.get(kind);
      if(!view){const board=document.createElement('section');board.className='board';
      const heading=document.createElement('h3');heading.textContent=title;board.append(heading);
      const scroll=document.createElement('div');scroll.className='scroll';scroll.tabIndex=0;scroll.setAttribute('aria-label',title+this._t(" — défilement"));
      const table=document.createElement('table');const caption=document.createElement('caption');caption.textContent=this._t("Horaires dans le fuseau de l’aéroport : ")+(this._airportClock._zone||this._t("indisponible"));table.append(caption);
      const zoneLabel=document.createElement('p');zoneLabel.className='zone-caption';zoneLabel.textContent=caption.textContent;zoneLabel.setAttribute('aria-hidden','true');board.append(zoneLabel);
      const head=document.createElement('thead'),hr=document.createElement('tr');
      for(const label of [this._t("Heure"),cityTitle,this._t("Vol"),this._t("Statut")]){const th=document.createElement('th');th.scope='col';th.textContent=label;hr.append(th);}head.append(hr);table.append(head);
      const body=document.createElement('tbody');
      table.append(body);scroll.append(table);board.append(scroll);container.append(board);
      view={heading,scroll,headers:[...hr.children],caption,zoneLabel,engine:new OasisSplitBoard(scroll,body,this._boardScheduler,this._config.table_animations,false)};this._boardViews.set(kind,view);}
      view.heading.textContent=title;view.scroll.setAttribute('aria-label',title+this._t(' — défilement'));
      view.headers.forEach((header,i)=>header.textContent=[this._t('Heure'),cityTitle,this._t('Vol'),this._t('Statut')][i]);
      view.caption.textContent=this._t("Horaires dans le fuseau de l’aéroport : ")+(this._airportClock._zone||this._t("indisponible"));view.zoneLabel.textContent=view.caption.textContent;
      const {values,message}=data[kind];
      const source=this._hass?.states[this._config[kind+'_entity']];
      const firstAirportRefresh=this._airportBoardRefresh?.[kind]&&source!==this._airportBoardBaseline?.[kind];
      view.engine.update(values,message,sharedWidths,airportChanged||!!this._airportBoardRefresh?.[kind]);
      // Un état vide ou indisponible ne doit pas animer l'arrivée ultérieure des vols.
      if(firstAirportRefresh&&values.length)this._airportBoardRefresh[kind]=false;
      this._boardStateSources[kind]=source;
    }
    this._boardScheduler.hold=false;this._boardScheduler.schedule();
  }
  _renderFollowed() {
    const list=this.shadowRoot.querySelector('.followed');const scroll=list.scrollTop;list.replaceChildren();
    const {flights,message}=this._flights('followed_entity');
    if(!flights.length){const p=document.createElement('p');p.className='empty';p.textContent='✈ '+message;list.append(p);return;}
    for(const flight of flights) {
      const item=document.createElement('article');item.className='flight';
      const title=document.createElement('strong');title.textContent=flight.flight_number||flight.callsign||this._t("Vol suivi");
      const airline=document.createElement('small');airline.textContent=flight.airline||flight.airline_short||'';
      const route=document.createElement('div');route.className='route';
      route.textContent=(flight.airport_origin_city||flight.airport_origin_code_iata||'—')+' → '+(flight.airport_destination_city||flight.airport_destination_code_iata||flight.airport_city||'—');
      const details=document.createElement('small');details.className='route';details.textContent=[flight.aircraft_model,flight.aircraft_registration,flight.status_text,flight.altitude!==undefined?this._t("Altitude : ")+flight.altitude+' ft':null,flight.ground_speed!==undefined?this._t("Vitesse : ")+flight.ground_speed+' kt':null].filter(Boolean).join(' · ');
      item.append(title,airline,route,details);
      // Identifiants intégration uniquement ; jamais de HTML provenant d'un capteur.
      const flightId=flight.id||flight.flight_id;
      if(/^[a-zA-Z0-9]+$/.test(String(flightId||''))){const link=document.createElement('a');link.href='https://www.flightradar24.com/'+encodeURIComponent(flight.callsign||flight.flight_number||'')+'/'+flightId;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';link.textContent=this._t("Voir sur Flightradar24 ↗");item.append(link);}
      list.append(item);
    }
    list.scrollTop=scroll;
  }
  _actionEntity(action){return this._config?.[{add:'add_entity',remove:'remove_entity',clear:'clear_entity'}[action]];}
  _actionAvailable(action) {
    const entity=this._actionEntity(action),state=this._hass?.states[entity];
    return !this._config?.read_only&&!this._busy&&!!state&&state.state!=='unavailable'&&(action==='clear'||state.state!=='unknown');
  }
  _updateButtons(){for(const button of this.shadowRoot.querySelectorAll('[data-action]'))button.disabled=!this._actionAvailable(button.dataset.action);}
  _openAction(action) {
    if(!this._actionAvailable(action))return;
    this._action=action;this._launcher=this.shadowRoot.querySelector('[data-action="'+action+'"]');
    this.shadowRoot.querySelector('#flight-dialog-title').textContent={add:this._t("Ajouter un vol"),remove:this._t("Retirer un vol"),clear:this._t("Effacer les suivis")}[action];
    this.shadowRoot.querySelector('.explanation').textContent=action==='clear'?this._t("Cette action effacera tous les suivis supplémentaires. Confirme pour continuer."):this._t("Le suivi sera modifié uniquement après confirmation.");
    this._input.dir='ltr';this._input.value='';this._input.hidden=action==='clear';this._input.required=action!=='clear';
    this.shadowRoot.querySelector('label').hidden=action==='clear';
    this.shadowRoot.querySelector('.feedback').textContent='';this.shadowRoot.querySelector('.submit').disabled=false;
    this._dialog.showModal();(action==='clear'?this.shadowRoot.querySelector('.cancel'):this._input).focus();
  }
  async _submitAction() {
    if(!this._dialog.open||!this._actionAvailable(this._action)||!this.shadowRoot.querySelector('form').reportValidity())return;
    const value=this._input.value.trim().toUpperCase();
    if(this._action!=='clear'&&!/^[A-Z0-9][A-Z0-9 -]{0,63}$/.test(value)){this.shadowRoot.querySelector('.feedback').textContent=this._t("Numéro de vol ou indicatif invalide.");return;}
    const entity=this._actionEntity(this._action),domain=entity.split('.')[0];
    this._busy=true;this._updateButtons();this.shadowRoot.querySelector('.submit').disabled=true;
    try {
      // Seul point d'écriture : formulaire validé par l'utilisateur, jamais par le rendu.
      await this._hass.callService(domain,this._action==='clear'?'press':'set_value',this._action==='clear'?{entity_id:entity}:{entity_id:entity,value});
      this._dialog.close();
    } catch (_) {this.shadowRoot.querySelector('.feedback').textContent=this._t("Action impossible. Vérifie ta connexion et tes droits.");}
    finally {this._busy=false;this._updateButtons();this.shadowRoot.querySelector('.submit').disabled=false;}
  }
}
class OasisFlightradarCardEditor extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});}
  _t(key){return oasisTranslate(this._language||'en',key);}
  set hass(hass){const language=oasisLanguage(hass);if(language===this._language)return;this._language=language;this.lang=language;this.dir=['ar','ur'].includes(language)?'rtl':'ltr';if(this._config)this._render();}
  setConfig(config){this._config={...config};this._render();}
  _render(){
    this.shadowRoot.innerHTML='<style>label{display:block;margin:12px 0;font:14px system-ui}input{display:block;box-sizing:border-box;width:100%;padding:10px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:6px}</style>';
    for(const [key,label] of [['airport_entity',this._t("Aéroport (text / input_text)")],['departures_entity',this._t("Capteur des départs")],['arrivals_entity',this._t("Capteur des arrivées")],['followed_entity',this._t("Capteur des vols suivis")],['add_entity',this._t("Ajouter un vol (text / input_text)")],['remove_entity',this._t("Retirer un vol (text / input_text)")],['clear_entity',this._t("Effacer les suivis (button / input_button)")],['visible_rows',this._t("Lignes visibles (1–30)")]]) {
      const wrapper=document.createElement('label');wrapper.textContent=label;const input=document.createElement('input');input.value=this._config[key]??(key==='visible_rows'?10:'');
      if(key==='visible_rows'){input.type='number';input.min=1;input.max=30;input.step=1;}
      input.addEventListener('change',()=>{if(!input.reportValidity())return;if(input.value)this._config[key]=key==='visible_rows'?Number(input.value):input.value.trim();else delete this._config[key];this._emit();});wrapper.append(input);this.shadowRoot.append(wrapper);
    }
    const label=document.createElement('label');label.textContent=this._t("Lecture seule");const check=document.createElement('input');check.type='checkbox';check.checked=this._config.read_only!==false;check.addEventListener('change',()=>{this._config.read_only=check.checked;this._emit();});label.append(check);this.shadowRoot.append(label);
    const animationLabel=document.createElement('label');animationLabel.textContent=this._t("Animations des tableaux Départs et Arrivées");const animationCheck=document.createElement('input');animationCheck.type='checkbox';animationCheck.checked=this._config.table_animations!==false;animationCheck.addEventListener('change',()=>{this._config.table_animations=animationCheck.checked;this._emit();});animationLabel.append(animationCheck);this.shadowRoot.append(animationLabel);
    const help=document.createElement('p');help.textContent=this._t("Photos locales, fuseaux personnalisés et correspondances de champs : disponibles dans l’éditeur de code.");this.shadowRoot.append(help);
  }
  _emit(){this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config}},bubbles:true,composed:true}));}
}
if(!customElements.get('oasis-flightradar-card'))customElements.define('oasis-flightradar-card',OasisFlightradarCard);
if(!customElements.get('oasis-flightradar-card-editor'))customElements.define('oasis-flightradar-card-editor',OasisFlightradarCardEditor);
window.customCards=window.customCards||[];
if(!window.customCards.some(c=>c.type==='oasis-flightradar-card'))window.customCards.push({type:'oasis-flightradar-card',name:'Oasis Flightradar Card',description:'Aéroport, deux horloges, départs, arrivées et suivi de vols dans une seule carte.'});
