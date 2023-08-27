var flippingdipping = thePIT.RConfig('flipmasks');
var flipdipNorm = thePIT.RConfig('flipnorm');

var imgWorker
const normalMapInfo = {
  width : 128,
  height : 128
}

function genTexture(color,size=4){
	if (parseInt(size)>0){
		var dataColor = new Uint8Array(4 *size);
		var color = new THREE.Color( color );
		if (color.isColor){
			var r= Math.floor(color.r * 255);
			var g= Math.floor(color.g * 255);
			var b= Math.floor(color.b * 255);
			for ( let i = 0; i < size; i ++ ) {
				const stride = i * 4;
				dataColor[ stride ] = r;
				dataColor[ stride + 1 ] = g;
				dataColor[ stride + 2 ] = b;
				dataColor[ stride + 3 ] = 255;
			}
			return dataColor;
		}else{
			return new Uint8Array(4 *size);
		}
	}
	return false;
}

const BLACK = new THREE.DataTexture(genTexture(new THREE.Color( 0, 0 ,0 ) ),4,4);
const GRAY = new THREE.DataTexture(genTexture(new THREE.Color( 0.5, 0.5 ,0,5 ) ),4,4);
const WHITE = new THREE.DataTexture(genTexture(new THREE.Color( 1, 1 ,1 ) ),4,4);

var materialStack = new Set();

const materialTypeCheck = {
	metal_base : ["engine\\materials\\metal_base.remt"],
	multilayer : ["engine\\materials\\multilayered.mt"],
	decals: ["base\\materials\\mesh_decal.mt"],
	glass: ["base\\materials\\glass.mt"],
}

if (window.Worker) {
  imgWorker = new Worker('js/workers/imgWork.js');

  imgWorker.onmessage = (event) =>{
    context = nMeKanv.getContext('2d');
    context.putImageData(event.data,0,0,0,0,normalMapInfo.width,normalMapInfo.height);
    //normMe = new THREE.CanvasTexture(nMeKanv,THREE.UVMapping,THREE.RepeatWrapping)
    //material.normalMap = normMe;
    material.normalMap.needsUpdate = true
    //material.map.needsUpdate = true;
    material.normalMap.flipY = flipdipNorm;
  }
}

dat.GUI.prototype.removeFolder = function(name) {
   var folder = this.__folders[name];
   if (!folder) {
     return;
   }
   folder.close();
   this.__ul.removeChild(folder.domElement.parentNode);
   delete this.__folders[name];
   this.onResize();
 }

function notify3D(message){
	let Data = new Date(Date.now());
	var NTextarea = document.querySelector("#NotificationCenter div.offcanvas-body");
	NTextarea.innerHTML = '[ '+Data.toLocaleString('en-GB', { timeZone: 'UTC' })+' ] ' + message+'<br/>'+NTextarea.innerHTML;
}


function fogApply(fogType){
	console.log(typeof(fogType.color));
	if ((fogType?.color) && (fogType.far) && fogType.near){
		return new THREE.Fog( fogType.color, fogType.near,fogType.far)
	}
}
/*thacanvas events*/

thacanvas.addEventListener('mousedown',(event)=>{
	event.preventDefault();
	if (event.shiftKey && (event.button==0)){
		paintMaskCTX.beginPath();
	}
});
thacanvas.addEventListener('mouseup',(event)=>{
	event.preventDefault();
	if (event.shiftKey &&  (event.button==0)){
		console.log('mouseup',event.button)
		paintMaskCTX.closePath();
	}
});

thacanvas.addEventListener( 'mousemove', (event)=>{
	event.preventDefault();
});

function onMouseMove( event ) {
	event.preventDefault();
	if (paintMask3D){
		const array = getMousePosition( thacanvas, event.clientX, event.clientY );
		onClickPosition.fromArray( array );
		if (scene.children.filter(el => el.type.toLowerCase()=='group').length>0){
			const intersects = getIntersects( onClickPosition, scene.children.filter(el => el.type.toLowerCase()=='group')[0].children); //fix for GLB loaded scene
			if ( intersects.length > 0 && intersects[ 0 ].uv ) {

				const uv = intersects[ 0 ].uv;
				uvPaint.fromArray(intersects[ 0 ].uv)
				canvas.setCrossPosition( uv.x, uv.y );
				draw( paintMaskCTX, uv.x * 768, 768 - uv.y * 768 );
			}
		}
	}
}

/*TODO Aggiungere filtro dell'attuale scena con solo i membri in gruppo filtrati per rimuovere inutili mesh da controllare.*/

function getMousePosition( dom, x, y ) {
	const rect = dom.getBoundingClientRect();
	return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];
}

function getIntersects( point, objects ) {
	mouseCurPos.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );
	raycaster.setFromCamera( mouseCurPos, camera );
	return raycaster.intersectObjects( objects, false );
}

var nMeKanv = document.getElementById('normalMe');
const paintMaskHT = document.getElementById('maskPainter');
const paintMaskCTX = paintMaskHT.getContext('2d');
paintMaskCTX.willReadFrequently = true;
paintMaskCTX.lineCap = "round";
var pressure = 0.2;
var snapsManager = document.getElementById('Snapshots');
paintMaskCTX.save();

//grayscaleCheck = document.getElementById('gScalePaint');

function HairTexture(hairData=[{c:'#002250',p:0},{c:'#002250',p:1}]) {
	var size = 256;
	// get canvas
	canvas = document.getElementById( 'hairTex' );//canvas.height = size; //canvas.width = size;
	// get context
	var context = canvas.getContext( '2d' );
	// draw gradient
	context.rect( 0, 0, size, size );
	var gradient = context.createLinearGradient( 128, 0, 128, size );
	hairData.forEach((swatch)=>{
		gradient.addColorStop(swatch.p,swatch.c);
	})
	/*
	gradient.addColorStop(0, '#99ddff'); // light blue
	gradient.addColorStop(1, 'transparent');*/
	context.fillStyle = gradient;
	context.fill();
}

function clearCanvas(target,fillStyle='', squareSize = 0){
  let t_canvas = target.getContext('2d');
  t_canvas.clearRect(0,0,squareSize,squareSize)
  if (fillStyle!=''){
    t_canvas.fillStyle = fillStyle;
    t_canvas.fillRect(0,0,squareSize,squareSize)
  }
}

function safeNormal(){
	nMeKanv.width=128;
	nMeKanv.height=128;
	nctx = nMeKanv.getContext('2d');
	nctx.clearRect(0, 0, nMeKanv.width, nMeKanv.height);
	nctx.fillStyle = `rgb(120,119,255)`;
	nctx.fillRect(0, 0, 128, 128);
}

function theChecked( sons ){
  /*Find the index of the checked submesh to unwrap their UVs */
  var checked = [];
   if (sons.length != 0 ){
     for (let i = 0 , k = sons.length; i < k; i++){
       if (sons[i].checked){
         checked.push(i);
       }
     }
   }
   return checked;/*return an array of indexes*/
}

 var paintMask3D = false;
 var err_counter = 0;
 var control_reset = false;
 var control_side = false;
 var getImageData = false;
 var imgDataShot = null;
 let scene, camera, renderer, controls, axesHelper;
 let pointlight, ambientlight, pointlight_2, pointlight_3, pointlight_4;
 var changeLumen = false;
 //-------------parameter for Dat Window-----------------------
const params = {
 autorotation: false,
 rotationspeed: 6,
 wireframe: false,
 onesided: false,
 lightpower:2,
 alpha:0,
 maskColor:[50, 0, 0],
 fog:{
	color: 0x9b9d3f,
	near: 10,
	far: 105
	}
};
//-------------Aiming box for the camera ----------------------

//basic material map

//-------------Material and Object Constant--------------------
//const safeMap = new THREE.TextureLoader().load( "./images/favicon.png" );
const canvasPaint = new THREE.CanvasTexture(paintMaskCTX.canvas);
canvasPaint.format = THREE.LuminanceFormat
canvasPaint.wrapS = THREE.RepeatWrapping
canvasPaint.wrapT = THREE.RepeatWrapping
const drawStartPos = new THREE.Vector2();

const material = new THREE.MeshStandardMaterial({color: 0x500000,map:canvasPaint,alphaMap:canvasPaint,alphaTest:0});
const metal_base = new THREE.MeshStandardMaterial({color: 0x808080});

const glass = new THREE.MeshPhysicalMaterial({  roughness: 0.3,   transmission: 1, thickness: 0.05});
//material for stitches zip and other things
const stitchMap = new THREE.TextureLoader().load("./images/cpsource/garment_decals_d01.png");
const stitchNorMap = new THREE.TextureLoader().load("./images/cpsource/garment_decals_n01.png");
stitchMap.wrapS = THREE.RepeatWrapping;
stitchMap.wrapT = THREE.RepeatWrapping;
stitchNorMap.wrapS = THREE.RepeatWrapping;
stitchNorMap.wrapT = THREE.RepeatWrapping;
stitchNorMap.premultiplyAlpha = true;

const stitches = new THREE.MeshStandardMaterial({map:stitchMap,normalMap:stitchNorMap, transparent: true,opacity: 0.7, color: 0xffffff});
//-------------Hairs Materials----------------------------------
var hairShading = document.getElementById('hairTex');
HairTexture();

const hairCText = new THREE.CanvasTexture(hairShading);
const hair_card = new THREE.MeshStandardMaterial({map:hairCText,transparent:false,side:THREE.DoubleSide,fog:true});
const hair_cap = new THREE.MeshStandardMaterial({color: 0x502200,side:THREE.FrontSide});//
//const hair_card = new THREE.MeshStandardMaterial({color: 0x002250,side:THREE.DoubleSide});//
const hair_short = new THREE.MeshStandardMaterial({color: 0x225022,side:THREE.DoubleSide});//
const hair_other = new THREE.MeshStandardMaterial({color: 0x222222,side:THREE.DoubleSide});//

//__this will be for direct painting purpose
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const intersects = [];

const mouseCurPos = new THREE.Vector2();
const onClickPosition = new THREE.Vector2();
const uvPaint = new THREE.Vector2();

//

safeNormal();
var normMe = new THREE.CanvasTexture(nMeKanv);
var canvUVWrapped = document.getElementById('UVMapMe');

//const maploader = new THREE.FileLoader().setResponseType('arraybuffer');
const loader = new THREE.GLTFLoader(); //loader for Gltf and glb models
//const loader = new GLTFLoader();
//const fbxloader = new THREE.FBXLoader(); //loader for FBX Format
const gui = new dat.GUI({autoPlace:false,width:350});
var GuiSubmesh =gui.addFolder("Submesh Toggle");
var GuiInfo = gui.addFolder("Submesh Info");
GuiSubmesh.close();//closes the submeshes folder


/*control onto the flip*/

var flipcheck = document.getElementById("flipMask");

flipcheck.onclick=function(){
  let layerSelected = document.querySelector("#layeringsystem li.active");
  flippingdipping = flipcheck.checked;
  thePIT.savePref({flipmasks:flippingdipping});
  //need to update the canvas
  material.map.flipY = flippingdipping;
  if (layerSelected){
    layerSelected.click();
  }  
}

var flipNcheck = document.getElementById("flipNorm");
flipNcheck.onclick=function(){
  flipdipNorm = flipNcheck.checked;
  thePIT.savePref({flipnorm:flipdipNorm});
  //need to update the canvas
  var test = document.getElementById("normalMe");
  var test2 = test.getContext("2d");
  var image = test2.getImageData(0,0,normalMapInfo.width,normalMapInfo.height)
  if (window.Worker) {
    imgWorker.postMessage(image)
  }
}

//document.documentElement.style.setProperty('--rendView', '700px'); //used for changing the viewport size
//Parametric Render width from CSS
//const renderwidth = Number((parseInt(document.getElementById("interface").offsetWidth/9)*4)-15)
const renderwidth = Number(getComputedStyle(document.documentElement).getPropertyValue('--rendView').replace(/px/,''));
let resized = false; //semaphore for resizing behaviour
window.addEventListener('resize', function() {  resized = true;  });// resize event listener

document.getElementById("UVSave").addEventListener('click', (e) =>{
  let down = document.getElementById("UVSave")
  let UWUnwrapped = canvUVWrapped.toDataURL('image/png');
  down.href = UWUnwrapped;
  down.download = "uvmap.png";
});

document.getElementById("expMsk").addEventListener('click', (e) =>{
  let mylayer = document.querySelector("#masksPanel li.active").innerText;
  let down = document.getElementById("expMsk")
  let UWUPaintedMask = paintMaskHT.toDataURL('image/png');
  down.href = UWUPaintedMask;
  down.download = "newmask_layer_"+mylayer+".png";
});

document.getElementById("UVGen").addEventListener('click', (e) =>{
  canvUVWrapped.dispatchEvent(new Event("dblclick"));
});

let paint = false;
paintMaskCTX.lineWidth = 0.2;

let originalLayer = '';

// add canvas event listeners
paintMaskHT.addEventListener( 'pointerdown', function ( e ) {
	//pressure = Number(document.getElementById("strokeMsk").value) + (Number(document.getElementById("strokeMsk").value) * e.pressure)
	pressure = Number(document.getElementById("strokeMsk").value);
	paint = true;
	drawStartPos.set( e.offsetX, e.offsetY );
});

paintMaskHT.addEventListener( 'pointermove', function ( e ) {
	//pressure = Number(document.getElementById("strokeMsk").value) + (Number(document.getElementById("strokeMsk").value) * e.pressure)
	pressure = Number(document.getElementById("strokeMsk").value);
	if ( paint ) draw( paintMaskCTX, e.offsetX, e.offsetY );
});

paintMaskHT.addEventListener( 'pointerup', function (e) {
  console.log('pointerup');
	paint = false;
  paintMaskCTX.beginPath();
});

paintMaskHT.addEventListener( 'pointerleave', function () {
  console.log('pointerleave');
	paint = false;
  paintMaskCTX.closePath();
});

canvUVWrapped.addEventListener('dblclick',function(){
  try{
    if (scene.children.filter(elm => elm.type.toLowerCase()=='group')){
      var scena = scene.children.filter(elm => elm.type=='Group')
      if (scena[0].hasOwnProperty("children")){
        var sbmeshs = scena[0].children.filter( elm => elm.type == 'SkinnedMesh'|| elm.type == 'Mesh')
        var sz = 768;
        clearCanvas(canvUVWrapped,'',768);

        const ctxxxx = canvUVWrapped.getContext('2d');

        const abc = 'abc';
        const a = new THREE.Vector2();
        const b = new THREE.Vector2();
        const uvs = [ new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2() ];
        const face = [];
        const width = height =768;

        let container = document.getElementById("unChecksMesh");
        let tocompute = theChecked(container.querySelectorAll("input[type='checkbox']"))

        var lod
        tocompute.forEach((x)=>{
          	lod = sbmeshs[x]
          	const index = lod.geometry.index;
			const uvAttribute = lod.geometry.attributes.uv;
          	ctxxxx.strokeStyle = "#"+tinycolor.fromRatio({r:(Math.random()*.5),g:(Math.random()*.4+.6),b:(Math.random()*.4+.6)}).toHex();
          	ctxxxx.lineWidth = .2;

          var il
          if ( index ) {
            il = index.count
          }else{
            il = uvAttribute.count
          }

          for ( let i = 0; i < il; i=i+3 ) {
  					face[ 0 ] = index.getX( i );
  					face[ 1 ] = index.getX( i + 1 );
  					face[ 2 ] = index.getX( i + 2 );
  					uvs[ 0 ].fromBufferAttribute( uvAttribute, face[ 0 ] );
  					uvs[ 1 ].fromBufferAttribute( uvAttribute, face[ 1 ] );
  					uvs[ 2 ].fromBufferAttribute( uvAttribute, face[ 2 ] );
  					//processFace( face, uvs, i / 3 );
            // draw contour of face
            ctxxxx.beginPath();
            a.set( 0, 0 );
            for ( let j = 0, jl = uvs.length; j < jl; j++ ) {
              const uv = uvs[ j ];
              a.x += uv.x;
              a.y += uv.y;
              if ( j === 0 ) {
                ctxxxx.moveTo( uv.x * ( width - 2 ) + 0.5, ( 1 - uv.y ) * ( height - 2 ) + 0.5 );
              } else {
                ctxxxx.lineTo( uv.x * ( width - 2 ) + 0.5, ( 1 - uv.y ) * ( height - 2 ) + 0.5 );
              }
            }
            ctxxxx.closePath();
            ctxxxx.stroke();
  				}
        })
      }
    }
  }catch(error){
    console.log(error,scena);
    notify3D("Errore di lettura",true);
  }

});

var MDLloadingButton = document.getElementById('btnMdlLoader');
var CustomLoadButton = document.getElementById('cstMdlLoader');
var UVSbmeshENA = document.getElementById('unChecksMesh');
//-------------Material and Object Constant--------------------
function paintDatas(textureData,w,h){
  var oc = document.createElement('canvas');
  oc.width=w;
  oc.height=h;
  var octx = oc.getContext('2d');
  var imageData = octx.createImageData(w,h);
  var k=0;
  for (let i = 0; i < imageData.data.length; i += 4) {
 	 // Modify pixel data
 	 imageData.data[i] = textureData[k];  // R value
 		 imageData.data[i + 1] =  textureData[k]    // G value
 		 imageData.data[i + 2] =  textureData[k]  // B value
 	 imageData.data[i + 3] = 255;  // A value
 	 k++;
  }
  octx.putImageData(imageData,0,0,0,0,w,h);
  paintMaskCTX.drawImage(oc,0,0,768,768);
  oc.remove();
}

function DDSNormal(textureData,w,h){
  var oc = document.createElement('canvas');
  oc.width=w;
  oc.height=h;
  var octx = oc.getContext('2d');
  var imageData = octx.createImageData(w,h);//var imageData = octx.createImageData(w,h);
  var k=0;
  for (let i = 0; i < imageData.data.length; i += 4) {
 	 // Modify pixel data
 	imageData.data[i] = textureData[k];  // R value
   	imageData.data[i + 1] = textureData[k+1];  // G value
   	imageData.data[i + 2] = 255;
 	imageData.data[i + 3] = 255;  // A value
 	k+=4;
  }
  octx.putImageData(imageData,0,0,0,0,w,h);
  nMeKanv.width=768;
  nMeKanv.height=768;
  nctx = nMeKanv.getContext('2d');
  nctx.drawImage(oc,0,0,768,768);
  oc.remove();
}

function giveToTheAim(textureData,w,h){
 var aimcanvas = document.getElementById('MaskTargettoAim');
 var ctx = aimcanvas.getContext('2d');
 aimcanvas.width=512;
 aimcanvas.height=512;

 var imageData = ctx.createImageData(w,h);
 var k=0;
 for (let i = 0; i < imageData.data.length; i += 4) {
	 // Modify pixel data
	 imageData.data[i] = textureData[k];  // R value
	 if (grayscaleCheck.checked){
		 imageData.data[i + 1] =  textureData[k]    // G value
		 imageData.data[i + 2] =  textureData[k]  // B value
	 }else{
		 imageData.data[i + 1] = 0    // G value
		 imageData.data[i + 2] = 0  // B value
	 }
	 imageData.data[i + 3] = 255;  // A value
	 k++;
 }
 //Create another temporary canvas
  var oc = document.createElement('canvas');
  oc.width=w;
  oc.height=h;
  var octx = oc.getContext('2d');
  octx.putImageData(imageData,0,0,0,0,w,h);
  //octx.putImageData(imageData,0,0,0,0,w,h);
  octx.scale(512/w,512/h);
  octx.setTransform(1,0,0,-1,0,0);
  //ctx.drawImage(oc,0,0,512,512);
  paintMaskCTX.drawImage(oc,0,0,768,768);
  oc.remove();
}

function draw( drawContext, x, y ) {
        let color = document.getElementById("maskoolor").getAttribute('data-color');
				drawContext.lineWidth = pressure;
				drawContext.moveTo( drawStartPos.x, drawStartPos.y );
				drawContext.strokeStyle = '#'+color;
				drawContext.lineTo( x, y );
				drawContext.stroke();
				// reset drawing start position to current position.
				drawStartPos.set( x, y );
				// need to flag the map as needing updating.
				material.map.needsUpdate = true;
			}
	/*
	grayscaleCheck.addEventListener('click', ( event )=>{
		let paintDisplay = document.querySelectorAll("span.choose")
		let basecode

		let rangeshift = document.querySelectorAll('#panelPain input[type="range"]')
		rangeshift.forEach((range, i)=>{
			range.classList.toggle('grayscale');
		})

		if (grayscaleCheck.checked){

			const imageData = paintMaskCTX.getImageData(0, 0, paintMaskHT.width, paintMaskHT.height);
			const data = imageData.data;
			for (let i = 0; i < data.length; i += 4) {
					//const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
					data[i]     = data[i]; // red
					data[i + 1] = data[i]; // green
					data[i + 2] = data[i]; // blue
			}
			paintMaskCTX.putImageData(imageData, 0, 0);

			paintDisplay.forEach((spans, i) => {
				basecode = spans.getAttribute('data-color').substring(0,2);
				spans.setAttribute('data-color',basecode.repeat(3));
				spans.setAttribute('style','background-color:#'+basecode.repeat(3));
			});

		}else{

			const imageData = paintMaskCTX.getImageData(0, 0, paintMaskHT.width, paintMaskHT.height);
			const data = imageData.data;
			for (let i = 0; i < data.length; i += 4) {
					//const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
					data[i]     = data[i]; // red
					data[i + 1] = 0; // green
					data[i + 2] = 0; // blue
			}
			paintMaskCTX.putImageData(imageData, 0, 0);
      paintDisplay.forEach((spans, i) => {
				basecode = spans.getAttribute('data-color').substring(0,2);
				spans.setAttribute('data-color',basecode+"0000");
				spans.setAttribute('style','background-color:#'+basecode+"0000");
			});
		}
		material.map.needsUpdate = true
	})
	*/
function layersActive(index){
  let indicators = document.getElementById('layeringsystem');
  let listlayers = indicators.getElementsByTagName("li");

  let paintLayer = document.getElementById('masksPanel');
  let paint_L_ena = paintLayer.getElementsByTagName("li");

  for (var i=1; i < listlayers.length; i++) {
    if (Number(listlayers[i].innerText)>index){
     listlayers[i].setAttribute('disabled','disabled');
     listlayers[i].classList.remove('active');
    	 //console.log("this -> "+i+" has to be disabled");
     paint_L_ena[i].classList.add('off');
    }else{
     listlayers[i].removeAttribute('disabled');
     paint_L_ena[i].classList.remove('off');
    }
  }
}

//Revert to the original layer
document.getElementById('wipeMsk').addEventListener('click', (e) =>{
  if (originalLayer!=''){
    let img = new Image;
    img.onload = function(){
      paintMaskCTX.drawImage(img,0,0,768,768); // Or at whatever offset you like
			material.map.needsUpdate = true;
    };
    img.src = originalLayer;

  }
});

document.getElementById('fillMsk').addEventListener('click', (e) =>{
  //Fills with the current colors
  clearCanvas(paintMaskHT,tinycolor('#'+$('#maskoolor').data('color')).toRgbString(),768)
  material.map.needsUpdate =true;
});

//get the actual snapshot in an image and it push in the interface
document.getElementById('snapsMsk').addEventListener('click' , (event)=>{
  if (snapsManager.children.length > 9){
    snapsManager.firstElementChild.remove();
  }
  let crapimg = paintMaskHT.toDataURL('image/png');
  snapsManager.innerHTML +="<img src='"+crapimg+"' >";
});


/* Back One snapshot */
document.getElementById('stepbackMsk').addEventListener('click', (event) =>{
  if (snapsManager.children.length >= 1){
    snapsManager.lastElementChild.remove();
    //snapsManager.lastElementChild.dispatchEvent(new Event('click'));
    let sourceimage;
    if (snapsManager.lastElementChild!=null){
      sourceimage = snapsManager.lastElementChild;
    }else{
      sourceimage = originalLayer;
    }
    let img = new Image;
    img.onload = function(){
      paintMaskCTX.drawImage(img,0,0,768,768); // Or at whatever offset you like
    };
    img.src = sourceimage.src;
    //img=null;
    material.map.needsUpdate = true;
  }else{
		document.getElementById("wipeMsk").dispatchEvent(new Event('click'));
	}
});

document.querySelector('#Snapshots').addEventListener('click', (event) =>{
  if (event.target && event.target.tagName=="IMG"){
    let sourceimage = event.target;

    let img = new Image;
    img.onload = function(){
      paintMaskCTX.drawImage(img,0,0,768,768); // Or at whatever offset you like
    };
    img.src = sourceimage.src;
    //img=null;
    material.map.needsUpdate = true;
  }
});

function str2ab(str) {
 var buf = new ArrayBuffer(str.length); // 2 bytes for each char
 var bufView = new Uint8Array(buf);
 for (var i=0, strLen=str.length; i < strLen; i++) {
	 bufView[i] = str.charCodeAt(i);
 }
 return buf;
}

function loadNormOntheFly(path){
	let Normed = document.querySelector('#withbones i.icon-normals');
	path = path.replaceAll(/\//g,'\\')
  	var bufferimage = thePIT.ApriStream(path,'binary');
	var ab = str2ab(bufferimage);
  
  if (path.endsWith(".png")){
  	if (ab.byteLength>0){
  			var filePointer = 0;
  			const headerData = new Uint8Array(ab,0,8);
  			filePointer +=8;
  			//Check on PNG file signature http://www.libpng.org/pub/png/spec/1.2/PNG-Rationale.html#R.PNG-file-signature
  			if (
  				(headerData[0]==0x89)
  				&& (headerData[1]==0x50)
  				&& (headerData[2]==0x4e)
  				&& (headerData[3]==0x47)
  				&& (headerData[4]==0x0d)
  				&& (headerData[5]==0x0a)
  				&& (headerData[6]==0x1a)
  				&& (headerData[7]==0x0a)
  			){
  				//Getting the image dimesions to work with the canvas import
  				//chuckiteration
  				var chunkslenght, chunkstype
  				var pngWidth = pngHeight = 0;
  				var imgByteLenght = ab.byteLength

  				while ((pngWidth==0) && (pngWidth==0) && (filePointer<imgByteLenght)) {
  					chunkslenght = parseInt(new DataView(ab,filePointer,4).getInt32(),16); //from hexa I'll take the size of the chunks
  					chunkstype = new Uint8Array(ab,filePointer+4,4);
  					filePointer+=8;
  					//console.log(chunkslenght+" : "+chunkstype);
  					if ( (chunkstype[0]==0x49)
  						&&(chunkstype[1]==0x48)
  						&&(chunkstype[2]==0x44)
  						&&(chunkstype[3]==0x52) ){
  						//go for the read of the length
  						pngWidth=parseInt(new DataView(ab,filePointer,4).getUint32());
  						pngHeight=parseInt(new DataView(ab,filePointer+4,4).getUint32());
  					}
  					filePointer+=chunkslenght+4; //last 4 byte are for the checksum
  				}

  				if (pngWidth>0){
  					context = nMeKanv.getContext('2d');
  					/* Size is setted up */
					nMeKanv.width = normalMapInfo.width = pngWidth;
					nMeKanv.height = normalMapInfo.height = pngHeight;

  					var encodedData = btoa(bufferimage);
  					var dataURI = "data:image/png;base64," + encodedData;
  					var nMap = new Image();
  					nMap.onload = function(){
  						context.drawImage(nMap, 0, 0, normalMapInfo.width,normalMapInfo.height);
  						var imageData = context.getImageData(0,0,normalMapInfo.width,normalMapInfo.height);
              			if (window.Worker) { imgWorker.postMessage(imageData) }
						Normed.style.color = 'var(--normal)';
  					}
  					nMap.src = dataURI;
  				}else{
  					//console.log('no sizes found');
  					notify3D('no sizes found');
  					safeNormal();
  					
            		Normed.style.color = '';
  				}

  			}else{
          		Normed.style.color = 'rgb(255,0,0)';
  				notify3D('another format');
  			}
  	}else{
      Normed.style.color = 'rgb(255,128,0)';
  	}
  }else if(path.endsWith(".dds")){
    var data = str2ab(bufferimage);
    let offsetHeight = 3;
    let offsetwidth = 4;
    const headerData = new Uint32Array( data, 0, 5 ); //get the two dimensions data bytes
    let height = headerData[3];
    let width = headerData[4];
    let size = height * width * 4;
    const dx10Data = new Uint32Array( data, 128, 4 ); //get the type of DDS
    var normalData
   //wolvenkit 8.4.3+ and cli 1.5.0+ format
    if ((dx10Data[0]==61) && (dx10Data[1]==3)&& (dx10Data[2]==0)&& (dx10Data[3]==1)){
      normalData = new Uint32Array( data, 148, size );
    }else{
      //or legacy RGBA Unorm
      normalData = new Uint8Array( data, 148, size );
    }
    DDSNormal(normalData,width,height);
    Normed.style.color = 'var(--normal)';
    material.normalMap.flipY = flipdipNorm
    material.normalMap.needsUpdate = true;
  }
  material.map.flipY = flippingdipping
  material.map.needsUpdate = true;
}

function loadMapOntheFly(path){
  //const encoder = new TextEncoder()
  path = path.replaceAll(/\//g,'\\');
  var bufferimage
  bufferimage = thePIT.ApriStream(path,'binary');

  if ((typeof(bufferimage)!="object") && (bufferimage!="") ){

    if (path.endsWith(".png")){
      var base64 = window.btoa(bufferimage);
      let img = new Image();
      img.src = "data:image/png;base64," + base64;
      img.onload = function () {
          paintMaskCTX.drawImage(img, 0, 0, 768, 768);
          //Load the layer and update the materials
          material.color.set(0x500000);
          material.map.flipY = flippingdipping
          material.map.needsUpdate = true;
      };
      originalLayer = img.src;

    }else if(path.endsWith(".dds")){
    	var data = str2ab(bufferimage);
    	let offsetHeight = 3;
		let offsetwidth = 4;
		const headerData = new Uint32Array( data, 0, 5 ); //get the two dimensions data bytes
		let height = headerData[3];
		let width = headerData[4];
		let size = height * width;
 		const dx10Data = new Uint32Array( data, 128, 4 ); //get the type of DDS
 		var luminancedata
 		 //wolvenkit 8.4.3+ and cli 1.5.0+ format
 		if ((dx10Data[0]==61) && (dx10Data[1]==3)&& (dx10Data[2]==0)&& (dx10Data[3]==1)){
 			 luminancedata = new Uint8Array( data, 148, size );
 		}else{
 			 //or legacy
 			 luminancedata = new Uint8Array( data, 128, size );
 		}

   	 	material.color.set(0x500000);

   	 //material.map = canvasPaint //material.map = dataTex;
   	  //giveToTheAim(luminancedata,width,height);
      paintDatas(luminancedata,width,height);
      originalLayer = paintMaskHT.toDataURL('image/png');
    }

     material.map.flipY = flippingdipping
     material.map.needsUpdate = true;
  }else{
    let notific = document.querySelector("#notyCounter span");
    let mipreference = document.getElementById("prefxunbundle");

    err_counter = err_counter+1;
    notific.textContent = err_counter;
    material.color.set(0x000055);
    clearCanvas(paintMaskHT,'rgb(256,256,256)',768);//material.map = safeMap;
	material.map.needsUpdate = true;
    notify3D('An error happened during the load of the file: '+mipreference.value+path);
	for (i=$("#layeringsystem li.active").index();i<=19;i++){
		$("#layeringsystem li").eq(i).attr('disabled','disabled')
	}
  }
}

function cleanScene(){
	if (scene.children.length==6){
		scene.traverse(oggetti=>{
			if (!oggetti.isMesh) return
			oggetti.geometry.dispose();
		})
		scene.children.pop(scene.children[5]);
	}
}

function mBuildAppearances(model){
	var menuAppearances = document.querySelector("#appearanceSwitcher ul");
	menuAppearances.innerHTML="";
	document.getElementById("appeInfo").innerHTML="";

	if ((model.length>0) && (typeof(model)=='object')){
		if (model.length<=0){ return }
		if (model[0]?.appearanceCode===undefined){
			console.log(model[0]);
			return;
		}

		if (model[0]?.appearanceCode.length <= 0) {	return }

		model[0].appearanceCode.forEach((app,index)=>{
			menuAppearances.innerHTML += `<li><a class="dropdown-item ${index==0 ? 'active':''}"  href="#" data-name="${app}"> ${app}</a></li>`;
		});
		
		let names = model.map(x=> x.name.replace('_LOD_1',''));
		model.forEach((el,index)=>{
			let infoGui = new Object();
			infoGui[`Vert-${el.name}`] = `${el.vertexes}`;
			GuiInfo.add(infoGui, `Vert-${el.name}`)
		});
		
		GuiInfo.__controllers.forEach((item, i) => {
			item.domElement.children[0].readOnly=true;
		});

	}else{
		menuAppearances.innerHTML = `<li><a class="dropdown-item" href="#" disabled>No Appearances</a></li>`;
	}
}

function LoadModelOntheFly(path){
	const repOut = new RegExp('');
	path = path.replaceAll(/\//g,'\\'); //setup the right path to be requested
  	var mobjInfo = [];
	let Boned = false;
	let MasksOn = document.querySelector('#withbones svg:nth-child(1) path');

  	var modelfile, Decal

	if (/^[\w|\W]:\\.+/.test(path)){
		modelfile = thePIT.ApriStream(path,'binary',true);
	}else{
		modelfile = thePIT.ApriStream(path,'binary');
	}
  	data = str2ab(modelfile);

	if (data.byteLength>0){
	  	loader.parse( data ,'', ( glbscene ) => {
	  	gui.removeFolder("Submesh Toggle");
      	gui.removeFolder("Submesh Info");      
		UVSbmeshENA.innerHTML=""; //remove all the buttons in the uv calculator
		clearCanvas(canvUVWrapped,'',768)

		GuiSubmesh = gui.addFolder("Submesh Toggle");
		GuiInfo = gui.addFolder("Submesh Info");
	  	//Check on parser extension KHR_material_variants

		if (glbscene.parser.extensions?.KHR_binary_glTF!=undefined){
			var materialExt
			try {
				materialExt = JSON.parse(glbscene.parser.extensions.KHR_binary_glTF.content);
				//console.log(materialExt);
			} catch (error) {
				console.error(error);
			}
		}
	     glbscene.scene.traverse( function ( child ) {
			Decal = false;
			iStitches = false;
			if ((child.type=="SkinnedMesh") && (!Boned)){Boned=true;}

	      if ( child.isMesh ) {	
          	mobjInfo.push(
				{	"name":child.name,
					"appearanceCode":child.userData.materialNames,
					"vertexes":child.geometry.attributes.uv.count}
				);
			child.frustumCulled = false;
			if ((child.userData?.materialNames!=null) && (child.userData?.materialNames!=undefined)){
				materialStack.add(child.userData.materialNames[0]);
				if (!(/(vehicle_lights)|(logos)|(neon_rims)|(visor)|(rivets)|(\bnone\b)|(logo_spacestation.+)|(default_tpp)|((.+)?glass(.+)?)|(multilayer_lizzard)|(phongE1SG1.+)|((.+)?stickers(.+)?)|(stiti.+)|(stit?ch.+)|(black_lighter)|(eyescreen)|(dec_.+)|((.+)?screen(.+)?)|((.+)?decal(.+)?)|(.+_dec\d+)|(02_ca_limestone_1.*)|(zi(p)+er.+)/g.test(child.userData.materialNames.toString()))){
					if (modelType=='hair'){
						if ((/.+_cap.+/).test(child.userData.materialNames.toString())){
							child.material = hair_cap;
						}else if((/.+_short.+/).test(child.userData.materialNames.toString())){
							child.material = hair_short;
						}else if((/.+_card(s).+/).test(child.userData.materialNames.toString())){
							child.material = hair_card;
							hair_card.map.needsUpdate = true;
						}else if((/lambert/).test(child.userData.materialNames.toString())){
							child.material = material;
						}else{
							child.material = hair_other;
						}
					}else{
						child.material = material;
					}
				}else if(/(stiti.+)|(stit?ch.+)|(dec_stitches.+)|(zi(p)+er.+)/g.test(child.userData.materialNames.toString())){
					child.material = stitches;
                	iStitches = true;
			}else{
				if ((/.+(masksset).+/g.test(child.userData.materialNames.toString())) || (/^ml_.+/g.test(child.userData.materialNames.toString()))){
				child.material = material;
						}else if (/((.+)?glass(.+))/g.test(child.userData.materialNames.toString())) {
							child.material = glass;
							Decal = true;
				}else{
			//if is a decoration, a zipper a stiches apply a semitransparent material with autogenerated color
				child.material = new THREE.MeshBasicMaterial({color:new THREE.Color("rgb("+Number.parseInt(20*Math.random())+", "+Number.parseInt(50*Math.random()+100)+", 255)"), opacity:0.3,transparent:true});
							Decal = true;
				}
			}
		}else{
			child.material = material;
		}

		child.visible = true;

		if (Decal){
			GuiSubmesh.add(child, 'visible').name('<i class="fas fa-tag text-warning"></i> '+child.name);
		}else if (iStitches){
            GuiSubmesh.add(child, 'visible').name('<i class="fa-solid fa-ellipsis text-secondary"></i> '+child.name);
		}else{
			GuiSubmesh.add(child, 'visible').name( child.name );
		}

		UVSbmeshENA.innerHTML+=`<div class="form-check form-switch mx-2">
			<input class="form-check-input" type="checkbox" role="switch" id="uvchk_${child.name}" checked>
			<label class="form-check-label" for="uvchk_${child.name}" autocomplete="off">${child.name}</label>
	  	</div>`;
		//'<input type="checkbox" class="btn-check" id="uvchk_'+child.name+'" checked  ><label class="btn btn-sm btn-outline-secondary mb-2" for="uvchk_'+child.name+'" autocomplete="off">'+child.name+'</label>';
		}
	    });
      	mBuildAppearances(mobjInfo);
	    //if (Boned){MasksOn.classList.add('on');}else{MasksOn.classList.remove('on');}
		if (Boned){MasksOn.setAttribute("fill","red");}else{MasksOn.setAttribute("fill","currentColor");}
	    if (params.onesided){material.side=null; }else{material.side=THREE.DoubleSide;}
	    scene.add(glbscene.scene);
	    //Autocentering
		var helper = new THREE.BoxHelper(glbscene.scene);
	    helper.geometry.computeBoundingBox();
	    var centerPoint = new THREE.Vector3();
	    centerPoint.x = (helper.geometry.boundingBox.max.x + helper.geometry.boundingBox.min.x) / 2;
	    centerPoint.y = (helper.geometry.boundingBox.max.y + helper.geometry.boundingBox.min.y) / 2;
	    centerPoint.z = (helper.geometry.boundingBox.max.z + helper.geometry.boundingBox.min.z) / 2;
	    //camera.target = centerPoint;
	    controls.target = centerPoint;

	  }, (error) => {
	    notify3D(error);
	  });
	}else{
		notify3D(`-- The 3d model wasn't there when i try to load it --`); //https://github.com/Neurolinked/MlsetupBuilder/issues/8
    	//TODO activate an export of the file, if successeful go and do shit.
	}
}


document.getElementById("takeashot").addEventListener('click', (e) =>{
	getImageData = true;
	animate();
});

document.getElementById("maskLayer").addEventListener('fire', e => {
	 let modelTarget = document.getElementById("modelTarget").value;
	 let masksTemplate = document.getElementById("masksTemplate").value;

	 if ((masksTemplate!="") && (modelTarget!="")){
		 let maskLayer = document.getElementById("maskLayer").value;
		 let masksPath = masksTemplate.replace(/X/g,maskLayer);
		 //load of the new textures onto the models
		 loadMapOntheFly(masksPath);
	 }

});

function customLoad(e){
//custom 3d assets file loading
//document.getElementById('cstMdlLoader').addEventListener('click',(e)=>{
	cleanScene()
	let maxLayers = 0;
	layersActive(maxLayers);
  	safeNormal()
	clearCanvas(paintMaskHT,'rgb(256,256,256)',768); //material.map = safeMap;
	//var texture = new THREE.CanvasTexture(nMeKanv,THREE.UVMapping,THREE.RepeatWrapping)
  	material.normalMap.needsUpdate = true // = texture;
  	//material.map.needsUpdate = true;
	//CustomLoadButton.setAttribute('disabled','disabled');
	thePIT.ThreeDAsset();
  	let Normed = document.querySelector('#withbones i.icon-normals');
	//Normed.setAttribute("fill",'currentColor');
  	Normed.style.color='';
};

document.getElementById('lastCustomMDL').addEventListener('change',(e)=>{
	let file = document.getElementById('lastCustomMDL');
	//let file = MLSB.TreeD.lastModel;
	//re-enable the button
	//CustomLoadButton.disabled=false;

	if (file.value.split('.').reverse()[0]=='fbx'){
		//now i can't do anything
		/*
		var test = fbxloader.parse(str2ab(modello), '')
		console.log(test);
*/
	}else{
		//t3Ddata = str2ab(modello);
    	safeNormal();
		cleanScene();
    	LoadModelOntheFly(file.value)

		layersActive(0);
		material.map.needsUpdate =true;
		control_reset = true;
		//TODO file.value é il nome del file da aggiungere
		//Se non ce n'è un'altro con lo stesso path
	}
});

/*MDLloadingButton button click */
MDLloadingButton.addEventListener('click',(e)=>{
 var nthLayer = document.querySelector("#layeringsystem").children;
 var activeLayer = document.querySelector("#layeringsystem li.active");

 MDLloadingButton.setAttribute('disabled','disabled');
 let theModel = MLSB.TreeD.lastModel//document.getElementById("modelTarget").value; //path of the model to load
 let theMaskLayer = document.getElementById("masksTemplate").value; //template path for the textures
 let theNormal = document.getElementById("normTemplate").value; //normal file to apply to the whole model
 let layer = document.getElementById("maskLayer").value; //actual layer selected in the editors
 let maxLayer_thisModel = document.getElementById("maxLayers").value; //actual numer of layer that the models support
 layer = Number(layer);
 maxLayer_thisModel = Number(maxLayer_thisModel);

 if (((layer<0) | (layer>20)) | (activeLayer===null) | (layer>maxLayer_thisModel)){ layer = 0 }

 theMaskLayer = String(theMaskLayer).replace(/X/g,layer);

 if (theMaskLayer.match(/^[/|\w|\.]+.[dds|png]$/)){
	 //load textures
	 loadMapOntheFly(theMaskLayer);
	 //material.needUpdates =true; //setup the mask I'll set the material to update
 }else{
   	material.color.set(0x000055);
	clearCanvas(paintMaskHT,'rgb(256,256,256)',768);//material.map = safeMap;
	material.map.needsUpdate = true;
	notify3D('the texture '+theMaskLayer+' does not exists');
 }

 //let Normed = document.querySelector('#withbones svg:nth-child(2) path');
let Normed = document.querySelector('#withbones i.icon-normals');

if (theNormal.match(/^[/|\w|\.]+.[dds|png]/)){
 loadNormOntheFly(theNormal);
}else{
 safeNormal();
 Normed.style.color = '';
 //var texture = new THREE.CanvasTexture(nMeKanv,THREE.UVMapping,THREE.RepeatWrapping)
 //material.normalMap = texture;
 material.normalMap.needsUpdate = true
 notify3D('No Normal, reset to safeNorm');
}


 //material.needUpdates = true;
 //search for the right extension
 if (theModel.match(/.+\.glb$/)){
	cleanScene();
	if (modelType=='hair'){
		if (!(/show/.test(document.getElementById('HairTool')))){
			document.querySelector("#versionDisplay a:nth-child(4)").click();
		}
	}
	LoadModelOntheFly(theModel);
	//Disattivazione livelli non utilizzabili
	layersActive(maxLayer_thisModel);
   	//defUVUnwrap()
   	clearCanvas(canvUVWrapped,',768');
	//material.needUpdates =true;
	document.getElementById("modelTarget").setAttribute('loaded',true);
	MDLloadingButton.disabled=false;
	control_reset=true;
 }else{
	 let notific =document.querySelector("#notyCounter span");
	 err_counter=err_counter+1;
	 notific.textContent = err_counter;
	 console.error("The model '"+theModel+"' does not exists, check that the model .glb file is on the path requested");
	 MDLloadingButton.disabled=false;
	 notify3D('We are searching for .glb files and then this "'+theModel+'" one showed up, we can\'t open it now');
 }

});

init();

function init() {
	scene = new THREE.Scene();
	/*    const axesHelper = new THREE.AxesHelper( 5 );    scene.add( axesHelper ); to understand position of the objects */
	var thacanvas = document.getElementById('thacanvas');
	thacanvas.setAttribute('data-engine',THREE.REVISION);
  	renderer = new THREE.WebGLRenderer({canvas:thacanvas, alpha:true, antialias:true});
	if (window.innerHeight-80<512){
	renderer.setSize(renderwidth,renderwidth);
	}else{
	renderer.setSize(renderwidth,window.innerHeight-80);
	}

	renderer.gammaFactor = 2.2;
  	renderer.outputEncoding = THREE.sRGBEncoding;
  	renderer.toneMapping = THREE.ACESFilmicToneMapping;
  	renderer.toneMappingExposure = 1.25;
	//----calculating the shadows
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap

	//Canvas events for painting

	//---calculating the shadows
  	camera = new THREE.PerspectiveCamera(15,renderwidth/(window.innerHeight-80),0.01,10000);
  	camera.position.set(0.0,-0.4,-8);
	camera.updateProjectionMatrix();
  /*

  const helper = new THREE.CameraHelper( camera );
  scene.add( helper );
  */
  controls = new THREE.OrbitControls(camera, renderer.domElement);

  controls.autoRotate = false;
  controls.autoRotateSpeed = params.rotationspeed;

  controls.enableDamping = true;
  controls.enablePan = true;

  controls.target.set(0.01,0.7,0.07);

  ambientlight = new THREE.AmbientLight( 0x606060,3 ); // soft white light
  //ambientlight.intensity=1;
  scene.add( ambientlight );

  pointlight = new THREE.PointLight(0x75cb04,params.lightpower); //6C5624
  pointlight_2 = new THREE.PointLight(0xf5f503,params.lightpower);
  pointlight_3 = new THREE.PointLight(0x6078F5,params.lightpower+1);
  pointlight_4 = new THREE.PointLight(0x6078F5,params.lightpower);

  pointlight.position.set(5,0,5);
  pointlight_2.position.set(-5,0,-5);
  pointlight_3.position.set(0,0.5,-3);
  pointlight_4.position.set(0,3,3);

	/*
	pointlight.castShadow = true

	pointlight.shadow.mapSize.width = 256; // default
	pointlight.shadow.mapSize.height = 256; // default
	pointlight.shadow.camera.near = 0.05; // default
	pointlight.shadow.camera.far = 20; // default
	/*
	pointlight_2.castShadow = true
	pointlight_3.castShadow = true
	pointlight_4.castShadow = true
	*/
  scene.add(pointlight);
  scene.add(pointlight_2);
  scene.add(pointlight_3);
  scene.add(pointlight_4);

  //load a text file and output the result to the console
  //material.map = safeMap;
	material.normalMap = normMe;

	//fog
	//TODO adding fog to the scene
	scene.fog = new THREE.Fog( params.fog.color, params.fog.near,params.fog.far);

  //Setup the DAT position
  	const GuiBasicsetup = gui.addFolder("Basic Setup");
	/*
	GuiBasicsetup.addColor(params, 'maskColor').onChange(()=>{
		material.color = new THREE.Color(`rgb(${parseInt(params.maskColor[0])},${parseInt(params.maskColor[1])},${params.maskColor[2]})`);
	});*/
  	GuiBasicsetup.add( params, 'autorotation' ).name( 'Auto Rotation' );
  	GuiBasicsetup.add( params, 'rotationspeed',2, 10 ).name( 'Rotation speed' );
	GuiBasicsetup.add( params, 'wireframe').name( 'View wireframe' ).onChange(() => {
   	if (params.wireframe){
		 material.wireframe=true;
		 hair_cap.wireframe = true;
		 hair_card.wireframe = true;
		 hair_short.wireframe = true;
		 hair_other.wireframe = true;
	}else{
		 material.wireframe=false;
		 hair_cap.wireframe = false;
		 hair_card.wireframe = false;
		 hair_short.wireframe = false;
		 hair_other.wireframe = false;
	}
   //material.NeedUpdates;
   });;
  GuiBasicsetup.add( params, 'onesided').name( '1-side' ).onChange(() => {
   if (params.onesided){material.side=THREE.FrontSide;}else{material.side=THREE.DoubleSide;}
   //material.NeedUpdates;
   });
	GuiBasicsetup.add( params, 'lightpower',0.5, 10 ).name( 'Light power' ).onChange(() => {
		changeLumen = true;
	});
	GuiBasicsetup.add(params, 'alpha', 0, 0.08,0.005).name('Maskchannel').onChange(()=>{
		material.alphaTest = params.alpha
	})
  GuiBasicsetup.close();

  const GuiFogSetup = gui.addFolder("Fog config");

  GuiFogSetup.addColor(params.fog, 'color').onChange((e)=>{
	scene.fog = fogApply(params.fog);
  });

  GuiFogSetup.add( params.fog, 'near',0,100 ).name( 'Near Distance' ).onChange((e)=>{
	scene.fog = fogApply(params.fog);
  });

  GuiFogSetup.add( params.fog, 'far',params.fog.near,10000 ).name( 'Far Distance' ).onChange((e)=>{
	scene.fog = fogApply(params.fog);
  });

  gui.close(); //close the whole dat.gui

  var datpotision = document.getElementById('dat-container');
  datpotision.appendChild(gui.domElement);
  animate();
}


function animate() {
  if (resized) resize()

	if (!paintMask3D){
		controls.autoRotate = params.autorotation;
		controls.autoRotateSpeed = params.rotationspeed;
	}else{
		controls.autoRotate = false;
	}

  //check mesh reload
  if (control_reset){
   control_reset = false;
   camera.position.set(0,1,-7);
  }else{
   controls.update();
  }
  if (control_side){control_side=false;}
	if (changeLumen) {
    pointlight.intensity=params.lightpower;
    pointlight_2.intensity=params.lightpower;
    pointlight_3.intensity=params.lightpower+2;
    pointlight_4.intensity=params.lightpower;
    changeLumen=false;
  }
  renderer.render(scene, camera);
	if(getImageData == true){
			let a = document.getElementById('takeashot');
			imgDataShot = renderer.domElement.toDataURL('image/png');
			getImageData = false;
			a.href = imgDataShot;
			a.download = "lastscreen.png";
			//console.log(imgDataShot);
	}
  requestAnimationFrame(animate);
}

function resize() {
		 resized = false
		 // update the size
		 if (window.innerHeight-80<512){
			 renderer.setSize(renderwidth, 512);
		 }else{
			 renderer.setSize(renderwidth, window.innerHeight-80);
		 }
		 // update the camera
		 const canvas = renderer.domElement
		 camera.aspect = canvas.clientWidth/canvas.clientHeight
		 camera.updateProjectionMatrix()
 }

 document.querySelector('body').addEventListener('keydown', (event)=>{
	 if (event.shiftKey){
		paintMask3D=true;
		controls.enabled=false;
	}else{
		paintMask3D=false;
		controls.enabled=true;
	}
 });
 document.querySelector('body').addEventListener('keyup', (event)=>{
	 if (event.shiftKey){
		 paintMask3D=true;
		 controls.enabled=false;
	 }else{
 		paintMask3D=false;
		controls.enabled = true;
 	}

 });
