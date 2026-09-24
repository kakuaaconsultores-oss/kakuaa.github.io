
let comprasCatalogosCache = {};
async function cargarComprasCatalogos(){
 try{const r=await fetchApi(API+'/api/compras/catalogos');if(!r.ok)return;comprasCatalogosCache=await r.json();
 const p=document.getElementById('comp-proveedor'),t=document.getElementById('comp-tipo'),cond=document.getElementById('comp-condicion');
 if(p){p.innerHTML='<option value="">Proveedor *</option>';(comprasCatalogosCache.proveedores||[]).forEach(x=>p.innerHTML+='<option value="'+x.id+'">'+escapeHtml(x.razon_social)+'</option>');}
 if(t){t.innerHTML='<option value="">Tipo de comprobante</option>';(comprasCatalogosCache.tipos_comprobante||[]).filter(x=>Number(x.activo)!==0).forEach(x=>t.innerHTML+='<option value="'+x.id+'">'+escapeHtml(x.nombre)+'</option>');} if(cond){cond.innerHTML='<option value="">Condición de compra</option>';(comprasCatalogosCache.condiciones||[]).filter(x=>Number(x.activo)!==0).forEach(x=>cond.innerHTML+='<option value="'+x.id+'">'+escapeHtml(x.nombre)+'</option>');}
 renderCatalogoCompra('lista-conceptos-compra',comprasCatalogosCache.conceptos||[],['codigo','nombre','tipo','tasa_iva']);
 renderCatalogoCompra('lista-condiciones-compra',comprasCatalogosCache.condiciones||[],['codigo','nombre','tipo','dias_credito','cuotas']);
 renderCatalogoCompra('lista-formas-pago-compra',comprasCatalogosCache.formas_pago||[],['codigo','nombre','tipo']);
 renderCatalogoCompra('catalogo-tipos-compra',comprasCatalogosCache.tipos_comprobante||[],['codigo','nombre']);
 renderProveedoresCompra(comprasCatalogosCache.proveedores||[]);
 }catch(e){console.error(e);}
}
function renderCatalogoCompra(id,rows,cols){
 const el=document.getElementById(id);if(!el)return;
 el.innerHTML='<table class="tabla"><thead><tr>'+cols.map(x=>'<th>'+escapeHtml(x)+'</th>').join('')+'<th>Acciones</th></tr></thead><tbody>'+
 rows.map(r=>'<tr>'+cols.map(x=>'<td>'+escapeHtml(r[x]??'')+'</td>').join('')+
 '<td><button class="btn btn-gris btn-pequeno" onclick="editarCatalogoCompra(\''+id+'\','+r.id+')">Editar</button> <button class="btn btn-rojo btn-pequeno" onclick="eliminarCatalogoCompra(\''+id+'\','+r.id+')">Eliminar</button></td></tr>').join('')+
 '</tbody></table>';
}
let tipoComprobanteEditando=null, condicionCompraEditando=null;
function abrirNuevoTipoComprobante(){
 tipoComprobanteEditando=null;
 document.getElementById('tipo-compra-codigo').value='';
 document.getElementById('tipo-compra-nombre').value='';
 document.getElementById('form-tipo-compra').style.display='block';
 document.getElementById('btn-guardar-tipo-compra').textContent='＋ Crear Tipo de Comprobante';
}
function cancelarTipoComprobante(){document.getElementById('form-tipo-compra').style.display='none';tipoComprobanteEditando=null;}
async function guardarTipoComprobante(){
 const body={codigo:document.getElementById('tipo-compra-codigo').value.trim(),nombre:document.getElementById('tipo-compra-nombre').value.trim(),activo:1};
 if(!body.codigo||!body.nombre){alert('Código y nombre son obligatorios.');return;}
 const url=API+'/api/compras/tipos_comprobante_compra'+(tipoComprobanteEditando?'/'+tipoComprobanteEditando:'');
 const r=await fetchApi(url,{method:tipoComprobanteEditando?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const d=await r.json();if(!r.ok){alert(d.error||'No se pudo guardar');return;}
 cancelarTipoComprobante();await cargarComprasCatalogos();
}
function editarCatalogoCompra(id,recordId){
 const rows=(id==='catalogo-tipos-compra'?comprasCatalogosCache.tipos_comprobante:comprasCatalogosCache.condiciones)||[];
 const row=rows.find(x=>x.id===recordId);if(!row)return;
 if(id==='catalogo-tipos-compra'){
   tipoComprobanteEditando=recordId;
   document.getElementById('tipo-compra-codigo').value=row.codigo||'';
   document.getElementById('tipo-compra-nombre').value=row.nombre||'';
   document.getElementById('form-tipo-compra').style.display='block';
   document.getElementById('btn-guardar-tipo-compra').textContent='💾 Guardar cambios';
   document.getElementById('form-tipo-compra').scrollIntoView({behavior:'smooth',block:'center'});
 }else{
   condicionCompraEditando=recordId;
   document.getElementById('cond-codigo').value=row.codigo||'';
   document.getElementById('cond-nombre').value=row.nombre||'';
   document.getElementById('cond-tipo').value=row.tipo||'dias';
   document.getElementById('cond-dias').value=row.dias_credito||0;
   document.getElementById('cond-cuotas').value=row.cuotas||1;
   actualizarCamposCondicionCompra();
   document.getElementById('form-condicion-compra').style.display='block';
   document.getElementById('btn-guardar-condicion').textContent='💾 Guardar cambios';
   document.getElementById('form-condicion-compra').scrollIntoView({behavior:'smooth',block:'center'});
 }
}
async function eliminarCatalogoCompra(id,recordId){
 const nombre=id==='catalogo-tipos-compra'?'tipo de comprobante':'condición de compra';
 if(!confirm('¿Eliminar este '+nombre+'? Esta acción no se puede deshacer.'))return;
 const path=id==='catalogo-tipos-compra'?'tipos_comprobante_compra':'condiciones_compra';
 const r=await fetchApi(API+'/api/compras/'+path+'/'+recordId,{method:'DELETE'});
 const d=await r.json();if(!r.ok){alert(d.error||'No se pudo eliminar');return;}await cargarComprasCatalogos();
}
function actualizarCamposCondicionCompra(){
 const tipo=document.getElementById('cond-tipo')?.value;
 const dias=document.getElementById('cond-dias'),cuotas=document.getElementById('cond-cuotas');
 if(!dias||!cuotas)return;
 dias.disabled=tipo!=='dias';cuotas.disabled=tipo!=='cuotas';
 dias.style.opacity=tipo==='dias'?'1':'.5';cuotas.style.opacity=tipo==='cuotas'?'1':'.5';
}
function abrirNuevaCondicion(){
 condicionCompraEditando=null;
 ['cond-codigo','cond-nombre'].forEach(id=>document.getElementById(id).value='');
 document.getElementById('cond-tipo').value='dias';document.getElementById('cond-dias').value=0;document.getElementById('cond-cuotas').value=1;
 actualizarCamposCondicionCompra();document.getElementById('form-condicion-compra').style.display='block';
 document.getElementById('btn-guardar-condicion').textContent='＋ Crear Condición de Compra';
}
function cancelarCondicionCompra(){document.getElementById('form-condicion-compra').style.display='none';condicionCompraEditando=null;}
async function guardarCondicionCompra(){
 const body={codigo:document.getElementById('cond-codigo').value.trim(),nombre:document.getElementById('cond-nombre').value.trim(),tipo:document.getElementById('cond-tipo').value,dias_credito:Number(document.getElementById('cond-dias').value||0),cuotas:Number(document.getElementById('cond-cuotas').value||1)};
 if(!body.codigo||!body.nombre){alert('Código y nombre son obligatorios.');return;}
 if(body.tipo==='dias'&&body.dias_credito<0){alert('Los días no pueden ser negativos.');return;}
 if(body.tipo==='cuotas'&&body.cuotas<1){alert('La cantidad de cuotas debe ser al menos 1.');return;}
 const path='/api/compras/condiciones_compra';
 const r=await fetchApi(API+path+(condicionCompraEditando?'/'+condicionCompraEditando:''),{method:condicionCompraEditando?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const d=await r.json();if(!r.ok){alert(d.error||'No se pudo guardar');return;}cancelarCondicionCompra();await cargarComprasCatalogos();
}
function renderProveedoresCompra(rows){const el=document.getElementById('lista-proveedores-compra');if(!el)return;el.innerHTML='<table class="tabla"><thead><tr><th>RUC</th><th>Razón social</th><th>Contacto</th><th>Estado</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+escapeHtml(r.ruc||'')+'</td><td>'+escapeHtml(r.razon_social)+'</td><td>'+escapeHtml(r.correo||r.telefono||'')+'</td><td>'+escapeHtml(r.estado)+'</td></tr>').join('')+'</tbody></table>';}
async function crearProveedorCompra(){const body={ruc:document.getElementById('prov-ruc').value.trim(),razon_social:document.getElementById('prov-razon').value.trim(),nombre_comercial:document.getElementById('prov-nombre').value.trim(),documento:document.getElementById('prov-doc').value.trim(),correo:document.getElementById('prov-correo').value.trim(),telefono:document.getElementById('prov-telefono').value.trim(),direccion:document.getElementById('prov-direccion').value.trim()};if(!body.razon_social){alert('La razón social es obligatoria.');return;}const r=await fetchApi(API+'/api/compras/proveedores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok){alert(d.error||'No se pudo crear el proveedor');return;}await cargarComprasCatalogos();}
async function crearConceptoCompra(){const body={codigo:document.getElementById('ccp-codigo').value.trim(),nombre:document.getElementById('ccp-nombre').value.trim(),tipo:document.getElementById('ccp-tipo').value.trim()||'servicio',tasa_iva:Number(document.getElementById('ccp-iva').value||0),cuenta_contable_id:document.getElementById('ccp-cuenta').value||null,descripcion:document.getElementById('ccp-desc').value.trim()};if(!body.codigo||!body.nombre){alert('Código y nombre son obligatorios.');return;}const r=await fetchApi(API+'/api/compras/conceptos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok){const d=await r.json();alert(d.error||'No se pudo crear');return;}await cargarComprasCatalogos();}
async function crearCatalogoCompra(tipo){let body;if(tipo==='condiciones')body={codigo:document.getElementById('cond-codigo').value.trim(),nombre:document.getElementById('cond-nombre').value.trim(),dias_credito:Number(document.getElementById('cond-dias').value||0)};else body={codigo:document.getElementById('fp-codigo').value.trim(),nombre:document.getElementById('fp-nombre').value.trim(),tipo:document.getElementById('fp-tipo').value};if(!body.codigo||!body.nombre){alert('Código y nombre son obligatorios.');return;}const r=await fetchApi(API+'/api/compras/'+tipo,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok){const d=await r.json();alert(d.error||'No se pudo crear');return;}await cargarComprasCatalogos();}
async function guardarComprobanteCompra(){const body={proveedor_id:Number(document.getElementById('comp-proveedor').value),tipo_comprobante_id:Number(document.getElementById('comp-tipo').value)||null,condicion_id:Number(document.getElementById('comp-condicion').value)||null,numero:document.getElementById('comp-numero').value.trim(),cdc:document.getElementById('comp-cdc').value.trim(),fecha:document.getElementById('comp-fecha').value,gravado_10:Number(document.getElementById('comp-grav10').value||0),gravado_5:Number(document.getElementById('comp-grav5').value||0),exento:Number(document.getElementById('comp-exento').value||0),iva_10:Number(document.getElementById('comp-iva10').value||0),iva_5:Number(document.getElementById('comp-iva5').value||0),total:Number(document.getElementById('comp-total').value||0),observacion:document.getElementById('comp-observacion').value.trim(),origen:'MANUAL'};if(!body.proveedor_id||!body.numero||!body.fecha||!body.total){alert('Proveedor, número, fecha y total son obligatorios.');return;}const r=await fetchApi(API+'/api/compras/comprobantes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok){const d=await r.json();alert(d.error||'No se pudo registrar');return;}const d=await r.json();await cargarComprobantesCompra();if(d.id)await mostrarCuotero(d.id);}
async function cargarComprobantesCompra(){const r=await fetchApi(API+'/api/compras/comprobantes');if(!r.ok)return;const rows=await r.json();const el=document.getElementById('lista-compras');if(el)el.innerHTML='<table class="tabla"><thead><tr><th>Fecha</th><th>Proveedor</th><th>Comprobante</th><th>Total</th><th>Estado</th><th>Acción</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+escapeHtml(x.fecha)+'</td><td>'+escapeHtml(x.proveedor)+'</td><td>'+escapeHtml(x.numero)+'</td><td>'+Number(x.total||0).toLocaleString('es-PY')+'</td><td>'+escapeHtml(x.estado)+'</td><td>'+(x.estado==='anulado'?'—':'<button class="btn btn-rojo btn-pequeno" onclick="anularCompra('+x.id+')">Anular</button>')+'</td></tr>').join('')+'</tbody></table>';const pend=document.getElementById('lista-compras-pendientes');if(pend)pend.innerHTML='<table class="tabla"><thead><tr><th>Fecha</th><th>Proveedor</th><th>Número</th><th>Total</th><th>Estado</th></tr></thead><tbody>'+rows.filter(x=>x.estado==='pendiente_contabilizar').map(x=>'<tr><td>'+escapeHtml(x.fecha)+'</td><td>'+escapeHtml(x.proveedor)+'</td><td>'+escapeHtml(x.numero)+'</td><td>'+Number(x.total||0).toLocaleString('es-PY')+'</td><td>'+escapeHtml(x.estado)+'</td></tr>').join('')+'</tbody></table>';}
async function anularCompra(id){if(!confirm('¿Anular este comprobante?'))return;const r=await fetchApi(API+'/api/compras/comprobantes/'+id+'/estado',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({estado:'anulado'})});if(r.ok)await cargarComprobantesCompra();else alert('No se pudo anular.');}
async function cargarReportesCompras(){const r1=await fetchApi(API+'/api/compras/reportes/proveedor');if(r1.ok){const rows=await r1.json();const e=document.getElementById('reporte-compras-proveedor');if(e)e.innerHTML='<table class="tabla"><thead><tr><th>Proveedor</th><th>Comprobantes</th><th>Total</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+escapeHtml(x.proveedor)+'</td><td>'+x.comprobantes+'</td><td>'+Number(x.total||0).toLocaleString('es-PY')+'</td></tr>').join('')+'</tbody></table>';}const r2=await fetchApi(API+'/api/compras/reportes/pendientes-pago');if(r2.ok){const rows=await r2.json();const e=document.getElementById('reporte-pendientes-pago');if(e)e.innerHTML='<table class="tabla"><thead><tr><th>Fecha</th><th>Proveedor</th><th>Número</th><th>Total</th><th>Estado</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+escapeHtml(x.fecha)+'</td><td>'+escapeHtml(x.proveedor)+'</td><td>'+escapeHtml(x.numero)+'</td><td>'+Number(x.total||0).toLocaleString('es-PY')+'</td><td>'+escapeHtml(x.estado)+'</td></tr>').join('')+'</tbody></table>';}}
async function prepararModuloCompras(){await cargarComprasCatalogos();await cargarComprobantesCompra();await cargarReportesCompras();}

setTimeout(()=>{if(typeof prepararModuloCompras==='function') prepararModuloCompras();},1200);

async function mostrarCuotero(comprobanteId){
 const box=document.getElementById('cuotero-generado');if(!box)return;
 const r=await fetchApi(API+'/api/compras/cuotas/'+comprobanteId);if(!r.ok){box.innerHTML='';return;}
 const rows=await r.json();
 if(!rows.length){box.innerHTML='<div class="sin-datos">La factura quedó sin cuotas asociadas.</div>';return;}
 box.innerHTML='<h3 style="margin:0 0 10px">Cuotero generado</h3><table class="tabla"><thead><tr><th>Cuota</th><th>Vencimiento</th><th>Importe</th><th>Saldo</th><th>Estado</th></tr></thead><tbody>'+
 rows.map(x=>'<tr><td>'+x.numero_cuota+'</td><td>'+escapeHtml(x.fecha_vencimiento)+'</td><td>'+Number(x.importe||0).toLocaleString('es-PY')+'</td><td>'+Number(x.saldo||0).toLocaleString('es-PY')+'</td><td>'+escapeHtml(x.estado)+'</td></tr>').join('')+
 '</tbody></table>';
}
