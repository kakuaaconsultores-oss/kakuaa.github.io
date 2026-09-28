let ordenesCompraCache=[];
let ocDetalleActual=null;
let ocLineas=[];

function ocEscape(v){return typeof escapeHtml==='function'?escapeHtml(v??''):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function ocHoy(){return new Date().toISOString().slice(0,10);}
async function cargarOrdenesCompra(){
 const root=document.getElementById('oc-contenido'); if(!root)return;
 try{
  const r=await fetchApi(API+'/api/compras/ordenes'); const d=await r.json();
  if(!r.ok){root.innerHTML='<div class="sin-datos">'+ocEscape(d.error||'No se pudieron cargar las órdenes.')+'</div>';return;}
  ordenesCompraCache=d||[]; renderListadoOC();
 }catch(e){console.error(e);root.innerHTML='<div class="sin-datos">No se pudieron cargar las órdenes de compra.</div>';}
}
function renderListadoOC(){
 const root=document.getElementById('oc-contenido');if(!root)return;
 const rows=ordenesCompraCache;
 const k={borrador:0,emitida:0,aprobada:0,parcialmente_recibida:0,recibida:0,cerrada:0};
 rows.forEach(x=>{if(k[x.estado]!=null)k[x.estado]++;});
 root.innerHTML='<div class="oc-kpis">'+
 ['borrador','emitida','aprobada','parcialmente_recibida','recibida'].map((s,i)=>'<div class="oc-kpi"><strong>'+k[s]+'</strong><span>'+['Borradores','Emitidas','Aprobadas','Recepción parcial','Recibidas'][i]+'</span></div>').join('')+
 '</div><div class="card"><div class="oc-toolbar"><input id="oc-buscar" placeholder="Buscar OC, proveedor o RUC" oninput="filtrarOC()"><select id="oc-filtro-estado" onchange="filtrarOC()"><option value="">Todos los estados</option><option value="borrador">Borrador</option><option value="emitida">Emitida</option><option value="aprobada">Aprobada</option><option value="parcialmente_recibida">Recepción parcial</option><option value="recibida">Recibida</option><option value="cerrada">Cerrada</option><option value="anulada">Anulada</option></select><input id="oc-desde" type="date" onchange="filtrarOC()"><input id="oc-hasta" type="date" onchange="filtrarOC()"><button class="btn btn-azul" onclick="abrirNuevaOC()">＋ Nueva Orden de Compra</button></div><div id="oc-tabla"></div></div>';
 renderTablaOC(rows);
}
function filtrarOC(){
 const q=(document.getElementById('oc-buscar')?.value||'').toLowerCase();
 const est=document.getElementById('oc-filtro-estado')?.value||'';
 const desde=document.getElementById('oc-desde')?.value||'',hasta=document.getElementById('oc-hasta')?.value||'';
 renderTablaOC(ordenesCompraCache.filter(x=>(!q||[x.numero,x.proveedor,x.ruc].join(' ').toLowerCase().includes(q))&&(!est||x.estado===est)&&(!desde||x.fecha>=desde)&&(!hasta||x.fecha<=hasta)));
}
function ocEstado(s){return {'borrador':'Borrador','emitida':'Emitida','aprobada':'Aprobada','parcialmente_recibida':'Recepción parcial','recibida':'Recibida','cerrada':'Cerrada','anulada':'Anulada'}[s]||s;}
function renderTablaOC(rows){
 const el=document.getElementById('oc-tabla');if(!el)return;
 if(!rows.length){el.innerHTML='<div class="sin-datos">No hay órdenes de compra para los filtros seleccionados.</div>';return;}
 el.innerHTML='<div class="tabla-wrap"><table class="tabla"><thead><tr><th>OC</th><th>Fecha</th><th>Proveedor</th><th>Centro de costos</th><th>Total</th><th>Recepción</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>'+
 rows.map(x=>{const pct=x.cantidad_pedida?Math.min(100,(Number(x.cantidad_recibida||0)/Number(x.cantidad_pedida))*100):0;return '<tr><td><strong>'+ocEscape(x.numero)+'</strong></td><td>'+ocEscape(x.fecha)+'</td><td>'+ocEscape(x.proveedor)+'<br><small>'+ocEscape(x.ruc||'')+'</small></td><td>'+ocEscape(x.centro_costo_codigo?x.centro_costo_codigo+' — '+x.centro_costo_nombre:'—')+'</td><td>G. '+Number(x.total||0).toLocaleString('es-PY')+'</td><td>'+pct.toFixed(0)+'%<br><small>'+Number(x.cantidad_recibida||0)+' / '+Number(x.cantidad_pedida||0)+'</small></td><td><span class="oc-badge oc-'+ocEscape(x.estado)+'">'+ocEscape(ocEstado(x.estado))+'</span></td><td><button class="btn btn-gris btn-pequeno" onclick="verOC('+x.id+')">Ver</button></td></tr>';}).join('')+'</tbody></table></div>';
}
async function cargarCatalogosOC(){
 const [cat,cc,dep,art]=await Promise.all([
  fetchApi(API+'/api/compras/catalogos'),fetchApi(API+'/api/finanzas/centros-costos'),
  fetchApi(API+'/api/inventarios/depositos'),fetchApi(API+'/api/inventarios/items')
 ]);
 window.ocCat=cat.ok?await cat.json():{};
 window.ocCC=cc.ok?await cc.json():[];
 window.ocDep=dep.ok?await dep.json():[];
 window.ocArt=art.ok?await art.json():[];
}
function abrirNuevaOC(){
 cargarCatalogosOC().then(()=>{ocLineas=[];renderFormularioOC();});
}
function agregarLineaOC(){
 ocLineas.push({item_id:'',cantidad:1,precio_unitario:0,descuento:0,centro_costo_id:'',deposito_id:''});
 renderLineasOC();
}
function eliminarLineaOC(i){ocLineas.splice(i,1);renderLineasOC();}
function actualizarLineaOC(i,campo,valor){ocLineas[i][campo]=valor; if(campo==='item_id'){const a=window.ocArt.find(x=>Number(x.id)===Number(valor));if(a){ocLineas[i].iva_tasa=Number(a.tipo_iva??10);ocLineas[i].descripcion=a.nombre;}} renderLineasOC();}
function renderFormularioOC(){
 const root=document.getElementById('oc-contenido');
 root.innerHTML='<div class="card"><div class="oc-form-head"><div><h3>Nueva Orden de Compra</h3><span>El número se genera automáticamente al guardar.</span></div><button class="btn btn-gris" onclick="cargarOrdenesCompra()">← Volver</button></div>'+
 '<div class="form-grid"><select id="oc-proveedor"><option value="">Proveedor *</option>'+((window.ocCat.proveedores||[]).filter(x=>x.estado==='activo').map(x=>'<option value="'+x.id+'">'+ocEscape(x.razon_social)+' — '+ocEscape(x.ruc||'')+'</option>').join(''))+'</select><input id="oc-fecha" type="date" value="'+ocHoy()+'"><input id="oc-fecha-entrega" type="date"><select id="oc-condicion"><option value="">Condición de compra</option>'+((window.ocCat.condiciones||[]).filter(x=>Number(x.activo)!==0).map(x=>'<option value="'+x.id+'">'+ocEscape(x.nombre)+'</option>').join(''))+'</select><select id="oc-centro"><option value="">Centro de costos (general)</option>'+window.ocCC.filter(x=>Number(x.activo)!==0).map(x=>'<option value="'+x.id+'">'+ocEscape(x.codigo)+' — '+ocEscape(x.nombre)+'</option>').join('')+'</select><select id="oc-moneda"><option value="PYG">Guaraníes (PYG)</option><option value="USD">Dólares (USD)</option></select><select id="oc-deposito-general"><option value="">Depósito general</option>'+window.ocDep.filter(x=>Number(x.activo)!==0).map(x=>'<option value="'+x.id+'">'+ocEscape(x.codigo)+' — '+ocEscape(x.nombre)+'</option>').join('')+'</select><input id="oc-observacion" class="full" placeholder="Observaciones"></div>'+
 '<div class="oc-detalle-head"><h3>Artículos solicitados</h3><button class="btn btn-azul btn-pequeno" onclick="agregarLineaOC()">＋ Agregar artículo</button></div><div id="oc-lineas"></div><div class="oc-total" id="oc-total">Total OC: G. 0</div>'+
 '<div class="oc-actions"><button class="btn btn-verde" onclick="guardarOC()">Guardar borrador</button><button class="btn btn-azul" onclick="guardarOC(true)">Emitir OC</button><button class="btn btn-gris" onclick="cargarOrdenesCompra()">Cancelar</button></div></div>';
 agregarLineaOC();
}
function renderLineasOC(){
 const el=document.getElementById('oc-lineas');if(!el)return;
 const items=window.ocArt||[],cc=window.ocCC||[],dep=window.ocDep||[];
 let total=0;
 el.innerHTML='<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Artículo</th><th>Unidad</th><th>Cantidad</th><th>Precio unit.</th><th>IVA</th><th>Descuento</th><th>Centro de costos</th><th>Depósito</th><th>Total</th><th></th></tr></thead><tbody>'+
 ocLineas.map((l,i)=>{const a=items.find(x=>Number(x.id)===Number(l.item_id));const sub=Math.max(0,Number(l.cantidad||0)*Number(l.precio_unitario||0)-Number(l.descuento||0));total+=sub;return '<tr><td><select onchange="actualizarLineaOC('+i+',\'item_id\',this.value)"><option value="">Artículo *</option>'+items.filter(x=>Number(x.activo)!==0).map(x=>'<option value="'+x.id+'" '+(Number(l.item_id)===Number(x.id)?'selected':'')+'>'+ocEscape(x.codigo)+' — '+ocEscape(x.nombre)+'</option>').join('')+'</select></td><td>'+ocEscape(a?.unidad_nombre||'—')+'</td><td><input type="number" min="0.001" step="0.001" value="'+Number(l.cantidad||0)+'" onchange="actualizarLineaOC('+i+',\'cantidad\',this.value)"></td><td><input type="number" min="0" step="0.01" value="'+Number(l.precio_unitario||0)+'" onchange="actualizarLineaOC('+i+',\'precio_unitario\',this.value)"></td><td>'+Number(l.iva_tasa??10)+'%</td><td><input type="number" min="0" step="0.01" value="'+Number(l.descuento||0)+'" onchange="actualizarLineaOC('+i+',\'descuento\',this.value)"></td><td><select onchange="actualizarLineaOC('+i+',\'centro_costo_id\',this.value)"><option value="">Usar general</option>'+cc.filter(x=>Number(x.activo)!==0).map(x=>'<option value="'+x.id+'" '+(Number(l.centro_costo_id)===Number(x.id)?'selected':'')+'>'+ocEscape(x.codigo)+' — '+ocEscape(x.nombre)+'</option>').join('')+'</select></td><td><select onchange="actualizarLineaOC('+i+',\'deposito_id\',this.value)"><option value="">Usar general</option>'+dep.filter(x=>Number(x.activo)!==0).map(x=>'<option value="'+x.id+'" '+(Number(l.deposito_id)===Number(x.id)?'selected':'')+'>'+ocEscape(x.codigo)+' — '+ocEscape(x.nombre)+'</option>').join('')+'</select></td><td>G. '+sub.toLocaleString('es-PY')+'</td><td><button class="btn btn-rojo btn-pequeno" onclick="eliminarLineaOC('+i+')">✕</button></td></tr>';}).join('')+'</tbody></table></div>';
 const t=document.getElementById('oc-total');if(t)t.textContent='Total OC: G. '+total.toLocaleString('es-PY');
}
async function guardarOC(emitir=false){
 if(!ocLineas.length){alert('Agregá al menos un artículo.');return;}
 const body={proveedor_id:Number(document.getElementById('oc-proveedor').value||0),fecha:document.getElementById('oc-fecha').value,fecha_entrega:document.getElementById('oc-fecha-entrega').value||null,condicion_id:Number(document.getElementById('oc-condicion').value||0)||null,centro_costo_id:Number(document.getElementById('oc-centro').value||0)||null,moneda:document.getElementById('oc-moneda').value,observacion:document.getElementById('oc-observacion').value.trim(),estado:emitir?'emitida':'borrador',detalle:ocLineas.map(l=>({...l,item_id:Number(l.item_id||0),cantidad:Number(l.cantidad||0),precio_unitario:Number(l.precio_unitario||0),descuento:Number(l.descuento||0),centro_costo_id:Number(l.centro_costo_id||0)||null,deposito_id:Number(l.deposito_id||0)||null}))};
 if(!body.proveedor_id||!body.fecha){alert('Proveedor y fecha son obligatorios.');return;}
 if(body.detalle.some(x=>!x.item_id||x.cantidad<=0)){alert('Cada línea debe tener un artículo y una cantidad mayor a cero.');return;}
 const r=await fetchApi(API+'/api/compras/ordenes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();
 if(!r.ok){alert(d.error||'No se pudo guardar la OC.');return;}
 alert('Orden de compra '+d.numero+' guardada correctamente.');
 await cargarOrdenesCompra();
}
async function verOC(id){
 const r=await fetchApi(API+'/api/compras/ordenes/'+id);const d=await r.json();if(!r.ok){alert(d.error||'No se pudo cargar la OC.');return;}
 ocDetalleActual=d;renderDetalleOC();
}
function renderDetalleOC(){
 const root=document.getElementById('oc-contenido'),o=ocDetalleActual.orden,d=ocDetalleActual.detalle||[];
 const recib= d.reduce((a,x)=>a+Number(x.cantidad_recibida||0),0),ped=d.reduce((a,x)=>a+Number(x.cantidad||0),0),pct=ped?Math.min(100,recib/ped*100):0;
 root.innerHTML='<div class="card"><div class="oc-form-head"><div><h3>'+ocEscape(o.numero)+'</h3><span>'+ocEscape(o.proveedor)+' · '+ocEscape(o.ruc||'')+'</span></div><button class="btn btn-gris" onclick="cargarOrdenesCompra()">← Volver</button></div>'+
 '<div class="oc-info-grid"><div><small>Fecha</small><strong>'+ocEscape(o.fecha)+'</strong></div><div><small>Entrega prevista</small><strong>'+ocEscape(o.fecha_entrega||'—')+'</strong></div><div><small>Centro de costos</small><strong>'+ocEscape(o.centro_costo_codigo?o.centro_costo_codigo+' — '+o.centro_costo_nombre:'—')+'</strong></div><div><small>Estado</small><strong>'+ocEscape(ocEstado(o.estado))+'</strong></div></div>'+
 '<div class="oc-progress"><span style="width:'+pct+'%"></span></div><div class="oc-recepcion-resumen">'+pct.toFixed(0)+'% recibido · '+recib+' / '+ped+' unidades</div>'+
 '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Artículo</th><th>Pedido</th><th>Recibido</th><th>Pendiente</th><th>Centro</th><th>Depósito</th></tr></thead><tbody>'+
 d.map(x=>'<tr><td><strong>'+ocEscape(x.item_codigo||'')+'</strong> — '+ocEscape(x.descripcion)+'</td><td>'+Number(x.cantidad||0)+'</td><td>'+Number(x.cantidad_recibida||0)+'</td><td>'+Math.max(0,Number(x.cantidad||0)-Number(x.cantidad_recibida||0))+'</td><td>'+ocEscape(x.centro_linea_codigo?x.centro_linea_codigo+' — '+x.centro_linea_nombre:'—')+'</td><td>'+ocEscape(x.deposito_codigo?x.deposito_codigo+' — '+x.deposito_nombre:'—')+'</td></tr>').join('')+'</tbody></table></div>'+
 '<div class="oc-actions"><select id="oc-nuevo-estado"><option value="">Cambiar estado</option>'+['emitida','aprobada','cerrada','anulada'].map(s=>'<option value="'+s+'">'+ocEstado(s)+'</option>').join('')+'</select><button class="btn btn-azul" onclick="cambiarEstadoOC()">Actualizar estado</button></div>'+
 '<div class="oc-note">La OC no ejecuta presupuesto ni genera asiento contable. La ejecución ocurre al registrar la adquisición.</div></div>';
}
async function cambiarEstadoOC(){
 const e=document.getElementById('oc-nuevo-estado')?.value;if(!e)return;
 const r=await fetchApi(API+'/api/compras/ordenes/'+ocDetalleActual.orden.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({estado:e})});const d=await r.json();if(!r.ok){alert(d.error||'No se pudo actualizar.');return;}await verOC(ocDetalleActual.orden.id);
}
document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{if(document.getElementById('vista-orden-compra'))cargarOrdenesCompra();},800);});
