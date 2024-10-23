import * as THREE from 'three';
import { OrbitControls } from 'orbit';
import { Fog } from 'fog';
import { Color } from 'color';
import { MathUtils } from 'mathutils';
import { GLTFLoader } from 'gltf';

/*Performances */
import Stats from '../public/three/examples/jsm/libs/stats.module.js';
import { GPUStatsPanel } from 'stats';

var firstModelLoaded = false;
var flippingdipping = thePIT.RConfig('flipmasks');
var flipdipNorm = thePIT.RConfig('flipnorm');
var flipcheck = document.getElementById("flipMask");

var actualExtension = 'dds';


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
				let textureMD5Code = CryptoJS.MD5((datas[3]).replace(/\.(dds|png)$/g,".xbm"));
				textureStack[textureMD5Code] = new THREE.DataTexture(datas[0],datas[1],datas[2]);
				textureStack[textureMD5Code].needsUpdate = true
				materialStack[datas[4]].normalMap = textureStack[textureMD5Code];
				materialStack[datas[4]].normalMap.needsUpdate = true;
				break;
			case 'rough':
				paintDatas(datas[0],datas[1],datas[2],datas[3],THREE.RGBAFormat);
				let roughMD5Code = CryptoJS.MD5((datas[3]).replace(/\.(dds|png)$/g,".xbm"));
				textureStack[roughMD5Code] = new THREE.DataTexture(datas[0],datas[1],datas[2]);
				textureStack[roughMD5Code].needsUpdate = true
				materialStack[datas[4]].roughnessMap = textureStack[roughMD5Code];
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

var materialHair = new THREE.MeshStandardMaterial({color:0xBB000B,opacity:.9,side:THREE.DoubleSide,depthTest:true});
var materialBASE = new THREE.MeshStandardMaterial({color:0x0000FF,transparent:true, side:THREE.DoubleSide,depthWrite :false});

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

function retDefTexture(mapName="engine\\textures\\editor\\grey.xbm",material="default",type="diffuse"){
	// kind of listed maps
	type = ((type=="diffuse") || (type=="normal") || (type=="metal") || (type=="rough") || (type=="alpha")  || (type=="emissive") || (type=="mlmask") ) ? type : "diffuse";

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
			if (!modello[0].hasOwnProperty('children')){
				notifyMe("No Group found in the scene")
				reject();
			}
			var submeshes = modello[0].children.filter(elm => elm.type=='SkinnedMesh' || elm.type=='Mesh');

			var getCanvas = _2dContext.getContext("2d")
			const lines = new THREE.Vector2();
			const isle = new THREE.Vector2();
			const uvs = [new THREE.Vector2(),new THREE.Vector2(),new THREE.Vector2()];
			const face = [];

			var lod
			
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
			resolve();
		} catch (error) {
			notifyMe(error);
			reject();
		}
	}
	)
}

function paintDatas(textureData,w,h,target,format){
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
			console.log("1 channel")
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
		
		resolve(true);
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

				.then((ev)=>{
					//load deferred textures in the textureDock
					LoadStackTextures();
				}).catch((error)=>{
					notifyMe(`LoadModel ${error}`);
				})
			}).catch((error)=>{
				notifyMe(`LoadMaterials ${error}`);
			})
		}).catch((error)=>{
			notifyMe(`LoadScene ${error}`);
		});
	});
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
}).on('switchLayer',function(ev,layer=0){
	if (firstModelLoaded){
		//Used to switch the mask layer used on the multilayer material
		let selected = activeMLayer();

		if (materialStack[selected].hasOwnProperty("mask")){
			test = _getFileContent({file:materialStack[selected].mask,maptype:'mlmask',shader:selected})
				.then((result)=>{
					var myMask = textureDock.filter(elm=>elm.file==materialStack[selected].mask)
					if (myMask?.length==1){
						//var LAYER = 
						let nameMask = CryptoJS.MD5(materialStack[selected].mask).toString()
						
						paintDatas(result,myMask[0].info.width,myMask[0].info.height,'maskPainter',THREE.RGBAFormat)
						textureStack[nameMask] = new THREE.DataTexture(result,myMask[0].info.width,myMask[0].info.height,THREE.RGBAFormat)

						materialStack[selected].setValues({
							alphaMap:textureStack[nameMask],
							map:textureStack[nameMask],
							opacity: parseFloat($("#layerOpacity").val())
						})
						materialStack[selected].map.flipY = flippingdipping;
						materialStack[selected].map.needsUpdate = true;
					}
				}).catch((error)=>{
					notifyMe(`switchLayer ${error.stack.split("\n")}`)
				});
			
		}
	}
}).on('switchAppearance',function(ev, appearance='default'){

	try{
		let tempID = materialJSON.Appearances.map(el=>el.Name).indexOf(appearance)
		if (tempID  >=0 ){ 
			materialJSON.Appearances[tempID].Materials.forEach((material)=>{
				materialSet.add(material);
			})
		}

	}catch(wrong){
		notifyMe(wrong);
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

	if (PARAMS.oneside){
		materialStack[selected].side=THREE.FrontSide;
    }else{
        materialStack[selected].side=THREE.DoubleSide;
    }

}).on('maskAlpha',function(event){
    //masking the alpha
	let selected = activeMLayer();

	materialStack[selected].setValues({alphaTest:PARAMS.maskChannel});

}).on("theWire",function(event){
    //changinf the wireframe value
	let selected = activeMLayer();

	materialStack[selected].setValues({wireframe:PARAMS.wireframes});
}).on('changeColor',function(ev, color){
	//change the color ONLY if a layer is selected
	if (materialStack.length>0){
		try{
			let selected = activeMLayer();
		
			materialStack[selected].setValues({color:new THREE.Color(color)});
			materialStack[selected].needsUpdate;
		}catch(error){
			notifyMe(error);
		}
	}
}).on('flipMask',function(event){
	let selected = activeMLayer();
	flippingdipping = flipcheck.checked;
	thePIT.savePref({flipmasks:flippingdipping});
	materialStack[selected].map.flipY= flippingdipping;
	materialStack[selected].map.needsUpdate = true;
}).on('flipNorm',function(event){
	let selected = activeMLayer();
	materialStack[selected].normalMap.flipY = !materialStack[selected].normalMap.flipY;
	materialStack[selected].normalMap.needsUpdate = true;
}).on('playTexture',function(event,texture){
	var dummyMd5 = CryptoJS.MD5(texture.replace(/\.(dds|png)$/g,".xbm"));
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

function getImageInfo(binaryData){
	var bufferData = str2ab(binaryData);
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
		var imageDatas

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
			console.warn = parseInt(new DataView(bufferData,filePointer,4).getInt32(),16);
		}
		var pngchannels=3;
		switch (pngColorType) {
			case 0:
				console.log(`Grayscale sample`);
				pngchannels=1;
				break;
			case 2:
				console.log(`RGB triple`);
				break;
			case 3:
				console.log(`PLTE palette index`)
				pngchannels=0;
				break;
			case 4:
				console.log(`grayscale sample, followed by an alpha sample`)
				pngchannels=2;
				break;
			case 6:
				console.log(`R,G,B triple, followed by an alpha sample`)
				break;
			default:
				notifyMe("This is an unknown PNG format !!");
				pngchannels=-1;
				break;
		}

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
				if (textureObj.maptype=='normal'){
				var gammaCorrection = 2.2;
					
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


/* function dataToTeX(fileNAME, binaryData, channels=4, format = THREE.RGBAFormat,type = '',_materialName=""){
	var imageINFO = getImageInfo(binaryData);
	var bufferData = str2ab(binaryData);
	//const headerData = new Uint8Array( bufferData, 0, 8 ); //get the two dimensions data bytes

	if (type!='M'){
		pushTexturetoPanel(fileNAME,imageINFO.width,imageINFO.height);
	}

	if (imageINFO?.format=='DDS'){
		
		try {
			//DDS Case
				const spaceData = new Uint32Array( bufferData, 0, 5 ); //get the two dimensions data bytes
				let height = spaceData[3];
				let width = spaceData[4];
				//console.log(`texture ${width}x${height}px`);
				let size = height * width * channels;
				//console.log(size);
				const dx10Data = new Uint32Array( bufferData, 128, 4 ); //get the type of DDS

				var imageDatas
				if ((dx10Data[0]==61) && (dx10Data[1]==3)&& (dx10Data[2]==0)&& (dx10Data[3]==1)){
					//console.log(`DDS ${format}`);
					if (format == THREE.RGBAFormat){
						imageDatas = new Uint8Array( bufferData, 148, imageINFO.size );
					}else{
						switch (imageINFO.bytes) {
							case 16:
								imageDatas = new Uint16Array( bufferData, 148, imageINFO.size );
								break;
						
							default:
								imageDatas = new Uint8Array( bufferData, 148, imageINFO.size );
								break;
						}
					}
				}else{
					//or legacy RGBA Unorm
					switch (imageINFO.bytes) {
						case 16:
							imageDatas = new Uint16Array( bufferData, 148, imageINFO.size );
							break;
					
						default:
							imageDatas = new Uint8Array( bufferData, 148, imageINFO.size );
							break;
					}
				}
				
				var resultTex
				switch (type) {
					case 'M':
						//masks
						paintDatas(imageDatas,imageINFO.width,imageINFO.height,'maskPainter',format);
						break;
					case 'RM':
						imgWorker.postMessage(['roughnessSwap',imageDatas, width, height, fileNAME,_materialName]);
						break;
					case 'N':
						//normals
						if (imageDatas.isTexture){
						}else{
							resultTex = FlatNORM;
							if (imageINFO.bytes==8){
								imgWorker.postMessage(['normalFix',imageDatas, width, height, fileNAME,_materialName]);
							}else if (imageINFO.bytes==16){
	
							}else{
								return FlatNORM;
							}
						}
						break;
					default:
						break;
				}
	
				//rebuild the colors
				if (format == THREE.LuminanceFormat){
					imageDatas = rebuildText(imageDatas,width,height);
					imageINFO.channels = 4;
				}

				if (imageINFO.bytes==16){
					resultTex = new THREE.DataTexture(imageDatas,width,height,THREE.RGBAFormat, RGBA16UI);
				}else{
					switch (imageINFO.channels) {
						case 1:
							resultTex = new THREE.DataTexture(imageDatas,width,height,THREE.RedFormat);
							break;
						case 2:
							resultTex = new THREE.DataTexture(imageDatas,width,height,THREE.RGFormat);
							break;
						case 3:
							resultTex = new THREE.DataTexture(imageDatas,width,height,THREE.RGBFormat);
							break;
						default:
							resultTex = new THREE.DataTexture(imageDatas,width,height,THREE.RGBAFormat);
							break;
					}
				}

				resultTex.wrapS = THREE.RepeatWrapping;
				resultTex.wrapT = THREE.RepeatWrapping;

				if (type!='M'){
					paintDatas(imageDatas,width,height,fileNAME,format)
				}
				
				return resultTex;
			}catch(error){
				notifyMe(error);
				return BLACK;
			}
	}else if (imageINFO?.format=='PNG'){
		//console.log(imageINFO,'PNG');
		try{
			if ((imageINFO.width > 0) && (imageINFO.height > 0)){
				
				var encodedData = btoa(binaryData);
				var dataURI = "data:image/png;base64," + encodedData;

				
				let offcanvas = new OffscreenCanvas(imageINFO.width,imageINFO.height);
				let gl = offcanvas.getContext("2d");
				var img = new Image(imageINFO.width,imageINFO.height);
				img.onload = function(){
					gl.drawImage(img,0,0,imageINFO.width,imageINFO.height); // Or at whatever offset you like
					var imageData = gl.getImageData(0, 0, imageINFO.width,imageINFO.height)
					return new THREE.DataTexture(imageData.data,imageINFO.width,imageINFO.height,THREE.RGBAFormat)
				};

				img.src = dataURI;
			}else{
				console.error('Texture of size 0');
				return ERROR;
			}
		}catch(error){
			console.error(error);
			return WHITE;
		}
	}else{
		notifyMe('Format not recognized, returned WHITE');
		return WHITE;
	}
} */

//Get texture file content to be processed
async function _getFileContent(textureObj){
	return new Promise((resolve, reject)=>{

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
					console.log(result)
				}).catch((error)=>{
					console.log(error)
					materialStack[textureObj.shader].userData.layers = 0
				}).finally((e)=>{
					$(window).trigger("limitLayers",materialStack[textureObj.shader].userData.layers);
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
				textureObj.info = getImageInfo(textureResult);
			}
			
			if (textureObj.maptype!='mlmask'){
				pushTexturetoPanel(realTexturePath, textureObj.info.width, textureObj.info.height);
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
 * Map an existing texture onto the right shader map slot
 *  * @param {Object} textureObj contain datas from the textureDoc array
 * the object has this property structure {file,maptype,shader});
 * @returns nothing
 */
function MapTextures(textureObj){
	try {
		if (textureObj.hasOwnProperty("file") && textureObj.hasOwnProperty("shader") && textureObj.hasOwnProperty("maptype") && textureObj.hasOwnProperty("entries")){
			var textureMD5Code = CryptoJS.MD5(textureObj.file);
			var returntexture = textureStack[textureMD5Code]===undefined ? ERROR : textureStack[textureMD5Code];
			textureObj.entries.forEach((toMap)=>{
				switch (toMap.maptype) {
					case "mlmask":
						materialStack[toMap.shader].map = textureStack[textureMD5Code]
						materialStack[toMap.shader].alphaMap = textureStack[textureMD5Code]
						materialStack[toMap.shader].map.needsUpdate = true;
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
				}
			})
		}else{
			throw new Error('The texture object lack information');
		}
	} catch (error) {
		notifyMe(`MapTextures ${error}`)
	}
}

/**
 * Async function that process every texture in the Stack
 * It takes elements from the Texture Doc and than apply
 * to the right shader
 */
async function ProcessStackTextures(){
	texturePromise = textureDock.map((x)=>{return _getFileContent(x)});
	clearTexturePanel();

	Promise.allSettled(texturePromise).then((res)=>{
		
		res.forEach((elm,index)=>{
			if (elm.status=='rejected'){return}

			let target  = (textureDock[index].file).replace('.xbm',`.${textureformat}`)

			if (textureDock[index].file.match(/\.mlmask$/)){ target='maskPainter' } //change the default Canvas target

			let textureIndex = CryptoJS.MD5(textureDock[index].file)

			var THREEFormat = THREE.RGBAFormat //Default format for PNGs
			if (textureDock[index].info.format=='DDS'){
				if (textureDock[index].info.bytes==16){
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
				}

/* 				paintDatas(elm.value,
					textureDock[index].info.width,
					textureDock[index].info.height,
					target,
					THREEFormat
				) */

			}else if (textureDock[index].info.format=='PNG'){
				textureStack[textureIndex] = new THREE.DataTexture(elm.value,
					textureDock[index].info.width,
					textureDock[index].info.height,
					THREEFormat,
				);
			}
			textureStack[textureIndex].wrapS = THREE.RepeatWrapping;
			textureStack[textureIndex].wrapT = THREE.RepeatWrapping;

			paintDatas(elm.value,
				textureDock[index].info.width,
				textureDock[index].info.height,
				target,
				THREEFormat
			)
			switch (textureDock[index].maptype) {
				case 'mlmask':
					//Blur here ?
					//texturedatas,width,height,fileNAME,material,channelsTarget,pixels
					/* if (PARAMS.maskBlur>0){
						imgWorker.postMessage([
							'blurApply',
							elm.value, 
							textureDock[index].info.width, 
							textureDock[index].info.height, 
							target,
							textureDock[index].shader,
							PARAMS.maskBlur
						]);
					} */
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
						'normalFix',
						elm.value, 
						textureDock[index].info.width, 
						textureDock[index].info.height, 
						target,
						textureDock[index].shader
					]);
					break;
				default:
					MapTextures(textureDock[index])
					break;
			}
		/* 	if (textureDock[index].shader.userData?.type=='hair'){
				console.log(`Bisogna snegrare`);
			} */
	})
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

			var Rdecal = lambertType.clone();
			var decalConfig = {userData:{type:'decal'},color:0xFFFFFF,transparent:true, side:THREE.DoubleSide,depthWrite :false}

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
				let nmMD5Code = CryptoJS.MD5(materialEntry.Data.NormalTexture)
				decalConfig.normalMap = retDefTexture(materialEntry.Data.NormalTexture,_materialName,"normal");
			}

			if (materialEntry?.Data.hasOwnProperty('MetalnessTexture')){
				decalConfig.metalnessMap =retDefTexture(materialEntry.Data.MetalnessTexture,_materialName,"metalness");
				decalConfig.metalness = materialEntry.Data.MetalnessScale
			}

			if (materialEntry?.Data.hasOwnProperty('RoughnessTexture')){
				decalConfig.roughnessMap =retDefTexture(materialEntry.Data.RoughnessTexture,_materialName,"roughness");
				decalConfig.roughness = materialEntry.Data.RoughnessScale
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
			var rbaseConfig = {userData:{type:'metal'}}

			if (materialEntry.Data.hasOwnProperty('AlphaThreshold')){
				rbaseConfig.opacity = materialEntry.Data.AlphaThreshold;
			}
			//Texture information
			if (materialEntry.Data.hasOwnProperty('BaseColor')){
				rbaseConfig.map = retDefTexture(materialEntry.Data.BaseColor,_materialName,"diffuse");
			}
			//Color applyed over textures
			if (materialEntry.Data.hasOwnProperty('BaseColorScale')){
				rbaseConfig.color = new THREE.Color(`rgb(${parseInt(materialEntry.Data.BaseColorScale.X*255)},${parseInt(materialEntry.Data.BaseColorScale.Y*255)},${parseInt(materialEntry.Data.BaseColorScale.Z*255)})`)
			}

			if (materialEntry.Data.hasOwnProperty('Normal')){
				rbaseConfig.normalMap = retDefTexture(materialEntry.Data.Normal,_materialName,"normal");
			}

			if (materialEntry.Data.hasOwnProperty('Roughness')){
				rbaseConfig.roughnessMap = retDefTexture(materialEntry.Data.Roughness,_materialName,"roughness");
				rbaseConfig.roughness = materialEntry.Data.RoughnessScale
			}

			if (materialEntry.Data.hasOwnProperty('Metalness')){
				rbaseConfig.metalnessMap =retDefTexture(materialEntry.Data.Metalness,_materialName,"metalness");
				rbaseConfig.metalness = materialEntry.Data.MetalnessScale
			}
			

			Rbase.setValues(rbaseConfig);
			Rbase.normalMap.needsUpdate = true;
			return Rbase
		}


		if (materialTypeCheck.multilayer.includes(materialEntry.MaterialTemplate)){
			var Mlayer = stdMaterial.clone();
			Mlayer.userData={type:'multilayer'};

			if (materialEntry?.Data.hasOwnProperty('MultilayerMask')){
				
				//name of the Actual layer textures to be loaded will be stored
				Mlayer.map = retDefTexture(materialEntry.Data.MultilayerMask,_materialName,"mlmask");
				Mlayer.map.needsUpdate = true;
				Mlayer.mask = materialEntry.Data.MultilayerMask;
			}

			if (materialEntry?.Data.hasOwnProperty('GlobalNormal')){
				var normMD5Code = CryptoJS.MD5(materialEntry.Data.GlobalNormal)
				if (textureStack[normMD5Code]===undefined){
					
					//textureStack[normMD5Code] = getTexture(materialEntry.Data.GlobalNormal,NORMAL,_materialName)
					textureStack[normMD5Code] = retDefTexture(materialEntry.Data.GlobalNormal,_materialName,"normal");
					textureStack[normMD5Code].wrapS = THREE.RepeatWrapping
					textureStack[normMD5Code].wrapT = THREE.RepeatWrapping
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
			let fxConfig = {userData:{type:'fx'},color:0xFFFFFF};

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
			var configHair = {};
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
			var skinConfig = {userData:{type:'skin'},color:0xFFDABE};

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
			return materialGlass
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
				$("#Mlswitcher").html("");
				$("#mLayerOperator").html("");
				
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
						}
					});
				}

				// Defer textureDock;
				if (materialLoaded){
					$("#Mlswitcher").html(multilayerSwitch);
					$("#mLayerOperator").html(multilayerMaskMenu);
					$("#mLayerOperator li:nth-child(1)").addClass("active");
					$("#Mlswitcher div:nth-child(1) input[type='radio']").prop("checked",true);
	
					//Appearances building
					$("#appeInfo").html(materialJSON.codeAppearances());
					$("#appearanceSwitcher ul").html(materialJSON.codeAppearances(`<li><a class="dropdown-item" data-name='$APPEARANCE$'>$APPEARANCE$</a></li>`));
				}else{
					//Appearances building
					$("#appeInfo").html("");
					$("#appearanceSwitcher ul").html("");
					throw new Error("Failed the Material Import");
				}
			}else{
				//TODO create the basic material
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
							subsCheckUVs += `<input type="checkbox" class="btn-check" id="uvchk_${child.name}" checked >
											 <label class="btn btn-sm btn-outline-secondary mb-2" for="uvchk_${child.name}" autocomplete='off' title="${child.userData.materialNames[0]}" >${child.name}</label>`
							//Assign the Material
							
							child.material = materialStack[child.userData?.materialNames[0]];
							child.material.needsUpdate=true;
						}else{
							//If isn't coded it apply a default lambertMaterial
							child.material = materialNone;
						}
						//set to display the submesh
						child.visible = true;
					}
				})

				$("#withbones svg:nth-child(1) path").attr("fill",(Boned ? 'red':'currentColor'));
				$("#sbmeshEN > ul").html(subsCheckText);
				$("#unChecksMesh").html(subsCheckUVs);

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

				resolve(true);
			})		
		}else{
			notifyMe(`${path} empty file ??? No model to display i guess`);
			reject();
		}
	});
}
