import * as THREE from 'three';
import { OrbitControls } from 'orbit';
import { Fog } from 'fog';
import { Color } from 'color';
import { MathUtils } from 'mathutils';
import { GLTFLoader } from 'gltf';

var firstModelLoaded = false;
var flippingdipping = thePIT.RConfig('flipmasks');
var flipdipNorm = thePIT.RConfig('flipnorm');
var flipcheck = document.getElementById("flipMask");

var actualExtension = 'dds';
const matrixTransform = {
	offsetX: 0.0,
	offsetY: 0.0,
	repeat: 1.0,
	centerX: 0,
	centerY: 1
}


var imgWorker
if (window.Worker) {
    imgWorker = new Worker('js/workers/imgWork.js');
  
    imgWorker.onmessage = (event) =>{

		var command, datas
		[command, ...datas] = event.data;
		//console.log(command,datas);
		/* 
		datas[0] binary image datas
		datas[1] width
		datas[2] height
		datas[3] filename
		datas[4] materialName
		 */
		switch (command){
			case 'blurApply':
				//apply the blur on the masks for a better fusion with other textures
				clearCanvas('maskPainter');
				paintDatas(datas[0],datas[1],datas[2],'maskPainter',THREE.RGBAFormat);
				break;
			case 'gradientApply':
				break;
			case 'alphaFix':
				console.log(alphaFix);
				break;
			case 'paint':
				clearCanvas(datas[3]);
				paintDatas(datas[0],datas[1],datas[2],datas[3],THREE.RGBAFormat);
				let textureMD5Code = getEncodedFileName((datas[3]).replace(/\.(dds|png)$/g,".xbm"));
				let oldUserData = textureStack[textureMD5Code].userData?.type
				textureStack[textureMD5Code] = new THREE.DataTexture(datas[0],datas[1],datas[2]);
				textureStack[textureMD5Code].minFilter = THREE.LinearFilter;
				textureStack[textureMD5Code].magFilter = THREE.LinearFilter;
				textureStack[textureMD5Code].needsUpdate = true
				textureStack[textureMD5Code].userData.type = oldUserData;
				if (textureStack[textureMD5Code].userData?.type=="globalnormal"){
					paintDatas(
						datas[0],
						datas[1],
						datas[2],
						"normalMerge",
						THREE.RGBAFormat);
				}
				materialStack[datas[4]].normalMap = textureStack[textureMD5Code];
				materialStack[datas[4]].normalMap.needsUpdate = true;
				break;
			case 'rough':
				paintDatas(datas[0],datas[1],datas[2],datas[3],THREE.RGBAFormat);
				let roughMD5Code = getEncodedFileName((datas[3]).replace(/\.(dds|png)$/g,".xbm"));
				textureStack[roughMD5Code] = new THREE.DataTexture(datas[0],datas[1],datas[2]);
				textureStack[roughMD5Code].minFilter = THREE.LinearFilter;
				textureStack[roughMD5Code].magFilter = THREE.LinearFilter;
				textureStack[roughMD5Code].needsUpdate = true

				var repVal = parseFloat($(".multiplier")[0].attr("data-mul")) * parseFloat($("#layerTile").val());

				let offset_h = repVal *  mLsetup.Layers[MLSB.Editor.layerSelected].offsetU
				let offset_v = (-1 *  mLsetup.Layers[MLSB.Editor.layerSelected].offsetV) * repVal

				var offset = new THREE.Vector2(offset_h,offset_v);
				console.log(datas[4]);

				materialStack[datas[4]].roughnessMap = textureStack[roughMD5Code];

				materialStack[datas[4]].roughnessMap.offset=offset;
				materialStack[datas[4]].roughnessMap.repeat.set(repVal,repVal);

				materialStack[datas[4]].roughnessMap.needsUpdate = true;
				break;
			case 'interface':
				//here will display some messages on the interface
				notifyMe(datas[0],false);
				break;
			case 'log':
				console.log(datas);
				break;
			default:
				console.log(command)
				break;
		}
    }
}

const NORMAL = 'normalMap';

var materialStack = new Array();
var materialSet = new Set();
var textureStack = new Array();
var textureDock = new Array();
var texturePromise = new Array();

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
		"base\\fx\\shaders\\emissive_basic_transparent.mt",
		"base\\fx\\shaders\\metal_base_glitter.mt"
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
		"base\\materials\\vehicle_destr_blendshape.mt",
		"base\\fx\\_shaders\\sandevistan_multilayer.mt"
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
const TDNormalMerger ={
	scene: null,
	renderer:null,
	canvas:null,
	camera:null,
	plane:null
}

const MDLloader = new GLTFLoader(); //Loading .glb files

var materialGlass = new THREE.MeshPhysicalMaterial({  roughness: 0.2,   transmission: 1, thickness: 0.005});

var stdMaterial = new THREE.MeshStandardMaterial({color:0x808080, side:THREE.DoubleSide, visible:true}); //this will substitute the problematic single multilayer material

var materialHair = new THREE.MeshStandardMaterial({color:0xBB000B,opacity:.9,side:THREE.DoubleSide,depthTest:true});
var materialBASE = new THREE.MeshStandardMaterial({color:0x0000FF,transparent:true, alphaTest:0.05,side:THREE.DoubleSide,depthWrite :false,visible:true});

var lambertType = new THREE.MeshLambertMaterial();
var materialNoneToCode = new THREE.MeshLambertMaterial({color:0x808080,emissive:0xFFFF00,emissiveIntensity:.2});

var materialNone = new THREE.MeshLambertMaterial({color:0xFFFFFF});

var materialLegacy = new THREE.MeshStandardMaterial({color:0xFF0000,side:THREE.DoubleSide,depthWrite :false,visible:true,transparent:false,alphaTest:0.05,name:"MLSBlegacy"});

var normalMerger

var loader = new THREE.FileLoader();
loader.load('./shaders/mergeNormal.vert.glsl', function (vertexShader) {
    loader.load('./shaders/mergeNormal.frag.glsl', function (fragmentShader) {
        normalMerger = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
				globalnormal: { type: "t", value:FlatNORM},
				detailnormal: { type: "t", value:FlatNORM},
				globalnormalScale: { type: "f", value:1.0},
				detailnormalScale: { type: "f", value:1.0},
				tiles: { type: "f", value:1.0},
				offset: {type:"v", value:[0.0,0.0]}
			},
			glslVersion:THREE.GLSL1
        });
		TDNormalMerger.plane.material = normalMerger
		TDNormalMerger.plane.material.needsUpdate=true;
    });
})


function sceneLoaded(){
	if (TDengine.scene==null){ return false }
	if (!TDengine.scene.hasOwnProperty("children")){ return false }
	let hasScene = false;
	TDengine.scene.children.forEach((elm)=>{
		if (!hasScene){
			if ((elm?.name=="Scene") && (elm.type=="Group")){hasScene=true}
		}
	})
	return hasScene;
}

/**
 * 
 * @param {*} filename String with the filename to list all unique files
 * @returns an encoded string
 */
function getEncodedFileName(filename){
	return CryptoJS.MD5(filename).toString();
}

function setNormalMergeCanvasSize(squaresize=300){
	const squareCheck = parseInt(squaresize);
	if (!((squareCheck>0) && (squareCheck < 4096))){
		squaresize=300;
	}
	let normalMergeCanvas = document.getElementById("normalMerge")
	normalMergeCanvas.setAttribute("width",squaresize)
	normalMergeCanvas.setAttribute("height",squaresize)
}

function chainError(err) {
  return Promise.reject(err)
};

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

function isGREY(textureFile){
	return ((textureFile=="engine\\textures\\editor\\grey.xbm") ||
	(textureFile=="base\\surfaces\\materials\\default\\gray.xbm"));
}

function isWHITE(textureFile){
	return ((textureFile=="engine\\textures\\editor\\white.xbm") || 
		(textureFile=="engine\\textures\\editor\\small_white.xbm") ||
		(textureFile=="base\\surfaces\\materials\\default\\white.xbm"));
}

function isBLACK(textureFile){
	return ((textureFile=="engine\\textures\\editor\\black.xbm")||
	(textureFile=="base\\surfaces\\materials\\default\\black.xbm"));
}

function checkMaps(mapName="engine\\textures\\editor\\black.xbm"){
	if (isBLACK(mapName)) { return 0.0; }
	if (isGREY(mapName))  { return 0.5; }
	if (isWHITE(mapName)) { return 1.0; }
	return -1.0;
}

function retDefTexture(mapName="engine\\textures\\editor\\grey.xbm",material="default",type="diffuse"){
	// kind of listed maps
	type = ((type=="diffuse") || (type=="normal") || (type=="normaldetail") || (type=="metal") || (type=="rough") || (type=="roughness") || (type=="alpha")  || (type=="emissive") || (type=="mlmask") ) ? type : "diffuse";
	if (PARAMS.debugTexture) {console.log("retDefTexture: ", mapName,type)}
	
	switch (mapName){
		case "base\\surfaces\\materials\\default\\black.xbm":
		case "engine\\textures\\editor\\black.xbm":
			return BLACK;
			break;
		case "base\\surfaces\\materials\\default\\white.xbm":
		case "engine\\textures\\small_white.xbm":
		case "engine\\textures\\editor\\white.xbm":
			return WHITE;
			break;
		case "engine\\textures\\editor\\normal.xbm":
			return FlatNORM;
			break; 
		default:
			if (mapName!="engine\\textures\\editor\\grey.xbm"){
				if (textureDock.filter(elm=>elm.file==mapName).length<=0){
					textureDock.push({file:mapName,maptype:type,shader:material,entries:[{maptype:type,shader:material}]})
				}else{
					let tInd = textureDock.findIndex((elm) => elm.file==mapName)
					textureDock[tInd].entries.push({maptype:type,shader:material});
				}
			}
			return GRAY;
	}
}

function getUVSubmeshIndex(sons){
	var checked = [];
	if (sons?.length>0){
		for (let i=0,k=sons.length; i<k; i++){
			if (sons[i].checked){
				checked.push(i)
			}
		}
	}
	return checked;
}
function retUVMapData(_2dContext,selected,size){
	return new Promise((resolve,reject)=>{
		try {
			var modello = TDengine.scene?.children.filter(elm=>elm.type=='Group');
			if (PARAMS.modelDebug){console.log(modello)}
			if (!modello[0].hasOwnProperty('children')){
				notifyMe("No Group found in the scene")
				reject();
			}
			var submeshes = modello[0].children.filter(elm => elm.type=='SkinnedMesh' || elm.type=='Mesh');

			if ((modello[0].children.length==1) && (modello[0].children[0].name=="Armature")){
				submeshes = modello[0].children[0].children.filter(elm => elm.type=='SkinnedMesh' || elm.type=='Mesh');
			}
			if (PARAMS.modelDebug){console.log(submeshes)}

			var getCanvas = _2dContext.getContext("2d")
			const lines = new THREE.Vector2();
			const isle = new THREE.Vector2();
			const uvs = [new THREE.Vector2(),new THREE.Vector2(),new THREE.Vector2()];
			const face = [];

			var lod
			if (submeshes.length > 0){
				selected.forEach((x)=>{
					lod = submeshes[x]
					const index = lod.geometry.index;
					const uvAttribute = lod.geometry.attributes.uv;
					getCanvas.strokeStyle = `#${tinycolor.fromRatio({r:(Math.random() * .7 + .3), g:(Math.random() * .6 + .4), b:(Math.random()* .4 + .6) }).toHex()}`;
					getCanvas.lineWidth = .2;

					var il
					if (index){
						il = index.count
					}else{
						il = uvAttribute.count
					}

					for(let i = 0; i < il; i=i+3 ){
						face[0] = index.getX(i);
						face[1] = index.getX(i+1);
						face[2] = index.getX(i+2);
						uvs[0].fromBufferAttribute(uvAttribute, face[0]);
						uvs[1].fromBufferAttribute(uvAttribute, face[1]);
						uvs[2].fromBufferAttribute(uvAttribute, face[2]);
						getCanvas.beginPath();
						lines.set(0,0);
						//Draw points
						for (let j = 0, jl=uvs.length; j<jl; j++){
							const uv = uvs[j];
							lines.x = uv.x;
							lines.y = uv.y;
							if (j===0){
								getCanvas.moveTo(uv.x * (size - 2) + 0.5, (1 - uv.y) * (size - 2 ) + 0.5)
							}else{
								getCanvas.lineTo(uv.x * (size - 2) + 0.5, (1 - uv.y) * (size - 2 ) + 0.5)
							}
						}
						getCanvas.closePath();
						getCanvas.stroke();
					}
				})
			}else{
				notifyMe("We didn't found SkinnedMeshes under the glb scene, see the dev log");
				console.log(modello[0].children);
			}
			resolve();
		} catch (error) {
			console.log(error);
			notifyMe(error);
			reject();
		}
	}
	)
}

function paintDatas(textureData,w,h,target,format){
	try{
		var opCanvas = {
			dom : document.getElementById(target),
			context : null,
			width: 0,
			height:0
		}
	
		if (textureData == undefined){
			textureData = ERROR.image.data
			w=ERROR.image.width
			h=ERROR.image.height
			format = THREE.RGBAFormat
		}
	
		opCanvas.width = opCanvas.dom.getAttribute("width");
		opCanvas.height = opCanvas.dom.getAttribute("height");
		opCanvas.context = opCanvas.dom.getContext('2d',{ willReadFrequently: true });
		opCanvas.context.reset();
		opCanvas.context.setTransform(1, 0, 0, 1, 0, 0);
	
		var oc = document.createElement('canvas');
		oc.width=w;
		oc.height=h;
		var octx = oc.getContext('2d');
		var imageData = octx.createImageData(w,h);
		var k=0;
	
		switch (format) {
			case THREE.LuminanceFormat:
			case THREE.RedFormat:
				for (let i = 0; i < imageData.data.length; i += 4) {
					// Modify pixel data
					imageData.data[i] = textureData[k];  // R value
					imageData.data[i + 1] =  textureData[k]    // G value
					imageData.data[i + 2] =  textureData[k]  // B value
					imageData.data[i + 3] = 255;  // A value
					k++;
				}
				break;
			case THREE.RGFormat:
				for (let i = 0; i < imageData.data.length; i += 4) {
					// Modify pixel data
					imageData.data[i] = textureData[k];  // R value
					imageData.data[i + 1] =  textureData[k+1]    // G value
					imageData.data[i + 2] =  0;  // B value
					imageData.data[i + 3] = 255;  // A value
					k+=2;
				}
				break;
			case THREE.RGBFormat:
				for (let i = 0; i < imageData.data.length; i += 4) {
					// Modify pixel data
					imageData.data[i] = textureData[k];  // R value
					imageData.data[i + 1] =  textureData[k+1]    // G value
					imageData.data[i + 2] =  textureData[k+2]  // B value
					imageData.data[i + 3] = 255;  // A value
					k+=3;
				}
				break;
			case THREE.RGBAFormat:
				for (let i = 0; i < imageData.data.length; i++) {
					// Modify pixel data
					imageData.data[i] = textureData[i]; // every value
				}
				break;
		}
	
		octx.putImageData(imageData,0,0,0,0,w,h);
		if (w==h){
			opCanvas.context.scale(opCanvas.width/w,opCanvas.height/h)
		}else if (w>h){
			opCanvas.context.scale(opCanvas.width/w,opCanvas.width/w)
		}else if (h>w){
			opCanvas.context.scale(opCanvas.height/h,opCanvas.height/h)
		}
		opCanvas.context.drawImage(oc,0,0,w,h);
	
		oc.remove();
	}catch (error){
		notifyMe(`${error} : -> ${target}`);
	}
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

function getCanvasSize(ThreejsObject){
	var canvas = ThreejsObject.renderer.domElement
	var size = parseInt(canvas.getAttribute("width"))
	ThreejsObject.renderer.setSize(size,size);
    ThreejsObject.camera.aspect =size/size;
    ThreejsObject.camera.updateProjectionMatrix();
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
		clearTexturePanel(); // UI/UX interface
		clearCanvas('texturePlayer');

		var groupdisposeID = [];
		var groupObj = null;

		materialSet.clear();

		materialStack.forEach((material) => { material.dispose() });
		materialStack=[];

		textureStack.forEach((element) => {element.dispose()});
		textureStack=[];
		//the Dock loading of textures
		textureDock=[];

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

		PARAMS.listSubmeshes = {};
		document.getElementById("tweakContainer").dispatchEvent(new Event("cleanMeshes"));
		
		resolve(true);
	})
}


const renderwidth = Number(getComputedStyle(document.documentElement).getPropertyValue('--rendView').replace(/px/,''));
let resized = false; //semaphore for resizing behaviour
window.addEventListener('resize', function() {  resized = true;  });// resize event listener


const BLACK = new THREE.DataTexture(genTexture(new THREE.Color( 0, 0 ,0 ) ),4,4);
const GRAY = new THREE.DataTexture(genTexture(new THREE.Color( 0.5, 0.5 ,0.5) ),4,4);
const WHITE = new THREE.DataTexture(genTexture(new THREE.Color( 1, 1 ,1 ) ),4,4);
const FlatNORM = new THREE.DataTexture(genTexture(new THREE.Color( 0.47, 0.47 ,1 )),4,4);
const ERROR = new THREE.DataTexture(genTexture(new THREE.Color( 1, 0 ,0 )),4,4);
BLACK.userData = {name:"black"};
GRAY.userData={name:"gray"};
WHITE.userData={name:"white"};
FlatNORM.userData={name:"normal"};
ERROR.userData={name:"error"};

BLACK.wrapS = BLACK.wrapT = THREE.RepeatWrapping;
GRAY.wrapS = GRAY.wrapT = THREE.RepeatWrapping;
WHITE.wrapS = WHITE.wrapT = THREE.RepeatWrapping;
FlatNORM.wrapS = FlatNORM.wrapT = THREE.RepeatWrapping;
ERROR.wrapS = ERROR.wrapT = THREE.RepeatWrapping;

const debugTexture = new THREE.TextureLoader().load( 'images/system/uv_grid_opengl.jpg');
debugTexture.wrapS = debugTexture.wrapT = THREE.RepeatWrapping;

//screenshotSaver
$("#takeashot").click(function(ev){
	getImageData = true;
	animate();
});

function getOffsetValues(){
	var offset_h=0, offset_v = 0;

	if (mLsetup.Layers[MLSB.Editor.layerSelected].offsetU!==undefined){

		offset_h =  parseFloat(mLsetup.Layers[MLSB.Editor.layerSelected].offsetU==null ? $("#layerOffU").val(): mLsetup.Layers[MLSB.Editor.layerSelected].offsetU).toPrecision(4)
		offset_v =  parseFloat(mLsetup.Layers[MLSB.Editor.layerSelected].offsetV==null ? $("#layerOffV").val(): mLsetup.Layers[MLSB.Editor.layerSelected].offsetV).toPrecision(4)
	}else{
		offset_h = $("#layerOffU").val();
		offset_v = $("#layerOffV").val();
	}
	return [offset_h , offset_v];
}

function updateUvTransform(material=null) {
	
	try {
		
		if (PARAMS.textureDebug){console.log(matrixTransform)}
		let selected = activeMLayer();
		if (materialStack[selected].map?.isTexture){
			materialStack[selected].map.offset.set( matrixTransform.offsetX, matrixTransform.offsetY )
			materialStack[selected].map.repeat.set( matrixTransform.repeat, matrixTransform.repeat )
		}
		if (materialStack[selected].roughnessMap?.isTexture){
			materialStack[selected].roughnessMap.offset.set( matrixTransform.offsetX, matrixTransform.offsetY )
			materialStack[selected].roughnessMap.repeat.set( matrixTransform.repeat, matrixTransform.repeat )
		}
		if (materialStack[selected].metalnessMap?.isTexture){
			materialStack[selected].metalnessMap.offset.set( matrixTransform.offsetX, matrixTransform.offsetY )
			materialStack[selected].metalnessMap.repeat.set( matrixTransform.repeat, matrixTransform.repeat )
		}
		if (PARAMS.normalMerger){
			normalMerger.uniforms.tiles.value = matrixTransform.repeat;
			normalMerger.uniforms.offset.value = [matrixTransform.offsetX, matrixTransform.offsetY];
		}else{
			if (materialStack[selected].userData?.detailNormalMap==undefined){
				console.error("no detail normal map")
			}else{
				materialStack[selected].userData.detailNormalMap.repeat.set(matrixTransform.repeat, matrixTransform.repeat)
				materialStack[selected].userData.detailNormalMap.offset.set(matrixTransform.offsetX, matrixTransform.offsetY)
				materialStack[selected].userData.detailNormalMap.updateMatrix();
				materialStack[selected].userData.detailNormalTransform = materialStack[selected].userData.detailNormalMap.matrix;
			}
		}
	} catch (error) {
		console.error(error);
	}
}


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

	TDNormalMerger.scene = new THREE.Scene();
	TDNormalMerger.canvas = document.getElementById("normalMerge");
	TDNormalMerger.camera = new THREE.OrthographicCamera(
		-1, // left
		1, // right
		1, // top
		-1, // bottom
		-1, // near,
		1, // far
	);
	TDNormalMerger.renderer = new THREE.WebGLRenderer({
		canvas: TDNormalMerger.canvas,
        antialias:true,
		gammaFactor : 2.2,
		preserveDrawingBuffer: true
	});
	TDNormalMerger.plane = new THREE.PlaneGeometry(2, 2);
	TDNormalMerger.scene.add(new THREE.Mesh(TDNormalMerger.plane, normalMerger));

	if (window.innerHeight-80<512){
		TDengine.renderer.setSize(renderwidth,renderwidth);
	}else{
		TDengine.renderer.setSize(renderwidth, window.innerHeight-80);
	}
	TDengine.renderer.setPixelRatio( window.devicePixelRatio );

    TDengine.camera = new THREE.PerspectiveCamera(15,renderwidth/(window.innerHeight-80),PARAMS.cameraNear,PARAMS.cameraFar);
    TDengine.camera.position.set(0.0,-0.4,-8);
	TDengine.camera.updateProjectionMatrix();

    TDengine.control = new OrbitControls(TDengine.camera, TDengine.renderer.domElement);
    TDengine.control.autoRotate = PARAMS.rotation;
    TDengine.control.autoRotateSpeed = PARAMS.speed;
    TDengine.control.enableDamping = true;
    TDengine.control.enablePan = true;
    TDengine.control.target.set(0.01,0.7,0.07);
    
    //lights declaration
    //TDengine.lights.ambient = new THREE.AmbientLight( PARAMS.A_light_color,PARAMS.A_light_pow ); // soft white light ambientlight.intensity=1;
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

    //TDengine.scene.add( TDengine.lights.ambient );
    TDengine.scene.fog = new THREE.Fog( PARAMS.fogcolor, PARAMS.fognear,PARAMS.fogfar);
    animate();
}

/**
 * 
 */
function resetDetailNormal(){
	var ctxr = document.getElementById('normalMerge');
	let selected = activeMLayer();
	if (materialStack[selected].normapMap?.isTexture){
		materialStack[selected].normapMap.dispose();
	}
	materialStack[selected].normapMap = new THREE.CanvasTexture(ctxr);
	materialStack[selected].normapMap.wrapS = materialStack[selected].normapMap.wrapT = THREE.RepeatWrapping;
	materialStack[selected].normapMap.needsUpdate = true;
}

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
}

function animate() {
    if (resized) {
		resize();
	}
	
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
	if ((normalMerger!=undefined) && (normalMerger!=null)){
		getCanvasSize(TDNormalMerger)
		TDNormalMerger.renderer.render(TDNormalMerger.scene, TDNormalMerger.camera);
	}

    if(getImageData == true){
		let a = document.getElementById('takeashot');
		if (PARAMS.showImgOffSet){
			let cvs = TDengine.renderer.getContext("2d");
			let textsets = {
				H:mLsetup.Layers[MLSB.Editor.layerSelected].offsetU,
				V:mLsetup.Layers[MLSB.Editor.layerSelected].offsetV,
				MH:mLsetup.Layers[MLSB.Editor.layerSelected].microblend.offset.h,
				MV:mLsetup.Layers[MLSB.Editor.layerSelected].microblend.offset.v
			}
		}
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
}

//String to bufferArray
function str2ab(str) {
	try {
		var buf = new ArrayBuffer(str.length); // 2 bytes for each char
		var bufView = new Uint8Array(buf);
		for (var i=0, strLen=str.length; i < strLen; i++) {
			bufView[i] = str.charCodeAt(i);
		}
	} catch (error) {
		notifyMe(error.message)
		return false;
	}
	return buf;
}

function getImageInfo(binaryData){
	var bufferData = str2ab(binaryData);
	if (!bufferData){console.log('Error,in the buffer Data')}
	const headerData = new Uint8Array( bufferData, 0, 8 ); //get the two dimensions data bytes
	//DDS Case
	if ((headerData[0]==0x44) && (headerData[1]==0x44) && (headerData[2]==0x53) ){
		const spaceData = new Uint32Array( bufferData, 0, 5 ); //get the two dimensions data bytes
		let headSize = spaceData[1];
		let height = spaceData[3];
		let width = spaceData[4];
		let bytes = 8;
		//let size = height * width * channels;
		const dx10Data = new Uint32Array( bufferData, 128, 4 ); //get the type of DDS
		var channels = 4;
		var DXGIformat = 'DXGI_FORMAT_R8G8B8A8_UNORM_SRGB'; //RGBA sRGB

		switch (dx10Data[0]){
			case 11:
				//DXGI_FORMAT_R16G16B16A16_UNORM RGBA 16bit
				DXGIformat = 'DXGI_FORMAT_R16G16B16A16_UNORM'
				bytes=16;
				break;
			case 29:
			case 28:
				break;
			case 49:
				//DXGI_FORMAT_R8G8_UNORM = 49
				DXGIformat = 'DXGI_FORMAT_R8G8_UNORM'
				channels = 2;
				break
			case 61:
				//DXGI_FORMAT_R8_UNORM = 61 RedChannel or Luminance
				DXGIformat = 'DXGI_FORMAT_R8_UNORM'
				channels = 1;
				break;
			default:
				console.error(`Unknown value ${dx10Data[0]}`);
				break;
		}

		return {
			width:width,
			height:height,
			format:'DDS',
			size:(height * width * channels),
			bytes:bytes,
			channels:channels,
			DXGIformat:DXGIformat
		}

	}else if ((headerData[0]==0x89) && (headerData[1]==0x50) && (headerData[2]==0x4e) && (headerData[3]==0x47)	&& (headerData[4]==0x0d) && (headerData[5]==0x0a) && (headerData[6]==0x1a) && (headerData[7]==0x0a) ){
		//PNG case
		var chunkslenght, chunkstype
		var pngWidth, pngHeight;
		var pngBit, pngColorType, pngCompression, pngInterlaced, pngFilter;

		pngWidth=pngHeight=0;
		var imgByteLenght = bufferData.byteLength
		var filePointer = 8; /*after the header */
		
		

		//Search for the chunks with the Size of the texture
		while ((pngWidth==0) && (pngHeight==0) && (filePointer<imgByteLenght)) {
			chunkslenght = parseInt(new DataView(bufferData,filePointer,4).getInt32(),16); //from hexa I'll take the size of the chunks
			chunkstype = new Uint8Array(bufferData,filePointer+4,4);
			filePointer+=8;
			if ( (chunkstype[0]==0x49)
				&&(chunkstype[1]==0x48)
				&&(chunkstype[2]==0x44)
				&&(chunkstype[3]==0x52) ){
				//IHDR Chunk
				//go for the read of the length
				pngWidth=parseInt(new DataView(bufferData,filePointer,4).getUint32());
				pngHeight=parseInt(new DataView(bufferData,filePointer+4,4).getUint32());
				pngBit= parseInt(new DataView(bufferData,filePointer+8,1).getUint8());
				pngColorType = parseInt(new DataView(bufferData,filePointer+9,1).getUint8());
				pngCompression = parseInt(new DataView(bufferData,filePointer+10,1).getUint8());
				pngFilter = parseInt(new DataView(bufferData,filePointer+11,1).getUint8());
				pngInterlaced = parseInt(new DataView(bufferData,filePointer+12,1).getUint8());
			}
			filePointer+=chunkslenght+4; //last 4 byte are for the checksum
			//console.warn = parseInt(new DataView(bufferData,filePointer,4).getInt32(),16);
		}
		var pngchannels=3;
		let textureMessage = ''
		switch (pngColorType) {
			case 0:
				textureMessage=`Grayscale sample`;
				pngchannels=1;
				break;
			case 2:
				textureMessage=`RGB triple`;
				break;
			case 3:
				textureMessage=`PLTE palette index`;
				pngchannels=0;
				break;
			case 4:
				textureMessage=`grayscale sample, followed by an alpha sample`;
				pngchannels=2;
				break;
			case 6:
				textureMessage=`R,G,B triple, followed by an alpha sample`;
				break;
			default:
				notifyMe("This is an unknown PNG format !!");
				pngchannels=-1;
				break;
		}

		if (PARAMS.textureDebug){console.log(textureMessage)}

		return {width:pngWidth,height:pngHeight,format:'PNG', colorType:pngColorType,bytes:pngBit,compress:pngCompression,filter:pngFilter,Ilaced:pngInterlaced,channels:pngchannels}
	}else{
		console.warn(`${binaryData.slice(0,4)} format`)
		return {width:0,height:0,format:'Unknown'};
	}
}

/**
 * Load an image from a given URL
 * @param {ArrayBuffer} textureData dataview of the image datas
 * @param {Number} width size in pixel of the image width
 * @param {Number} height size in pixel of the image height
 * @returns {Uint8Array} RGBA channels ArrayBuffer of the texture
 */
function rebuildText(textureData, width, height){
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
	return imageData;
}

/**
 * Load an image from a given URL
 * @param {String} dataURI The URL of the image resource
 * @param {Object} info contains the datas of the encoding of the image
 * @returns {Promise<Image>} The loaded image
 */
async function pngResolve(dataURI,textureObj){
	return new Promise((resolve, reject)=>{
		var info = textureObj.info
		let offcanvas = new OffscreenCanvas(info.width,info.height);
		let gl = offcanvas.getContext("2d");
		var img = new Image(info.width,info.height);
		try {
			img.addEventListener('load', () => {
				gl.drawImage(img,0,0,info.width,info.height); // Or at whatever offset you like
				var imageData = gl.getImageData(0, 0, info.width,info.height)
				if ((textureObj.maptype=='normal') || (textureObj.maptype=='normaldetail')){
					var gammaCorrection = 2.2 //2.2;
					for (var i = 0; i < imageData.data.length; i += 4) {
						imageData.data[i] = 255 * Math.pow((imageData.data[i] / 255), gammaCorrection);
						imageData.data[i+1] = 255 * Math.pow((imageData.data[i+1] / 255), gammaCorrection);
						imageData.data[i+2] = 255 * Math.pow((imageData.data[i+2] / 255), gammaCorrection);
					}
				}
				resolve(imageData.data);
			});
			img.src = dataURI;
		} catch (error) {
			reject(`pngResolve ${error}`);
		}
	});
}

async function ddsResolve(binarydata, info){
	return new Promise((resolve,reject)=>{
		var bufferData = str2ab(binarydata);
		try {

			var imageDatas = ''
			switch (info.bytes) {
				case 16:
					imageDatas = new Uint16Array( bufferData, 148, info.size );
					break;
			
				default:
					imageDatas = new Uint8Array( bufferData, 148, info.size );
					break;
			}

			
			if (info.DXGIformat == 'DXGI_FORMAT_R8_UNORM'){
				imageDatas = rebuildText(imageDatas,info.width,info.height);
				info.channels = 4;
			}

			resolve(imageDatas)
		} catch (error) {
			notifyMe(`ddsResolve : ${error}`)
			reject(false)
		}
	})
}

//Get texture file content to be processed
async function _getFileContent(textureObj){
	return new Promise((resolve, reject)=>{
		if (PARAMS.textureDebug){
			console.log(`request _getFileContent`,textureObj);
		}
		if (!textureObj.hasOwnProperty("file") && !textureObj.hasOwnProperty("maptype")){
			reject({error:true,log:"invalid Texture"});
		}
		var realTexturePath
		
		if (textureObj.file.match(/\.mlmask$/)){
			let basePaths = textureObj.file.split("\\").slice(0,-1);
			let maskFilename = textureObj.file.split("\\").pop().toString();
			let subfolder = maskFilename.split(".")[0]+"_layers"
			
			basePaths.push(subfolder,maskFilename);
			var filename = basePaths.join("\\");
			//TODO Optimize the number of searches of the same file in a Directory
			//Number of textures in the mlmask file
			if ((PARAMS.obFoldercheck) || (!materialStack[textureObj.shader].userData.hasOwnProperty("layers")) || (materialStack[textureObj.shader].userData?.layers < 0) ){
				var maxMasksPR = thePIT.mapMasks(filename); //check the numbers of masks layers in the subfolder
				maxMasksPR.then((result)=>{
					materialStack[textureObj.shader].userData.layers = result
				}).catch((error)=>{
					console.log(error)
					materialStack[textureObj.shader].userData.layers = 0
				}).finally((e)=>{
					//only the selected one will decide the number of layers
					//$(window).trigger("limitLayers",materialStack[textureObj.shader].userData.layers);
				})
			}
			//TODO make the loading of the masks in promise after 
			//the first calculation of the number of the masks
			realTexturePath = (filename).replace('.mlmask',`_${MLSB.Editor.layerSelected}.${textureformat}`)
			//multilayer mask texture to be taken
		}else{
			realTexturePath = (textureObj.file).replace('.xbm',`.${textureformat}`)
		}

		var theTextureContent = thePIT.OpenStream(realTexturePath,'binary');
		theTextureContent.then((textureResult)=>{
			//get info from the binary datas
			if (!textureObj.hasOwnProperty('info')){
				try {
					let dummy = getImageInfo(textureResult);
					textureObj.info = dummy
					if (textureObj.maptype=='diffuse'){
						let tInd = textureDock.findIndex((elm) => elm.file==filename)
						if (tInd>0){
							textureDock[tInd].info=dummy;
						}
					}

					if (PARAMS.textureDebug){
						console.log(realTexturePath,textureObj.info);
					}
					
				} catch (error) {
					notifyMe(error);
					if (PARAMS.textureDebug){console.log("no Info Property")}
				}
			}
			
			
			if (textureObj.maptype!='mlmask'){
				pushTexturetoPanel(realTexturePath, textureObj.info.width, textureObj.info.height,textureObj.maptype,textureObj.shader);
			}
			

			if (textureObj.info?.format=='DDS'){

				var test = ddsResolve(textureResult,textureObj.info)
							.then((data)=>{
								resolve(data)
							}).catch((error)=>{
								notifyMe(`theTextureContent ${textureformat} ${error}`)
								reject(false)
							});

			}else if (textureObj.info?.format=='PNG'){

				var encodedData = btoa(textureResult);
				var dataURI = "data:image/png;base64," + encodedData;
				var test = pngResolve(dataURI,textureObj)
							.then((data)=>{
								resolve(data)
							}).catch((error)=>{
								notifyMe(`theTextureContent ${textureformat} ${error}`)
								reject(false)
							})
				
			}
		}).catch((error)=>{
			reject(false)
			notifyMe(`_getFileContent ${error}`);
		});
	});
}

/**
 * Generate and assign a THREE.DataTexture based on the datas it get in
 *  * @param {Object} TexturePromise contain datas from the textureDoc array with additional information
 *  * @param {Number} DockTexture index TextureDock object image info
 *  * @param {Number} TextureStackIndex index of the texture in textureStack array
 * @returns nothing
 */
function genDataTexture(TexturePromise,DockTexture,TextureStackIndex){
	return new Promise((resolve, reject)=>{
		try {
			var THREEFormat = THREE.RGBAFormat //Default format for PNGs
			let target  = (DockTexture.file).replace('.xbm',`.${textureformat}`)
			if (DockTexture.info.format=='DDS'){
				if (DockTexture.info.bytes==16){
					textureStack[TextureStackIndex] = new THREE.DataTexture(TexturePromise, DockTexture.info.width, DockTexture.info.height, THREEFormat,	RGBA16UI);
				}else{
					//(Bit color texture)
					switch (DockTexture.info.channels) {
						case 1:
							THREEFormat = THREE.RedFormat
							break;
						case 2:
							THREEFormat = THREE.RGFormat
							break;
						case 3:
							THREEFormat = THREE.RGBFormat
							break;
					}
		
					textureStack[TextureStackIndex] = new THREE.DataTexture(TexturePromise, DockTexture.info.width, DockTexture.info.height, THREEFormat);
					textureStack[TextureStackIndex].anisotropy = TDengine.renderer.capabilities.getMaxAnisotropy();
				}
			}else if (DockTexture.info.format=='PNG'){
				textureStack[TextureStackIndex] = new THREE.DataTexture(TexturePromise, DockTexture.info.width, DockTexture.info.height,THREEFormat);
			}
			textureStack[TextureStackIndex].wrapS=THREE.RepeatWrapping;
			textureStack[TextureStackIndex].wrapT=THREE.RepeatWrapping;
			textureStack[TextureStackIndex].anisotropy = TDengine.renderer.capabilities.getMaxAnisotropy();

			paintDatas(TexturePromise,
				DockTexture.info.width,
				DockTexture.info.height,
				target,
				THREEFormat
			)

			switch (DockTexture.maptype) {
				case 'normal':
					/* imgWorker.postMessage([
						'normalFix',
						TexturePromise, 
						DockTexture.info.width, 
						DockTexture.info.height, 
						target,
						DockTexture.shader
					]); */
					break;
				case 'roughness':
					console.warn(`roughness worker on`);
					
					imgWorker.postMessage([
						'roughnessSwap',
						TexturePromise, 
						DockTexture.info.width, 
						DockTexture.info.height, 
						target,
						DockTexture.shader
					]);
					break;
				default:
					MapTextures(DockTexture)
					break;
			}

		} catch (error) {
			notifyMe(`${error.message} : resetting the ${DockTexture.file} to default Gray`);
			textureStack[TextureStackIndex]= GRAY;
		}
		resolve(true);
	});
}
/**
 * Map an existing texture onto the right shader map slot
 *  * @param {Object} textureObj contain datas from the textureDoc array
 * the object has this property structure {file,maptype,shader});
 * @returns nothing
 */
function MapTextures(textureObj){
	try {
		if (textureObj.hasOwnProperty("file") && textureObj.hasOwnProperty("shader") && textureObj.hasOwnProperty("maptype") && textureObj.hasOwnProperty("entries")){
			var textureMD5Code = getEncodedFileName(textureObj.file);
			var returntexture = textureStack[textureMD5Code]===undefined ? ERROR : textureStack[textureMD5Code];
			if (PARAMS.textureDebug){
				console.log(`Mapping texture`)
				console.log(textureObj);
			}
			textureObj.entries.forEach((toMap)=>{
				switch (toMap.maptype) {
					case "mlmask":
						materialStack[toMap.shader].alphaMap = textureStack[textureMD5Code]
						materialStack[toMap.shader].alphaMap.needsUpdate = true;
						break;
					case "diffuse":
						materialStack[toMap.shader].map = returntexture
						materialStack[toMap.shader].map.needsUpdate = true;
						break;
					case "metalness":
						materialStack[toMap.shader].metalnessMap = returntexture
						materialStack[toMap.shader].metalnessMap.needsUpdate = true;
						break;
					case "emissive":
						materialStack[toMap.shader].emissiveMap = returntexture
						materialStack[toMap.shader].emissiveMap.needsUpdate = true;
						break;
					case "ao":
						materialStack[toMap.shader].aoMap = returntexture
						materialStack[toMap.shader].aoMap.needsUpdate = true;
						break;
					case "alpha":
						materialStack[toMap.shader].alphaMap = returntexture
						materialStack[toMap.shader].alphaMap.needsUpdate = true;
						break;
					case "normaldetail":
						materialStack[toMap.shader].userData.detailNormalMap = returntexture
						materialStack[toMap.shader].uniforms.detailNormalMap.value.needsUpdate = true;
				}
			})
		}else{
			throw new Error('The texture object lack information');
		}
	} catch (error) {
		notifyMe(`MapTextures ${error}`)
	}
}

function getTHREEFormat(textureObject){
	var result = THREE.RGBAFormat;
	if (textureObject?.info.format=='DDS'){
		if (textureObject?.info.bytes!=16){
			switch (textureObject.info?.channels) {
				case 1:
					result = THREE.RedFormat
					break;
				case 2:
					result = THREE.RGFormat;
					break;
				case 3:
					result = THREE.RGBFormat;
					break;
			}
		}
	}
	return result
}

/**
 * Async function that process every texture in the Stack
 * It takes elements from the Texture Doc and than apply
 * to the right shader
 */
async function ProcessStackTextures(){
	texturePromise = textureDock.map((x)=>{return _getFileContent(x)});

	/* textureDock.reduce((previousPromise,nextID)=>{
			return previousPromise.then(()=>{
				return _getFileContent(nextID).then((textureContent)=>{
					nextID.content=textureContent;
				})
			});
		},Promise.resolve())
		.then(()=>{
			//clearTexturePanel();
			//textureDock.forEach((elm, index)=>{	
				
			//}) 
		}).catch((error)=>{
			notifyMe(error);
		}).finally(()=>{

		}) */
				
	clearTexturePanel();
	/**
	 * The approach map a promise the Settle all work in a
	 * bad performance behaviour giving a spike in demanding resources
	 * 
	 * This will run parallel concursive Promise resolution
	 * a best approach as used in main.mjs is tu use an
	 * array and a reduce function into a promise to 
	 * map every texture and then get a series
	 * 
	 * Example as in the RepoBuilder function in main.mjs
	 * conf is an Array of configuration that get a promise
	 * from the wcliPlanner function.
	 * 
	 * conf.reduce((previousPromise,nextID)=>{
					return previousPromise.then(()=>{
						return wcliPlanner(nextID,additionalRef)
					});
				},Promise.resolve())
	 */
	

	Promise.allSettled(texturePromise).then((res)=>{
		
		res.forEach((elm,index)=>{
			if (elm.status=='rejected'){return}

			let target  = (textureDock[index].file).replace('.xbm',`.${textureformat}`)

			if (textureDock[index].file.match(/\.mlmask$/)){ target='maskPainter' } //change the default Canvas target

			let textureIndex = getEncodedFileName(textureDock[index].file)

			var THREEFormat = getTHREEFormat(textureDock[index]) //Default format for PNGs

			if (textureDock[index].info.format=='DDS'){
				textureStack[textureIndex] = new THREE.DataTexture(elm.value,
								textureDock[index].info.width,
								textureDock[index].info.height,
								THREEFormat,
								(textureDock[index].info.bytes==16 ? RGBA16UI : THREE.UnsignedByteType));

				textureStack[textureIndex].minFilter = THREE.LinearFilter;
				textureStack[textureIndex].magFilter = THREE.LinearFilter;
				/* if (textureDock[index].info.bytes==16){
					textureStack[textureIndex] = new THREE.DataTexture(elm.value,
																	textureDock[index].info.width,
																	textureDock[index].info.height,
																	THREEFormat,
																	RGBA16UI);
				}else{

					switch (textureDock[index].info.channels) {
						case 1:
							THREEFormat = THREE.RedFormat
							break;
						case 2:
							THREEFormat = THREE.RGFormat
							break;
						case 3:
							THREEFormat = THREE.RGBFormat
							break;
					}

					textureStack[textureIndex] = new THREE.DataTexture(elm.value,
						textureDock[index].info.width,
						textureDock[index].info.height,
						THREEFormat);
				} */

			}else if (textureDock[index].info.format=='PNG'){
				textureStack[textureIndex] = new THREE.DataTexture(elm.value,
					textureDock[index].info.width,
					textureDock[index].info.height,
					THREEFormat,
				);
				textureStack[textureIndex].minFilter = THREE.LinearFilter;
				textureStack[textureIndex].magFilter = THREE.LinearFilter;
			}

			textureStack[textureIndex].wrapS = textureStack[textureIndex].wrapT = THREE.RepeatWrapping;

			paintDatas(elm.value,
				textureDock[index].info.width,
				textureDock[index].info.height,
				target,
				THREEFormat
			)
			if (PARAMS.textureDebug){ console.log(textureDock[index].maptype,target); }
			
			switch (textureDock[index].maptype) {
				case 'mlmask':
					//Blur here ?
					//texturedatas,width,height,fileNAME,material,channelsTarget,pixels
					/* imgWorker.postMessage([
						'resize',
						{
							data:elm.value,
							width:textureDock[index].info.width,
							height:textureDock[index].info.height,
							layer: MLSB.Editor.layerSelected
						}
					]); */
					MapTextures(textureDock[index])
					break;
				case 'normal':
					imgWorker.postMessage([
						'normalFix',
						elm.value, 
						textureDock[index].info.width, 
						textureDock[index].info.height, 
						target,
						textureDock[index].shader
					]);
					break;
				case 'roughness':
					imgWorker.postMessage([
						'roughnessSwap',
						elm.value, 
						textureDock[index].info.width, 
						textureDock[index].info.height, 
						target,
						textureDock[index].shader
					]);
					console.warn(`roughness worker off`)
					break;
				default:
					MapTextures(textureDock[index])
					break;
			}
			
			if (textureDock[index].shader.userData?.type=='hair'){
				console.log(`hair shader`);
			}
		}),(rejected)=>{
			console.log(rejected);
		}
	}).then(()=>{
		$("#thacanvas").trigger("switchMlayer");
	}).catch((error)=>{
		notifyMe(`ProcessStackTextures ${error}`);
	})
}
/*
This function will load NON default textures from the textureDock
and set them to a shader to the correct map
*/
async function LoadStackTextures(){
	const workdone = await ProcessStackTextures();
	return workdone;
}

function codeMaterials(materialEntry,_materialName){
	if (materialEntry.hasOwnProperty('MaterialTemplate')){
		//switching the code based on the type of the material
		if (materialTypeCheck.decals.includes(materialEntry.MaterialTemplate)){

			var Rdecal = materialBASE.clone();
			var decalConfig = {name:_materialName,userData:{type:'decal'},color:0xFFFFFF,transparent:true,alphaTest:0.05, side:THREE.DoubleSide, depthWrite :true}
			
			//Decal Textures
			if (materialEntry.Data.hasOwnProperty('DiffuseTexture')){
				//MD5 the name of the file to load or import it
				decalConfig.map = retDefTexture(materialEntry.Data.DiffuseTexture,_materialName,"diffuse");
			}

			if ('UseNormalAlphaTex' in materialEntry?.Data){
				if (materialEntry.Data.UseNormalAlphaTex > 0 ){
					decalConfig.alphaTest = 0.02;
					decalConfig.alphaMap = retDefTexture(materialEntry.Data.NormalAlphaTex,_materialName,"normal");
				}
			}
			
			if (materialEntry?.Data.hasOwnProperty('NormalTexture')){
				let nmMD5Code = getEncodedFileName(materialEntry.Data.NormalTexture)
				decalConfig.normalMap = retDefTexture(materialEntry.Data.NormalTexture,_materialName,"normal");
			}

			if (materialEntry?.Data.hasOwnProperty('MetalnessTexture')){
				decalConfig.metalnessMap =retDefTexture(materialEntry.Data.MetalnessTexture,_materialName,"metalness");
				decalConfig.metalness = materialEntry.Data.MetalnessScale
			}

			if (materialEntry?.Data.hasOwnProperty('RoughnessTexture')){
				decalConfig.roughnessMap = retDefTexture(materialEntry.Data.RoughnessTexture,_materialName,"roughness");
				decalConfig.roughnessMap.needsUpdate = true
				decalConfig.roughness = materialEntry.Data.RoughnessScale
			}
			
			//Color over textures
			if (materialEntry.Data.hasOwnProperty('DiffuseColor')){
				decalConfig.color = new THREE.Color(`rgb(${materialEntry.Data.DiffuseColor.Red},${materialEntry.Data.DiffuseColor.Green},${materialEntry.Data.DiffuseColor.Blue})`);
				decalConfig.opacity = (materialEntry.Data.DiffuseColor.Alpha/255)
			}

			if (materialEntry.Data.hasOwnProperty('DiffuseAlpha')){
				decalConfig.alphaTest=materialEntry.Data.DiffuseAlpha;
			}
			
			decalConfig.name=_materialName;
			Rdecal.setValues(decalConfig);
			return Rdecal
		}

		if (materialTypeCheck.metal_base.includes(materialEntry.MaterialTemplate)){

			var Rbase = materialBASE.clone();
			var rbaseConfig = {name:_materialName,userData:{type:'metal'},side:THREE.DoubleSide}

			if (materialEntry.Data.hasOwnProperty('AlphaThreshold')){
				rbaseConfig.opacity = materialEntry.Data.AlphaThreshold;
			}
			//Texture information
			if (materialEntry.Data.hasOwnProperty('BaseColor')){
				rbaseConfig.map = retDefTexture(materialEntry.Data.BaseColor,_materialName,"diffuse");
			}
			//Color applyed over textures
			if (materialEntry.Data.hasOwnProperty('BaseColorScale')){
				rbaseConfig.color = new THREE.Color().setRGB(
					parseFloat(materialEntry.Data.BaseColorScale.X),
					parseFloat(materialEntry.Data.BaseColorScale.Y),
					parseFloat(materialEntry.Data.BaseColorScale.Z))
			}

			if (materialEntry.Data.hasOwnProperty('Normal')){
				rbaseConfig.normalMap = retDefTexture(materialEntry.Data.Normal,_materialName,"normal");
				rbaseConfig.normalScale =  parseFloat(materialEntry.Data.NormalStrength).toPrecision(2);
			}

			if (materialEntry.Data.hasOwnProperty('Roughness')){
				rbaseConfig.roughnessMap = retDefTexture(materialEntry.Data.Roughness,_materialName,"roughness");
				rbaseConfig.roughness = materialEntry.Data.RoughnessScale
			}

			if (materialEntry.Data.hasOwnProperty('Metalness')){
				rbaseConfig.metalnessMap = retDefTexture(materialEntry.Data.Metalness,_materialName,"metalness");
				rbaseConfig.metalness = materialEntry.Data.MetalnessScale
			}
			
			Rbase.setValues(rbaseConfig);
			Rbase.normalMap.needsUpdate = true;
			return Rbase
		}


		if (materialTypeCheck.multilayer.includes(materialEntry.MaterialTemplate)){
			var Mlayer = stdMaterial.clone()
			Mlayer.map=GRAY;
			Mlayer.name = _materialName;

			Mlayer.defines.MLSBInspect = false;
			Mlayer.defines.USE_DETAILNORMAL = true;

			Mlayer.userData.detailNormalScale = 1.0;
			Mlayer.userData.detailNormalMap = FlatNORM;
			Mlayer.userData.detailNormalMap.updateMatrix();
			Mlayer.userData.detailNormalTransform =  Mlayer.userData.detailNormalMap.matrix;

			/**
			 * 
			 RoughLevel and MetalLevel are
			 multiply-add parameter
			 the param 0 is the multiply part
			 the param 1 is the add components
			 */

			/*
			 * 
			 * https://github.com/mrdoob/three.js/tree/dev/src/renderers/shaders/ShaderChunk 
			 */
			Mlayer.onBeforeCompile = (shader)=>{
				shader.uniforms.roughLevel = {value:new THREE.Vector2(1,0)};
				shader.uniforms.metalLevel = {value:new THREE.Vector2(0,1)};
				shader.uniforms.detailNormalScale = {value:Mlayer.userData.detailNormalScale};
				shader.uniforms.detailNormalMap = {value: Mlayer.userData.detailNormalMap};
				shader.uniforms.detailNormalTransform = {value: new THREE.Matrix3(Mlayer.userData.detailNormalTransform)};
			
				/** VERTEX SHADER for global and detail normals */
				let vertexElementCode = document.getElementById("vertexShader");
				let fragmentElementCode = document.getElementById("fragmentShader");

				/*TODO push materials normal into detailNormalMap and use the detailNormalMapScale power  */
				/** FRAGMENT SHADER form global and detail normals
				 * default space for normals is TangentSpace NormalMap
				 */
				/**
				 * //Texture Blending in HSL
	float3 blend_linear(float4 n1, float4 n2)
	{
		float3 r = (n1 + n2)*2 - 2;
		return normalize(r);
	}

	float3 blend_overlay(float4 n1, float4 n2)
	{
		n1 = n1*4 - 2;
		float4 a = n1 >= 0 ? -1 : 1;
		float4 b = n1 >= 0 ?  1 : 0;
		n1 =  2*a + n1;
		n2 = n2*a + b;
		float3 r = n1*n2 - a;
		return normalize(r);
	}

	float3 blend_pd(float4 n1, float4 n2)
	{
		n1 = n1*2 - 1;
		n2 = n2.xyzz*float4(2, 2, 2, 0) + float4(-1, -1, -1, 0);
		float3 r = n1.xyz*n2.z + n2.xyw*n1.z;
		return normalize(r);
	}

	float3 blend_whiteout(float4 n1, float4 n2)
	{
		n1 = n1*2 - 1;
		n2 = n2*2 - 1;
		float3 r = float3(n1.xy + n2.xy, n1.z*n2.z);
		return normalize(r);
	}

	float3 blend_udn(float4 n1, float4 n2)
	{
		float3 c = float3(2, 1, 0);
		float3 r;
		r = n2*c.yyz + n1.xyz;
		r =  r*c.xxx -  c.xxy;
		return normalize(r);
	}

	float3 blend_rnm(float4 n1, float4 n2)
	{
		float3 t = n1.xyz*float3( 2,  2, 2) + float3(-1, -1,  0);
		float3 u = n2.xyz*float3(-2, -2, 2) + float3( 1,  1, -1);
		float3 r = t*dot(t, u) - u*t.z;
		return normalize(r);
	}

	float3 blend_unity(float4 n1, float4 n2)
	{
		n1 = n1.xyzz*float4(2, 2, 2, -2) + float4(-1, -1, -1, 1);
		n2 = n2*2 - 1;
		float3 r;
		r.x = dot(n1.zxx,  n2.xyz);
		r.y = dot(n1.yzy,  n2.xyz);
		r.z = dot(n1.xyw, -n2.xyz);
		return normalize(r);
	}
				 */
				//console.log(shader.vertexShader);
				/* shader.vertexShader = shader.vertexShader
				.replace(`#include <uv_pars_vertex>`,
	`#include <uv_pars_vertex>\nuniform mat3 detailNormalTransform;\nvarying vec2 detailNormalUV;`
				)
				.replace(`#include <uv_vertex>`,
	`#include <uv_vertex>
	detailNormalUV = ( detailNormalTransform * vec3( uv, 1 ) ).xy;
	`); */


	vertexElementCode.value = PARAMS.normalMerger ? normalMerger.vertexShader: shader.vertexShader;

				/* .replace(`#include <clipping_planes_pars_fragment>`,
	`#include <clipping_planes_pars_fragment>
		vec3 reconstruct_normal(vec2 rg_channels) {
		// Decompress the red and green channels from the [0, 1] texture range 
		// to the view-space [-1, 1] range.
		vec2 normal_xy = rg_channels * 2.0 - 1.0;

		// Calculate the blue channel (Z component) using the Pythagorean theorem.
		// The vector is normalized, so x^2 + y^2 + z^2 = 1.
		float normal_z = sqrt(1.0 - dot(normal_xy, normal_xy));

		// Combine the channels to form the final normal vector.
		return vec3(normal_xy, normal_z);
	}
	`) */

				shader.fragmentShader = shader.fragmentShader
	.replace("#define STANDARD",
		"#define STANDARD\nuniform sampler2D detailNormalMap;\nuniform float detailNormalScale;\n")
	.replace(`#include <normal_fragment_maps>`,
	`
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	
	vec3 DN = texture2D( detailNormalMap , vMapUv ).xyz;
    DN.xy *= .8;
	float z = sqrt(1.0 - dot(DN.rg, DN.rg));
	DN = vec3(DN.rg, z) * 2.0 - 1.0;

	normal = normalize(tbn * normalize(vec3(mapN.xy + DN.xy , mapN.z)));
	//normal = normalize(tbn * mapN);
	`
	)
	.replace(`#include <roughnessmap_fragment>`,
		`float roughnessFactor = roughness;
		#ifdef USE_ROUGHNESSMAP
			vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv ).rgba;
			// reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
			roughnessFactor *= texelRoughness.g;
		#endif
		`)
	
			
					//normal = normalize( tbn * mapN );
				shader.fragmentShader = shader.fragmentShader
					.replace(
						`#include <color_fragment>`,
	`#include <color_fragment>
	vec4 colorInspect = vec4(1,0,0,1);
	#ifdef MLSBInspect
		diffuseColor = colorInspect;
	#else
		diffuseColor = diffuseColor;
	#endif`);
				
				fragmentElementCode.value = PARAMS.normalMerger ? normalMerger.fragmentShader: shader.fragmentShader;
			}
			/**
			 * MeshStandardNodeMaterial
			 * var globalNormal = new THREE.NormalNode( );
			 * var materialNode = new THREE.NormalNode( );
			 * r = normalize(float3(n1.xy + n2.xy, n1.z));
			 */
			Mlayer.userData={name:_materialName,type:'multilayer',GlobalNormal:null};

			if (PARAMS.switchTransparency){
				//activate transparency not, maskAlpha
				Mlayer.transparent=true
				Mlayer.alphaTest=0.0
			}else{
				//go back to mask the material with alphaTest Value
				Mlayer.transparent=false
				Mlayer.alphaTest=PARAMS.maskChannel
			}
			//Mlayer.transparent=true;
			//Mlayer.alphaTest = PARAMS.maskChannel;
			if (materialEntry?.Data.hasOwnProperty('MultilayerMask')){
				
				//name of the Actual layer textures to be loaded will be stored
				Mlayer.alphaMap = retDefTexture(materialEntry.Data.MultilayerMask,_materialName,"mlmask");
				Mlayer.alphaMap.needsUpdate = true;
				Mlayer.mask = materialEntry.Data.MultilayerMask;
			}

			if (materialEntry?.Data.hasOwnProperty('GlobalNormal')){
				var normMD5Code = getEncodedFileName(materialEntry.Data.GlobalNormal)
				Mlayer.userData.GlobalNormal = normMD5Code;
				
				if (textureStack[normMD5Code]===undefined){
					textureStack[normMD5Code] = retDefTexture(materialEntry.Data.GlobalNormal,_materialName,"normal");
					textureStack[normMD5Code].wrapS = THREE.RepeatWrapping
					textureStack[normMD5Code].wrapT = THREE.RepeatWrapping
					textureStack[normMD5Code].userData.type="globalnormal";
				}

				Mlayer.normalMap = textureStack[normMD5Code];
			}else{
				Mlayer.normalMap = FlatNORM;
			}
			if (Mlayer.hasOwnProperty("normalMap")){
				Mlayer.normalMap.needsUpdate = true;
			}
			Mlayer.needsUpdate = true;
			return Mlayer
		}

		if (materialTypeCheck.fx.includes(materialEntry.MaterialTemplate)){
			
			let actualMaterial = lambertType.clone();
			let fxConfig = {name:_materialName,userData:{type:'fx'},color:0xFFFFFF};

			if (materialEntry?.Data.hasOwnProperty('Emissive')){
				fxConfig.emissiveIntensity = parseFloat(materialEntry?.Data.Emissive);
			}
			if (materialEntry?.Data.hasOwnProperty('EmissiveColor')){
				fxConfig.emissive = new THREE.Color(`rgb(${materialEntry.Data.EmissiveColor.Red},${materialEntry.Data.EmissiveColor.Green},${materialEntry.Data.EmissiveColor.Blue})`)
			}

			actualMaterial.setValues(fxConfig);
			return actualMaterial;
		}

		if (materialTypeCheck.hair.includes(materialEntry.MaterialTemplate)){
			var configHair = {name:_materialName};
			var actualMaterial = materialHair.clone();
			

			if (materialEntry?.Data.hasOwnProperty('Strand_Gradient')){
				configHair.map = retDefTexture(materialEntry.Data.Strand_Gradient,_materialName,"diffuse");
				configHair.map.needsUpdate = true;
			}

 			if (materialEntry?.Data.hasOwnProperty('Strand_Alpha')){
				configHair.alphaMap = retDefTexture(materialEntry.Data.Strand_Alpha,_materialName,"alpha");
				configHair.alphaTest = 0.03;
				configHair.alphaMap.needsUpdate = true;
			}

			if (materialEntry?.Data.hasOwnProperty('Strand_ID')){

			}
			
			//console.log(configHair);

			actualMaterial.setValues(configHair);
			return actualMaterial;
		}


		if (materialTypeCheck.skin.includes(materialEntry.MaterialTemplate)){

			var skin = stdMaterial.clone();
			var skinConfig = {name:_materialName,userData:{type:'skin'},color:0xFFDABE};

			//console.warn('skin',materialEntry,'skin');

			if (materialEntry?.Data.hasOwnProperty('TintColor')){
				skinConfig.color = new THREE.Color(`rgb(${materialEntry.Data.TintColor.Red},${materialEntry.Data.TintColor.Green},${materialEntry.Data.TintColor.Blue})`);
				skinConfig.opacity = parseFloat(materialEntry.Data.TintColor.Alpha/255);
			}
			
			if (materialEntry?.Data.hasOwnProperty('Albedo')){
				skinConfig.map = retDefTexture(materialEntry.Data.Albedo,_materialName,"diffuse");
				skinConfig.map.needsUpdate = true;
			}

			if (materialEntry.Data.hasOwnProperty('Normal')){
				skinConfig.normalMap = retDefTexture(materialEntry.Data.Normal,_materialName,"normal");
				skinConfig.normalScale= new THREE.Vector2(0,materialEntry.Data.DetailNormalInfluence);
				skinConfig.normalMap.needsUpdate = true
			}

			if (materialEntry.Data.hasOwnProperty('Roughness')){

				skinConfig.roughnessMap = retDefTexture(materialEntry.Data.roughnessMap,_materialName,"roughness");
				skinConfig.roughnessMap.needsUpdate =true;
				skinConfig.metalnessMap = skinConfig.roughnessMap;
			}

			skin.setValues(skinConfig);
			return skin;
		}

		if (materialTypeCheck.glass.includes(materialEntry.MaterialTemplate)){
			var glassMe = materialGlass.clone();
			glassMe.setValues({name:_materialName});
			return glassMe
		}

		return materialNoneToCode;
	}
	return materialNone;
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
				//Reset multilayer list for appearances
				window.dispatchEvent(new CustomEvent('uicleanMlmaterial'));
/* 				$("#Mlswitcher").html("");
				$("#mLayerOperator").html(""); */
				
				var multilayerSwitch ="";
				var multilayerMaskMenu = "";
				var materialLoaded = false;

				if (materialLoaded = materialJSON.import(tempMaterial)){
					//retrieve for the first appearance the materials
					materialJSON.Appearances[0].Materials.forEach((material)=>{
						materialSet.add(material);
					})
					//Build every unique material entry to be applyed to
					materialSet.forEach((material)=>{
						materialStack[material] = codeMaterials(materialJSON.Materials.filter(el => el.Name == material)[0],material);

						let entry, idx
						idx = materialJSON.findIndex(material)
						
						if (entry = materialJSON.find(material)){
							if (materialTypeCheck.multilayer.includes(entry.MaterialTemplate)){
								multilayerSwitch+= materialJSON.codeMaterial(idx,`<div class="form-check"><label for="mlt_$_MATERIALID" class="form-check-label" >$_MATERIALNAME</label><input class="form-check-input" type="radio" id="mlt_$_MATERIALID" name="multilayerSel" data-material="$_MATERIALFULLNAME" value="$_MATERIALID"></div>`);

								multilayerMaskMenu += materialJSON.codeMaterial(idx,`<li><a class="dropdown-item" href="#" data-multilayer="${idx}" >$_MATERIALFULLNAME</a></li>`);
							}
						}else{
							notifyMe(`${material} not present`)
						}
					});
				}

				// Defer textureDock;
				if (materialLoaded){
					const materialEventData = {
						detail:{
							mlSwitch:multilayerSwitch,
							mlMaskMenu:multilayerMaskMenu,
							appeInfo: materialJSON.codeAppearances(),
							appeSwitch: materialJSON.codeAppearances(`<li><a class="dropdown-item" data-name='$APPEARANCE$'>$APPEARANCE$</a></li>`)
						}
					}
					window.dispatchEvent(new CustomEvent("uiLoadMaterial",materialEventData));
				}else{
					//Appearances building
					window.dispatchEvent(new CustomEvent("uiResetAppearance"));
					throw new Error("Failed the Material Import");
				}
			}else{
				//TODO create the basic material
				console.info("No Material file present, build a basic Multilayer one");
			}
			resolve();
		} catch (error) {
			notifyMe(error,true);
			reject("No Material file");
		}
		
	} );
}

function LoadModel(path){
	return new Promise((resolve,reject)=>{
		//var subsCheckText = '';
		var subsCheckUVs = '';
		path = path.replaceAll(/\//g,'\\'); //setup the right path to be requested
		var modelfile;
	
		if (/^[\w|\W]:\\.+/.test(path)){
			modelfile = thePIT.ApriStream(path,'binary',true)
		}else{
			modelfile = thePIT.ApriStream(path,'binary')
		}
		
		var modelstring = string2arraybuffer(modelfile);

		if (modelfile.length > 0){
			$(window).trigger('cleanTweakPanes');
			/*
			remove all the submesh toggle buttons
			remove all the buttons in the uv calculator
			*/
			$(window).trigger('uiResetMeshes');

			MLSB.TreeD.model.bones = false;

			MDLloader.parse( modelstring ,'', ( glbscene ) => {
				glbscene.scene.traverse( function ( child ) {
					
					if (child.type=="Bone"){
						//Boned ||= true;
						MLSB.TreeD.model.bones = true;
					}

					if ((child.type=="SkinnedMesh") && (PARAMS.modelDebug)) {
						console.log(child.name,child.userData?.materialNames[0]);
					}

					if (child.isMesh){
						if (child.userData?.materialNames){
							//Submesh Enabler UI
							let check = {
								name:child.name,
								material:child.userData.materialNames[0]
							}

							PARAMS.listSubmeshes[child.name]=true;
							$(window).trigger('uiPushMeshes',check);
							
							try {
								//Assign the Material
								if (!child.userData.hasOwnProperty('materialNames')){
									notifyMe(`Need a MaterialName for {child.name}`)
								}else{
									//child.material = normalMerger;
									child.material = materialStack[child.userData?.materialNames[0]];
								}
								child.material.needsUpdate=true;
							} catch (error) {
								notifyMe(`${error}, switching to none Material`);
								child.material = materialNone;
								child.material.needsUpdate=true;
							}
						}else{
							//If isn't coded it apply a default lambertMaterial
							child.material = materialNone;
						}
						//set to display the submesh
						child.visible = true;
					}
				})
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
				$(window).trigger("uiUpdMeshes");
				resolve(true);
			})		
		}else{
			notifyMe(`${path} empty file ??? No model to display i guess`);
			reject();
		}
	});
}

function traverseModel(subject,options){
	var intOptions
	if (typeof(options)!="object"){
		intOptions = {resetCamera:false}
	}else{
		intOptions = options
	}

	return new Promise((resolve,reject)=>{
		if (subject?.isScene){
			subject.scene.traverse( function( child ) {
				console.log(child)
			})
			resolve(true);
		}else{
			reject(false);
		}
	})
}

function calcOffset(tiles,h,v){
	h = parseFloat(h)
	v = parseFloat(v)
	tiles = parseFloat(tiles);
	var tjsBottom = 0;
	var ratio = 1/tiles
	var calculated = {h:0,v:0}
	
	calculated.h = h < 0 ? (parseFloat(1+h)) % 1 : h;
	calculated.v = v < 0 ?  (parseFloat(1+v)) % 1 : v;
	
	calculated.v =  calculated.v - (((1 - calculated.v) - calculated.v) * 2)

	while (calculated.v < 0){
		calculated.v = calculated.v + 1.0
	}


	h = parseFloat(calculated.h);
	v = parseFloat(calculated.v);
	
	if (PARAMS.textureDebug){ console.log(tiles,h,v)}
	var horizontal, vertical

	horizontal = parseFloat(h).toPrecision(4);
	vertical = parseFloat(v).toPrecision(4);

	return new THREE.Vector2(horizontal,vertical)
}

/**
 * TODO Still not used
 * @param {object} material 
 * @returns 
 */
function composeMultilayerMaterial(material){
	const defaultMaterial = {
		color: new THREE.Color( 1, 0 ,0 ),
		map: GRAY,
		metalnessMap:GRAY,
		roughnessMap:GRAY,
		normalDetailMap:FlatNORM,
	};
	const materialObj = defaultMaterial;

	return materialObj;
}

$("#thacanvas").on("mouseover",function(event){
	//is shift is pressed change the material, if it's release put it back
	if (MLSB.Key.shiftPress){
	}
}).on("mouseout",function(event){
	//only when mouseout occur
	TDengine.scene.traverse(oggetti=>{
		if ((oggetti.type=="SkinnedMesh") && (oggetti.material.name=='MLSBlegacy')){
			console.log(oggetti);
		}
	})
}).on('loadScene',function(event,fileModel){
	/*
    Need a Promise and the use of then

	Load Materials
		if there is no Material file try to export it
	Load First Layer mask
		if not found replace with a def. one and disable all layers except 0
	Load the Models and Apply Materials
	*/
	//cleanScene();

	var materialFile = fileModel.replace(/\.glb$/,'.Material.json')
	
	//console.log(TDengine.scene);
	/* cleanScene().
	then((ev)=>{
		MLSBConfig.then((config)=>{
			actualExtension=config.maskformat;
		}).then((ev)=>{
			LoadMaterials(materialFile)
			.then((ev)=>{
				firstModelLoaded=true;
				$("#layeringsystem li").removeClass("active");
				$("#layeringsystem li").eq(MLSB.Editor.layerSelected).addClass("active");

				LoadModel(fileModel)
				.then((ev)=>{
					//load deferred textures in the textureDock
					LoadStackTextures();
					firstModelLoaded=true;
				}).catch((error)=>{
					notifyMe(`LoadModel ${error}`);
				})
			},
			(ev)=>{
				notifyMe(ev);
			}).catch((error)=>{
				notifyMe(`LoadMaterials ${error}`);
			})
		}).catch((error)=>{
			notifyMe(`LoadScene ${error}`);
		});
	}); */

	cleanScene()
		.then(()=>{
			 //check the size of the window
			 resize();
			})
		.then(()=>{ return MLSBConfig})
		.then((config)=>{actualExtension=config.maskformat;},chainError)
		.then(()=>{return LoadMaterials(materialFile);},chainError)
		.then(()=>{
			firstModelLoaded=true;
			$("#layeringsystem li").removeClass("active");
			$("#layeringsystem li").eq(MLSB.Editor.layerSelected).addClass("active");
			TDNormalMerger.scene.children[0].material = normalMerger;
			TDNormalMerger.scene.children[0].material.needsUpdate = true;
			return LoadModel(fileModel);
			}
			,chainError)
		.then(()=>{
			firstModelLoaded=true;
			return LoadStackTextures();
			}
			,chainError)
		.catch((error)=>{
			notifyMe(`LoadScene ${error}`);
		});
		
}).on('changeBg',function(ev){
	$("#thacanvas").css("background-color",PARAMS.bkgColors);
}).on('loadMaterials',function(ev){
	/*
	Check if there is loaded a model, otherwize
	Load the Materials
	*/
}).on('toggleMesh',function(ev,name,toggle){
	TDengine.scene.traverse(oggetti=>{
		if (oggetti.name==name.trim()){
			oggetti.visible=toggle;
		}
	})
}).on('switchMlayer',function(ev){
	let selected = activeMLayer();
	if (materialStack[selected]?.userData.hasOwnProperty("layers")){
		$(window).trigger("limitLayers",materialStack[selected].userData.layers);
	}
}).on('renderMaterial',function(ev,layerMaterial){
	if (sceneLoaded()){
		let selected = activeMLayer();
		//check if the material Has a diffuse map
		var repVal = layerMaterial?.xTiles * parseFloat($("#layerTile").val());
		var offset_h, offset_v

		[offset_h, offset_v] = getOffsetValues();

		var offset = calcOffset(repVal,offset_h,offset_v);
		matrixTransform.offsetX = offset.x
		matrixTransform.offsetY = offset.y
		matrixTransform.repeat = repVal

		if ((layerMaterial.hasOwnProperty('diffuse')) && (layerMaterial?.diffuse?.texture!='' || layerMaterial?.diffuse?.texture!=null)){
			if (PARAMS.textureDebug){
				console.log(layerMaterial)
			}
			//find is the file was already loaded somewhere and reuse-it
			var myTex = textureDock.filter(elm=>elm.file==layerMaterial.diffuse.texture);
			let C_diffuse = getEncodedFileName(layerMaterial.diffuse.texture).toString();
			//Repeating of the textures

			if (myTex?.length==1){
				//there was it, map it
				materialStack[selected].map = textureStack[C_diffuse];
				materialStack[selected].needsUpdate = true;
			}else{
				
				let test = retDefTexture(layerMaterial.diffuse.texture,selected,"diffuse");
				let tInd = textureDock.findIndex((elm) => elm.file==layerMaterial.diffuse.texture)

				var texProm = _getFileContent(textureDock[tInd])
					.then((texturePromised)=>{
						if (texturePromised.status=='rejected'){
							notifyMe(`There was a problem loading the texture ${layerMaterial.diffuse.texture}`)
							return
						}
						genDataTexture(texturePromised,textureDock[tInd],C_diffuse).then((response)=>{
							if (PARAMS.textureDebug){console.log(textureStack[C_diffuse])}
							//repVal = layerMaterial.xTiles * parseFloat($("#layerTile").val())

							materialStack[selected].map = textureStack[C_diffuse]
							materialStack[selected].map.wrapS = materialStack[selected].map.wrapT = THREE.RepeatWrapping;
							materialStack[selected].map.needsUpdate=true;
						}).catch((error)=>{
							notifyMe(error.message);
							console.error('error #%d',error)
							console.log(layerMaterial)
						})
						//materialStack[selected].needsUpdate = true;
				}).catch((err)=>{
					notifyMe(err);
				})
				
			}
		}
		/** roughness management */
		if (layerMaterial.hasOwnProperty('roughness')) {
			//it has roughness with a texture
			let test = checkMaps(layerMaterial.roughness.texture);
			//retDefTexture
			if (test < 0){
				//custom map
				//find is the file was already loaded somewhere and reuse-it
				var myTex = textureDock.filter(elm=>elm.file==layerMaterial.roughness.texture);
				let C_rough = getEncodedFileName(layerMaterial.roughness.texture).toString();
				
				if (myTex?.length==1){
					//there was it, map it
					materialStack[selected].roughnessMap = textureStack[C_rough];
					materialStack[selected].roughnessMap.flipY = flippingdipping;
					materialStack[selected].roughnessMap.offset=offset;
					materialStack[selected].roughnessMap.repeat.set(repVal,repVal);
					materialStack[selected].roughnessMap.needsUpdate = true;
				}else{
					test = retDefTexture(layerMaterial.roughness.texture,selected,"rough");
					let tInd = textureDock.findIndex((elm) => elm.file==layerMaterial.roughness.texture)

					var texProm = _getFileContent(textureDock[tInd])
						.then((texturePromised)=>{
							return genDataTexture(texturePromised,textureDock[tInd],C_rough)
						}).then((response)=>{
							if (PARAMS.textureDebug){console.log(textureStack[C_rough])}
							materialStack[selected].roughnessMap = textureStack[C_rough]
							materialStack[selected].roughnessMap.offset=offset;
							materialStack[selected].roughnessMap.repeat.set(repVal,repVal);
							materialStack[selected].roughnessMap.needsUpdate =true
						}).catch((error)=>{
							notifyMe(error.message);
							console.error('error #%d',error)
						})
				}
			}else{
				materialStack[selected].roughnessMap = retDefTexture(layerMaterial.roughness.texture);
				materialStack[selected].roughnessMap.flipY = flippingdipping;
				materialStack[selected].roughnessMap.needsUpdate =true
			}
		}
		/**metallness management */
		if (layerMaterial.hasOwnProperty('metal')) {
			//it has metallness with a texture
			let test = checkMaps(layerMaterial.metal.texture);
			//retDefTexture
			if (test < 0){
				//custom map
				//find is the file was already loaded somewhere and reuse-it
				var myTex = textureDock.filter(elm=>elm.file==layerMaterial.metal.texture);
				let C_metal = getEncodedFileName(layerMaterial.metal.texture).toString();
				
				if (myTex?.length==1){
					//there was it, map it
					materialStack[selected].metalnessMap = textureStack[C_metal];
					materialStack[selected].metalnessMap.flipY = flippingdipping;
					materialStack[selected].metalnessMap.needsUpdate =true
				}else{
					test = retDefTexture(layerMaterial.metal.texture,selected,"metal");
					let tInd = textureDock.findIndex((elm) => elm.file==layerMaterial.metal.texture)

					var texProm = _getFileContent(textureDock[tInd])
						.then((texturePromised)=>{
							return genDataTexture(texturePromised,textureDock[tInd],C_metal);
						}).then((response)=>{
								if (PARAMS.textureDebug){console.log(textureStack[C_metal])}

								materialStack[selected].metalnessMap = textureStack[C_metal]
								//materialStack[selected].metalnessMap.repeat.set(repVal,repVal);
								materialStack[selected].metalnessMap.flipY = flippingdipping;
								//materialStack[selected].metalnessMap.offset=offset;
								materialStack[selected].metalnessMap.needsUpdate =true
						}).catch((error)=>{
							console.log(layerMaterial.metal.texture);
							notifyMe(error.message);
							console.error('error #%d',error)
						})
				}
			}else{
				materialStack[selected].metalnessMap = retDefTexture(layerMaterial.metal.texture);
				materialStack[selected].metalnessMap.needsUpdate =true
			}
		}
		/**normal management */
		if (PARAMS.normalMerger){
			setNormalMergeCanvasSize(materialStack[selected].normalMap.source.data.width);
		}
		// load the material normal
		if (layerMaterial.hasOwnProperty('normal')) {
			//TODO continue in rendermaterial and blend material + core model normals
			var myTex = textureDock.filter(elm=>elm.file==layerMaterial.normal.texture);
			let C_normal = getEncodedFileName(layerMaterial.normal.texture);

			if (myTex?.length==1){
				materialStack[selected].detailnormal = textureStack[C_normal];
				materialStack[selected].detailnormal.needsUpdate =true
			}else{
				
				let test = retDefTexture(layerMaterial.normal.texture,selected,"normaldetail");

				let tInd = textureDock.findIndex((elm) => elm.file==layerMaterial.normal.texture)
				console.log(selected,layerMaterial.normal.texture);
				var texProm = _getFileContent(textureDock[tInd])
				.then((texturePromised)=>{
					return genDataTexture(texturePromised,textureDock[tInd],C_normal);
				})
				.then((response)=>{
					//paintDatas(textureStack[C_normal].data)
					//normalMerge
					//TODO texture read, to continue you have to plug it into the shader and 
					if (PARAMS.textureDebug){console.log(textureStack[C_normal])}
					if (PARAMS.normalMerger){
						normalMerger.uniforms.globalnormal.value = textureStack[materialStack[selected].userData.GlobalNormal];
						normalMerger.uniforms.detailnormal.value = textureStack[C_normal];
						normalMerger.uniforms.globalnormal.value.needsUpdate = true;
						normalMerger.uniforms.detailnormal.value.needsUpdate = true;
					}else{
						materialStack[selected].userData.detailNormalMap = FlatNORM;
						materialStack[selected].userData.detailNormalMap = textureStack[C_normal];
						materialStack[selected].userData.detailNormalMap.needsUpdate =true;
					}

				}).catch((error)=>{
					if (PARAMS.textureDebug){console.log(layerMaterial.normal.texture)}
					notifyMe(error.message);
					console.error('error #%d',error)
				})
			} 
		}
		if (PARAMS.normalMerger){
			resetDetailNormal()
		}
		updateUvTransform();
	}
}).on("texOffset",function(ev,source='layer'){
	var tileMul = parseFloat($("#layerTile").prev("[data-mul]").data("mul"))
	var tileValue = tileMul * parseFloat(source =='ui' ? $("#layerTile").val() : mLsetup.Layers[MLSB.Editor.layerSelected].tiles).toPrecision(4);
	var offsetX = parseFloat(source =='ui' ? $("#layerOffU").val() : mLsetup.Layers[MLSB.Editor.layerSelected].offsetU).toPrecision(4);
	var offsetY = parseFloat(source =='ui' ? $("#layerOffV").val() : mLsetup.Layers[MLSB.Editor.layerSelected].offsetV).toPrecision(4);

	if (sceneLoaded()){
		var offset = calcOffset(tileValue,offsetX,offsetY) //new THREE.Vector2(h,(v==-0 ? 0 : v));
		matrixTransform.repeat = tileValue
		matrixTransform.offsetX = parseFloat(offset.x).toPrecision(4)
		matrixTransform.offsetY = parseFloat(offset.y).toPrecision(4)
		updateUvTransform()
	}
}).on("texTiled",function(ev,source='layer'){
	if (sceneLoaded()){
		var tileValue = mLsetup.Layers[MLSB.Editor.layerSelected].tiles;
		if (source == 'ui'){
			tileValue = $("#layerTile").val();
		}
		var offsetX = parseFloat(source =='ui' ? $("#layerOffU").val() : mLsetup.Layers[MLSB.Editor.layerSelected].offsetU).toPrecision(4);
		var offsetY = parseFloat(source =='ui' ? $("#layerOffV").val() : mLsetup.Layers[MLSB.Editor.layerSelected].offsetV).toPrecision(4);
		var offset = calcOffset(tileValue,offsetX,offsetY) //new THREE.Vector2(h,(v==-0 ? 0 : v));
		matrixTransform.offsetX = parseFloat(offset.x).toPrecision(4)
		matrixTransform.offsetY = parseFloat(offset.y).toPrecision(4)
		
		//Used to switch the mask layer used on the multilayer material
		let selected = activeMLayer();
		var actualMaterial = MLSB.getMaterial();
		var repChange = actualMaterial.xTiles * parseFloat(tileValue).toPrecision(4);
		matrixTransform.repeat = parseFloat(repChange).toPrecision(4);
		updateUvTransform()
		materialStack[selected].needsUpdate = true;
	}
}).on('switchLayer',function(ev,layer=0){
	if (sceneLoaded()){
		
		//Used to switch the mask layer used on the multilayer material
		let selected = activeMLayer();

		if (materialStack[selected]!=undefined){
			if (materialStack[selected].hasOwnProperty("mask")){
				var test = _getFileContent({file:materialStack[selected].mask,maptype:'mlmask',shader:selected})
					.then((result)=>{
						var myMask = textureDock.filter(elm=>elm.file==materialStack[selected].mask)
						if (myMask?.length==1){
							//var LAYER = 
							let nameMask = getEncodedFileName(materialStack[selected].mask).toString()
							
							try{
								if (myMask[0].hasOwnProperty("info")){
									
									paintDatas(result,myMask[0].info.width,myMask[0].info.height,'maskPainter',THREE.RGBAFormat)
									/* window.dispatchEvent(new CustomEvent("setMask",{
										detail:{
											data:
											width:
											height:
											layer:
										}
									})) */
									textureStack[nameMask] = new THREE.DataTexture(result,myMask[0].info.width,myMask[0].info.height,THREE.RGBAFormat)
								}
							}catch(error){
								console.log(myMask);
								notifyMe(error);
							}

							materialStack[selected].setValues({
								alphaMap:textureStack[nameMask],
								opacity: PARAMS.opacityPreview ? opacityCheck($("#layerOpacity").val()) : 1.0
							})

							materialStack[selected].alphaMap.flipY = flippingdipping;
							materialStack[selected].alphaMap.needsUpdate = true;
							$('#thacanvas').trigger("texTiled");
						}
					}).catch((error)=>{
						if (PARAMS.modelDebug){console.error(error)}
						notifyMe(`switchLayer ${error.hasOwnProperty('stack') ? error.stack.split("\n") : error}`)
					});
				
			}
		}else{
			console.log("No Multilayer selected present")
		}
	}
}).on('switchAppearance',function(ev, appearance){
	try{
		if ((appearance.hasOwnProperty("name")) && 
			(appearance.hasOwnProperty("index"))) {
				MLSB.TreeD.appearance = appearance.index;
			
			$(window).trigger(`uicleanMlmaterial`);
			var foundMultilayer = false
			
			let new_Materials = materialJSON.Appearances[appearance.index].Materials;
			new_Materials.forEach((mat)=>{
				if (!materialSet.has(mat)){
					materialSet.add(mat);
					materialStack[mat] = codeMaterials(materialJSON.Materials.filter(el => el.Name == mat)[0], mat);
					if (materialStack[mat].userData.type=='multilayer'){
						foundMultilayer = true
						$(window).trigger(`uiPushMlmaterial`,mat);
					}
				}
			})
			
			let k = 0;
			TDengine.scene.traverse(oggetti=>{
				if (oggetti.isMesh){
					$("#sbmeshEN li").eq(k).attr("data-material",new_Materials[k]);
					oggetti.material=materialStack[new_Materials[k]];
					oggetti.material.needsUpdate=true;
					k++;
				}
			});

			if (foundMultilayer){
				$(window).trigger(`uiswitchMlmaterial`,1)
				$("#thacanvas").trigger("switchLayer",MLSB.Editor.layerSelected);
			}
		}
	}catch(wrong){
		notifyMe(wrong);
	}
}).on('matHighlight',function(ev,highlight){
	let selected = activeMLayer();
	if (selected!=undefined){
		materialStack[selected].defines.MLSBInspect = highlight;
		materialStack[selected].needsUpdate = true;
	}
}).on('hairColorSwitch',function(ev,profile){
	console.log(profile)
	
}).on('updCamera',function(ev){
	if (PARAMS.cameraNear > PARAMS.cameraFar){
		PARAMS.cameraFar = PARAMS.cameraNear+1;
	}
	TDengine.camera.near = PARAMS.cameraNear;
	TDengine.camera.far = PARAMS.cameraFar;
	TDengine.camera.updateProjectionMatrix();
}).on('fogNew',function(ev){
	try{
		TDengine.scene.fog = new THREE.Fog( PARAMS.fogcolor, PARAMS.fognear,PARAMS.fogfar);
	}catch(error){
		notifyMe(error);
	}
}).on('blurMask',function(ev){
	console.log(ev);
}).on('changeFormat',function(ev){
	/*Update the texture format on preferences change */
	let trigMe = thePIT.RConfig('maskformat');
	trigMe.then((newformat)=>{
		textureformat = newformat;
	}).catch((error)=>{
		notifyMe(error);
	})
}).on('newlights',function(event,index){
	switch (index) {
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
	let selected = activeMLayer();
	//apply type of render
	PARAMS.oneside=!PARAMS.oneside;

	if(materialStack[selected]){
		materialStack[selected].side = PARAMS.oneside ? THREE.FrontSide: THREE.DoubleSide;
	}
}).on('switchAlpha',function(event){
	if (sceneLoaded()){
		let selected = activeMLayer();

		if (PARAMS.switchTransparency){
			//activate transparency not, maskAlpha
			materialStack[selected].setValues({transparent:true,alphaTest:0.0})
		}else{
			//go back to mask the material with alphaTest Value
			materialStack[selected].setValues({transparent:false,alphaTest:PARAMS.maskChannel})
		}
		materialStack[selected].needsUpdate=true;
	}
}).on('maskAlpha',function(event){
	if (TDengine.scene.children.filter((elm)=>elm.type=="Group").length>0){
		//masking the alpha
		if (!PARAMS.switchTransparency){
			let selected = activeMLayer();

			materialStack[selected].setValues({alphaTest:PARAMS.maskChannel});
		}
	}
}).on("theWire",function(event){
	if (TDengine.scene.children.filter((elm)=>elm.type=="Group").length>0){
		for(const[key,mat] of Object.entries(materialStack)){
			mat.setValues({wireframe:PARAMS.wireframes});
			mat.needsUpdate = true;
		}
	}
}).on('changeOpacity',function(ev,opacity){
	let selected = activeMLayer();
	if (materialStack[selected]){
		materialStack[selected].setValues({opacity:opacity});
	}
}).on('changeColor',function(ev, color){
	//change the color ONLY if a layer is selected
	try{
		if (sceneLoaded()){
			let selected = activeMLayer();
			materialStack[selected].setValues({color:new THREE.Color(color)});
		}
	}catch(error){
		notifyMe(error);
	}
}).on('flipMask',function(event){
	let selected = activeMLayer();
	flippingdipping = flipcheck.checked;
	thePIT.savePref({flipmasks:flippingdipping});
	if (materialStack[selected]){
		materialStack[selected].map.flipY= flippingdipping;
		materialStack[selected].map.needsUpdate = true;
	}
}).on('flipNorm',function(event){
	let selected = activeMLayer();
	if (materialStack[selected]){
		materialStack[selected].normalMap.flipY = !materialStack[selected].normalMap.flipY;
		materialStack[selected].normalMap.needsUpdate = true;
	}
}).on('playTexture',function(event,texture){
	var dummyMd5 = getEncodedFileName(texture.replace(/\.(dds|png)$/g,".xbm"));
	var imgDatas = textureStack[dummyMd5]
	paintDatas(imgDatas.image.data,imgDatas.image.width,imgDatas.image.height,'texturePlayer',imgDatas.format);
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
}).on('UVDisplay',function(event){
	//generate and display the UVMap for the selected submeshes
	let UVmapper = document.getElementById("UVMapMe")
	let mysize = UVmapper.width;
	clearCanvas("UVMapMe");

	retUVMapData(
		UVmapper,
		getUVSubmeshIndex(document.querySelectorAll(`#unChecksMesh input[type="checkbox"]`)),
		mysize)
		.then(result=>{
			notifyMe(`UVMap created`,false);
		}).catch(error=>{
			notifyMe(error);
		});

}).on('UVExport',function(){
	/*
	* generate and export to file the UVMap for the selected submeshes
	* using the export size selected
	*/
	let mysize = parseInt($("#UVformat").val());
	if (mysize==0){
		mysize = document.getElementById("UVMapMe").width;
	}

	var offSCExport = new OffscreenCanvas(mysize,mysize);
	retUVMapData(
		offSCExport,
		getUVSubmeshIndex(document.querySelectorAll(`#unChecksMesh input[type="checkbox"]`)),
		mysize)
		.then(result=>{
			offSCExport.convertToBlob({type:'image/png'})
				.then(blob=>{
					
					const url = URL.createObjectURL(blob);
					let a = document.createElement('a');
					a.href = url;
					a.download = `UV_${mysize}_${String($("#modelTarget").val()).split("\/").reverse()[0].split(".")[0]}.png`;
					a.click();
					a.remove();
				})
				.catch(error=>notifyMe(error))

			notifyMe(`UVMap need to be exported`,false);
		}).catch(error=>{
			notifyMe(error);
		});
});