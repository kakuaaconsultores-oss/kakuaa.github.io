let centrosCostosCache=[];

async function cargarCentrosCostos(){
  try{
    const r=await fetchApi(API+'/api/finanzas/centros-costos');
    if(!r.ok)return;
    centrosCostosCache=await r.json();
    renderCentrosCostos();
    llenarSelectCentroCostoFactura();
  }catch(e){console.error('No se pudieron cargar los centros de costos',e);}
}

function llenarSelectCentroCostoFactura(){
  const sel=document.getElementById('comp-centro-costo');
  if(!sel)return;
  const actual=sel.value;
  sel.innerHTML='<option value="">Centro de costo *</option>';
  centrosCostosCache.filter(x=>Number(x.activo)!==0).forEach(x=>{
    const padre=x.centro_padre_id?centrosCostosCache.find(p=>Number(p.id)===Number(x.centro_padre_id)):null;
    const pref=padre?'↳ ':'';
    const opt=document.createElement('option');
    opt.value=x.id;
    opt.textContent=pref+(x.codigo||'')+' — '+(x.nombre||'');
    sel.appendChild(opt);
  });
  if(actual)sel.value=actual;
}

function renderCentrosCostos(){
  const el=document.getElementById('lista-centros-costos');
  if(!el)return;
  if(!centrosCostosCache.length){
    el.innerHTML='<div class="sin-datos">No hay centros de costos definidos.</div>';
    return;
  }
  el.innerHTML='<table class="tabla"><thead><tr><th>Código</th><th>Nombre</th><th>Centro padre</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>'+
    centrosCostosCache.map(x=>{
      const activo=Number(x.activo)!==0;
      const padre=x.centro_padre_id?centrosCostosCache.find(p=>Number(p.id)===Number(x.centro_padre_id)):null;
      return '<tr><td><strong>'+escapeHtml(x.codigo||'')+'</strong></td><td>'+escapeHtml(x.nombre||'')+'</td><td>'+escapeHtml(padre?((padre.codigo||'')+' — '+(padre.nombre||'')):'—')+'</td><td>'+escapeHtml(activo?'Activo':'Inactivo')+'</td><td>'+
        '<button class="btn btn-gris btn-pequeno" onclick="editarCentroCosto('+x.id+')">Editar</button> '+
        '<button class="btn '+(activo?'btn-amarillo':'btn-verde')+' btn-pequeno" onclick="cambiarEstadoCentroCosto('+x.id+','+(!activo)+')">'+(activo?'Inactivar':'Reactivar')+'</button>'+
        '</td></tr>';
    }).join('')+'</tbody></table>';
}

function limpiarFormularioCentroCosto(){
  document.getElementById('cc-codigo').value='';
  document.getElementById('cc-nombre').value='';
  const p=document.getElementById('cc-padre');if(p)p.value='';
  centroCostoEditando=null;
  const b=document.getElementById('btn-guardar-centro-costo');if(b)b.textContent='＋ Guardar centro de costo';
}

let centroCostoEditando=null;

function llenarPadresCentroCosto(valor){
  const sel=document.getElementById('cc-padre');if(!sel)return;
  sel.innerHTML='<option value="">Sin centro padre</option>'+
    centrosCostosCache.filter(x=>Number(x.activo)!==0 && Number(x.id)!==Number(centroCostoEditando)).map(x=>
      '<option value="'+x.id+'">'+escapeHtml((x.codigo||'')+' — '+(x.nombre||''))+'</option>'
    ).join('');
  if(valor)sel.value=String(valor);
}

function abrirNuevoCentroCosto(){
  limpiarFormularioCentroCosto();
  llenarPadresCentroCosto('');
  document.getElementById('form-centro-costo').style.display='block';
}

function editarCentroCosto(id){
  const row=centrosCostosCache.find(x=>Number(x.id)===Number(id));if(!row)return;
  centroCostoEditando=id;
  document.getElementById('cc-codigo').value=row.codigo||'';
  document.getElementById('cc-nombre').value=row.nombre||'';
  llenarPadresCentroCosto(row.centro_padre_id);
  document.getElementById('form-centro-costo').style.display='block';
  document.getElementById('form-centro-costo').scrollIntoView({behavior:'smooth',block:'center'});
  document.getElementById('btn-guardar-centro-costo').textContent='💾 Guardar cambios';
}

function cancelarCentroCosto(){
  document.getElementById('form-centro-costo').style.display='none';
  limpiarFormularioCentroCosto();
}

async function guardarCentroCosto(){
  const body={
    codigo:document.getElementById('cc-codigo').value.trim().toUpperCase(),
    nombre:document.getElementById('cc-nombre').value.trim(),
    centro_padre_id:Number(document.getElementById('cc-padre').value)||null
  };
  if(!body.codigo||!body.nombre){alert('Código y nombre son obligatorios.');return;}
  const url=API+'/api/finanzas/centros-costos'+(centroCostoEditando?'/'+centroCostoEditando:'');
  const r=await fetchApi(url,{method:centroCostoEditando?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const d=await r.json();
  if(!r.ok){alert(d.error||'No se pudo guardar el centro de costo.');return;}
  cancelarCentroCosto();
  await cargarCentrosCostos();
}

async function cambiarEstadoCentroCosto(id,activo){
  const accion=activo?'reactivar':'inactivar';
  if(!confirm('¿Querés '+accion+' este centro de costo?'))return;
  const r=await fetchApi(API+'/api/finanzas/centros-costos/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({activo})});
  const d=await r.json();
  if(!r.ok){alert(d.error||'No se pudo actualizar el estado.');return;}
  await cargarCentrosCostos();
}

function prepararVistaCentrosCostos(){
  if(document.getElementById('vista-centro-costos'))return;
  const main=document.querySelector('main')||document.body;
  const s=document.createElement('section');
  s.className='vista';
  s.id='vista-centro-costos';
  s.innerHTML='<h2 class="titulo-seccion">Definición de Centros de Costos</h2>'+
    '<p class="subtitulo">Definí las áreas o unidades responsables de las operaciones. El centro de costo se selecciona en cada transacción y no queda ligado permanentemente al concepto presupuestario.</p>'+
    '<div class="inv-panel"><h3>Nuevo centro de costo</h3><div class="inv-note">📊 El centro de costo es independiente del concepto presupuestario. Una misma compra o venta puede asignarse a un centro distinto según la operación.</div>'+
    '<div class="inv-grid"><div><label>Código *</label><input id="cc-codigo" maxlength="30" placeholder="Ej.: ADM"></div><div><label>Nombre *</label><input id="cc-nombre" placeholder="Ej.: Administración"></div><div><label>Centro padre</label><select id="cc-padre"><option value="">Sin centro padre</option></select></div></div>'+
    '<div class="inv-actions"><button id="btn-guardar-centro-costo" class="btn btn-verde" onclick="guardarCentroCosto()">＋ Guardar centro de costo</button><button class="btn btn-gris" onclick="cancelarCentroCosto()">Cancelar</button></div></div>'+
    '<div class="inv-panel" style="margin-top:16px"><div style="display:flex;justify-content:space-between;align-items:center"><div><h3>Centros definidos</h3><p class="inv-help" style="margin:3px 0 0">Podés editar o inactivar/reactivar sin eliminar el historial.</p></div></div><div id="lista-centros-costos" class="inv-table-wrap" style="margin-top:14px"></div></div>';
  main.appendChild(s);
  cargarCentrosCostos();
}

document.addEventListener('DOMContentLoaded',()=>{
  prepararVistaCentrosCostos();
  cargarCentrosCostos();
});
setTimeout(()=>{prepararVistaCentrosCostos();cargarCentrosCostos();},1000);
