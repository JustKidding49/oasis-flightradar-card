/* Carte de lecture seule : aucun service HA, aucune modification d'entité. */
class OasisFr24Banner extends HTMLElement {
  _t(key,params){return oasisTranslate(this._language||oasisLanguage(this._hass),key,params);}

  static cache = new Map();
  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this.shadowRoot.innerHTML = `<style>
      :host{display:block} ha-card{position:relative;border:0;border-radius:24px;overflow:hidden;background:#11110f;color:#fffdf7;box-shadow:none}
      .hero{height:300px;position:relative;background:linear-gradient(130deg,#11110f,#4a4327)}
      img{width:100%;height:100%;object-fit:cover;display:none} .shade{position:absolute;inset:0;background:linear-gradient(transparent 30%,rgba(0,0,0,.65))}
      .label{position:absolute;left:28px;bottom:24px;right:28px}.code{font:11px system-ui;letter-spacing:.18em} h2{font:40px Georgia,serif;margin:8px 0} .status{font:12px system-ui;margin:0}
      .credit{position:absolute;right:14px;bottom:14px;z-index:2;font:11px system-ui;line-height:1.5;color:#20352b}.credit summary{list-style:none;cursor:pointer;background:rgba(255,253,247,.88);border-radius:50%;width:30px;height:30px;display:grid;place-items:center;font-size:19px;float:right}.credit summary::-webkit-details-marker{display:none}.credit summary:focus-visible{outline:2px solid white;outline-offset:3px}.credit-content{clear:both;padding:12px;background:#fffdf7;border-radius:12px;margin-top:38px;max-width: min(360px,calc(100vw - 100px));box-shadow:0 4px 18px #0003}.credit a{color:inherit}.credit[hidden]{display:none}
      .credit summary{background:transparent;color:#fffdf7;text-shadow:0 1px 4px rgba(0,0,0,.8)}
      @media(max-width:600px){.hero{height:190px}.label{left:20px;bottom:18px}h2{font-size:30px}}
    </style><ha-card><div class="hero"><img alt="" referrerpolicy="no-referrer"><div class="shade"></div><div class="label"><div class="code"></div><h2></h2><p class="status" aria-live="polite"></p></div></div><details class="credit" hidden><summary aria-label="Crédits de la photo" title="Crédits de la photo">ⓘ</summary><div class="credit-content"></div></details></ha-card>`;
  }
  _translateStatic(){oasisStaticText(this,[["summary","Crédits de la photo","aria-label"],["summary","Crédits de la photo","title"]]);}
  setConfig(config) {
    if(!config.entity) throw new Error('entity est requis');
    this.config=config; this.code=undefined;
    if(this._hass) this.hass=this._hass;
  }
  set hass(hass) {
    const language=oasisLanguage(hass),changed=language!==this._language;this._language=language;this.lang=language;this.dir=['ar','ur'].includes(language)?'rtl':'ltr';
    this._hass=hass;this._translateStatic();
    if(changed){if(this._photoData)this.show(this.code,this._photoData);else if(this._statusKey)this.text('.status',this._statusKey);this.text('.code',this._t('AÉROPORT SUIVI')+(/^[A-Z0-9]{4}$/.test(this.code)?' · '+this.code:''));}
    if(!this.config) return;
    // preview_icao sert uniquement aux tests visuels, jamais à écrire un état HA.
    const code=String(this.config.preview_icao??hass.states[this.config.entity]?.state??'').trim().toUpperCase();
    if(code===this.code) return;
    this.code=code; this.controller?.abort();
    this.controller=new AbortController();
    this.update(code,this.controller.signal);
  }
  disconnectedCallback(){this.controller?.abort();this.code=undefined;}
  getCardSize(){return 5;}
  getGridOptions(){return {columns:'full',rows:'auto'};}
  text(selector,value){if(selector==='.status')this._statusKey=value;this.shadowRoot.querySelector(selector).textContent=this._t(value);}
  neutral(code,message){
    this._photoData=null;const img=this.shadowRoot.querySelector('img');img.onload=null;img.onerror=null;img.removeAttribute('src');img.style.display='none';
    this.text('.code',/^[A-Z0-9]{4}$/.test(code)?this._t('AÉROPORT SUIVI')+' · '+code:this._t('AÉROPORT SUIVI'));
    this.text('h2',/^[A-Z0-9]{4}$/.test(code)?code:this._t("À découvrir"));this.text('.status',message);
    const credit=this.shadowRoot.querySelector('.credit');credit.hidden=true;credit.open=false;this.shadowRoot.querySelector('.credit-content').replaceChildren();
  }
  show(code,data){
    if(code!==this.code) return;this._photoData=data;
    this.text('h2',data.city);this.text('.status',data.local?"Photo de votre bibliothèque":"Ville desservie par l’aéroport");
    const img=this.shadowRoot.querySelector('img');img.alt=data.city;
    img.onload=()=>{if(code===this.code)img.style.display='block';};
    img.onerror=()=>{if(code===this.code){img.style.display='none';this.text('.status',"Image indisponible");}};
    img.src=data.url;
    const credit=this.shadowRoot.querySelector('.credit');const creditContent=this.shadowRoot.querySelector('.credit-content');creditContent.replaceChildren();
    if(!data.local){
      const a=document.createElement('a');a.href=data.page;a.target='_blank';a.rel='noopener noreferrer';a.referrerPolicy='no-referrer';a.textContent='Wikimedia Commons';
      creditContent.append(this._t("Photo : ")+data.artist+' · '+data.license+' · ',a,this._t(" · Recadrée pour le bandeau"));credit.hidden=false;
    }
  }
  async json(url,signal){
    const r=await fetch(url,{signal,credentials:'omit',referrerPolicy:'no-referrer',headers:{Accept:'application/json'}});
    if(!r.ok)throw new Error('HTTP '+r.status);return r.json();
  }
  plain(html){const doc=new DOMParser().parseFromString(String(html||''),'text/html');return (doc.body.textContent||'').trim();}
  async lookup(code,signal){
    const query='SELECT ?cityLabel ?image WHERE { ?airport wdt:P239 "'+code+'"; wdt:P931 ?city. ?city wdt:P18 ?image. SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". } } LIMIT 1';
    const data=await this.json('https://query.wikidata.org/sparql?'+new URLSearchParams({query,format:'json'}),signal);
    const row=data.results?.bindings?.[0];if(!row)throw new Error('Ville ou photo non référencée');
    const filename=decodeURIComponent(row.image.value.split('/').pop());
    const commons=await this.json('https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({action:'query',format:'json',origin:'*',titles:'File:'+filename,prop:'imageinfo',iiprop:'url|extmetadata|mime',iiurlwidth:'1600',iiextmetadatafilter:'Artist|LicenseShortName|Attribution|Credit'}),signal);
    const info=Object.values(commons.query?.pages||{})[0]?.imageinfo?.[0];
    if(!info||!/^image\/(jpeg|png|webp)$/.test(info.mime||''))throw new Error('Photo indisponible');
    const url=info.thumburl||info.url;
    if(!['upload.wikimedia.org','thumb.wikimedia.org'].includes(new URL(url).hostname)||new URL(url).protocol!=='https:')throw new Error('Source inattendue');
    if(new URL(info.descriptionurl).hostname!=='commons.wikimedia.org')throw new Error('Crédit indisponible');
    const metadata=info.extmetadata||{};
    const artist=this.plain(metadata.Attribution?.value||metadata.Artist?.value||metadata.Credit?.value);
    const license=this.plain(metadata.LicenseShortName?.value);
    if(!artist||!license)throw new Error('Crédit ou licence manquant');
    return {city:row.cityLabel.value,url,page:info.descriptionurl,artist,license};
  }
  async update(code,signal){
    this.neutral(code,/^[A-Z0-9]{4}$/.test(code)?"Recherche de la ville…":"Renseignez un code OACI");
    if(!/^[A-Z0-9]{4}$/.test(code))return;
    const local=this.config.local_images?.[code];
    if(local){this.show(code,{city:local.city,url:local.url,local:true});return;}
    if(this.config.online_images===false){this.text('.status',"Photo non configurée");return;}
    const cached=OasisFr24Banner.cache.get(code);
    if(cached&&Date.now()-cached.time<3600000){this.show(code,cached.data);return;}
    const timeout=setTimeout(()=>this.controller?.signal===signal&&this.controller.abort(),20000);
    try{
      const data=await this.lookup(code,signal);
      if(signal.aborted||code!==this.code)return;
      OasisFr24Banner.cache.set(code,{time:Date.now(),data});this.show(code,data);
    }catch(error){if(code===this.code)this.text('.status',signal.aborted?"Recherche indisponible pour le moment":"Aucune photo disponible pour cet aéroport");}
    finally{clearTimeout(timeout);}
  }
}
if(!customElements.get('oasis-fr24-internal-banner'))customElements.define('oasis-fr24-internal-banner',OasisFr24Banner);
