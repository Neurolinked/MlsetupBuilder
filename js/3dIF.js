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
	var NTextarea = document.querySelector("#NotificationCenter div.offcanvas-body");
	NTextarea.innerHTML = message+'<br/>'+NTextarea.innerHTML;
}

 var err_counter = 0;
 var control_reset = false;
 var control_side = false;

 var getImageData = false;
 var imgDataShot = null;
 let scene, camera, renderer, controls, axesHelper;
 let pointlight, ambientlight, pointlight_2, pointlight_3, pointlight_4;
 //-------------parameter for Dat Window-----------------------
const params = {
 autorotation: false,
 rotationspeed: 6,
 wireframe: false,
 onesided: false
};
//-------------Aiming box for the camera ----------------------

//-------------Material and Object Constant--------------------
const material = new THREE.MeshStandardMaterial({color: 0x500000});//
const safeMap = new THREE.TextureLoader().load( "./images/favicon.png" );
const maploader = new THREE.FileLoader().setResponseType('arraybuffer');
const loader = new THREE.GLTFLoader(); //loader for Gltf and glb models
const gui = new dat.GUI({autoPlace:false});
var GuiSubmesh =gui.addFolder("Submesh Toggle");
GuiSubmesh.close();//closes the submeshes folder

const renderwidth=512; //width size of the 3d canvas
let resized = false; //semaphore for resizing behaviour
window.addEventListener('resize', function() {  resized = true;  });// resize event listener

var MDLloadingButton = document.getElementById('btnMdlLoader');
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
  	 const headerData = new Uint32Array( data, 0, 124 );
  	 let height = headerData[3];
  	 let width = headerData[4];
  	 let size = height * width;
  	 const luminancedata = new Uint8Array( data, 128, size );
  	 var dataTex = new THREE.DataTexture(luminancedata, height, width, THREE.LuminanceFormat, THREE.UnsignedByteType);
  	 dataTex.flipY=true;
  	 material.color.set(0x500000);
  	 material.map = dataTex;
  	 giveToTheAim(luminancedata,width,height);
  	 console.log(height+","+width);
  	 material.needUpdates =true;
  }else{
    let notific = document.querySelector("#notyCounter span");
    let mipreference = document.getElementById("prefxunbundle")

    err_counter = err_counter+1;
    notific.textContent = err_counter;
    material.color.set(0x000055);
    material.map = safeMap;
    notify3D('An error happened during the load of the file: '+mipreference.value+path);
  }
}

function LoadModelOntheFly(path){

  path = path.replaceAll(/\//g,'\\'); //setup the right path to be requested
  var sk_helper;
  let oMdlInfo = document.getElementById("modalInfo");
  oMdlInfo.querySelector(".modal-body").innerHTML="";

  let strGLBInfo = "";
  let Boned = false;
  let MasksOn = document.getElementById('withbones');

  var modelfile

  modelfile = thePIT.ApriStream(path,'binary');
  data = str2ab(modelfile);

  loader.parse( data ,'', ( glbscene ) => {
    gui.removeFolder("Submesh Toggle");

    GuiSubmesh = gui.addFolder("Submesh Toggle");
     glbscene.scene.traverse( function ( child ) {
      if ((child.type=="SkinnedMesh") && (!Boned)){Boned=true;}

      if ( child.isMesh ) {
        //strGLBInfo = strGLBInfo + "<p><span class='badge bg-md-dark w-100 rounded-0'>"+child.name+"</span> <br><p><span class='badge bg-warning text-dark p-1'>Material names:</span> "+child.userData.materialNames.toString().replaceAll(",",", ")+"</p>";//" <span class='badge bg-warning text-dark p-1'>AppNames:</span> "+child.userData.materialNames.toString().replaceAll(",",", ")+"</p>";
        strGLBInfo = strGLBInfo + "<p class='eq-lay3 rounded'><span class='badge layer-1 w-100 rounded-0'>"+child.name+"</span><details class='eq-lay3 text-white'><summary class='bg-info p-1 text-dark'>Material names</summary><div class='twoColGrid'><div class='p-1 text-center'>"+child.userData.materialNames.toString().replaceAll(",","</div><div class=' text-center p-1'>")+"</div></details></p>";
        if (!(/(decals)|(vehicle_lights)|(\bnone\b)|(logo_spacestation.+)|(glass.+)|(multilayer_lizzard)|(phongE1SG1.+)|(stickers.+)|(stiti.+)|(stit?ch.+)|(black_lighter)|(eyescreen)|(dec_.+)|(decal_.+)|(02_ca_limestone_1.*)|(zip+er.+)|(ziper.+)/g.test(child.userData.materialNames.toString()))){
            child.material = material;
        }else{
          //if is a decoration, a zipper a stiches apply a semitransparent material with autogenerated color
          if (/^(masksset)/g.test(child.userData.materialNames.toString())){
            child.material = material;
          }else{
            child.material = new THREE.MeshBasicMaterial({color:new THREE.Color("rgb("+Number.parseInt(20*Math.random())+", "+Number.parseInt(50*Math.random()+100)+", 255)"), opacity:0.3,transparent:true});
          }

        }
        child.visible = true;
        GuiSubmesh.add(child, 'visible').name( child.name );
      }
    });

    if (Boned){MasksOn.classList.add('on');}else{MasksOn.classList.remove('on');}

    if (params.onesided){material.side=null; }else{material.side=THREE.DoubleSide;}
    scene.add(glbscene.scene);
    //Autocentering
    var helper = new THREE.BoxHelper(glbscene.scene);
    helper.geometry.computeBoundingBox();
    var centerPoint = new THREE.Vector3();
    centerPoint.x = (helper.geometry.boundingBox.max.x + helper.geometry.boundingBox.min.x) / 2;
    centerPoint.y = (helper.geometry.boundingBox.max.y + helper.geometry.boundingBox.min.y) / 2;
    centerPoint.z = (helper.geometry.boundingBox.max.z + helper.geometry.boundingBox.min.z) / 2;
    camera.target = centerPoint;
    controls.target = centerPoint;
    oMdlInfo.querySelector(".modal-body").insertAdjacentHTML('afterbegin',strGLBInfo);
  }, (error) => {
    console.error( error );
  });
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

document.getElementById('btnMdlLoader').addEventListener('click',(e)=>{

 var nthLayer = document.querySelector("#layeringsystem").children;
 var activeLayer = document.querySelector("#layeringsystem li.active");

 MDLloadingButton.setAttribute('disabled','disabled');

 let theModel = document.getElementById("modelTarget").value; //path of the model to load
 let theMaskLayer = document.getElementById("masksTemplate").value; //template path for the textures
 let layer = document.getElementById("maskLayer").value; //actual layer selected in the editors
 let maxLayer_thisModel = document.getElementById("maxLayers").value; //actual numer of layer that the models support

 layer = Number(layer);
 maxLayer_thisModel = Number(maxLayer_thisModel);

 if (((layer<0) | (layer>20)) | (activeLayer===null) | (layer>maxLayer_thisModel)){ layer = 0 }

 theMaskLayer = String(theMaskLayer).replace(/X/g,layer);

 if (theMaskLayer.match(/^[/|\w|\.]+.dds/)){
	 //load textures
	 loadMapOntheFly(theMaskLayer);
	 material.needUpdates =true; //setup the mask I'll set the material to update
 }else{
	 notify3D('the texture '+theMaskLayer+' does not exists');
 }
 //search for the right extension
 if (theModel.match(/^[/|\w|\.]+.glb/)){
	 if (scene.children.length==6){
		 scene.traverse(oggetti=>{
			 if (!oggetti.isMesh) return
			 oggetti.geometry.dispose();
		 })
		 scene.children.pop(scene.children[5]);
	 }

	 LoadModelOntheFly(theModel);
	 //Disattivazione livelli non utilizzabili
	 layersActive(maxLayer_thisModel);
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
	 nofity3D('We are searching for .glb files and then this "'+theModel+'" one showed up, we can\'t open it now');
 }
});

init();

function init() {
  scene = new THREE.Scene();

  /*    const axesHelper = new THREE.AxesHelper( 5 );    scene.add( axesHelper ); to understand position of the objects */

  var thacanvas = document.getElementById('thacanvas');
  renderer = new THREE.WebGLRenderer({canvas:thacanvas,alpha:true,antialias:true});
  if (window.innerHeight-200<512){
   renderer.setSize(renderwidth,renderwidth);
  }else{
   renderer.setSize(renderwidth,window.innerHeight-200);
  }

  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  camera = new THREE.PerspectiveCamera(15,renderwidth/(window.innerHeight-200),0.012,10000);
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

  ambientlight = new THREE.AmbientLight( 0x404040 ); // soft white light
  ambientlight.intensity=4;
  scene.add( ambientlight );

  pointlight = new THREE.PointLight(0x75cb04,4); //6C5624
  pointlight_2 = new THREE.PointLight(0xf5f503,4);
  pointlight_3 = new THREE.PointLight(0x6078F5,4);
  pointlight_4 = new THREE.PointLight(0x6078F5,4);

  pointlight.position.set(5,0,5);
  pointlight_2.position.set(-5,0,-5);
  pointlight_3.position.set(0.61,0.05,-3);
  pointlight_4.position.set(0,3,3);

  scene.add(pointlight);
  scene.add(pointlight_2);
  scene.add(pointlight_3);
  scene.add(pointlight_4);

  //load a text file and output the result to the console
  material.map = safeMap;

  //Setup the DAT position
  const GuiBasicsetup = gui.addFolder("Basic Setup");
  GuiBasicsetup.add( params, 'autorotation' ).name( 'Auto Rotation' );
  GuiBasicsetup.add( params, 'rotationspeed',2, 10 ).name( 'Rotation speed' );
	GuiBasicsetup.add( params, 'wireframe').name( 'View wireframe' ).onChange(() => {
   if (params.wireframe){material.wireframe=true;}else{material.wireframe=false;}
   material.NeedUpdates;
   });;
  GuiBasicsetup.add( params, 'onesided').name( '1-side' ).onChange(() => {
   if (params.onesided){material.side=THREE.FrontSide;}else{material.side=THREE.DoubleSide;}
   material.NeedUpdates;
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
  if (control_side){material.needUpdates; control_side=false;}

  renderer.render(scene, camera);

	if(getImageData == true){
			let a = document.getElementById('takeashot');
      imgDataShot = renderer.domElement.toDataURL('image/png');
      getImageData = false;
			a.href=imgDataShot;
			a.download = "lastscreen.png";
			//console.log(imgDataShot);
  }
  requestAnimationFrame(animate);
}

function resize() {
		 resized = false

		 // update the size
		 if (window.innerHeight-200<512){
			 renderer.setSize(renderwidth, 512);
		 }else{
			 renderer.setSize(renderwidth, window.innerHeight-200);
		 }
		 // update the camera
		 const canvas = renderer.domElement
		 camera.aspect = canvas.clientWidth/canvas.clientHeight
		 camera.updateProjectionMatrix()
 }
