const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../src/i18n.js'),'utf8');
const {translations,language,translate}=vm.runInNewContext(source+';({translations:OASIS_TRANSLATIONS,language:oasisLanguage,translate:oasisTranslate})');
const languages=['en','de','es','it','hu','pt','id','zh','hi','bn','ar','ur'];
const airports=require('../src/airports.json');
const countries=require('../src/country-codes.json');
const locations=require('../src/airport-locales.json');
const geoSource=fs.readFileSync(path.join(__dirname,'../src/airport-localization.js'),'utf8');
const countryEnglish=require('../src/country-names-en.json');
const geo=vm.runInNewContext(geoSource+';({location:oasisAirportLocation,country:oasisCountryName})',{OASIS_COUNTRY_CODES:countries,OASIS_COUNTRY_NAMES_EN:countryEnglish,OASIS_AIRPORT_LOCALES:locations});

test('Pays du catalogue : codes ISO et noms dans les treize langues',()=>{
  assert.equal(Object.keys(countries).length,new Set(airports.map(a=>a.country)).size);
  for(const airport of airports)for(const lang of ['fr',...languages]){
    assert.match(countries[airport.country],/^[A-Z]{2}$/);
    const country=geo.country(airport.country,lang);assert.ok(country);assert.notEqual(country,countries[airport.country]);
  }
  assert.equal(geo.country('Autriche','hu'),'Ausztria');
  assert.equal(geo.country('Hongrie','en'),'Hungary');
  assert.equal(geo.country('États-Unis','de'),'Vereinigte Staaten');
  const oldBrowser=vm.runInNewContext(geoSource+';oasisCountryName',{Intl:{},OASIS_COUNTRY_CODES:countries,OASIS_COUNTRY_NAMES_EN:countryEnglish});
  assert.equal(oldBrowser('Hongrie','hu'),'Hungary');
});
test('Polyfill HA limité à la langue active : alias anglais toujours disponibles',()=>{
  const localizedOnly=vm.runInNewContext(geoSource+';({location:oasisAirportLocation,country:oasisCountryName})',{
    Intl:{DisplayNames:class{of(code){return new Intl.DisplayNames(['fr'],{type:'region'}).of(code);}}},
    OASIS_COUNTRY_CODES:countries,OASIS_COUNTRY_NAMES_EN:countryEnglish,OASIS_AIRPORT_LOCALES:locations
  });
  const vienna=airports.find(a=>a.code==='LOWW');
  assert.equal(localizedOnly.country('Autriche','fr'),'Autriche');
  assert.equal(localizedOnly.country('Autriche','en'),'Austria');
  assert.ok(localizedOnly.location(vienna,'fr').aliases.includes('Austria'));
});
test('Villes embarquées : correspondance OACI, traduction et repli anglais',()=>{
  for(const[code,entry]of Object.entries(locations.cities)){
    assert.equal(entry.original,airports.find(a=>a.code===code)?.city);
    assert.match(entry.wikidata,/^Q\d+$/);assert.ok(entry.labels.en);
    for(const lang of Object.keys(entry.labels)){assert.ok(['fr',...languages].includes(lang));assert.equal(typeof entry.labels[lang],'string');}
  }
  const vienna=airports.find(a=>a.code==='LOWW');
  assert.equal(geo.location(vienna,'hu').name,'Bécs');
  assert.equal(geo.location(vienna,'en').name,'Vienna');
  const custom={code:'ZZZZ',city:'Original',name:'Original · Airport',country:'France',city_names:{en:'English',hu:'Magyar'}};
  assert.equal(geo.location(custom,'de').city,'English');
  assert.equal(geo.location(custom,'hu').name,'Magyar · Airport');
  const override={...vienna,city:'Other city',name:'My airport'};
  assert.equal(geo.location(override,'hu').city,'Other city');
});
test('Localisation non destructive : noms originaux et identifiants conservés',()=>{
  const airport=airports.find(a=>a.code==='LIRF');const before=JSON.stringify(airport);
  const result=geo.location(airport,'hu');assert.equal(result.name,'Róma-Fiumicino');
  for(const alias of [airport.name,airport.city,airport.country,airport.code,airport.iata,'Róma','Olaszország'])assert.ok(result.aliases.includes(alias));
  assert.equal(JSON.stringify(airport),before);
});
test('Tous les textes embarqués sont traduits dans les douze langues additionnelles',()=>{
  for(const[key,values]of Object.entries(translations))for(const lang of languages){
    assert.equal(typeof values[lang],'string',key+' / '+lang);
    assert.ok(values[lang].length,key+' / '+lang);
    assert.deepEqual(values[lang].match(/\{\w+\}/g)||[],key.match(/\{\w+\}/g)||[]);
  }
});
test('Langue Home Assistant prioritaire, variantes régionales et repli anglais',()=>{
  for(const lang of ['fr',...languages])assert.equal(language({locale:{language:lang}}),lang);
  assert.equal(language({locale:{language:'pt-BR'},language:'fr'}),'pt');
  assert.equal(language({locale:{language:'zh_Hans'}}),'zh');
  assert.equal(language({language:'hu-HU'}),'hu');
  assert.equal(language({locale:{language:'xx'},language:'fr'}),'en');
  assert.equal(language(null),'en');
  assert.equal(language({}),'en');
  assert.equal(translate('xx','Ajouter un vol'),'Add a flight');
  assert.equal(translate('fr','Ajouter un vol'),'Ajouter un vol');
  const original=translations['Ajouter un vol'].hu;
  delete translations['Ajouter un vol'].hu;
  assert.equal(translate('hu','Ajouter un vol'),'Add a flight');
  translations['Ajouter un vol'].hu=original;
  assert.equal(translate('en','✈ Ajouter un vol'),'✈ Add a flight');
  assert.equal(translate('hu','{count} aéroports',{count:12}),'12 repülőtér');
  assert.equal(translate('en','unknown key'),'unknown key');
});
