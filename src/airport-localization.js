/* English region-name fallback: Unicode CLDR / ICU.
UNICODE LICENSE V3
COPYRIGHT AND PERMISSION NOTICE
Copyright © 1991-2026 Unicode, Inc.

NOTICE TO USER: Carefully read the following legal agreement. BY
DOWNLOADING, INSTALLING, COPYING OR OTHERWISE USING DATA FILES, AND/OR
SOFTWARE, YOU UNEQUIVOCALLY ACCEPT, AND AGREE TO BE BOUND BY, ALL OF THE
TERMS AND CONDITIONS OF THIS AGREEMENT. IF YOU DO NOT AGREE, DO NOT
DOWNLOAD, INSTALL, COPY, DISTRIBUTE OR USE THE DATA FILES OR SOFTWARE.
Permission is hereby granted, free of charge, to any person obtaining a
copy of data files and any associated documentation (the "Data Files") or
software and any associated documentation (the "Software") to deal in the
Data Files or Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, and/or sell
copies of the Data Files or Software, and to permit persons to whom the
Data Files or Software are furnished to do so, provided that either (a)
this copyright and permission notice appear with all copies of the Data
Files or Software, or (b) this copyright and permission notice appear in
associated Documentation.
THE DATA FILES AND SOFTWARE ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF
THIRD PARTY RIGHTS.
IN NO EVENT SHALL THE COPYRIGHT HOLDER OR HOLDERS INCLUDED IN THIS NOTICE
BE LIABLE FOR ANY CLAIM, OR ANY SPECIAL INDIRECT OR CONSEQUENTIAL DAMAGES,
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THE DATA
FILES OR SOFTWARE.
Except as contained in this notice, the name of a copyright holder shall
not be used in advertising or otherwise to promote the sale, use or other
dealings in these Data Files or Software without prior written
authorization of the copyright holder.
*/
// Noms géographiques embarqués (Wikidata CC0) et régions Intl.DisplayNames.
// Aucune traduction réseau, aucun changement des données d'intégration.
const oasisRegionNames=new Map();
function oasisCountryName(country,language,code){
  code=code||OASIS_COUNTRY_CODES[country];
  if(!code)return country||'';
  // Home Assistant peut ne charger que la locale active de son polyfill.
  // Les alias anglais doivent rester anglais même lorsque `en` est indisponible.
  if(language==='en'&&OASIS_COUNTRY_NAMES_EN[code])return OASIS_COUNTRY_NAMES_EN[code];
  for(const locale of [language,'en']){
    try{
      if(!oasisRegionNames.has(locale))oasisRegionNames.set(locale,new Intl.DisplayNames([locale],{type:'region',fallback:'none'}));
      const name=oasisRegionNames.get(locale).of(code);if(name)return name;
    }catch(_){/* Ancien navigateur : conserver le nom disponible. */}
  }
  return OASIS_COUNTRY_NAMES_EN[code]||country||'';
}
function oasisAirportLocation(airport,language='en'){
  const normalize=value=>String(value||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
  const stored=OASIS_AIRPORT_LOCALES.cities[airport.code];
  // Une liste personnalisée ne doit pas hériter d'une ville différente.
  const labels=airport.city_names||(stored&&normalize(stored.original)===normalize(airport.city)?stored.labels:{});
  const city=labels?.[language]||labels?.en||airport.city||'';
  const country=oasisCountryName(airport.country,language,airport.country_code);
  const originalName=String(airport.name||airport.city||airport.code);
  const originalCity=String(airport.city||'');
  // Garder le nom propre de l'aéroport : ne pas traduire des patronymes/marques.
  // Si le titre est seulement la ville ou commence par celle-ci, remplacer ce préfixe.
  let name=originalName;
  const candidates=[originalCity,labels?.fr,labels?.en].filter(Boolean).sort((a,b)=>b.length-a.length);
  for(const candidate of candidates){
    if(normalize(originalName)===normalize(candidate)){name=city;break;}
    if(normalize(originalName).startsWith(normalize(candidate))&&/^\s*[·,(/\-–—]/.test(originalName.slice(candidate.length))){name=city+originalName.slice(candidate.length);break;}
  }
  // La ville traduite reste explicite même si le titre officiel ne la contient pas.
  const title=city&&!normalize(name).includes(normalize(city))?city+' · '+name:name;
  return {city,country,name:title,aliases:[originalName,originalCity,airport.country,labels?.en,city,country,oasisCountryName(airport.country,'en',airport.country_code),airport.code,airport.iata||'']};
}
