const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../src/i18n.js'),'utf8');
const {translations,language,translate}=vm.runInNewContext(source+';({translations:OASIS_TRANSLATIONS,language:oasisLanguage,translate:oasisTranslate})');
const languages=['en','de','es','it','hu','pt','id','zh','hi','bn','ar','ur'];
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
