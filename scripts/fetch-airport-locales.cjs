// Maintenance uniquement : noms publics Wikidata (CC0), jamais de connexion HA.
// Émet un JSON sur stdout ; le snapshot validé est enregistré séparément.
const airports=require('../src/airports.json');
const languages=['fr','en','de','es','it','hu','pt','id','zh','hi','bn','ar','ur'];
const normalize=value=>String(value||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
async function main(){
  const candidates=new Map();
  for(let offset=0;offset<airports.length;offset+=100){
    const codes=airports.slice(offset,offset+100).map(a=>JSON.stringify(a.code)).join(' ');
    const query=`SELECT DISTINCT ?code ?city ?label ?alias WHERE { VALUES ?code { ${codes} } ?airport wdt:P239 ?code. { ?airport wdt:P931 ?city. } UNION { ?airport wdt:P131 ?city. } { ?city rdfs:label ?label. FILTER(LANG(?label) IN (${[...languages,'zh-hans'].map(l=>JSON.stringify(l)).join(',')})) } UNION { ?city skos:altLabel ?alias. FILTER(LANG(?alias) IN ("en","fr")) } }`;
    const response=await fetch('https://query.wikidata.org/sparql?format=json&query='+encodeURIComponent(query),{headers:{Accept:'application/sparql-results+json','User-Agent':'OasisFlightradarCard/0.1.5 (https://github.com/JustKidding49/oasis-flightradar-card)'},signal:AbortSignal.timeout(55000)});
    if(!response.ok)throw Error('Wikidata HTTP '+response.status+' (batch '+offset+')');
    for(const row of (await response.json()).results.bindings){
      const code=row.code.value,id=row.city.value.split('/').pop();
      if(!candidates.has(code))candidates.set(code,new Map());
      const group=candidates.get(code);if(!group.has(id))group.set(id,{id,labels:{},aliases:[]});
      if(row.label)group.get(id).labels[row.label['xml:lang']]=row.label.value;
      if(row.alias)group.get(id).aliases.push(row.alias.value);
    }
  }
  const cities={};
  for(const airport of airports){
    // Ne pas remplacer une ville par une région ou une autre ville desservie.
    const expected=normalize(airport.city);
    if(!expected)continue;
    const matching=[...(candidates.get(airport.code)?.values()||[])].filter(c=>[...Object.values(c.labels),...c.aliases].some(label=>normalize(label)===expected));
    if(matching.length!==1)continue;
    const city=matching[0];if(city.labels['zh-hans'])city.labels.zh=city.labels['zh-hans'];delete city.labels['zh-hans'];
    cities[airport.code]={original:airport.city,wikidata:city.id,labels:{en:airport.city,...city.labels}};
  }
  console.log(JSON.stringify({source:'Wikidata labels (CC0)',retrieved:new Date().toISOString().slice(0,10),languages,cities}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
