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


var nMeKanv = document.getElementById('normalMe');
var paintMask = document.getElementById('maskPainter').getContext('2d');
paintMask.save();

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
   return checked;
   /*return an array of indexes*/
}

function safetexturer(target){

}

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
 lightpower:2
};
//-------------Aiming box for the camera ----------------------

//basic material map

//-------------Material and Object Constant--------------------
const safeMap = new THREE.TextureLoader().load( "./images/favicon.png" );
const canvasPaint = new THREE.CanvasTexture(document.getElementById('maskPainter'));

const material = new THREE.MeshStandardMaterial({color: 0x500000});//
const materialPaint = new THREE.MeshStandardMaterial({map:canvasPaint});//

const glass = new THREE.MeshPhysicalMaterial({  roughness: 0.3,   transmission: 1, thickness: 0.05});
//material for stitches zip and other things
const stitchMap = new THREE.TextureLoader().load("./images/cpsource/garment_decals_d01.png");
const stitchNorMap = new THREE.TextureLoader().load("./images/cpsource/garment_decals_n01.png");
const raycaster = new THREE.Raycaster();

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


safeNormal();
var normMe = new THREE.CanvasTexture(nMeKanv);
var canvUVWrapped = document.getElementById('UVMapMe');

//const maploader = new THREE.FileLoader().setResponseType('arraybuffer');
const loader = new THREE.GLTFLoader(); //loader for Gltf and glb models
//const fbxloader = new THREE.FBXLoader(); //loader for FBX Format
const gui = new dat.GUI({autoPlace:false});
var GuiSubmesh =gui.addFolder("Submesh Toggle");
GuiSubmesh.close();//closes the submeshes folder


//document.documentElement.style.setProperty('--rendView', '700px'); //used for changing the viewport size
//Parametric Render width from CSS
const renderwidth = Number(getComputedStyle(document.documentElement).getPropertyValue('--rendView').replace(/px/,''));
let resized = false; //semaphore for resizing behaviour
window.addEventListener('resize', function() {  resized = true;  });// resize event listener

document.getElementById("UVSave").addEventListener('click', (e) =>{
  let down = document.getElementById("UVSave")
  let UWUnwrapped = canvUVWrapped.toDataURL('image/png');
  down.href = UWUnwrapped;
  down.download = "uvmap.png";
});

document.getElementById("UVGen").addEventListener('click', (e) =>{
  canvUVWrapped.dispatchEvent(new Event("dblclick"));
});

canvUVWrapped.addEventListener('dblclick',function(){
  try{
    if (scene.children.filter(elm => elm.type.toLowerCase=='group')){
      var scena = scene.children.filter(elm => elm.type=='Group')
      if (scena[0].hasOwnProperty("children")){
        var sbmeshs = scena[0].children.filter( elm => elm.type == 'SkinnedMesh'||elm.type == 'Mesh')
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
    console.log(error);
    notify3D("Errore di lettura",true);
  }

});

var MDLloadingButton = document.getElementById('btnMdlLoader');
var CustomLoadButton = document.getElementById('cstMdlLoader');
var UVSbmeshENA = document.getElementById('unChecksMesh');
//-------------Material and Object Constant--------------------

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
	 imageData.data[i + 1] = 0    // G value
	 imageData.data[i + 2] = 0  // B value
	 imageData.data[i + 3] = 255;  // A value
	 k++;
 }
 //Create another temporary canvas
  var oc = document.createElement('canvas');
  oc.width=w;
  oc.height=h;
  var octx = oc.getContext('2d');
  octx.putImageData(imageData,0,0,0,0,w,h);
  octx.scale(512/w,512/h);
  octx.setTransform(1,0,0,-1,0,0);
  ctx.drawImage(oc,0,0,512,512);

  paintMask.drawImage(oc,0,0,768,768);
  oc.remove();
}

function layersActive(index){
  let indicators = document.getElementById('layeringsystem');
  let listlayers = indicators.getElementsByTagName("li");

  for (var i=1; i < listlayers.length; i++) {
    if (Number(listlayers[i].innerText)>index){
     listlayers[i].setAttribute('disabled','disabled');
     listlayers[i].classList.remove('active');
    	 //console.log("this -> "+i+" has to be disabled");
    }else{
     listlayers[i].removeAttribute('disabled');
    }
  }
}

function str2ab(str) {
 var buf = new ArrayBuffer(str.length); // 2 bytes for each char
 var bufView = new Uint8Array(buf);
 for (var i=0, strLen=str.length; i < strLen; i++) {
	 bufView[i] = str.charCodeAt(i);
 }
 return buf;
}

function loadNormOntheFly(path){
	let Normed = document.querySelector('#withbones svg:nth-child(2) path');
  //const encoder = new TextEncoder()
	path = path.replaceAll(/\//g,'\\').replace(/\.xbm$/,".png"); //pngWay
	//path = path.replaceAll(/\//g,'\\');
  var bufferimage = thePIT.ApriStream(path,'binary');
	var ab = str2ab(bufferimage);

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
					//console.log(pngWidth,pngHeight);
					/* Size is setted up */
					nMeKanv.width  = pngWidth;
  				nMeKanv.height = pngHeight;

					var encodedData = btoa(bufferimage);
					var dataURI = "data:image/png;base64," + encodedData;
					var nMap = new Image();
					nMap.onload = function(){
						context.drawImage(nMap, 0, 0, nMeKanv.width,nMeKanv.height);
						var imageData = context.getImageData(0,0,pngWidth,pngHeight);
						for (let i = 0, l=imageData.data.length; i < l; i += 4) {
						 // Modify pixel data
						 imageData.data[i + 2] = 255;  // B value
						}
						context.putImageData(imageData,0,0,0,0,pngWidth,pngHeight);
						//normMe = new THREE.CanvasTexture(nMeKanv,THREE.UVMapping,THREE.RepeatWrapping)
						//material.normalMap = normMe;
            material.normalMap.needsUpdate = true
						//material.map.needsUpdate = true;
						material.normalMap.flipY = false;
						Normed.setAttribute("fill",'rgb(120,119,255)'); //display the normal flag
					}
					nMap.src = dataURI;

				}else{
					//console.log('no sizes found');
					notify3D('no sizes found');
					safeNormal();
					Normed.setAttribute("fill",'currentColor');
					//var texture = new THREE.CanvasTexture(nMeKanv)
					//material.normalMap = texture;
          material.normalMap.needsUpdate = true
				}

			}else{
				Normed.setAttribute("fill",'rgb(255,0,0)');
				notify3D('another format');
			}
	}else{
		Normed.setAttribute("fill",'rgb(255,128,0)');
	}
	/*
  if ((typeof(bufferimage)!="object") && (bufferimage!="") ){
			/*
		//ddsWay
		var data = str2ab(bufferimage);
  	 let offsetHeight = 3;
  	 let offsetwidth = 4;
  	 const headerData = new Uint32Array( data, 0, 124 );
  	 let height = headerData[3];
  	 let width = headerData[4];
  	 let size = height * width;
		 const dx10Data = new Uint32Array( data, 128, 4 );

		 var luminancedata
		 //wolvenkit 8.4.3+ and cli 1.5.0+ format
		 if ((dx10Data[0]==0x3D) && (dx10Data[1]==3)&& (dx10Data[2]==0)&& (dx10Data[3]==1)){
			 //DXGI_FORMAT_R8_UNORM
			 luminancedata = new Uint8Array( data, 148, size );
		 }else if ((dx10Data[0]==0x61) && (dx10Data[1]==0x3)&& (dx10Data[2]==0x0)&& (dx10Data[3]==0x1)){
			 //BC7-UNORM normals
			 console.log('Trovata bc7-typeless');
			 luminancedata = safeNorm;
		 }else if ((dx10Data[0]==0x62) && (dx10Data[1]==0x3)&& (dx10Data[2]==0x0)&& (dx10Data[3]==0x1)){
			 //BC7-UNORM normals
			 console.log('Trovata bc7-unorm RGB');
			 var test = new Uint16Array( data, 148 )
			 console.log(test);
			 luminancedata = safeNorm;
		 }else if ((dx10Data[0]==0x63) && (dx10Data[1]==0x3)&& (dx10Data[2]==0x0)&& (dx10Data[3]==0x1)){
		 	//BC7-UNORM normals
		 	console.log('Trovata bc7-unorm SRGB');
		 	luminancedata = safeNorm;
		 }else{
			 //or legacy
			 luminancedata = new Uint8Array( data, 128, size );
		 }

  	 var dataTex = new THREE.DataTexture(luminancedata, height, width, THREE.RGBAFormat, THREE.UnsignedByteType);
  	 dataTex.flipY=true;
  	 material.normalMap = dataTex;
  	 material.needUpdates =true;

  }else{
    let notific = document.querySelector("#notyCounter span");
    let mipreference = document.getElementById("prefxunbundle");
    err_counter = err_counter+1;
    notific.textContent = err_counter;
		safeNormal();
    //material.normalMap = safeNorm;
    notify3D('An error happened during the load of the file: '+mipreference.value+path);
  }
	*/
}

function loadMapOntheFly(path){
  //const encoder = new TextEncoder()
  path = path.replaceAll(/\//g,'\\');

  var bufferimage
  bufferimage = thePIT.ApriStream(path,'binary');
  //bufferimage = JSON.parse(bufferimage);

  if ((typeof(bufferimage)!="object") && (bufferimage!="") ){
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
  	 var dataTex = new THREE.DataTexture(luminancedata, height, width, THREE.LuminanceFormat, THREE.UnsignedByteType,THREE.UVMapping,THREE.RepeatWrapping);
  	 dataTex.flipY=true;
  	 material.color.set(0x500000);
  	 material.map = dataTex;
  	 giveToTheAim(luminancedata,width,height);
  	 //console.log(height+","+width);
  	 //material.needsUpdates =true;
  }else{
    let notific = document.querySelector("#notyCounter span");
    let mipreference = document.getElementById("prefxunbundle");

    err_counter = err_counter+1;
    notific.textContent = err_counter;
    material.color.set(0x000055);
    material.map = safeMap;
    notify3D('An error happened during the load of the file: '+mipreference.value+path);
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

function mBuildInfo(model){
  var oMdlPills = document.getElementById("v-pills-sMesh");
  oMdlPills.innerHTML="";
  var oMdlTabs = document.getElementById("v-pills-tabContent");
  oMdlTabs.innerHTML="";

  if ((model.length>0) && (typeof(model)=='object')){
    model.forEach((submesh)=>{
      if (submesh.hasOwnProperty("name")){
        //There is a Submesh
        oMdlPills.innerHTML+='<button class="nav-link rounded-0 " id="pill-'+submesh.name+'" data-bs-toggle="pill" data-bs-target="#tab-'+submesh.name+'" type="button" role="tab" aria-controls="#tab-'+submesh.name+'" aria-selected="false">'+submesh.name+'</button>';
        //Tab Creation
        oMdlTabs.innerHTML+='<div class="tab-pane fade show" id="tab-'+submesh.name+'" role="tabpanel" aria-labelledby="pill-'+submesh.name+'"></div>';

        let tab = document.getElementById("tab-"+submesh.name); //point the newly created tab

        if (submesh.hasOwnProperty("vertexes")){ tab.innerHTML +='<div class="mb-1"><span class="badge bg-info text-dark rounded-0">Vertex count</span> '+submesh.vertexes+'</div>'; } //vertexes
        if (submesh.hasOwnProperty("materials")){ tab.innerHTML +='<span class="badge bg-info text-dark rounded-0">Material list: </span> '+submesh.materials; //material list
        }
      }
    })
    var enMdlPills = document.querySelector("#pill-"+model[0].name);
    enMdlPills.click();
  }
}

function glbload(arBuffer){
	/*// TODO: remove
  let oMdlInfo = document.getElementById("modalInfo");
  oMdlInfo.querySelector(".modal-body").innerHTML="";*/
  var mobjInfo = [];

  /*// TODO: remove let strGLBInfo = "";*/
  let Boned = false;
  let MasksOn = document.querySelector('#withbones svg:nth-child(1)');
	var Decal

	loader.parse( arBuffer ,'', ( glbscene ) => {
    gui.removeFolder("Submesh Toggle");
    GuiSubmesh = gui.addFolder("Submesh Toggle");
     glbscene.scene.traverse( function ( child ) {
      if ((child.type=="SkinnedMesh") && (!Boned)){Boned=true;}

      if ( child.isMesh ) {
				Decal = false;
        //strGLBInfo = strGLBInfo + "<p><span class='badge bg-md-dark w-100 rounded-0'>"+child.name+"</span> <br><p><span class='badge bg-warning text-dark p-1'>Material names:</span> "+child.userData.materialNames.toString().replaceAll(",",", ")+"</p>";//" <span class='badge bg-warning text-dark p-1'>AppNames:</span> "+child.userData.materialNames.toString().replaceAll(",",", ")+"</p>";
				child.frustumCulled = false;
				if (child.hasOwnProperty('userData')){
					if (child.userData.hasOwnProperty('materialNames')){
						//strGLBInfo = strGLBInfo + "<p class='eq-lay3 rounded'><span class='badge layer-1 w-100 rounded-0'>"+child.name+"</span><details class='eq-lay3 text-white'><summary class='bg-info p-1 text-dark'>Material names</summary><div><div class='p-1 text-center'>"+[...new Set(child.userData.materialNames)].toString().replaceAll(",","</div><div class=' text-center p-1'>")+"</div></details></p>";
		        if (!(/(decal(s)?)|(vehicle_lights)|(\bnone\b)|(logo_spacestation.+)|((.+)?glass(.+)?)|(multilayer_lizzard)|(phongE1SG1.+)|(stickers.+)|(stiti.+)|(stit?ch.+)|(black_lighter)|(eyescreen)|(dec_.+)|(.decal.+)|(02_ca_limestone_1.*)|(zip+er.+)|(ziper.+)/g.test(child.userData.materialNames.toString()))){
		            child.material = material;
		        }else{
		          //if is a decoration, a zipper a stiches apply a semitransparent material with autogenerated color
		          if (/^(masksset)/g.test(child.userData.materialNames.toString())){
		            child.material = material;
		          }else{
		            child.material = new THREE.MeshBasicMaterial({color:new THREE.Color("rgb("+Number.parseInt(20*Math.random())+", "+Number.parseInt(50*Math.random()+100)+", 255)"), opacity:0.3,transparent:true});
								Decal = true;
		          }
		        }
					}else{
						child.material = material
					}
				}else{
					child.material = material;
				}
        child.visible = true;

				if (Decal){
					GuiSubmesh.add(child, 'visible').name('<i class="fas fa-tag text-warning"></i> '+child.name);
				}else{
					GuiSubmesh.add(child, 'visible').name( child.name );
				}
      }
    });
    mBuildInfo(mobjInfo);
    if (Boned){MasksOn.classList.add('on');}else{MasksOn.classList.remove('on');}

    if (params.onesided){material.side=null; }else{material.side=THREE.DoubleSide;}
    scene.add(glbscene.scene);

    var helper = new THREE.BoxHelper(glbscene.scene,0xffff00);
    helper.geometry.computeBoundingBox();
  	var centerPoint = new THREE.Vector3();
  	centerPoint.x = (helper.geometry.boundingBox.max.x + helper.geometry.boundingBox.min.x) / 2;
  	centerPoint.y = (helper.geometry.boundingBox.max.y + helper.geometry.boundingBox.min.y) / 2;
  	centerPoint.z = (helper.geometry.boundingBox.max.z + helper.geometry.boundingBox.min.z) / 2;
  	camera.target = centerPoint;
  	controls.target = centerPoint;

  }, (error) => {
    notify3D(error);

  });
}

function LoadModelOntheFly(path){
	const repOut = new RegExp('');
  path = path.replaceAll(/\//g,'\\'); //setup the right path to be requested

  /*let oMdlInfo = document.getElementById("modalInfo");
  oMdlInfo.querySelector(".modal-body").innerHTML="";*/

  var mobjInfo = [];

  //let strGLBInfo = "";

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

      UVSbmeshENA.innerHTML=""; //remove all the buttons in the uv calculator
      clearCanvas(canvUVWrapped,'',768)

	    GuiSubmesh = gui.addFolder("Submesh Toggle");
	     glbscene.scene.traverse( function ( child ) {
				 Decal = false;
	      if ((child.type=="SkinnedMesh") && (!Boned)){Boned=true;}

	      if ( child.isMesh ) {
	        //strGLBInfo = strGLBInfo + "<p><span class='badge bg-md-dark w-100 rounded-0'>"+child.name+"</span> <br><p><span class='badge bg-warning text-dark p-1'>Material names:</span> "+child.userData.materialNames.toString().replaceAll(",",", ")+"</p>";//" <span class='badge bg-warning text-dark p-1'>AppNames:</span> "+child.userData.materialNames.toString().replaceAll(",",", ")+"</p>";
          mobjInfo.push({"name":child.name,"materials":[...new Set(child.userData.materialNames)].toString().replaceAll(",",", "),"vertexes":child.geometry.attributes.uv.count});
					//strGLBInfo = strGLBInfo + "<p class='eq-lay3 rounded'><span class='badge layer-1 w-100 rounded-0'>"+child.name+"</span><details class='eq-lay3 text-white'><summary class='bg-info p-1 text-dark'>Material names</summary><div><span class='px-2'>"+[...new Set(child.userData.materialNames)].toString().replaceAll(",","</span> <span class='px-2'>")+"</span></details></p>";
	        //strGLBInfo = strGLBInfo + "<p class='eq-lay3 rounded'><span class='badge layer-1 w-100 rounded-0'>"+child.name+"</span><details class='eq-lay3 text-white'><summary class='bg-info p-1 text-dark'>Material names</summary><div><div class='p-1 text-center'>"+[...new Set(child.userData.materialNames)].toString().replaceAll(",","</div><div class=' text-center p-1'>")+"</div></details></p>";
					child.frustumCulled = false;
					if ((child.userData?.materialNames!=null) && (child.userData?.materialNames!=undefined)){
							if (!(/(vehicle_lights)|(visor)|(rivets)|(\bnone\b)|(logo_spacestation.+)|((.+)?glass(.+)?)|(multilayer_lizzard)|(phongE1SG1.+)|((.+)?stickers(.+)?)|(stiti.+)|(stit?ch.+)|(black_lighter)|(eyescreen)|(dec_.+)|((.+)?screen(.+)?)|((.+)?decal(.+)?)|(.+_dec\d+)|(02_ca_limestone_1.*)|(zi(p)+er.+)/g.test(child.userData.materialNames.toString()))){
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
			        }else{
			          //if is a decoration, a zipper a stiches apply a semitransparent material with autogenerated color
			          if (/.+(masksset).+/g.test(child.userData.materialNames.toString())){
			            child.material = material;
								}else if (/(.+)?glass(.+)?/g.test(child.userData.materialNames.toString())) {
									child.material = glass;
									Decal = true;
			          }else{
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
					}else{
						GuiSubmesh.add(child, 'visible').name( child.name );
					}

          UVSbmeshENA.innerHTML+='<input type="checkbox" class="btn-check" id="uvchk_'+child.name+'" checked  ><label class="btn btn-sm btn-outline-secondary mb-2" for="uvchk_'+child.name+'" autocomplete="off">'+child.name+'</label>';

	      }
	    });
      mBuildInfo(mobjInfo);
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
		notify3D("The 3dmodel wasn't there when i try to load it : "+path);
	}
}


document.getElementById("takeashot").addEventListener('click', (e) =>{
	getImageData = true;
  animate();
  //console.debug(imgDataShot);
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

//custom 3d assets file loading
document.getElementById('cstMdlLoader').addEventListener('click',(e)=>{
	cleanScene()
	let maxLayers = 0;
	layersActive(maxLayers);
  safeNormal()
	material.map = safeMap;
	//var texture = new THREE.CanvasTexture(nMeKanv,THREE.UVMapping,THREE.RepeatWrapping)
  material.normalMap.needsUpdate = true // = texture;
  material.map.needsUpdate = true;
	CustomLoadButton.setAttribute('disabled','disabled');
	thePIT.ThreeDAsset();
	let Normed = document.querySelector('#withbones svg:nth-child(2) path');
	Normed.setAttribute("fill",'currentColor');
});

document.getElementById('lastCustomMDL').addEventListener('change',(e)=>{
	let file = document.getElementById('lastCustomMDL');
	var modello = thePIT.EDStream(file.value,'binary');
	//re-enable the button
	CustomLoadButton.disabled=false;

	if (file.value.split('.').reverse()[0]=='fbx'){
		//now i can't do anything
		/*
		var test = fbxloader.parse(str2ab(modello), '')
		console.log(test);
*/
	}else{
		t3Ddata = str2ab(modello);
		cleanScene();
		glbload(t3Ddata);

		let modelname = file.value.split('\\').reverse()[0].split('.')[0] //split the path by slashes, reverse to get the last part, split the extension to get only the name [0] of the split
		let cstmModels = $('#modelsTree').jstree(true).get_json('custom')

		if (cstmModels.children.length<=0){
			$('#modelsTree').jstree(true).create_node("custom",{"text":modelname,"type":"custmesh","li_attr":{"model":file.value,layers:0}},"first")
		}else{
			let figli = cstmModels.children
			if (figli.filter(el => el.li_attr.model == file.value).length <= 0){
					$('#modelsTree').jstree(true).create_node("custom",{"text":modelname,"type":"custmesh","li_attr":{"model":file.value,layers:0}},"first")
			}
		}

		layersActive(0);
		material.map.needsUpdate =true;
		control_reset = true;
		//TODO file.value é il nome del file da aggiungere
		//Se non ce n'è un'altro con lo stesso path
	}
});

document.getElementById('btnMdlLoader').addEventListener('click',(e)=>{

 var nthLayer = document.querySelector("#layeringsystem").children;
 var activeLayer = document.querySelector("#layeringsystem li.active");

 MDLloadingButton.setAttribute('disabled','disabled');

 let theModel = document.getElementById("modelTarget").value; //path of the model to load
 let theMaskLayer = document.getElementById("masksTemplate").value; //template path for the textures
 let theNormal = document.getElementById("normTemplate").value; //normal file to apply to the whole model
 let layer = document.getElementById("maskLayer").value; //actual layer selected in the editors
 let maxLayer_thisModel = document.getElementById("maxLayers").value; //actual numer of layer that the models support

 layer = Number(layer);
 maxLayer_thisModel = Number(maxLayer_thisModel);

 if (((layer<0) | (layer>20)) | (activeLayer===null) | (layer>maxLayer_thisModel)){ layer = 0 }

 theMaskLayer = String(theMaskLayer).replace(/X/g,layer);

 if (theMaskLayer.match(/^[/|\w|\.]+.dds/)){
	 //load textures
	 loadMapOntheFly(theMaskLayer);
	 //material.needUpdates =true; //setup the mask I'll set the material to update
 }else{
	 material.map = safeMap;
	 notify3D('the texture '+theMaskLayer+' does not exists');
 }

 let Normed = document.querySelector('#withbones svg:nth-child(2) path');

if (theNormal.match(/^[/|\w|\.]+.xbm/)){
	//safeNormal();
 loadNormOntheFly(theNormal);
}else{
 safeNormal();
 Normed.setAttribute("fill",'currentColor');
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
	//---calculating the shadows
  camera = new THREE.PerspectiveCamera(15,renderwidth/(window.innerHeight-80),0.01,200);
  camera.position.set(0.0,-0.4,-8);
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
  material.map = safeMap;
	material.normalMap = normMe;

	//fog
	//TODO adding fog to the scene
	scene.fog = new THREE.Fog( 0x9b9d3f, 10,35);

  //Setup the DAT position
  const GuiBasicsetup = gui.addFolder("Basic Setup");
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
  GuiBasicsetup.close();

  gui.close(); //close the whole dat.gui

  var datpotision = document.getElementById('dat-container');
  datpotision.appendChild(gui.domElement);
  animate();
}


function animate() {
  if (resized) resize()
  controls.autoRotate = params.autorotation;
  controls.autoRotateSpeed = params.rotationspeed;
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
