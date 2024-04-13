import * as THREE from 'three';
import { OrbitControls } from 'orbit';
import { Fog } from 'fog';
import { Color } from 'color';
import { MathUtils } from 'mathutils';
import { GLTFLoader } from 'gltf';

/*Performances */
/* import Stats from '../public/three/examples/jsm/libs/stats.module.js';
import { GPUStatsPanel } from 'stats'; */

var firstModelLoaded = false;
var flippingdipping = thePIT.RConfig('flipmasks');
var flipdipNorm = thePIT.RConfig('flipnorm');
var actualExtension = 'dds';


var imgWorker
if (window.Worker) {
    imgWorker = new Worker('js/workers/imgWork.js');
  
    imgWorker.onmessage = (event) =>{
	  paintDatas(event.data[0],event.data[1],event.data[2],'normalMe',THREE.RGBAFormat);

	  let selected = activeMLayer();	
	  materialStack[selected].normalMap = new THREE.DataTexture(event.data[0],event.data[1],event.data[2]);
      materialStack[selected].normalMap.needsUpdate = true
    }
}

const normalMapInfo = {
  width : 768,
  height : 768
}

var materialStack = new Array();
var materialSet = new Set();
var textureStack = new Array();

const materialTypeCheck = {
	decals: [
		"base\\materials\\mesh_decal.mt",
		"base\\materials\\mesh_decal_emissive.mt",
		"base\\materials\\vehicle_mesh_decal.mt",
		"base\\materials\\mesh_decal_double_diffuse.mt",
		"base\\materials\\mesh_decal_parallax.mt",
		"base\\materials\\mesh_decal_gradientmap_recolor.mt"
		],
	fx:[
		"base\\fx\\_shaders\\mesh_decal__blackbody.mt",
		"base\\fx\\shaders\\parallaxscreen.mt",
		"base\\materials\\vehicle_lights.mt",
		"base\\fx\\shaders\\device_diode.mt",
		"base\\fx\\_shaders\\holo_mask.mt",
		"base\\fx\\shaders\\hologram.mt",
		"base\\fx\\shaders\\emissive_basic_transparent.mt"
	],
	glass: [
		"base\\materials\\glass.mt",
		"base\\materials\\glass_onesided.mt",
		"base\\materials\\vehicle_glass"
		],
	hair: [
		"base\\materials\\hair.mt",
		"base\\characters\\common\\hair\\textures\\hair_profiles\\_master__long.mi"
		],
	metal_base : [
		"engine\\materials\\metal_base.remt"
		],
	multilayer : [
		"engine\\materials\\multilayered.mt",
		"base\\materials\\vehicle_destr_blendshape.mt"
		],
	skin: [
		"base\\materials\\skin.mt",

	]
}

var paintMask3D = false;
var control_reset = false;
var control_side = false;
var getImageData = false;
var imgDataShot = null;
var delta = null;

var TDengine = {
    scene: null,
    renderer: null,
    MainCanvas: null,
    camera: null,
    control:null,
    lights:{
        ambient:null,
        point:[]
    },
	stats:null,
	gpupanel:null,
	UVMapcanvas: document.getElementById('UVMapMe'),
	time: new THREE.Clock()
}

const MDLloader = new GLTFLoader(); //Loading .glb files

var materialGlass = new THREE.MeshPhysicalMaterial({  roughness: 0.2,   transmission: 1, thickness: 0.005});

var stdMaterial = new THREE.MeshStandardMaterial({color:0x808080, side:THREE.DoubleSide}); //this will substitute the problematic single multilayer material

var mlMaterial = new THREE.MeshStandardMaterial({color:0x808080, side:THREE.DoubleSide}); //TODO remove this old shit

var materialHair = new THREE.MeshStandardMaterial({color:0xBB000B,opacity:.9,side:THREE.DoubleSide,depthTest:true});
var materialBASE = new THREE.MeshBasicMaterial({color:0x0000FF,transparent:true, side:THREE.DoubleSide,depthWrite :false});

var lambertType = new THREE.MeshLambertMaterial();
var materialNoneToCode = new THREE.MeshLambertMaterial({color:0x808080,emissive:0xFFFF00,emissiveIntensity:.2});

var materialNone = new THREE.MeshLambertMaterial({color:0xFFFFFF});

function string2arraybuffer(str) {
	var buf = new ArrayBuffer(str.length); // 2 bytes for each char
	var bufView = new Uint8Array(buf);
	for (var i=0, strLen=str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}

function activeMLayer(){
	let selectedOne = document.querySelector("#Mlswitcher input:checked")
	let multilayerActive = $("#Mlswitcher input").index(selectedOne);
	var multilayerSelect = $("#Mlswitcher input").eq(multilayerActive).attr("data-material")
	return multilayerSelect;
}

function checkMaps(mapName="engine\\textures\\editor\\black.xbm"){
	if (mapName=="engine\\textures\\editor\\black.xbm"){
		return 0.0;
	}
	if (mapName=="engine\\textures\\editor\\grey.xbm"){
		return 0.5;
	}
	if ((mapName=="engine\\textures\\editor\\white.xbm") || 
		(mapName=="engine\\textures\\editor\\small_white.xbm")) {
		return 1.0;
	}
	return -1.0;
}

function retDefTexture(mapName="engine\\textures\\editor\\grey.xbm"){
	switch (mapName){
		case "engine\\textures\\editor\\black.xbm":
			return BLACK;
			break;
		case "engine\\textures\\small_white.xbm":
		case "engine\\textures\\editor\\white.xbm":
			return WHITE;
			break;
		case "engine\\textures\\editor\\normal.xbm":
			return FlatNORM;
			break;
		default:
			if (mapName!="engine\\textures\\editor\\grey.xbm"){
				console.log(`Not matched filename ${mapName}`);
			}
			return GRAY;
	}
}

function paintDatas(textureData,w,h,target,format){
	var opCanvas = {
		dom : document.getElementById(target),
		context : null,
		width: 0,
		height:0
	}
	opCanvas.width = opCanvas.dom.getAttribute("width");
	opCanvas.height = opCanvas.dom.getAttribute("height");
	opCanvas.context = opCanvas.dom.getContext('2d');
	opCanvas.context.setTransform(1, 0, 0, 1, 0, 0);

	var oc = document.createElement('canvas');
	oc.width=w;
	oc.height=h;
	var octx = oc.getContext('2d');
	var imageData = octx.createImageData(w,h);
	var k=0;
	if (format == THREE.LuminanceFormat){
		for (let i = 0; i < imageData.data.length; i += 4) {
			// Modify pixel data
			imageData.data[i] = textureData[k];  // R value
			imageData.data[i + 1] =  textureData[k]    // G value
			imageData.data[i + 2] =  textureData[k]  // B value
			imageData.data[i + 3] = 255;  // A value
			k++;
		}
	}else if (format == THREE.RGBAFormat){ 
		for (let i = 0; i < imageData.data.length; i++) {
			// Modify pixel data
			imageData.data[i] = textureData[i];  // R value
		}
	}

	octx.putImageData(imageData,0,0,0,0,w,h);
	opCanvas.context.scale(opCanvas.width/w,opCanvas.height/h)
	opCanvas.context.drawImage(oc,0,0,w,h);

	oc.remove();
}

function genTexture(color,size=16){
	if (parseInt(size)>0){
		var dataColor = new Uint8Array(4 * size);
		//var color = new THREE.Color( color );
		
		if (color.hasOwnProperty('r') && color.hasOwnProperty('g') && color.hasOwnProperty('b')){
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

function resize() {
    resized = false
    // update the size
    if (window.innerHeight-80<512){
        TDengine.renderer.setSize(renderwidth, 512);
    }else{
        TDengine.renderer.setSize(renderwidth, window.innerHeight-80);
    }
    // update the camera
    var canvas = TDengine.renderer.domElement
    TDengine.camera.aspect = canvas.clientWidth/canvas.clientHeight
    TDengine.camera.updateProjectionMatrix();
}

function cleanScene(){
	return new Promise((resolve,reject)=>{
		var groupdisposeID = [];
		var groupObj = null;

		materialSet.clear();

		materialStack.forEach((material) => { material.dispose() });
		materialStack=[];

		textureStack.forEach((element) => {element.dispose()});
		textureStack=[];

		paintDatas(FlatNORM.source.data.data,4,4,'normalMe',THREE.RGBAFormat);

		TDengine.scene.traverse(oggetti=>{
			if (oggetti.isMesh){
				if (oggetti.material!==undefined){
					oggetti.material.dispose(); //Remove materials
				}
				oggetti.geometry.dispose(); //Remove geometry
			}
			if (oggetti.isGroup){
				groupdisposeID.push(oggetti.uuid);
			}
		})

		if (groupdisposeID.length > 0){
			groupdisposeID.forEach((gruppo,i)=>{
				groupObj = TDengine.scene.getObjectByProperty( 'uuid', gruppo )
				TDengine.scene.remove(groupObj);
			});
		}
		
		resolve();
	})
}


const renderwidth = Number(getComputedStyle(document.documentElement).getPropertyValue('--rendView').replace(/px/,''));
let resized = false; //semaphore for resizing behaviour
window.addEventListener('resize', function() {  resized = true;  });// resize event listener


const BLACK = new THREE.DataTexture(genTexture(new THREE.Color( 0, 0 ,0 ) ),4,4);
const GRAY = new THREE.DataTexture(genTexture(new THREE.Color( 0.5, 0.5 ,0,5 ) ),4,4);
const WHITE = new THREE.DataTexture(genTexture(new THREE.Color( 1, 1 ,1 ) ),4,4);
const FlatNORM = new THREE.DataTexture(genTexture(new THREE.Color( 0.47, 0.47 ,1 )),4,4);
const ERROR = new THREE.DataTexture(genTexture(new THREE.Color( 1, 0 ,0 )),4,4);

//screenshotSaver
$("#takeashot").click(function(ev){
	getImageData = true;
	animate();
});


$("#thacanvas").on('loadScene',function(event){
	/*
    Need a Promise and the use of then

	Load Materials
		if there is no Material file try to export it
	Load First Layer mask
		if not found replace with a def. one and disable all layers except 0
	Load the Models and Apply Materials
	*/
	//cleanScene();
	
	//console.log(TDengine.scene);
	cleanScene().
	then((ev)=>{
		MLSBConfig.then((config)=>{
			actualExtension=config.maskformat;
		}).then((ev)=>{
			LoadMaterials($("#materialTarget").val())
			.then((ev)=>{
				firstModelLoaded=true;
				$("#layeringsystem li").removeClass("active");
				$("#layeringsystem li").eq(MLSB.Editor.layerSelected).addClass("active");

				LoadModel($("#modelTarget").val())
			}).catch((error)=>{
				notifyMe(error);
			})
		}).catch((error)=>{
			notifyMe(error);
		});
	});
}).on('toggleMesh',function(ev,name,toggle){
	TDengine.scene.traverse(oggetti=>{
		if (oggetti.name==name.trim()){
			oggetti.visible=toggle;
		}
	})
}).on('switchLayer',function(ev,layer=0){
	if (firstModelLoaded){
		//Used to switch the mask layer used on the multilayer material
		let selected = activeMLayer();
		
		var LAYER = getTexture(materialStack[selected].mask);

 		materialStack[selected].setValues({
			alphaMap:LAYER,
			map:LAYER,
			opacity: parseFloat($("#layerOpacity").val())
		})
		materialStack[selected].map.needsUpdate = true;
	}
}).on('fogNew',function(ev){
	try{
		TDengine.scene.fog = new THREE.Fog( PARAMS.fogcolor, PARAMS.fognear,PARAMS.fogfar);
	}catch(error){
		notifyMe(error);
	}
}).on('newlights',function(event,index){
	switch (index) {
		case 0:
			TDengine.lights.ambient.color = new THREE.Color(PARAMS.A_light_color);
			TDengine.lights.ambient.intensity = PARAMS.A_light_pow;
			break;
		case 1:
			TDengine.lights.point[0].color = new THREE.Color(PARAMS.p_light1_col);
			TDengine.lights.point[0].intensity = PARAMS.p_light1_pow;
			break;
		case 2:
			TDengine.lights.point[1].color = new THREE.Color(PARAMS.p_light2_col);
			TDengine.lights.point[1].intensity = PARAMS.p_light2_pow;
            break;
		case 3:
			TDengine.lights.point[2].color = new THREE.Color(PARAMS.p_light3_col);
			TDengine.lights.point[2].intensity = PARAMS.p_light3_pow;
            break;
		case 4:
			TDengine.lights.point[3].color = new THREE.Color(PARAMS.p_light4_col);
			TDengine.lights.point[3].intensity = PARAMS.p_light4_pow;
            break;
	}
}).on('lightpos',function(event,index){
	switch (index) {
		case 1:
			TDengine.lights.point[0].position.set(PARAMS.l1_pos.x,PARAMS.l1_pos.y,PARAMS.l1_pos.z);
			break;
		case 2:
			TDengine.lights.point[1].position.set(PARAMS.l2_pos.x,PARAMS.l2_pos.y,PARAMS.l2_pos.z);
			break;
		case 3:
			TDengine.lights.point[2].position.set(PARAMS.l3_pos.x,PARAMS.l3_pos.y,PARAMS.l3_pos.z);
			break;
		case 4:
			TDengine.lights.point[3].position.set(PARAMS.l4_pos.x,PARAMS.l4_pos.y,PARAMS.l4_pos.z);
			break;
		default:
			break;
	}
}).on('sided',function(event){
    //single or doublesided
	if (PARAMS.oneside){
        mlMaterial.side=THREE.FrontSide;
    }else{
        mlMaterial.side=THREE.DoubleSide;
    }

}).on('maskAlpha',function(event){
    //masking the alpha
	mlMaterial.alphaTest = PARAMS.maskChannel;
}).on("theWire",function(event){
    //changinf the wireframe value
	mlMaterial.wireframe = PARAMS.wireframes;
}).on('changeColor',function(ev, color){
	//change the color ONLY if a layer is selected
	mlMaterial.color = new THREE.Color(color);
	mlMaterial.needsUpdate;
}).on('flipMask',function(event){
	let selected = activeMLayer();
	materialStack[selected].map.flipY= !materialStack[selected].map.flipY;
	materialStack[selected].map.needsUpdate = true;
}).on('flipNorm',function(event){
	let selected = activeMLayer();
	materialStack[selected].normalMap.flipY = !materialStack[selected].normalMap.flipY;
	materialStack[selected].normalMap.needsUpdate = true;
}).on('mousedown',function(event){
    //stop painting on the interface
	event.preventDefault();
	if (event.shiftKey && (event.button==0)){
		/* paintMaskCTX.beginPath(); */
	}
}).on('mouseup',function(event){
    //start painting on the interface
	event.preventDefault();
	if (event.shiftKey &&  (event.button==0)){
		/* paintMaskCTX.closePath(); */
	}
})

//INIT
init();

function init() {
	TDengine.scene = new THREE.Scene();
    TDengine.MainCanvas = document.getElementById('thacanvas');
	//TDengine.MainCanvas.setAttribute('data-engine',THREE.REVISION);
    notifyMe(`Three.js engine r.${THREE.REVISION}`,false);

    TDengine.renderer = new THREE.WebGLRenderer({
        canvas:TDengine.MainCanvas,
        alpha:true, 
        antialias:true,
        logarithmicDepthBuffer: true,
        gammaFactor : 2.2,
        outputEncoding : THREE.sRGBEncoding,
        toneMapping : THREE.ACESFilmicToneMapping,
        toneMappingExposure : 1.25
    });

	if (window.innerHeight-80<512){
		TDengine.renderer.setSize(renderwidth,renderwidth);
	}else{
		TDengine.renderer.setSize(renderwidth, window.innerHeight-80);
	}
	TDengine.renderer.setPixelRatio( window.devicePixelRatio );
    //TDengine.renderer.setClearColor(0x000000, 1.0);

    TDengine.camera = new THREE.PerspectiveCamera(15,renderwidth/(window.innerHeight-80),0.01,200);
    TDengine.camera.position.set(0.0,-0.4,-8);
	TDengine.camera.updateProjectionMatrix();

    TDengine.control = new OrbitControls(TDengine.camera, TDengine.renderer.domElement);
    TDengine.control.autoRotate = PARAMS.rotation;
    TDengine.control.autoRotateSpeed = PARAMS.speed;
    TDengine.control.enableDamping = true;
    TDengine.control.enablePan = true;
    TDengine.control.target.set(0.01,0.7,0.07);
    
    //lights declaration
    TDengine.lights.ambient = new THREE.AmbientLight( PARAMS.A_light_color,PARAMS.A_light_pow ); // soft white light ambientlight.intensity=1;
    TDengine.lights.point[0] = new THREE.PointLight(PARAMS.p_light1_col,PARAMS.p_light1_pow); //6C5624
    TDengine.lights.point[1] = new THREE.PointLight(PARAMS.p_light2_col,PARAMS.p_light2_pow);
    TDengine.lights.point[2] = new THREE.PointLight(PARAMS.p_light3_col,PARAMS.p_light3_pow);
    TDengine.lights.point[3] = new THREE.PointLight(PARAMS.p_light4_col,PARAMS.p_light4_pow);
    //positioning
    TDengine.lights.point[0].position.set(PARAMS.l1_pos.x,PARAMS.l1_pos.y,PARAMS.l1_pos.z);
    TDengine.lights.point[1].position.set(PARAMS.l2_pos.x,PARAMS.l2_pos.y,PARAMS.l2_pos.z);
    TDengine.lights.point[2].position.set(PARAMS.l3_pos.x,PARAMS.l3_pos.y,PARAMS.l3_pos.z);
    TDengine.lights.point[3].position.set(PARAMS.l4_pos.x,PARAMS.l4_pos.y,PARAMS.l4_pos.z);
    //instanciate
    TDengine.lights.point.forEach((light)=>{
        TDengine.scene.add(light);
    });

	/* const geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
	const materialz = new THREE.MeshStandardMaterial({color:0x808080});
	
	const mesh = new THREE.Mesh( geometry, materialz );
	TDengine.scene.add( mesh ); */

	/* const gridHelper = new THREE.GridHelper( 5, 8, 0xFFFF00, 0x808080 );
	gridHelper.position.y = 0;
	gridHelper.position.x = 0;
	TDengine.scene.add( gridHelper ) */

    TDengine.scene.add( TDengine.lights.ambient );
    TDengine.scene.fog = new THREE.Fog( PARAMS.fogcolor, PARAMS.fognear,PARAMS.fogfar);


	/* TDengine.stats = new Stats();
	document.body.appendChild( TDengine.stats.dom );
	TDengine.gpuPanel = new GPUStatsPanel( TDengine.renderer.getContext() );
	TDengine.stats.addPanel( TDengine.gpuPanel );
	TDengine.stats.showPanel( 0 ); */
    animate();
}

function animate() {
    if (resized) resize()

    if (!paintMask3D){
		TDengine.control.autoRotate = PARAMS.rotation;
		TDengine.control.autoRotateSpeed = PARAMS.speed;
	}else{
		TDengine.control.autoRotate = false;
	}

    if (control_reset){
		control_reset = false;
		TDengine.MainCanvas.position.set(0,1,-7);
	}else{
		TDengine.control.update();
	}

	if (control_side){
		control_side=false;
	}

    TDengine.renderer.render(TDengine.scene, TDengine.camera);
	/* TDengine.stats.update(); */

    if(getImageData == true){
		let a = document.getElementById('takeashot');
		imgDataShot = TDengine.renderer.domElement.toDataURL('image/png');
		getImageData = false;
		a.href = imgDataShot;
		if ($("#modelTarget").val()==""){
			a.download = `screen_${ new Date().valueOf()}.png`;
		}else{
			a.download = `screen_${String($("#modelTarget").val()).split("\/").reverse()[0].split(".")[0]}_${ new Date().valueOf()}.png`;
		}
	}
	

	requestAnimationFrame(animate);
	
/* 	TDengine.time.getDelta();
	materialNoneToCode.emissiveIntensity = Math.abs(Math.sin(TDengine.time.elapsedTime));
	materialNoneToCode.needsUpdate */
}

//String to bufferArray
function str2ab(str) {
	var buf = new ArrayBuffer(str.length); // 2 bytes for each char
	var bufView = new Uint8Array(buf);
	for (var i=0, strLen=str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}

function getImageSize(binaryData){
	var bufferData = str2ab(binaryData);
	const headerData = new Uint8Array( bufferData, 0, 8 ); //get the two dimensions data bytes
	//DDS Case
	if ((headerData[0]==0x44) && (headerData[1]==0x44) && (headerData[2]==0x53) ){
		const spaceData = new Uint32Array( bufferData, 0, 5 ); //get the two dimensions data bytes
		let height = spaceData[3];
		let width = spaceData[4];
		//console.log(`texture ${width}x${height}px`);
		//let size = height * width * channels;
		const dx10Data = new Uint32Array( bufferData, 128, 4 ); //get the type of DDS
		var channels = 4;
		var imageDatas

		switch (dx10Data[0]){
			case 29:
			case 28:
				break;
			case 61:
				channels=1;
				break;
			default:
				console.error(`Unknown value ${dx10Data[0]}`);
				break;
		}

		return {width:height,height:width,format:'DDS',size:(height * width * channels)}

	}else if ((headerData[0]==0x89) && (headerData[1]==0x50) && (headerData[2]==0x4e) && (headerData[3]==0x47)	&& (headerData[4]==0x0d) && (headerData[5]==0x0a) && (headerData[6]==0x1a) && (headerData[7]==0x0a) ){
		//PNG case
		var chunkslenght, chunkstype
		var pngWidth = pngHeight = 0;
		var imgByteLenght = bufferData.byteLength
		var filePointer = 8; /*after the header */
		//Search for the chunks with the Size of the texture
		while ((pngWidth==0) && (pngWidth==0) && (filePointer<imgByteLenght)) {
			chunkslenght = parseInt(new DataView(bufferData,filePointer,4).getInt32(),16); //from hexa I'll take the size of the chunks
			chunkstype = new Uint8Array(bufferData,filePointer+4,4);
			filePointer+=8;
			if ( (chunkstype[0]==0x49)
				&&(chunkstype[1]==0x48)
				&&(chunkstype[2]==0x44)
				&&(chunkstype[3]==0x52) ){
				//go for the read of the length
				pngWidth=parseInt(new DataView(bufferData,filePointer,4).getUint32());
				pngHeight=parseInt(new DataView(bufferData,filePointer+4,4).getUint32());
			}
			filePointer+=chunkslenght+4; //last 4 byte are for the checksum
		}
		return {width:pngWidth,height:pngHeight,format:'PNG'}
	}else{
		console.warn(`${binaryData.slice(0,4)} format`)
		return {width:0,height:0}
	}
}

function rebuildText(textureData,width,height){
	var defSize = (width*height)*4;
	var imageData = new Uint8Array(defSize);
	var k=0;
	for (let i = 0; i < defSize; i += 4) {
		// Modify pixel data
		imageData[i] = textureData[k];  // R value
		imageData[i + 1] = textureData[k]    // G value
		imageData[i + 2] = textureData[k]  // B value
		imageData[i + 3] = 255;  // A value
		k++;
	}
	//paintMask(imageData,width,height);
	return imageData;
}


function dataToTeX(binaryData, channels=4, format = THREE.RGBAFormat,type = ''){
	var imageINFO = getImageSize(binaryData);
	var bufferData = str2ab(binaryData);
	const headerData = new Uint8Array( bufferData, 0, 8 ); //get the two dimensions data bytes

	if (imageINFO?.format=='DDS'){
		

	}else if (imageINFO?.format=='PNG'){

	}else{
		notifyMe('Format not recognized, returned WHITE');
		return WHITE;
	}

	if (
		(headerData[0]==0x44) &&
		(headerData[1]==0x44) &&
		(headerData[2]==0x53) ){
		try {
		//DDS Case
			const spaceData = new Uint32Array( bufferData, 0, 5 ); //get the two dimensions data bytes
			let height = spaceData[3];
			let width = spaceData[4];
			//console.log(`texture ${width}x${height}px`);
			let size = height * width * channels;

			const dx10Data = new Uint32Array( bufferData, 128, 4 ); //get the type of DDS

			var imageDatas
			if ((dx10Data[0]==61) && (dx10Data[1]==3)&& (dx10Data[2]==0)&& (dx10Data[3]==1)){
				//console.log(`DDS ${format}`);
				if (format == THREE.RGBAFormat){
					imageDatas = new Uint32Array( bufferData, 148, size );
				}else{
					imageDatas = new Uint8Array( bufferData, 148, size );
				}
			}else{
				//or legacy RGBA Unorm
				imageDatas = new Uint8Array( bufferData, 148, size );
			}
			
			var resultTex
			switch (type) {
				case 'M':
					//masks
					paintDatas(imageDatas,width,height,'maskPainter',format);
					break;
				case 'N':
					//normals
					if (imageDatas.isTexture){
						paintDatas(FlatNORM.source.data.data,4,4,'normalMe',format);
					}else{
						imgWorker.postMessage([imageDatas,width,height]);
					}
					return FlatNORM;
					break;
				default:
					break;
			}

			//rebuild the colors
			if (format == THREE.LuminanceFormat){
				imageDatas = rebuildText(imageDatas,width,height);
			}

			resultTex = new THREE.DataTexture(imageDatas,width,height);
			resultTex.wrapS = THREE.RepeatWrapping;
			resultTex.wrapT = THREE.RepeatWrapping;
			return resultTex;
		}catch(error){
			notifyMe(error);
			return BLACK;
		}
	}else if (
		(headerData[0]==0x89)
		&& (headerData[1]==0x50)
		&& (headerData[2]==0x4e)
		&& (headerData[3]==0x47)
		&& (headerData[4]==0x0d)
		&& (headerData[5]==0x0a)
		&& (headerData[6]==0x1a)
		&& (headerData[7]==0x0a) ){

		try {
			//PNG Case
			var chunkslenght, chunkstype
			var pngWidth = pngHeight = 0;
			var imgByteLenght = bufferData.byteLength
			var filePointer = 8; /*after the header */
			//Search for the chunks with the Size of the texture
			while ((pngWidth==0) && (pngWidth==0) && (filePointer<imgByteLenght)) {
				chunkslenght = parseInt(new DataView(bufferData,filePointer,4).getInt32(),16); //from hexa I'll take the size of the chunks
				chunkstype = new Uint8Array(bufferData,filePointer+4,4);
				filePointer+=8;
				if ( (chunkstype[0]==0x49)
					&&(chunkstype[1]==0x48)
					&&(chunkstype[2]==0x44)
					&&(chunkstype[3]==0x52) ){
					//go for the read of the length
					pngWidth=parseInt(new DataView(bufferData,filePointer,4).getUint32());
					pngHeight=parseInt(new DataView(bufferData,filePointer+4,4).getUint32());
				}
				filePointer+=chunkslenght+4; //last 4 byte are for the checksum
			}
			// Connect the image to the Texture
			var texture = new THREE.Texture();
			if (pngWidth>0){
				// Connect the image to the Texture
				var texture = new THREE.Texture();
				var encodedData = btoa(bufferData);
				var dataURI = "data:image/png;base64," + encodedData;
				var pngMap = new Image();
				pngMap.onload = function () {
					texture.image = image;
					texture.wrapS=THREE.RepeatWrapping;
					texture.wrapT=THREE.RepeatWrapping;
					texture.needsUpdate = true;
					return texture;
				};
				pngMap.src = dataURI;
			}else{
				notifyMe('Got Black one',false);
				return BLACK;
			}
		}catch(error){
			notifyMe(error,false);
			return BLACK;
		}
	}else{
		notifyMe('Got Black one',false);
		return BLACK;
	}
}

//Get Textures data
function getTexture(filename){
	var temporaryTexture = null;
	var type = "";
	//
	if (filename.match(/\.mlmask$/)){
		//multilayer mask texture to be taken
		temporaryTexture = thePIT.ApriStream((filename).replace('.mlmask',`_${MLSB.Editor.layerSelected}.${textureformat}`),'binary');

		if ((typeof(temporaryTexture)!="object") && (temporaryTexture!="") ){
			return dataToTeX(temporaryTexture,1,THREE.LuminanceFormat,'M');
		}else{
			for (var i=$("#layeringsystem li.active").index();i<=19;i++){
				$("#layeringsystem li").eq(i).attr('disabled','disabled');
				$("#masksPanel li").eq(i).attr('disabled','disabled');
			}
			$(".controLayers li").removeClass("active");
			MLSB.Editor.layerSelected = 0;
			return ERROR;
		}
	
	}else if (type=filename.match(/.+(\w)\d{2}\.(xbm)$/) ){
		//normal format checking on type of texture:
		//
		temporaryTexture = thePIT.ApriStream((filename).replace('.xbm',`.${textureformat}`),'binary');

		if ((temporaryTexture=="") || (typeof(temporaryTexture)===undefined)){
			return ERROR;
		}
		switch (type[1]){
			case "n":
				//normal map, use the workers
				return dataToTeX(temporaryTexture,4,THREE.RGBAFormat,'N');
				break;
			case "d":
				//diffuse
				return dataToTeX(temporaryTexture,4,THREE.RGBAFormat,'');
				break;
			default:
				return dataToTeX(temporaryTexture);
				break;
		}
	}else if (type=filename.match(/.+\d{2}_(\w)\.(xbm)$/) ){
		temporaryTexture = thePIT.ApriStream((filename).replace('.xbm',`.${textureformat}`),'binary');
		
		if ((temporaryTexture=="") || (typeof(temporaryTexture)===undefined)){
			return ERROR;
		}

		switch (type[2]){
			case 'r':
				//roughness
			case 'd':
				//diffuse
			default:
				return dataToTeX(temporaryTexture,4,THREE.RGBAFormat,'');
				break;
		}
/* 	}else if (type=filename.match(/.+_decal\.(xbm)$/) ){
		temporaryTexture = thePIT.ApriStream((filename).replace('.xbm',`.${textureformat}`),'binary');
		
		if ((temporaryTexture=="") || (typeof(temporaryTexture)===undefined)){
			return ERROR;
		}
		return dataToTeX(temporaryTexture,4,THREE.RGBAFormat,''); */
	}else{
		if (checkMaps(filename)>0){
			return retDefTexture(filename);
		}

		temporaryTexture = thePIT.ApriStream((filename).replace('.xbm',`.${textureformat}`),'binary');
		
		if ((temporaryTexture=="") || (typeof(temporaryTexture)===undefined)){
			return ERROR;
		}
		return dataToTeX(temporaryTexture,4,THREE.RGBAFormat,'');
		
	}
}

function codeMaterials(materialEntry){
	
	if (materialEntry.hasOwnProperty('MaterialTemplate')){
		//switching the code based on the type of the material
		if (materialTypeCheck.decals.includes(materialEntry.MaterialTemplate)){
			
			var Rdecal = lambertType.clone();
			var decalConfig = {color:0xFFFFFF,transparent:true, side:THREE.DoubleSide,depthWrite :false}

			//Decal Textures
			if (materialEntry.Data.hasOwnProperty('DiffuseTexture')){
				//MD5 the name of the file to load or import it
				let textureMD5Code = CryptoJS.MD5(materialEntry.Data.DiffuseTexture)
				if (textureStack[textureMD5Code]===undefined){
					//the texture has to be loaded in the texture stack
					textureStack[textureMD5Code]=getTexture(materialEntry.Data.DiffuseTexture);
					textureStack[textureMD5Code].needsUpdate=true;
					decalConfig.map = textureStack[textureMD5Code];
				}else{
					//assign the texture
					decalConfig.map = textureStack[textureMD5Code];
				}
			}
			if ('UseNormalAlphaTex' in materialEntry?.Data){
				if (materialEntry.Data.UseNormalAlphaTex > 0 ){
					decalConfig.alphaTest = 0.02;
					let naMD5Code = CryptoJS.MD5(materialEntry.Data.NormalAlphaTex)
					if (textureStack[naMD5Code]===undefined){
						textureStack[naMD5Code]=getTexture(materialEntry.Data.NormalAlphaTex);
						textureStack[naMD5Code].needsUpdate=true;
						decalConfig.alphaMap = textureStack[naMD5Code];
					}else{
						decalConfig.alphaMap = textureStack[naMD5Code];

					}
				}
			}
			if (materialEntry?.Data.hasOwnProperty('NormalTexture')){
				let nmMD5Code = CryptoJS.MD5(materialEntry.Data.NormalTexture)
				if (textureStack[nmMD5Code]===undefined){
					textureStack[nmMD5Code]=getTexture(materialEntry.Data.NormalTexture);
					textureStack[nmMD5Code].needsUpdate=true;
					decalConfig.normalMap = textureStack[nmMD5Code]
				}else{
					decalConfig.normalMap = textureStack[nmMD5Code]
				}
			}
			//Color over textures
			if (materialEntry.Data.hasOwnProperty('DiffuseColor')){
				decalConfig.color = new THREE.Color(`rgb(${materialEntry.Data.DiffuseColor.Red},${materialEntry.Data.DiffuseColor.Green},${materialEntry.Data.DiffuseColor.Blue})`);
				decalConfig.opacity = (materialEntry.Data.DiffuseColor.Alpha/255)
			}
			Rdecal.setValues(decalConfig);
			return Rdecal
		}
		if (materialTypeCheck.metal_base.includes(materialEntry.MaterialTemplate)){
			var Rbase = materialBASE.clone();
			var rbaseConfig = {}
			
			if (materialEntry.Data.hasOwnProperty('AlphaThreshold')){
				rbaseConfig.opacity = materialEntry.Data.AlphaThreshold;
			}
			//Texture information
			if (materialEntry.Data.hasOwnProperty('BaseColor')){
				let textureMD5Code = CryptoJS.MD5(materialEntry.Data.BaseColor)
				if (textureStack[textureMD5Code]===undefined){
					textureStack[textureMD5Code]=getTexture(materialEntry.Data.BaseColor);
					textureStack[textureMD5Code].needsUpdate=true;
				}
				rbaseConfig.map=textureStack[textureMD5Code];
			}
			//Color applyed over textures
			if (materialEntry.Data.hasOwnProperty('BaseColorScale')){
				rbaseConfig.color = new THREE.Color(`rgb(${parseInt(materialEntry.Data.BaseColorScale.X*255)},${parseInt(materialEntry.Data.BaseColorScale.Y*255)},${parseInt(materialEntry.Data.BaseColorScale.Z*255)})`)
			}
			
			Rbase.setValues(rbaseConfig);
			return Rbase
		}
		if (materialTypeCheck.multilayer.includes(materialEntry.MaterialTemplate)){
			console.log(materialEntry.Data);
			var Mlayer = stdMaterial.clone();
			//Mlayer.name = materialEntry.name;

			if (materialEntry?.Data.hasOwnProperty('MultilayerMask')){
				
				//name of the Actual layer textures to be loaded will be stored
				Mlayer.map = getTexture(materialEntry.Data.MultilayerMask)
				Mlayer.map.needsUpdate = true;
				Mlayer.mask = materialEntry.Data.MultilayerMask;
			}

			if (materialEntry?.Data.hasOwnProperty('GlobalNormal')){
				var normMD5Code = CryptoJS.MD5(materialEntry.Data.GlobalNormal)
				if (textureStack[normMD5Code]===undefined){
					textureStack[normMD5Code] = getTexture(materialEntry.Data.GlobalNormal)
					Mlayer.normalMap = textureStack[normMD5Code];
					Mlayer.normalMap.needsUpdate = true;
				}else{
					Mlayer.normalMap = textureStack[normMD5Code];
					Mlayer.normalMap.needsUpdate = true;
				}
			}else{
				Mlayer.normalMap = FlatNORM;
				Mlayer.normalMap.needsUpdate = true;
			}
			Mlayer.needsUpdate = true;
			return Mlayer
		}

		if (materialTypeCheck.fx.includes(materialEntry.MaterialTemplate)){

			let actualMaterial = lambertType.clone();
			let fxConfig = {color:0xFFFFFF};

			if (materialEntry?.Data.hasOwnProperty('Emissive')){
				fxConfig.emissiveIntensity = parseFloat(materialEntry?.Data.Emissive);
			}
			if (materialEntry?.Data.hasOwnProperty('EmissiveColor')){
				fxConfig.Emissive = new THREE.Color(`rgb(${materialEntry.Data.EmissiveColor.Red},${materialEntry.Data.EmissiveColor.Green},${materialEntry.Data.EmissiveColor.Blue})`)
			}
			actualMaterial.setValues(fxConfig);
			return actualMaterial;
		}

		if (materialTypeCheck.hair.includes(materialEntry.MaterialTemplate)){
			var configHair = {};
			var actualMaterial = materialHair.clone();
			

			if (materialEntry?.Data.hasOwnProperty('Strand_Gradient')){
				let colMD5Code = CryptoJS.MD5(materialEntry.Data.Strand_Gradient);

				if (textureStack[colMD5Code]===undefined){
					textureStack[colMD5Code] = getTexture(materialEntry.Data.Strand_Gradient)
					configHair.map = textureStack[colMD5Code];
				}else{
					configHair.map = textureStack[colMD5Code];
				}
				configHair.map.needsUpdate = true;
			}

 			if (materialEntry?.Data.hasOwnProperty('Strand_Alpha')){
				
				let colMD5Code = CryptoJS.MD5(materialEntry.Data.Strand_Alpha);
				configHair.alphaTest=0.03;
				if (textureStack[colMD5Code]===undefined){
					textureStack[colMD5Code] = getTexture(materialEntry.Data.Strand_Alpha)
					configHair.alphaMap = textureStack[colMD5Code];
				}else{
					configHair.alphaMap = textureStack[colMD5Code];
				}
				configHair.alphaMap.needsUpdate = true;
			}
			
			actualMaterial.setValues(configHair);
			return actualMaterial;
		}
		if (materialTypeCheck.skin.includes(materialEntry.MaterialTemplate)){

			var skin = lambertType.clone();
			var skinConfig = {color:0xFFDABE};

			if (materialEntry?.Data.hasOwnProperty('TintColor')){
				skinConfig.color = new THREE.Color(`rgb(${materialEntry.Data.TintColor.Red},${materialEntry.Data.TintColor.Green},${materialEntry.Data.TintColor.Blue})`);
				skinConfig.opacity = parseFloat(materialEntry.Data.TintColor.Alpha/255);
			}
			if (materialEntry?.Data.hasOwnProperty('Albedo')){
				let albedoMD5Code = CryptoJS.MD5(materialEntry.Data.Albedo)

				if (textureStack[albedoMD5Code]===undefined){
					textureStack[albedoMD5Code] = getTexture(materialEntry.Data.Albedo)
					skinConfig.map = textureStack[albedoMD5Code];
					skinConfig.map.needsUpdate = true;
				}else{
					skinConfig.map = textureStack[albedoMD5Code];
					skinConfig.map.needsUpdate = true;
				}

			}
			skin.setValues(skinConfig);
			return skin;
		}

		if (materialTypeCheck.glass.includes(materialEntry.MaterialTemplate)){
			return materialGlass
		}

		console.warn(materialEntry);

		return materialNoneToCode;
	}else{
		
		return materialNone;
	}
}

function LoadMaterials(path){
	return new Promise((resolve,reject)=>{
		path = path.replaceAll(/\//g,'\\'); //setup the right path to be requested
		var tempMaterial=null;
	
		if (/^[\w|\W]:\\.+/.test(path)){
			tempMaterial = thePIT.ApriStream(path,'binary',true)
		}else{
			tempMaterial = thePIT.ApriStream(path,'binary')
		}
	
		try {
			if (tempMaterial!=''){
				materialJSON.import(tempMaterial);
				//retrieve for the first appearance the materials
				materialJSON.Appearances[0].Materials.forEach((material)=>{
					materialSet.add(material);
				})
				paintDatas(FlatNORM,4,4,'normalMe',THREE.RGBAFormat)

				//Reset multilayer list for appearances
				$("#Mlswitcher").html("");
				$("#mLayerOperator").html("");

				var multilayerSwitch ="";
				var multilayerMaskMenu = "";
				//Build every unique material entry to be applyed to
				materialSet.forEach((material)=>{
					materialStack[material] = codeMaterials(materialJSON.Materials.filter(el => el.Name == material)[0]);
					let entry, idx
					idx = materialJSON.findIndex(material)
					if (entry = materialJSON.find(material)){
						if (materialTypeCheck.multilayer.includes(entry.MaterialTemplate)){
							multilayerSwitch+= materialJSON.codeMaterial(idx,`<div class="form-check"><label for="mlt_$_MATERIALID" class="form-check-label" >$_MATERIALNAME</label><input class="form-check-input" type="radio" id="mlt_$_MATERIALID" name="multilayerSel" data-material="$_MATERIALFULLNAME" value="$_MATERIALID"></div>`);

							multilayerMaskMenu += materialJSON.codeMaterial(idx,`<li><a class="dropdown-item" href="#" data-multilayer="${idx}" >$_MATERIALFULLNAME</a></li>`);
						}
					}	
				});

				$("#Mlswitcher").html(multilayerSwitch);
				$("#mLayerOperator").html(multilayerMaskMenu);
				$("#mLayerOperator li:nth-child(1)").addClass("active");
				$("#Mlswitcher div:nth-child(1) input[type='radio']").prop("checked",true);

				//Appearances building
				$("#appeInfo").html(materialJSON.codeAppearances());
				$("#appearanceSwitcher ul").html(materialJSON.codeAppearances(`<li><a class="dropdown-item" data-name='$APPEARANCE$'>$APPEARANCE$</a></li>`));

			}else{

				console.info("No Material file present, build a basic Multilayer one");
			}
			resolve();
		} catch (error) {
			notifyMe(error,true);
			reject();
		}
		
	} );
}

function LoadModel(path){
	return new Promise((resolve,reject)=>{
		var subsCheckText = '';
		path = path.replaceAll(/\//g,'\\'); //setup the right path to be requested
		var modelfile;
	
		if (/^[\w|\W]:\\.+/.test(path)){
			modelfile = thePIT.ApriStream(path,'binary',true)
		}else{
			modelfile = thePIT.ApriStream(path,'binary')
		}
		
		var modelstring = string2arraybuffer(modelfile);

		if (modelfile.length > 0){
			$("#sbmeshEN > ul").html();  //Cleanup of the checkbox for the submeshes

			$(window).trigger('cleanTweakPanes');
			/*
			remove all the submesh toggle buttons
			remove all the buttons in the uv calculator
			*/
			$("#sbmeshEN > ul, #unChecksMesh").html("");

			var Boned=false;

			MDLloader.parse( modelstring ,'', ( glbscene ) => {
				glbscene.scene.traverse( function ( child ) {

					if (child.type=="Bone"){
						Boned ||= true;
					}

					if (child.isMesh){
						if (child.userData?.materialNames){
							//console.info(`Model info ${child.name}, material used: ${child.userData?.materialNames[0]}`);

							//Submesh Enabler UI
							subsCheckText +=`<li class="form-check" data-material="${child.userData.materialNames[0]}"><label for="${child.name}" class="form-check-label">${child.name}</label><input name="${child.name}" type="checkbox" class="form-check-input" checked ></li>`
							//Assign the Material
							
							child.material = materialStack[child.userData?.materialNames[0]];
							child.material.needsUpdate=true;
						}else{
							//If isn't coded it apply a default lambertMaterial
							child.material = new THREE.MeshLambertMaterial({color:0xFF0000});
						}
						//set to display the submesh
						child.visible = true;
					}
				})

				$("#withbones svg:nth-child(1) path").attr("fill",(Boned ? 'red':'currentColor'));
				$("#sbmeshEN > ul").html(subsCheckText);

				//Autocentering
				var helper = new THREE.BoxHelper(glbscene.scene);

				helper.geometry.computeBoundingBox();

				//calculate and dispose the center of rotation
				var centerPoint = new THREE.Vector3();
				centerPoint.x = (helper.geometry.boundingBox.max.x + helper.geometry.boundingBox.min.x) / 2;
				centerPoint.y = (helper.geometry.boundingBox.max.y + helper.geometry.boundingBox.min.y) / 2;
				centerPoint.z = (helper.geometry.boundingBox.max.z + helper.geometry.boundingBox.min.z) / 2;
				var cameraPos = TDengine.camera.position.clone()
				cameraPos.y=centerPoint.y;
				TDengine.camera.position.set(cameraPos.x,cameraPos.y,cameraPos.z);
				TDengine.camera.updateProjectionMatrix();
				//TDengine.camera.position.set(cameraPos);
				helper.dispose();

				TDengine.control.target = centerPoint;
				TDengine.scene.add(glbscene.scene);

				resolve();
			})		
		}else{
			notifyMe(`${path} empty file ??? No model to display i guess`);
			reject();
		}
	});
}
