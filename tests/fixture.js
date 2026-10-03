// Jeu de données fictif. Aucun accès à une installation Home Assistant.
window.mockCalls=[];
window.mockConfig={type:'custom:oasis-flightradar-card',airport_entity:'text.demo_airport',departures_entity:'sensor.demo_departures',arrivals_entity:'sensor.demo_arrivals',followed_entity:'sensor.demo_followed',add_entity:'text.demo_add',remove_entity:'text.demo_remove',clear_entity:'button.demo_clear',read_only:true,online_images:false,online_timezones:false};
const flights=Array.from({length:30},(_,i)=>({time_scheduled_departure:1791025200+i*600,time_scheduled_arrival:1791028800+i*600,airport_city:['Londres','Budapest','Amsterdam','Rome','New York'][i%5],flight_number:'OA'+(100+i),status_text:i%4?'À L’HEURE':'RETARDÉ'}));
window.mockHass={states:{
  'text.demo_airport':{state:'LFPB',attributes:{}},
  'sensor.demo_departures':{state:'30',attributes:{flights}},
  'sensor.demo_arrivals':{state:'30',attributes:{flights}},
  'sensor.demo_followed':{state:'1',attributes:{flights:[{id:'abcd1234',flight_number:'OA101',callsign:'OAS101',airline:'Oasis Airlines (démonstration)',airport_origin_city:'Paris',airport_destination_city:'Budapest',aircraft_model:'Airbus A320',aircraft_registration:'F-DEMO',altitude:32000,ground_speed:430,status_text:'EN VOL'}]}},
  'text.demo_add':{state:'',attributes:{}},'text.demo_remove':{state:'',attributes:{}},'button.demo_clear':{state:'2026-10-03',attributes:{}}
},callService:async(...args)=>{window.mockCalls.push(args);}};
window.mountCard=function(config={}){const previous=document.querySelector('oasis-flightradar-card');previous?.remove();const card=document.createElement('oasis-flightradar-card');card.setConfig({...window.mockConfig,...config});card.hass=window.mockHass;document.body.append(card);return card;};
// Le catalogue embarqué est décompressé de façon asynchrone avant l'enregistrement.
customElements.whenDefined('oasis-flightradar-card').then(()=>window.mountCard());
