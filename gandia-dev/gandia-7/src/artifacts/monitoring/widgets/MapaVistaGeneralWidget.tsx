import { useState, useEffect, useRef, useCallback } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Map as MLMap, Marker as MLMarker } from 'maplibre-gl'
import { supabase } from '../../../lib/supabaseClient'
import { getVisionScore } from '../../../lib/visionApi'
import { useUser } from '../../../context/UserContext'

export interface Corral {
  id: number; label: string; animales: number; capacidad: number
  estado: 'normal'|'atencion'|'cuarentena'; temp: number; humedad: number
  camara: boolean; lat?: number; lng?: number
  gps_lat?: number; gps_lng?: number; superficie_ha?: number; _dbId?: string
}

interface Props {
  corrales?: Corral[]
  onSelectCorral?: (c: Corral) => void
  scoreSanitario?: number
}

interface RGeo { lat:number; lng:number; ancho_m:number|null; largo_m:number|null }

const COL   = { normal:'#2FAF8F', atencion:'#F5A623', cuarentena:'#E5484D' }
const LABEL = { normal:'Normal', atencion:'Atención', cuarentena:'Cuarentena' }
const sc = (s:number) => s>=85?'#2FAF8F':s>=65?'#F5A623':'#E5484D'
const sl = (s:number) => s>=85?'ÓPTIMO':s>=65?'ACEPTABLE':'RIESGO'

function perim(lat:number,lng:number,a:number,l:number):number[][]{
  const dlat=(l/2)/111000, dlng=(a/2)/(111000*Math.cos(lat*Math.PI/180))
  return [[lng-dlng,lat+dlat],[lng+dlng,lat+dlat],[lng+dlng,lat-dlat],[lng-dlng,lat-dlat],[lng-dlng,lat+dlat]]
}
function poly(lat:number,lng:number,ha:number):number[][]{
  const s=Math.sqrt(ha*10000),dl=(s/2)/111000,dg=(s/2)/(111000*Math.cos(lat*Math.PI/180))
  return [[lng-dg,lat-dl],[lng+dg,lat-dl],[lng+dg,lat+dl],[lng-dg,lat+dl],[lng-dg,lat-dl]]
}

export default function MapaVistaGeneralWidget({corrales:corraleProp,onSelectCorral,scoreSanitario:scoreProp}:Props){
  const {profile} = useUser()
  const nombre = ((profile?.institutional_data as Record<string,unknown>)?.ranchName as string)||'MI UPP'

  const divRef     = useRef<HTMLDivElement>(null)
  const mapRef     = useRef<MLMap|null>(null)
  const markersRef = useRef<MLMarker[]>([])
  const onSelRef   = useRef(onSelectCorral)
  const fetchedRef = useRef<Corral[]>([])
  const geoRef     = useRef<RGeo|null>(null)
  useEffect(()=>{onSelRef.current=onSelectCorral},[onSelectCorral])

  const [fetched,      setFetched]      = useState<Corral[]>([])
  const [fetchedScore, setFetchedScore] = useState<number|undefined>(undefined)
  const [ranchoGeo,    setRanchoGeo]    = useState<RGeo|null>(null)

  useEffect(()=>{fetchedRef.current=fetched},[fetched])
  useEffect(()=>{geoRef.current=ranchoGeo},[ranchoGeo])

  const dibujar = useCallback((map:MLMap, geo:RGeo, corrales:Corral[])=>{
    map.flyTo({center:[geo.lng,geo.lat],zoom:16,duration:800})
    ;['rancho-fill','rancho-border','corrales-fill','corrales-border'].forEach(id=>{
      try{if(map.getLayer(id))map.removeLayer(id)}catch{/* ok */}
    })
    ;['rancho-perimeter','corrales-polys'].forEach(id=>{
      try{if(map.getSource(id))map.removeSource(id)}catch{/* ok */}
    })
    markersRef.current.forEach(m=>m.remove())
    markersRef.current=[]

    if(geo.ancho_m&&geo.largo_m){
      map.addSource('rancho-perimeter',{type:'geojson',data:{type:'Feature',geometry:{type:'Polygon',coordinates:[perim(geo.lat,geo.lng,geo.ancho_m,geo.largo_m)]},properties:{}}} as Parameters<typeof map.addSource>[1])
      map.addLayer({id:'rancho-fill',  type:'fill',source:'rancho-perimeter',paint:{'fill-color':'#2FAF8F','fill-opacity':0.08}} as Parameters<typeof map.addLayer>[0])
      map.addLayer({id:'rancho-border',type:'line',source:'rancho-perimeter',paint:{'line-color':'#2FAF8F','line-width':2.5,'line-dasharray':[6,3]}} as Parameters<typeof map.addLayer>[0])
    }

    const conGPS = corrales.filter(c=>c.gps_lat&&c.gps_lng&&!isNaN(c.gps_lat!)&&!isNaN(c.gps_lng!))
    const lista  = conGPS.length>0
      ? conGPS.map(c=>({...c,_la:c.gps_lat!,_ln:c.gps_lng!}))
      : corrales.map((c,i)=>{const a=(i/Math.max(corrales.length,1))*2*Math.PI;return{...c,_la:geo.lat+Math.cos(a)*0.0006,_ln:geo.lng+Math.sin(a)*0.0006}})

    const polFeats=lista.filter(c=>c.superficie_ha&&c.superficie_ha>0).map(c=>({
      type:'Feature' as const,
      geometry:{type:'Polygon' as const,coordinates:[poly(c._la,c._ln,c.superficie_ha!)]},
      properties:{color:COL[c.estado]}
    }))
    if(polFeats.length>0){
      map.addSource('corrales-polys',{type:'geojson',data:{type:'FeatureCollection',features:polFeats}} as Parameters<typeof map.addSource>[1])
      map.addLayer({id:'corrales-fill',  type:'fill',source:'corrales-polys',paint:{'fill-color':['get','color'],'fill-opacity':0.2}} as Parameters<typeof map.addLayer>[0])
      map.addLayer({id:'corrales-border',type:'line',source:'corrales-polys',paint:{'line-color':['get','color'],'line-width':2,'line-dasharray':[3,2]}} as Parameters<typeof map.addLayer>[0])
    }

    import('maplibre-gl').then(({default:mgl})=>{
      lista.forEach(c=>{
        const color=COL[c.estado],pct=c.capacidad>0?Math.round(c.animales/c.capacidad*100):0
        const el=document.createElement('div')
        el.innerHTML=`<div style="background:rgba(10,10,9,.95);border:2px solid ${color};border-radius:8px;padding:5px 10px;display:flex;align-items:center;gap:6px;white-space:nowrap;box-shadow:0 2px 16px rgba(0,0,0,.6);font-family:ui-monospace,monospace;cursor:pointer;"><span style="width:8px;height:8px;border-radius:50%;background:${color};"></span><span style="font-size:12px;font-weight:800;color:#F0F0F0;">${c.label}</span><span style="font-size:11px;color:${color};font-weight:700;">${c.animales}</span><span style="font-size:10px;color:#777;">${pct}%</span></div><div style="width:0;height:0;margin:0 auto;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid ${color};"></div>`
        el.addEventListener('click',()=>onSelRef.current?.(c))
        markersRef.current.push(new mgl.Marker({element:el,anchor:'bottom'}).setLngLat([c._ln,c._la]).addTo(map))
      })
    })
  },[])

  // Cargar datos
  useEffect(()=>{
    if(corraleProp) return
    async function load(){
      const {data:{session}}=await supabase.auth.getSession()
      if(!session) return
      const {data:r}=await supabase.from('ranch_extended_profiles').select('id,lat,lng,ancho_m,largo_m').eq('user_id',session.user.id).single()
      if(!r) return
      const lat=parseFloat(String(r.lat)),lng=parseFloat(String(r.lng))
      if(!isNaN(lat)&&!isNaN(lng)) setRanchoGeo({lat,lng,ancho_m:r.ancho_m??null,largo_m:r.largo_m??null})
      const {data:dbC}=await supabase.from('corrales').select('*').eq('rancho_id',r.id).eq('activo',true).order('label')
      if(dbC) setFetched(dbC.map((c:Record<string,unknown>,i:number)=>({
        id:i+1,label:c.label as string,animales:(c.animales as number)??0,capacidad:c.capacidad as number,
        estado:c.estado as 'normal'|'atencion'|'cuarentena',temp:22,humedad:60,
        camara:c.tiene_camara as boolean,
        gps_lat:c.lat!=null?parseFloat(String(c.lat)):undefined,
        gps_lng:c.lng!=null?parseFloat(String(c.lng)):undefined,
        superficie_ha:c.superficie_ha as number|undefined,_dbId:c.id as string,
      })))
      const vs=await getVisionScore(r.id)
      if(vs) setFetchedScore(vs.score)
    }
    load()
  },[corraleProp])

  // Init mapa
  useEffect(()=>{
    if(!divRef.current||mapRef.current) return
    import('maplibre-gl').then(({default:mgl})=>{
      const map=new mgl.Map({
        container:divRef.current!,
        style:{version:8,sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256}},layers:[{id:'osm',type:'raster',source:'osm'}]},
        center:[-105.8123,24.9234],zoom:15,attributionControl:false,
      })
      mapRef.current=map
      map.on('load',()=>{
        const geo=geoRef.current
        if(geo) dibujar(map,geo,corraleProp??fetchedRef.current)
      })
    })
    return ()=>{mapRef.current?.remove();mapRef.current=null}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  // Redibujar cuando llegan datos
  useEffect(()=>{
    const map=mapRef.current
    if(!map||!ranchoGeo) return
    if(!map.loaded()) return
    dibujar(map,ranchoGeo,corraleProp??fetched)
  },[ranchoGeo,fetched,corraleProp,dibujar])

  const corrales=corraleProp??fetched
  const scoreSanitario=scoreProp??fetchedScore
  const total=corrales.reduce((s,c)=>s+c.animales,0)
  const cap=corrales.reduce((s,c)=>s+c.capacidad,0)
  const pctOcup=cap>0?Math.round(total/cap*100):0
  const alertas=corrales.filter(c=>c.estado!=='normal').length
  const sColor=scoreSanitario!=null?sc(scoreSanitario):'#555'

  return(
    <div style={{display:'flex',flexDirection:'column',gap:10,height:corraleProp?'100%':520,minHeight:corraleProp?undefined:520,fontFamily:'system-ui,sans-serif'}}>
      <div style={{display:'grid',gridTemplateColumns:scoreSanitario!=null?'repeat(5,1fr)':'repeat(4,1fr)',gap:8}}>
        {scoreSanitario!=null&&(
          <div style={{background:'#171717',border:`1px solid ${sColor}30`,borderRadius:10,padding:'10px 14px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${sColor},transparent)`}}/>
            <div style={{fontSize:10,color:'#555',marginBottom:4}}>Score Sanitario</div>
            <div style={{display:'flex',alignItems:'baseline',gap:5}}>
              <div style={{fontSize:24,fontWeight:700,lineHeight:1,color:sColor,fontFamily:'ui-monospace,monospace'}}>{scoreSanitario}</div>
              <div style={{fontSize:9,color:sColor,fontWeight:600}}>{sl(scoreSanitario)}</div>
            </div>
          </div>
        )}
        {[
          {label:'CORRALES',value:corrales.length,sub:`${alertas} alertas`},
          {label:'ANIMALES',value:total,sub:`${pctOcup}% ocupación`},
          {label:'CAPACIDAD',value:cap,sub:'total cabezas'},
          {label:'GPS',value:corrales.filter(c=>c.gps_lat).length,sub:`de ${corrales.length}`},
        ].map((s,i)=>(
          <div key={i} style={{background:'#171717',border:'1px solid #1E1E1E',borderRadius:10,padding:'10px 14px'}}>
            <div style={{fontSize:9,color:'#555',fontFamily:'ui-monospace,monospace',letterSpacing:'0.07em',marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:22,fontWeight:700,color:'#F0F0F0',lineHeight:1,fontFamily:'ui-monospace,monospace'}}>{s.value}</div>
            <div style={{fontSize:9,color:'#444',marginTop:3,fontFamily:'ui-monospace,monospace'}}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{flex:1,borderRadius:12,overflow:'hidden',position:'relative',border:'1px solid #252525',minHeight:240}}>
        <div ref={divRef} style={{width:'100%',height:'100%'}}/>
        <div style={{position:'absolute',inset:0,pointerEvents:'none',background:'rgba(0,0,0,0.1)',zIndex:1,borderRadius:12}}/>
        <div style={{position:'absolute',top:12,left:12,zIndex:10,display:'flex',alignItems:'center',gap:7,background:'rgba(10,10,9,.92)',backdropFilter:'blur(10px)',border:'1px solid #2A2A2A',borderRadius:7,padding:'6px 12px'}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:'#2FAF8F',animation:'mpulse 2s ease-in-out infinite'}}/>
          <span style={{fontSize:10,fontWeight:600,color:'#F0F0F0',fontFamily:'ui-monospace,monospace'}}>EN VIVO</span>
          <span style={{fontSize:9,color:'#555',fontFamily:'ui-monospace,monospace'}}>{nombre.toUpperCase()}</span>
        </div>
        {scoreSanitario!=null&&(
          <div style={{position:'absolute',top:12,right:12,zIndex:10,display:'flex',alignItems:'center',gap:8,background:'rgba(10,10,9,.92)',backdropFilter:'blur(10px)',border:`1px solid ${sColor}30`,borderRadius:7,padding:'6px 12px'}}>
            <span style={{fontSize:9,color:'#555',fontFamily:'ui-monospace,monospace'}}>SANITARIO</span>
            <span style={{fontSize:14,fontWeight:800,color:sColor,fontFamily:'ui-monospace,monospace'}}>{scoreSanitario}</span>
          </div>
        )}
        <div style={{position:'absolute',bottom:12,left:12,zIndex:10,display:'flex',alignItems:'center',gap:12,background:'rgba(10,10,9,.92)',backdropFilter:'blur(10px)',border:'1px solid #2A2A2A',borderRadius:7,padding:'6px 12px'}}>
          {Object.entries(LABEL).map(([k,v])=>(
            <div key={k} style={{display:'flex',alignItems:'center',gap:5}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:COL[k as keyof typeof COL]}}/>
              <span style={{fontSize:9,color:'#888'}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{position:'absolute',bottom:12,right:12,zIndex:10,background:'rgba(10,10,9,.92)',border:'1px solid #2A2A2A',borderRadius:7,padding:'6px 12px'}}>
          <span style={{fontSize:9,color:'#555',fontFamily:'ui-monospace,monospace'}}>{corrales.length} CORRALES</span>
        </div>
      </div>
      <style>{`@keyframes mpulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
    </div>
  )
}