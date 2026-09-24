
let comprasCatalogosCache = {};
async function cargarComprasCatalogos(){
 try{
   await cargarCuentasContablesCompra();
   const r=await fetchApi(API+'/api/compras/catalogos');if(!r.ok)return;comprasCatalogosCache=await r.json();
 const p=document.getElementById('comp-proveedor'),t=document.getElementById('comp-tipo'),cond=document.getElementById('comp-condicion');
 if(p){p.innerHTML='<option value="">Proveedor *</option>';(comprasCatalogosCache.proveedores||[]).forEach(x=>p.innerHTML+='<option value="'+x.id+'">'+escapeHtml(x.razon_social)+'</option>');}
 if(p){p.onchange=()=>cargarTimbradosProveedor(Number(p.value)||0);}
 if(document.getElementById('comp-tipo'))document.getElementById('comp-tipo').onchange=validarFacturaEnPantalla;
 ['comp-numero','comp-fecha'].forEach(id=>document.getElementById(id)?.addEventListener('input',validarFacturaEnPantalla));
 if(t){t.innerHTML='<option value="">Tipo de comprobante</option>';(comprasCatalogosCache.tipos_comprobante||[]).filter(x=>Number(x.activo)!==0).forEach(x=>t.innerHTML+='<option value="'+x.id+'">'+escapeHtml(x.nombre)+'</option>');} if(cond){cond.innerHTML='<option value="">Condición de compra</option>';(comprasCatalogosCache.condiciones||[]).filter(x=>Number(x.activo)!==0).forEach(x=>cond.innerHTML+='<option value="'+x.id+'">'+escapeHtml(x.nombre)+'</option>');}
 renderCatalogoCompra('lista-conceptos-compra',comprasCatalogosCache.conceptos||[],['codigo','nombre','tipo','tasa_iva']);
 renderCatalogoCompra('lista-condiciones-compra',comprasCatalogosCache.condiciones||[],['codigo','nombre','tipo','dias_credito','cuotas']);
 renderCatalogoCompra('lista-formas-pago-compra',comprasCatalogosCache.formas_pago||[],['codigo','nombre','tipo','cuenta_contable_nombre']);
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
async function cargarCuentasContablesCompra(){
 const r=await fetchApi(API+'/api/contabilidad/cuentas');
 if(!r.ok){cuentasContablesCompra=[];return;}
 cuentasContablesCompra=await r.json();
 const sel=document.getElementById('fp-cuenta');
 if(sel)llenarSelectCuentasCompra(sel);
}
function llenarSelectCuentasCompra(sel,valor){
 sel.innerHTML='<option value="">— Seleccioná una cuenta contable —</option>';
 cuentasContablesCompra.filter(x=>Number(x.imputable)===1 && Number(x.activa)!==0).forEach(x=>{
   const opt=document.createElement('option');opt.value=x.id;opt.textContent=x.codigo+' - '+x.nombre;sel.appendChild(opt);
 });
 if(valor!=null)sel.value=String(valor);
}
function nombreCuentaCompra(id){const x=cuentasContablesCompra.find(c=>Number(c.id)===Number(id));return x?x.codigo+' - '+x.nombre:'';}
let tipoComprobanteEditando=null, condicionCompraEditando=null, formaPagoEditando=null, cuentasContablesCompra=[];
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
 const url=API+'/api/compras/tipos-comprobante'+(tipoComprobanteEditando?'/'+tipoComprobanteEditando:'');
 const r=await fetchApi(url,{method:tipoComprobanteEditando?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const d=await r.json();if(!r.ok){alert(d.error||'No se pudo guardar');return;}
 cancelarTipoComprobante();await cargarComprasCatalogos();
}
function editarCatalogoCompra(id,recordId){
 if(id==='lista-formas-pago-compra'){
   const row=(comprasCatalogosCache.formas_pago||[]).find(x=>x.id===recordId);if(!row)return;
   formaPagoEditando=recordId;
   document.getElementById('fp-codigo').value=row.codigo||'';
   document.getElementById('fp-nombre').value=row.nombre||'';
   document.getElementById('fp-tipo').value=row.tipo||'contado';
   llenarSelectCuentasCompra(document.getElementById('fp-cuenta'),row.cuenta_contable_id);
   document.getElementById('form-forma-pago-compra').style.display='block';
   document.getElementById('btn-guardar-forma-pago').textContent='💾 Guardar cambios';
   document.getElementById('form-forma-pago-compra').scrollIntoView({behavior:'smooth',block:'center'});return;
 }
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
 const path=id==='catalogo-tipos-compra'?'tipos_comprobante_compra':(id==='lista-formas-pago-compra'?'formas_pago_compra':'condiciones_compra');
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
 const path='/api/compras/condiciones';
 const r=await fetchApi(API+path+(condicionCompraEditando?'/'+condicionCompraEditando:''),{method:condicionCompraEditando?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const d=await r.json();if(!r.ok){alert(d.error||'No se pudo guardar');return;}cancelarCondicionCompra();await cargarComprasCatalogos();
}
let proveedorRucConsultado=false;
async function consultarRucProveedor(){
 const input=document.getElementById('prov-ruc'), estado=document.getElementById('prov-estado');
 const ruc=(input?.value||'').trim(); if(!ruc){alert('Ingresá un RUC.');return;}
 if(estado) estado.textContent='Consultando TuRuc…';
 try{
  const r=await fetchApi(API+'/api/compras/proveedores/consulta-ruc/'+encodeURIComponent(ruc));
  const d=await r.json();
  if(!r.ok){if(estado)estado.textContent=d.error||'No encontrado';alert(d.error||'No se encontró el RUC.');return;}
  const x=d.data||{};
  document.getElementById('prov-ruc').value=x.ruc||ruc;
  document.getElementById('prov-ruc').dataset.consultedRuc=(x.ruc||ruc).trim().toUpperCase();
  document.getElementById('prov-razon').value=x.razon_social||'';
  document.getElementById('prov-nombre').value=x.razon_social||'';
  document.getElementById('prov-doc').value=x.ruc||'';
  document.getElementById('prov-razon').readOnly=true;
  document.getElementById('prov-nombre').readOnly=true;
  document.getElementById('prov-doc').readOnly=true;
  if(estado){estado.textContent='Estado: '+(x.estado||'SIN DATO');estado.dataset.valor=x.estado||'';}
  proveedorRucConsultado=true;
 }catch(e){if(estado)estado.textContent='No se pudo consultar';alert('No se pudo consultar TuRuc.');}
}
function resetProveedorRuc(){
 proveedorRucConsultado=false;
 ['prov-razon','prov-nombre','prov-doc'].forEach(id=>{const e=document.getElementById(id);if(e){e.readOnly=false;e.value='';}});
 const e=document.getElementById('prov-estado');if(e)e.textContent='';
}
async function cargarTimbradosProveedor(proveedorId){
 const sel=document.getElementById('comp-timbrado'); if(!sel)return;
 sel.innerHTML='<option value="">Timbrado *</option>';
 if(!proveedorId)return;
 const r=await fetchApi(API+'/api/compras/proveedores/'+proveedorId+'/timbrados');
 if(!r.ok)return;
 const rows=await r.json();
 sel._timbrados=rows;
 rows.filter(x=>Number(x.activo)!==0).forEach(x=>{
   const modal=x.modalidad==='ELECTRONICO'?'Electrónico':'Impreso';
   const venc=x.fecha_vencimiento==='3000-12-31'?'sin vencimiento convencional':(x.fecha_vencimiento||'sin vencimiento');
   const opt=document.createElement('option');opt.value=x.id;opt.textContent=x.numero_timbrado+' · '+modal+' · '+(x.establecimiento||'---')+'-'+(x.punto_expedicion||'---')+' · '+x.numero_desde+'-'+x.numero_hasta+' · '+venc;sel.appendChild(opt);
 });
}
async function abrirTimbradosProveedor(proveedorId){
 const r=await fetchApi(API+'/api/compras/proveedores/'+proveedorId+'/timbrados');
 if(!r.ok){alert('No se pudieron cargar los timbrados.');return;}
 const rows=await r.json();
 const tipoOpts=(comprasCatalogosCache.tipos_comprobante||[]).map(x=>'<option value="'+x.id+'">'+escapeHtml(x.nombre)+'</option>').join('');
 let html='<div style="display:grid;gap:10px;max-height:55vh;overflow:auto">'+rows.map(x=>'<div class="card" style="padding:12px"><strong>'+escapeHtml(x.numero_timbrado)+'</strong> · '+escapeHtml(x.modalidad)+' · '+escapeHtml(x.tipo_nombre||'')+'<br><small>'+escapeHtml(x.establecimiento||'---')+'-'+escapeHtml(x.punto_expedicion||'---')+' · '+x.numero_desde+' a '+x.numero_hasta+' · vence '+escapeHtml(x.fecha_vencimiento||'sin fecha')+'</small><div style="margin-top:8px"><button class="btn btn-rojo btn-pequeno" onclick="desactivarTimbradoProveedor('+proveedorId+','+x.id+')">Desactivar</button></div></div>').join('')+'</div>';
 html+='<div class="card" style="margin-top:12px"><h4 style="margin-top:0">＋ Nuevo timbrado</h4><div class="form-grid"><select id="tim-tipo">'+tipoOpts+'</select><select id="tim-modalidad"><option value="IMPRESO">Impreso</option><option value="ELECTRONICO">Electrónico</option></select><input id="tim-numero" placeholder="N.º de timbrado *"><input id="tim-est" placeholder="Establecimiento (001)"><input id="tim-punto" placeholder="Punto de expedición (001)"><input id="tim-desde" type="number" min="1" placeholder="Número desde *"><input id="tim-hasta" type="number" min="1" placeholder="Número hasta *"><input id="tim-inicio" type="date"><input id="tim-venc" type="date"><input id="tim-obs" class="full" placeholder="Observación"></div><button class="btn btn-verde" onclick="guardarTimbradoProveedor('+proveedorId+')">Guardar timbrado</button></div>';
 const wrap=document.createElement('div');wrap.innerHTML='<div style="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center"><div style="background:#fff;border-radius:14px;padding:18px;width:min(850px,94vw);max-height:90vh;overflow:auto"><div style="display:flex;justify-content:space-between;align-items:center"><h3>Timbrados del proveedor</h3><button class="btn btn-gris" onclick="this.closest('.timbrado-modal').remove()">Cerrar</button></div><div class="timbrado-modal">'+html+'</div></div></div>';
 document.body.appendChild(wrap.firstElementChild);
 const modalidad=document.getElementById('tim-modalidad'),venc=document.getElementById('tim-venc');
 modalidad?.addEventListener('change',()=>{if(modalidad.value==='ELECTRONICO'){venc.value='3000-12-31';venc.disabled=true;}else{venc.disabled=false;if(venc.value==='3000-12-31')venc.value='';}});
}
async function guardarTimbradoProveedor(proveedorId){
 const body={tipo_comprobante_id:document.getElementById('tim-tipo').value,modalidad:document.getElementById('tim-modalidad').value,numero_timbrado:document.getElementById('tim-numero').value.trim(),establecimiento:document.getElementById('tim-est').value.trim(),punto_expedicion:document.getElementById('tim-punto').value.trim(),numero_desde:Number(document.getElementById('tim-desde').value),numero_hasta:Number(document.getElementById('tim-hasta').value),fecha_inicio:document.getElementById('tim-inicio').value,fecha_vencimiento:document.getElementById('tim-venc').value,observacion:document.getElementById('tim-obs').value.trim()};
 if(!body.numero_timbrado||!body.numero_desde||!body.numero_hasta){alert('Completá timbrado y rango numérico.');return;}
 const r=await fetchApi(API+'/api/compras/proveedores/'+proveedorId+'/timbrados',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const d=await r.json();if(!r.ok){alert(d.error||'No se pudo guardar');return;}
 const m=document.querySelector('.timbrado-modal');if(m)m.remove();await cargarComprasCatalogos();
}
async function desactivarTimbradoProveedor(proveedorId,timbradoId){
 const r=await fetchApi(API+'/api/compras/proveedores/'+proveedorId+'/timbrados/'+timbradoId,{method:'DELETE'});
 if(r.ok){const m=document.querySelector('.timbrado-modal');if(m)m.remove();await abrirTimbradosProveedor(proveedorId);}
}
function renderProveedoresCompra(rows){
 const el=document.getElementById('lista-proveedores-compra');if(!el)return;
 el.innerHTML='<table class="tabla"><thead><tr><th>RUC</th><th>Razón social</th><th>Contacto</th><th>Estado</th><th>Timbrados</th></tr></thead><tbody>'+
 rows.map(r=>'<tr><td>'+escapeHtml(r.ruc||'')+'</td><td>'+escapeHtml(r.razon_social)+'</td><td>'+escapeHtml(r.correo||r.telefono||'')+'</td><td>'+escapeHtml(r.estado)+'</td><td><button class="btn btn-azul btn-pequeno" onclick="abrirTimbradosProveedor('+r.id+')">Gestionar</button></td></tr>').join('')+
 '</tbody></table>';
}
async function crearProveedorCompra(){
 const body={ruc:document.getElementById('prov-ruc').value.trim(),razon_social:document.getElementById('prov-razon').value.trim(),nombre_comercial:document.getElementById('prov-nombre').value.trim(),documento:document.getElementById('prov-doc').value.trim(),correo:document.getElementById('prov-correo').value.trim(),telefono:document.getElementById('prov-telefono').value.trim(),direccion:document.getElementById('prov-direccion').value.trim()};
 const rucActual=body.ruc.toUpperCase();
 if(!proveedorRucConsultado||document.getElementById('prov-ruc').dataset.consultedRuc!==rucActual){alert('Consultá nuevamente el RUC antes de guardar.');return;}
 if(!body.ruc||!body.razon_social){alert('RUC y razón social son obligatorios.');return;}
 const r=await fetchApi(API+'/api/compras/proveedores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const d=await r.json();if(!r.ok){alert(d.error||'No se pudo crear el proveedor');return;}
 resetProveedorRuc();await cargarComprasCatalogos();
}
async function crearConceptoCompra(){const body={codigo:document.getElementById('ccp-codigo').value.trim(),nombre:document.getElementById('ccp-nombre').value.trim(),tipo:document.getElementById('ccp-tipo').value.trim()||'servicio',tasa_iva:Number(document.getElementById('ccp-iva').value||0),cuenta_contable_id:document.getElementById('ccp-cuenta').value||null,descripcion:document.getElementById('ccp-desc').value.trim()};if(!body.codigo||!body.nombre){alert('Código y nombre son obligatorios.');return;}const r=await fetchApi(API+'/api/compras/conceptos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok){const d=await r.json();alert(d.error||'No se pudo crear');return;}await cargarComprasCatalogos();}
function abrirNuevaFormaPago(){
 formaPagoEditando=null;document.getElementById('fp-codigo').value='';document.getElementById('fp-nombre').value='';
 document.getElementById('fp-tipo').value='contado';llenarSelectCuentasCompra(document.getElementById('fp-cuenta'));
 document.getElementById('form-forma-pago-compra').style.display='block';document.getElementById('btn-guardar-forma-pago').textContent='＋ Crear Forma de Pago';
}
function cancelarFormaPago(){document.getElementById('form-forma-pago-compra').style.display='none';formaPagoEditando=null;}
async function guardarFormaPago(){
 const body={codigo:document.getElementById('fp-codigo').value.trim(),nombre:document.getElementById('fp-nombre').value.trim(),tipo:document.getElementById('fp-tipo').value,cuenta_contable_id:Number(document.getElementById('fp-cuenta').value)||null};
 if(!body.codigo||!body.nombre||!body.cuenta_contable_id){alert('Código, nombre y cuenta contable son obligatorios.');return;}
 const url=API+'/api/compras/formas-pago'+(formaPagoEditando?'/'+formaPagoEditando:'');
 const r=await fetchApi(url,{method:formaPagoEditando?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const d=await r.json();if(!r.ok){alert(d.error||'No se pudo guardar');return;}cancelarFormaPago();await cargarComprasCatalogos();
}
async function crearCatalogoCompra(tipo){let body;if(tipo==='condiciones')body={codigo:document.getElementById('cond-codigo').value.trim(),nombre:document.getElementById('cond-nombre').value.trim(),dias_credito:Number(document.getElementById('cond-dias').value||0)};else body={codigo:document.getElementById('fp-codigo').value.trim(),nombre:document.getElementById('fp-nombre').value.trim(),tipo:document.getElementById('fp-tipo').value};if(!body.codigo||!body.nombre){alert('Código y nombre son obligatorios.');return;}const r=await fetchApi(API+'/api/compras/'+tipo,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok){const d=await r.json();alert(d.error||'No se pudo crear');return;}await cargarComprasCatalogos();}
async function validarFacturaEnPantalla(){
 const proveedor=Number(document.getElementById('comp-proveedor').value)||0;
 const tipo=Number(document.getElementById('comp-tipo').value)||0;
 const numero=document.getElementById('comp-numero').value.trim();
 const fecha=document.getElementById('comp-fecha').value;
 const tim=document.getElementById('comp-timbrado');
 const estado=document.getElementById('comp-timbrado-estado');
 if(!estado)return;
 if(!proveedor||!tipo||!numero||!fecha){estado.textContent='Completá proveedor, tipo, número y fecha para validar.';estado.style.color='var(--texto-suave)';return;}
 const rows=tim?._timbrados||[];
 const t=rows.find(x=>Number(x.id)===Number(tim.value));
 if(!t){estado.textContent='Seleccioná un timbrado.';estado.style.color='#b42318';return;}
 const parts=numero.split('-');
 const okFmt=parts.length===3&&parts.every(x=>/^\d+$/.test(x));
 const seq=okFmt?Number(parts[2]):0;
 const est=okFmt?parts[0].padStart(3,'0'):'';
 const punto=okFmt?parts[1].padStart(3,'0'):'';
 const enRango=okFmt&&seq>=Number(t.numero_desde)&&seq<=Number(t.numero_hasta);
 const estOk=!t.establecimiento||String(t.establecimiento).padStart(3,'0')===est;
 const puntoOk=!t.punto_expedicion||String(t.punto_expedicion).padStart(3,'0')===punto;
 const inicio=!t.fecha_inicio||fecha>=String(t.fecha_inicio).slice(0,10);
 const venc=!t.fecha_vencimiento||t.fecha_vencimiento==='3000-12-31'||fecha<=String(t.fecha_vencimiento).slice(0,10);
 if(okFmt&&enRango&&estOk&&puntoOk&&inicio&&venc){estado.textContent='✓ Número, rango, talonario y vigencia correctos.';estado.style.color='#15803d';return true;}
 estado.textContent='⚠ El número no coincide con el rango, establecimiento/punto o vigencia del timbrado.';estado.style.color='#b42318';return false;
}
async function guardarComprobanteCompra(){
 const body={proveedor_id:Number(document.getElementById('comp-proveedor').value),tipo_comprobante_id:Number(document.getElementById('comp-tipo').value)||null,timbrado_id:Number(document.getElementById('comp-timbrado').value)||null,condicion_id:Number(document.getElementById('comp-condicion').value)||null,numero:document.getElementById('comp-numero').value.trim(),cdc:document.getElementById('comp-cdc').value.trim(),fecha:document.getElementById('comp-fecha').value,gravado_10:Number(document.getElementById('comp-grav10').value||0),gravado_5:Number(document.getElementById('comp-grav5').value||0),exento:Number(document.getElementById('comp-exento').value||0),iva_10:Number(document.getElementById('comp-iva10').value||0),iva_5:Number(document.getElementById('comp-iva5').value||0),total:Number(document.getElementById('comp-total').value||0),observacion:document.getElementById('comp-observacion').value.trim(),origen:'MANUAL'};
 if(!body.proveedor_id||!body.tipo_comprobante_id||!body.timbrado_id||!body.numero||!body.fecha||!body.total){alert('Proveedor, tipo, timbrado, número, fecha y total son obligatorios.');return;}
 const valido=await validarFacturaEnPantalla();
 if(valido===false){const estado=document.getElementById('comp-timbrado-estado');alert(estado?.textContent||'El comprobante no coincide con el timbrado.');return;}
 const r=await fetchApi(API+'/api/compras/comprobantes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(!r.ok){const d=await r.json();alert(d.error||'No se pudo registrar');return;}const d=await r.json();await cargarComprobantesCompra();if(d.id)await mostrarCuotero(d.id);
}
async function cargarComprobantesCompra(){const r=await fetchApi(API+'/api/compras/comprobantes');if(!r.ok)return;const rows=await r.json();const el=document.getElementById('lista-compras');if(el)el.innerHTML='<table class="tabla"><thead><tr><th>Fecha</th><th>Proveedor</th><th>Comprobante</th><th>Total</th><th>Estado</th><th>Acción</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+escapeHtml(x.fecha)+'</td><td>'+escapeHtml(x.proveedor)+'</td><td>'+escapeHtml(x.numero)+'</td><td>'+Number(x.total||0).toLocaleString('es-PY')+'</td><td>'+escapeHtml(x.estado)+'</td><td>'+(x.estado==='anulado'?'—':'<button class="btn btn-rojo btn-pequeno" onclick="anularCompra('+x.id+')">Anular</button>')+'</td></tr>').join('')+'</tbody></table>';const pend=document.getElementById('lista-compras-pendientes');if(pend)pend.innerHTML='<table class="tabla"><thead><tr><th>Fecha</th><th>Proveedor</th><th>Número</th><th>Total</th><th>Estado</th></tr></thead><tbody>'+rows.filter(x=>x.estado==='pendiente_contabilizar').map(x=>'<tr><td>'+escapeHtml(x.fecha)+'</td><td>'+escapeHtml(x.proveedor)+'</td><td>'+escapeHtml(x.numero)+'</td><td>'+Number(x.total||0).toLocaleString('es-PY')+'</td><td>'+escapeHtml(x.estado)+'</td></tr>').join('')+'</tbody></table>';}
async function anularCompra(id){if(!confirm('¿Anular este comprobante?'))return;const r=await fetchApi(API+'/api/compras/comprobantes/'+id+'/estado',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({estado:'anulado'})});if(r.ok)await cargarComprobantesCompra();else alert('No se pudo anular.');}
async function cargarReportesCompras(){const r1=await fetchApi(API+'/api/compras/reportes/proveedor');if(r1.ok){const rows=await r1.json();const e=document.getElementById('reporte-compras-proveedor');if(e)e.innerHTML='<table class="tabla"><thead><tr><th>Proveedor</th><th>Comprobantes</th><th>Total</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+escapeHtml(x.proveedor)+'</td><td>'+x.comprobantes+'</td><td>'+Number(x.total||0).toLocaleString('es-PY')+'</td></tr>').join('')+'</tbody></table>';}const r2=await fetchApi(API+'/api/compras/reportes/pendientes-pago');if(r2.ok){const rows=await r2.json();const e=document.getElementById('reporte-pendientes-pago');if(e)e.innerHTML='<table class="tabla"><thead><tr><th>Fecha</th><th>Proveedor</th><th>Número</th><th>Total</th><th>Estado</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+escapeHtml(x.fecha)+'</td><td>'+escapeHtml(x.proveedor)+'</td><td>'+escapeHtml(x.numero)+'</td><td>'+Number(x.total||0).toLocaleString('es-PY')+'</td><td>'+escapeHtml(x.estado)+'</td></tr>').join('')+'</tbody></table>';}}
async function prepararModuloCompras(){await cargarComprasCatalogos();await cargarComprobantesCompra();await cargarReportesCompras();document.getElementById('comp-timbrado')?.addEventListener('change',validarFacturaEnPantalla);}

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
