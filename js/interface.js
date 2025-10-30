window.$ = window.jQuery;
const ml_randomized = [];
var coreMblends = {};

const copypasteManager = {
  source:null,
  destination:null
}

customElements.define("substance-layer", SubstanceLayer);

function orderLevelsMetal(a,b){
  //The format is [label,[value,value]]
  const label = 0;
  const threshold = 1;
  if (Array.isArray(a) && Array.isArray(b)){
    if ((a[threshold][1]==0) && (b[threshold][1]==0)){
      return b[threshold][0]- a[threshold][0];
    }else if ((a[threshold][0]==0) && (b[threshold][0]==0)){
       return a[threshold][1] - b[threshold][1];
    }else{
      if (a[threshold][1]==0){
        return -1
      }else if (b[threshold][1]==0){
        return 0
      }else{
        return b[threshold][0] - a[threshold][0];
      }
    }
  }else{
    return true;
  }
};

function getActiveMultilayerSetup(){
  return $("#MlSetupsList span.active").index();
}

function orderLevelsRough(a,b){
  //The format is [label,[value,value]]
  const label = 0;
  const threshold = 1;
  if (Array.isArray(a) && Array.isArray(b)){
    if ((a[threshold][1]==0) && (b[threshold][1]==0)){
      return a[threshold][0] - b[threshold][0];
    }else if ((a[threshold][0]==0) && (b[threshold][0]==0)){
       return a[threshold][1] - b[threshold][1];
    }else{
      if (a[threshold][1]==0){
        return -1
      }else if (b[threshold][1]==0){
        return 0
      }else{
        return b[threshold][0] - a[threshold][0];
      }
    }
  }else{
    return true;
  }
};

/**
 * 
 * @param {object} mousePosition
 * @param {number} mousePosition.x
 * @param {number} mousePosition.y
 * @param {number} layerIndex 
 * @returns 
 */
  function showContextMenu(mousePosition,layerIndex){
    if (!(mousePosition.hasOwnProperty("x") && mousePosition.hasOwnProperty("y"))){
      return 
    }
    layerIndex = parseInt(layerIndex)
    if (isNaN(layerIndex)){
      return
    }
    $("#layers-contextual").attr("data-source",layerIndex);
    $("#layers-contextual").css("top",`${mousePosition.y-60}px`).css("left",`${mousePosition.x}px`);
    $("#layers-contextual").addClass("visible");
  }

function setQuestion(text,action=''){
  $("#winConfirm .modal-title").html(text);
  $("#winConfirm button[value='yes']").attr("data-action",action);
  const  winConfirm = document.getElementById("winConfirm");
  winConfirm.showModal();
}

function getUILayerData(){
  return new Layer(
    $("#layerTile").val(),
    $("#matInput").val(),
    $("#layerOpacity").val(),
    $("#layerColor").val(),
    $("#layerNormal").val(),
    $("#layerRoughIn").val(),
    $("#layerRoughOut").val(),
    $("#layerMetalIn").val(),
    $("#layerMetalOut").val(),
    $("#layerOffU").val(),
    $("#layerOffV").val(),
    $("#matOverride").val(),
    $("#mbInput").val(),
    $("#mbTile").val(),
    $("#mbCont").val(),
    $("#mbNorm").val(),
    $("#mbOffU").val(),
    $("#mbOffV").val()
  );
}

function getMaterialFromFile(materialFilename){
  return String(materialFilename).split("\\").reverse()[0].split(".")[0]
}

function getMaterialColor(materialFile,colorCode="null_null"){
  var color = [.5,.5,.5];
  const materialKey = getMaterialFromFile(materialFile)
  if (MLSB.Materials[materialKey]!==undefined){
    color = MLSB.Materials[materialKey].colors.list[colorCode]!==undefined ? MLSB.Materials[materialKey].colors.list[colorCode] : [.5,.5,.5]
  }
  return color
}

function UIMlLayer(mlLayer,k){
  //Set both UI
  const sbUI =document.querySelector("substance-layer")

  sbUI.dispatchEvent(new CustomEvent("update",{detail:{
    layer:k,
    material:mlLayer.material,
    opacity:mlLayer.opacity,
    microblend:mlLayer.microblend.file,
    color:getMaterialColor(mlLayer.material,mlLayer.color)
  }}))

  $('#layeringsystem li').eq(k).data({
    mattile:mlLayer.tiles,
    labels:'('+mlLayer.color+') '+ String(mlLayer.material).replace(/^.*[\\\/]/, '').split('.')[0],
    material:mlLayer.material,
    opacity:mlLayer.opacity,
    color:mlLayer.color,
    normal:mlLayer.normal,
    roughin:mlLayer.roughnessIn,
    roughout:mlLayer.roughnessOut,
    metalin:mlLayer.metalIn,
    metalout:mlLayer.metalOut,
    offsetU:mlLayer.offsetU,
    offsetV:mlLayer.offsetV,
    mblend:mlLayer.microblend.file,
    mbtile:mlLayer.microblend.tiles,
    mbcontrast:mlLayer.microblend.contrast,
    mbnormal:mlLayer.microblend.normal,
    mboffu:mlLayer.microblend.offset.h,
    mboffv:mlLayer.microblend.offset.v
  });

  $('#layeringsystem li').eq(k).attr({
    "data-mattile":mlLayer.tiles,
    "data-labels":'('+mlLayer.color+') '+ String(mlLayer.material).replace(/^.*[\\\/]/, '').split('.')[0],
    "data-material":mlLayer.material,
    "data-opacity":mlLayer.opacity,
    "data-color":mlLayer.color,
    "data-normal":mlLayer.normal,
    "data-roughin":mlLayer.roughnessIn,
    "data-roughout":mlLayer.roughnessOut,
    "data-metalin":mlLayer.metalIn,
    "data-metalout":mlLayer.metalOut,
    "data-offsetU":mlLayer.offsetU,
    "data-offsetV":mlLayer.offsetV,
    "data-mblend":mlLayer.microblend.file,
    "data-mbtile":mlLayer.microblend.tiles,
    "data-mbcontrast":mlLayer.microblend.contrast,
    "data-mbnormal":mlLayer.microblend.normal,
    "data-mboffu":mlLayer.microblend.offset.h,
    "data-mboffv":mlLayer.microblend.offset.v
  });
}

function convLayersMlsetup(mlsetupTarget){
  if (mlsetupTarget instanceof Mlsetup){
    var size = mlsetupTarget.Layers.length;
    if (MLSB.UI.substance){
      const sbUI =document.querySelector("substance-layer")
      sbUI.dispatchEvent(new CustomEvent("disable",{detail:{layers:size}}))
    }
    for(k=0;k<size;k++){
      UIMlLayer(mlsetupTarget.Layers[k],k);
    }
  }else{
    notifyMe(`Impossible to convert a non mlsetup object`);
  }
}

function applyInEditor(){
  let activeMLTab = getActiveMultilayerSetup();
  let layersSelected = MLSB.getMllayer(activeMLTab); //MLSB.getMlsetup(activeMLTab).Layers[MLSB.Editor.layerSelected];
  $("#layerTile").val(layersSelected.tiles);
  $("#matInput").val(layersSelected.material).trigger("change");
  $(window).trigger("uiMaterialSelect",layersSelected.material);
  $("#layerOpacity").val(layersSelected.opacity)
  $("#layerColor").val(layersSelected.color).trigger("change");
  $(`#cagecolors span[data-order='${layersSelected.color}']`).click();
  $("#layerNormal").val(layersSelected.normal)
  $("#layerRoughIn").val(layersSelected.roughnessIn)
  $("#layerRoughOut").val(layersSelected.roughnessOut)
  $("#layerMetalIn").val(layersSelected.metalIn)
  $("#layerMetalOut").val(layersSelected.metalOut)
  $("#layerOffU").val(layersSelected.offsetU)
  $("#layerOffV").val(layersSelected.offsetV)
  $("#matOverride").val(layersSelected.override)
  $("#mbInput").val(layersSelected.microblend.file).trigger("focusout");
  $('#mbSelect').change();
  $("#mbTile").val(layersSelected.microblend.tiles)
  $("#mbCont").val(layersSelected.microblend.contrast)
  $("#mbNorm").val(layersSelected.microblend.normal)
  $("#mbOffU").val(layersSelected.microblend.offset.h)
  $("#mbOffV").val(layersSelected.microblend.offset.v).trigger("change")
}

function applyToLayer(){
  //Get the Data from the UI
  const tempLayer = getUILayerData();

  if (MLSB.UI.substance){
    const sbUI = document.querySelector("substance-layer");

    let materialKey = getMaterialFromFile(tempLayer.material); //material name without extension?
    let sbUIChanges = {
      layer:MLSB.Editor.layerSelected,
      material: tempLayer.material,
      opacity:tempLayer.opacity, 
      microblend:$("#mb-preview").attr("src"),
      color:[.5,.5,.5]
    }

    if (MLSB.Materials[materialKey]!==undefined){
      if (MLSB.Materials[materialKey]?.colors.list[tempLayer.color]!== undefined){
        sbUIChanges.color=MLSB.Materials[materialKey].colors.list[tempLayer.color];
      }
    }
    //dispatch changes on Substance UI
    sbUI.dispatchEvent(new CustomEvent("update",{detail:sbUIChanges}))
  }else{
    $("#layeringsystem li.active").removeClass("notsync");
    if ($("#layeringsystem li.active").length==1){
      UIMlLayer(tempLayer,MLSB.Editor.layerSelected);
    }else{
      notifyMe("NO level selected, please redo then layer Edit operation with a selected layer on");
    }
  }
  
  let activeMLTab = getActiveMultilayerSetup();

  MLSB.updMLLayer(activeMLTab,MLSB.Editor.layerSelected,tempLayer);
  /* MLSB.updMlsetup(activeMLTab,tempLayer,MLSB.Editor.layerSelected); */
}



/* CouchDB initialization */
const mlsbDB = new PouchDB('Docs');

mlsbDB.allDocs({
  startkey: 'mbpkg_',
  endkey:'mbpkg_\ufff0',
  include_docs: true,
}).then(function(mb_records){
  if (mb_records.rows.length > 0){
    console.log("found Mblends in DB")
  }else{
    console.log("No custom mblends in DB")
  }
});

mlsbDB.allDocs({
  startkey: 'material_',
  endkey:'material_\ufff0',
  include_docs: true,
}).then(function(material_records){
  if (material_records.rows.length>0){
    notifyMe(`Found ${material_records.rows.length} materials`);
  }else{
    console.log(`No custom materials in DB`);
  }
})

const remoteCouch = false
/* End */
var notifications = 0;
//var materialJSON = new MaterialBuffer();
var uncookMyFile = false;
var MLSBConfig = thePIT.RConfig();
var textureformat = ''
var maxTexturePlayer = 0;


//Broadcasting manager section
const bc = new BroadcastChannel("streaming"); //communication between opened interface windows
bc.onmessage = (event)=>{ console.log(event.data); }

var mLsetup = new Mlsetup();
/* var openMlsetup = []; */

/*Proxy function to manage nested objects*/
const createProxy = (obj,onSet)=>{
  return new Proxy(obj,
    {
      set(target,key,value){
        const updated = Reflect.set(target, key, value)// Update the property
        if (updated){
          onSet(key,value); //call the Callback to indicate a set operation
        }
      },
      get(target,key,receiver){
        const value = Reflect.get(target,key) //get the property value
        if (typeof(value)==='object' && value !==null){
          return createProxy(value,onSet);
        }
        return value;
      }
  });
}
const onSet = (key,value)=>{
  console.log(`evaluate this value ${value} for this key ${key}`);
}

const MLsetupUI = createProxy(mLsetup);

var layerSwapstart = null;

var modelType = 'default';
var mlSetupContent = '';

function checkOnSettings(){
  var checkDepot = thePIT.RConfig('paths.depot');
  checkDepot.then((result)=>{
    try {
      if (result=='') {
        //Try to setup the Depot folder.
        var setupSettings = document.getElementById('configure')
        setupSettings.showModal();
      } 
    } catch (error) {
      notifyMe(error,true);
    }
  });
}

/**
  * This function will extend the Numbercasting type
  * adding the feature of returning the lenght of numbers after the dot
*/
Number.prototype.countDecimals = function () {
    if(Math.floor(this.valueOf()) === this.valueOf()) return 0;
    return this.toString().split(".")[1].length || 0;
}

const range = (start, stop, step = 1) =>  Array(Math.ceil((stop - start) / step)+1).fill(start).map((x, y) => x + y * step)

function customMblendselect(ev){
  var mblendPrevSize = Number(window.getComputedStyle(document.documentElement).getPropertyValue('--mblendSize').replace(/px/,''));

  $("#cagethemicroblends li, #cagetheCuMBlends li").removeClass('MBactive');
  $(this).addClass("MBactive");
  let theoneselected = $(this).data('path');

  $("#mbSelect option").removeAttr("selected")

  let customMBdisplay = document.getElementById("cu_mu_display")
  
  customMBdisplay.scrollLeft = ($(`#cagetheCuMBlends li[data-path='${theoneselected.replaceAll('\\','\\\\')}']`).index() * (parseInt(mblendPrevSize) + 2))
  
  $("#mbSelect option").removeAttr("selected");
  let mbZelected = $("#mbSelect option").filter(function() {
     return $(this).val() === theoneselected;
   });
   
  mbZelected.attr('selected', true).change();
  $("#mbInput").val(theoneselected);
}

//Build the microblends gallery and compile the microblends select options
async function abuildMB(microblendObj){
  if (typeof(microblendObj)=="object"){
    if (microblendObj.hasOwnProperty("packages")){

      for(const[package, microblends] of Object.entries(microblendObj.packages)){
        if (package=='core'){
          var maxmicros = microblends.length
          var notfetched = 0;
          microblends.forEach((microblend)=>{
            try{
              fetch(`./images/${microblend.name}.png`)
                .then((res)=>{
                  //it means that the microblend is there
                  $("#cagethemicroblends").append(`<li style="background-image:url('./images/thumbs/${microblend.name}.png');"  data-package='${package}' title='${microblend.name}' data-path='${microblend.path}' > </li>`);
              }).catch((error)=>{
                notfetched=notfetched+1;
                $("#cagethemicroblends").append(`<li style="background-image:url('./images/thumbs/_nopreview.gif');"  data-package='${package}' title='${microblend.name}' data-path='${microblend.path}' > </li>`);
              })
            }catch(error){
              notfetched=notfetched+1;
              console.warn(error);
            }
            //Select selector
            $('#mbSelect optgroup[label="core"]').append(`<option data-package="core" data-thumbnail="./images/${microblend.name}.png" value="${microblend.path}">${microblend.name}</option>`);
          })

          var changedVersion = (sessionStorage.getItem("changedversion") === 'true' );
          //delay to wait all the fetches
          if (changedVersion=true){
            setTimeout(()=>{
              if (notfetched > (maxmicros/2) ){
                setQuestion("Choom, most of your Microblends in MLSB are missing.<br>Wanna try to res them from the Depot ?","getmblend");
              }
            },2000);
          }
        }
      }
    }
  }
}

async function nubuildMB(microblendObj){
  if ((typeof(microblendObj)=="object" ) ) {
    
    if (microblendObj.hasOwnProperty("packages")){
      var pkgName;
      var pkgList = document.getElementById('mbListPackages');
      /* Cleanup*/
      pkgList.innerHTML="";
      $("#mbHierarchy").html("");
      $("#mbSelect optgroup:not([label='core'])").html("");
      $("#mbSelect").val($("#mbSelect option:first").val()).change();
      $("#cagetheCuMBlends").html("");
      /* Cleanup*/
      microblendObj.packages.forEach((package)=>{
        pkgName = "";
        if (package.hasOwnProperty("name")){
            pkgName = package.name;
            pkgList.innerHTML+="<option value='"+pkgName+"' />";
            $("#mbSelect").append("<optgroup label='"+pkgName+"'>");
            $("#mbHierarchy").append(`<details open><summary>${pkgName}</summary><ul class='list-group list-group-flush' data-package='${pkgName}' ></ul></details>`);
        }
        if (package.hasOwnProperty("microblends")){

          var customMBlends = '';
          package.microblends.forEach((microblend)=>{
            let tmpName = microblend.path.split('.')[0].split("\\").reverse()[0];
            let hash = microblend?.hash != undefined ? `data-hash='${microblend.hash}'` : "";
            
            $("#mbSelect optgroup[label='"+pkgName+"']").append(`<option data-package='${pkgName}' data-thumbnail='./images/mblend/${pkgName.toLowerCase()}/${tmpName}.png' value='${microblend.path}'>${tmpName}</option>`);
            

            customMBlends += `<li style="background-image:url('./images/mblend/${pkgName.toLowerCase()}/thumbs/${tmpName}.png');" data-package='${pkgName}' data-path='${microblend.path}' title='${tmpName}' > </li>`;

            $("#mbHierarchy ul[data-package='"+pkgName+"']").append(`<li ${hash} data-path='${microblend.path}' class='list-group-item text-white p-1 pointer'><i class=' fa-solid fa-circle-minus text-danger'></i> ${tmpName}</li>`);
          });
          $("#cagetheCuMBlends").append(customMBlends);

          $("#cagetheCuMBlends li").on("click",customMblendselect);

        }
      })
    }
  }
  return;
}

async function materialTemplate(template){
  return new Promise((resolve,reject)=>{
    var materialText = "";
    for(const[key, material] of Object.entries(MLSB.Materials)){
      materialText += template.replaceAll('materialNameNoUScore',key.replaceAll("_",' '))
                              .replaceAll('materialName',key)
                              .replaceAll('materialPath',material.file)
    }
    resolve(materialText);
  })
}

async function uiBuildHairs(hairDB){
  if (hairDB.hasOwnProperty("Profiles")){
    notifyMe(`Hair Db game version :${hairDB?.GameVersion}`,false)
    var hair_colors = shade = ''
    var k=0;
    hairDB.Profiles.forEach((hair)=>{
      hair_colors = '';
      shade = ''
      if (hair.hasOwnProperty('RootToTip')){
        if (hair.RootToTip?.length >0){
          let closeGrad = "%, ";
          hair.RootToTip.forEach((item, key, arr) => {
            if (Object.is(arr.length - 1, key)) {
              closeGrad = "% ";
            }
            hair_colors +=` rgba(${item.color.Red},${item.color.Green},${item.color.Blue},${item.color.Alpha}) ${parseInt(item.value*100)}${closeGrad}`;
          })
        }
      }
      if (hair.hasOwnProperty('ID')){
        if (hair.ID?.length >0){
          let closeGrad = "%, ";
          hair.ID.forEach((item, key, arr) => {
            if (Object.is(arr.length - 1, key)) {
              closeGrad = "% ";
            }
            shade +=` rgba(${item.color.Red},${item.color.Green},${item.color.Blue},${item.color.Alpha}) ${parseInt(item.value*100)}${closeGrad} `;
          })
        }
      }

      $("#hairSwatches").append("<span data-set='"+hair.set+"' alt='"+hair.name+"'  title='"+hair.name+"' data-name='"+hair.name+"' data-crtt='linear-gradient("+hair_colors+")' data-cid='linear-gradient("+shade+")' style='background:linear-gradient("+hair_colors+");order:"+k+";' >"+"</span>");
      k++
    });
  }
}

async function abuildHairs(aHairs){
	if (typeof(aHairs)=="object"){
		if (aHairs.hasOwnProperty('profiles')){
			var hair_colors = shade = UIhairCode = ''

			aHairs.profiles.forEach((hair)=>{
				hair_colors = '';
				shade = ''
				if (hair.colors.hasOwnProperty('rootToTip')){
					if (hair.colors.rootToTip.length>0){
						let closeGrad = "%, ";
						hair.colors.rootToTip.forEach((item, key, arr) => {
				      if (Object.is(arr.length - 1, key)) {
								closeGrad = "% ";
							}
							hair_colors +=" "+item.c+" "+parseInt(item.p*100)+closeGrad
				    });
					}
				}
				if (hair.colors.hasOwnProperty('id')){
					if (hair.colors.id.length>0){
						let closeGrad = "%, ";
						hair.colors.id.forEach((item, key, arr) => {
				      if (Object.is(arr.length - 1, key)) {
								closeGrad = "% ";
							}
							shade +=" "+item.c+" "+parseInt(item.p*100)+closeGrad
				    });
					}
				}
        UIhairCode += `<span data-set='${hair.set}' alt='${hair.name}'  title='${hair.name}' data-name='${hair.name}' data-crtt='linear-gradient(${hair_colors})' data-cid='linear-gradient(${shade})' style='background:linear-gradient(${hair_colors});order:${hair.order}' >"+"</span>`
			});
      $("#hairSwatches").append(UIhairCode);
		}
	}
}

function switchLegacyMat(material){
	$("#materiaList li").removeClass("active");
	$("#materiaList li[data-ref='"+material+"']").addClass("active");
}

$(window).on("load", function (e) {
  const AppLoading = document.getElementById("Loading");
  AppLoading.showModal();
})

$(function(){
  var setupModPath = document.getElementById('setupModPath');
  //Get the hairs profiles Json Database
  $.getJSON( "./jsons/hairDB.json", function( hairProfiles ) {
    hairDB = hairProfiles
    uiBuildHairs(hairDB)
  })
  //Get the microblends Json database
  $.getJSON("./jsons/mbcore.json",function(microblendsList){
    coreMblends = microblendsList
    abuildMB(microblendsList)
  })
  
  var Workspaces = {
    index: 0,
    alternatives: [
      './css/workspace_legacy.css',
      './css/workspace_compact.css',
      './css/workspace_substance.css'
      ],
    dom : $("#workspaceCSS"),
    config( idx = 0 ){
      this.index = Number(idx) > 0 ? Number(idx) : 0;
      return this.alternatives[this.index];
    },
    walk(){
      let size = this.alternatives.length
      // add 1 -> mod to the size of the array -> add the size -> re-mod
      this.index = (++this.index % size + size) % size;
      thePIT.savePref({workspace:Number(this.index)});
      return this.alternatives[this.index];
    }
  }

  function movecontent(){
    if (Workspaces.index==2) {
      $("#MatSelector").insertBefore("#MlEditor");
      $("#Settings").insertAfter("#layer_settings")
      $("#layer_settings").appendTo("#SettingsScroller");
      $("#micropanel").appendTo("#SettingsScroller");
      $("#materialDis").appendTo("#SettingsSummary");
      $("#mb-preview").appendTo("#SettingsSummary");
      $("#SettingsSummary").append(`<div class='cube tint'> </div>
        <div id="rc-ColorSelector" style="display:none;">
          <div class="colorSelector"></div>
        </div>`);
      $("#cagecolors span.active").click();
      $("#Mlswitcher").parent().attr('open','');
    }else{
      $("div.cube.tint").remove();
      $("#rc-ColorSelector").remove();
      $("#layer_settings").insertAfter($("#MlEditor"));
      $("#micropanel").insertAfter($("#layer_settings"));
      $("#materialDis").appendTo("#matdisplay > div:nth-child(1)");
      $("#mb-preview").insertAfter("#MicroblendsLibrary");
      $("#Settings").appendTo("#modelsNavbar");
      $("#MatSelector").insertBefore("#appearanceSwitcher");
      $("#Mlswitcher").parent().removeAttr('open');
    }
  }

  MLSBConfig.then((config)=>{
    if (config.hasOwnProperty('paths')){
      materialJSON = new MaterialBuffer(config.paths.depot);
      $("dialog#setupModPath input").val(config.paths.lastmod);
      if ((config.paths?.game).match(new RegExp(/.+(archive\\pc\\content)$/))){
        alertMe('In your preferences you have to setup THE GAME folder, NOT the subfolder "archive\\pc\\content" ')
      }
    }
    if (config.hasOwnProperty('maskformat')){
      textureformat = config.maskformat
    }
    if (config.hasOwnProperty('workspace')){
      Workspaces.dom.attr('href',Workspaces.config(config.workspace));
      movecontent();
    }

  }).catch((error)=>{
    notifyMe(error);
  });

  $(".friendo").on("input",function(e){
    var friendship = $(this).data("control");
    $(friendship).val($(this).val())
    $(friendship).trigger("input",true);
    if (e.target.dataset?.control.match(/^#layerOff.+/)){
      $("#thacanvas").trigger("texOffset",'ui');
    }
  });

  $("input.driven").on({
      "input":function(e){
        driveRange(e);
      },
      "change":function(e){
        driveRange(e);
      }
    });

  function driveRange(identifier){
    if ($(identifier.target.getAttribute("id"))!=undefined){
      var controller = `#${identifier.target.getAttribute("id")}`;

      if ($(`.friendo[data-control='${controller}']`).length > 0 ){
        $(`.friendo[data-control='${controller}']`).val( $(controller).val());
      }

      if (controller=="#layerTile"){
        callOnce(()=>{
          $("#thacanvas").trigger("texTiled",'ui');
        },400);
      }
    }
  }

  //make it as a circular array https://kittygiraudel.com/2022/02/01/circular-array-in-js/
  //canvas for contestual material
  const canvasMaterial = document.getElementById('materialDis');
  const material2D = canvasMaterial.getContext("2d");
  var lastsize = canvasMaterial.offsetWidth;
  //function to draw the image material
  function drawMaterial(materialChoose){
    var squaresize = canvasMaterial.offsetWidth
    lastsize = squaresize;
    const img = new Image();
    img.onload = ()=>{
      material2D.drawImage(img,0,0,squaresize,squaresize)
    };
    img.onerror = ()=>{
      img.src = `./images/material/unused.jpg`;
      notifyMe("Custom or wrong material name, loading a default one")
    }
    img.src = `./images/material/${materialChoose}.jpg`
  }

  drawMaterial("unused");

  function uiSetMaterial(materialName,materialEntry){
    //from switchLegacyMat function
    $("#materiaList li").removeClass("active");
    $(`#materiaList li[data-ref='${materialName}']`).addClass("active");
    drawMaterial(materialName)
  }

  /* Material.json load and interface events */
  $("#materialJson").bind('update',()=>{
    $("#appeInfo").html("");
    try {
      var materialAppearances = JSON.parse($("#materialJson").val());
      materialJSON.import($("#materialJson").val());
      $("#appeInfo").html(materialJSON.codeAppearances());
    } catch (error) {
      notifyMe(error,false);
    }
  });

  $("body").on("click","#appeInfo button[data-appearance]",function(){
    $(`#nav-appearance div.card`).removeClass('active');
    let setAppearance = $(this).attr("data-appearance");
    $(this).closest(".card").addClass('active');
    $(`body #appearanceSwitcher li a[data-name='${setAppearance}']`).click();
  });
  

  var mls_Offcanvas = document.getElementById('off_MLSetups')
  var off_MLSetup = new bootstrap.Offcanvas(mls_Offcanvas)

  // Custom Event for Microblend loading
  const updblends = new Event('updMBlends');
  document.addEventListener(updblends,(e)=>{
      var updCustomMicroblends = thePIT.getMuBlends();
      updCustomMicroblends.then((listaMU) => {
        nubuildMB(listaMU);
      }).catch((error) => {
        console.log(error)
      })
  })

  var indexLayerContextual = null; //variable index for the copied Data
  var dataContextual = {};
  var newMBlendMan = {packageName:"",files:[]};

  const FolderImport = {
    groups:{},
    add : function(elm = {},type){
      if (!$.isEmptyObject(elm)){
        this.groups[type].push(elm);
      }
    },
    reset: function(){
      this.groups = {models:[],masks:[],textures:[],dirs:[]};
    }
  };

  FolderImport.reset();

	const materialsize = window.getComputedStyle(document.body).getPropertyValue('--matsizes').replace(/px/,'');

  //Building the list of microblends
  //let buildmyMicroblends = abuildMB(coreMblends);

  var readCustomMicroblends = thePIT.getMuBlends();

    readCustomMicroblends
      .then((listaMU) => {
        nubuildMB(listaMU);
      })
      .catch((error) => {
        console.log(error)
      })
	/* let buildmyNuMaterial = abuildMaterial(materialCore); */
	//let buildmyMasks = abuildMaskSelector(maskList)

	//not sure about this
	function slideMaterials(index,speed = 700){
		if (index/4>1){
			$("#cagemLibrary").animate({scrollTop:((Math.floor(index/4)-0.5)*(parseInt(materialsize)+3))+"px"},speed);
		}
	}

  function SOnotify(message){
    if (!("Notification" in window)) {
      // Check if the browser supports notifications
      alert("This browser does not support desktop notification");
    } else if (Notification.permission === "granted") {
      // Check whether notification permissions have already been granted;
      // if so, create a notification
      const notification = new Notification(message);
      // …
    } else if (Notification.permission !== "denied") {
      // We need to ask the user for permission
      Notification.requestPermission().then((permission) => {
        // If the user accepts, let's create a notification
        if (permission === "granted") {
          const notification = new Notification(message);
          // …
        }
      });
    }
  }

  function trigPARAMSchange(){
     document.getElementById("tweakContainer").dispatchEvent(new CustomEvent("changedUI"));
  }

  /*
	var matChooser = document.getElementById('materialChoser')
  */

  $(document).on('keydown', function(e) {
    var ev = e // Event object 'ev'
    var key = ev.code; // Detecting keyCode

    var ctrl =  ev.ctrlKey ? ev.ctrlKey : ((key === 17) ? true : false);
    var shift = ev.shiftKey ? ev.shiftKey : ((key === 16) ? true : false);

    //CTRL + SHIFT + w
    if (ctrl && shift && (key=='KeyW')){
      Workspaces.dom.attr('href',Workspaces.walk());
      movecontent();
    }
    if (ctrl &&(key=='KeyW')){
      //triggering close and reset to first
      $("#MlSetupsList span.text-bg-secondary .btn-close").click();
      return false;
    }

    //CTRL + SHIFT + A
    if (ctrl && shift && (key=='KeyA')){
      $("#applytoMyLayer").click();
    }

    if (ctrl && (key=='KeyO')){
      PARAMS.opacityPreview = !PARAMS.opacityPreview;
      trigPARAMSchange();
      $("#layerOpacity").trigger("input");
    }

    if (ctrl && (key=='KeyU')){
      //switch and Update UI
      $(".UI-layer-switch").toggleClass("d-none");
      const sbUI = document.querySelector("substance-layer");
      MLSB.UI.substance = !$("#substanceUI").hasClass("d-none");
      const activeMlSetup = getActiveMultilayerSetup()
      if (MLSB.UI.substance){
        sbUI.dispatchEvent(new CustomEvent("setActive",{detail:{layer:MLSB.Editor.layerSelected}}))

        let limitLayers = MLSB.getMlsetup(activeMlSetup).Layers.length
        if (limitLayers>0){
          sbUI.dispatchEvent(new CustomEvent("disable",{detail:{layers:limitLayers}}))
        }
      }else{
        $("#layeringsystem li").removeClass("active")
        $("#layeringsystem li").eq(MLSB.Editor.layerSelected).addClass("active");
      }
    }
    
    MLSB.Key.shiftPress = !MLSB.Key.shiftPress;
  });

  function updPanelCovers(){
    let fmanager = $("#MlEditor").offset().left;
    let layersetting = $("#layer_settings").offset().left;
    $('#panelsSize').text(`
      .coverFullEditor{top: 0;right: 0;border-left: 1px solid rgba(0,0,0,.2);transform: translateX(100%);width:${parseInt($( window ).width()-fmanager+(0.5 * parseFloat(getComputedStyle(document.documentElement).fontSize)))}px !important;}
      .coverParamEditor{top: 0;right: 0;border-left: 1px solid rgba(0,0,0,.2);width:${parseInt($( window ).width()-layersetting+2)}px !important;}
    `);
  }

	

  const mbDropZone = document.getElementById('dropzone');

  mbDropZone.addEventListener('dragleave', (event) => {
    event.stopPropagation();
    event.preventDefault();
    mbDropZone.classList.remove('active');
  });

  mbDropZone.addEventListener('dragover', (event) => {
    event.stopPropagation();
    event.preventDefault();
    // Style the drag-and-drop as a "copy file" operation.
    event.dataTransfer.dropEffect = 'copy';
    mbDropZone.classList.add('active');
  });

  mbDropZone.addEventListener('drop', (event) => {
    event.stopPropagation();
    event.preventDefault();
    const fileList = event.dataTransfer.files;
    var filteredFiles = {}
    mbDropZone.classList.remove('active');
    var md5
    Object.entries(fileList).forEach(([key, file]) => {
      if (file.name.match(/\.png$/)){
        filteredFiles[key]=file
        if ($("#mblendUserManager div[data-filepath='base\\surfaces\\microblends\\"+file.name+"']").length==0){
          md5 = CryptoJS.MD5("base\\surfaces\\microblends\\"+file.name)
          if ($(`#mblendUserManager div[data-hash='${md5}']`).length==0){
            $("#mblendUserManager").append(`<div data-filename='${file.name}' data-filepath='base\\surfaces\\microblends\\${file.name}' data-hash='${md5}'><input type="text" class="form-control form-control-sm" value="base\\surfaces\\microblends\\${file.name.replace(/\.png/,'.xbm').toLowerCase()}"></div>`);
          }
        }
      }
    });
    md5=null;
  });

  $("body").on("click","#mbHierarchy ul[data-package] li svg.fa-circle-minus",function(e){
    let name = $(this).parent().text();
    let package = $(this).parent().parent().data("package");
    let patapackage = $(this).parent().data("path");
    thePIT.delMBlend({package:package, file:name.trim()+".png", path:patapackage});
  });

  $("#CheckSaveMblend").click(function(){
    if (/^[a-zA-z0-9_\-]+$/.test($("#mbListPackage").val())) {

      newMBlendMan.packageName = $("#mbListPackage").val();
      var md5
      $("#mblendUserManager div[data-filename]").each((index)=>{
        if (/^[a-z0-9_\-\\\/]+\.xbm$/.test($("#mblendUserManager div[data-filename]").eq(index).children().val())){
          md5 = CryptoJS.MD5($("#mblendUserManager div[data-filename]").eq(index).children().val());
          newMBlendMan.files.push({
              name:$("#mblendUserManager div[data-filename]").eq(index).data('filename'),
              source:$("#mblendUserManager div[data-filename]").eq(index).data("filepath"),
              gamepath:$("#mblendUserManager div[data-filename]").eq(index).children().val(),
              hash:CryptoJS.enc.Hex.stringify(md5)
            })
        }
      })
      if (newMBlendMan.files.length>0){
        $("#CheckSaveMblend").append(`<div class="spinner-grow text-warning microspin" role="status"><span class="visually-hidden">Loading...</span></div>`);
        thePIT.importMBlend(newMBlendMan);
      }
      if ($("#mbLogPackager").hasClass("show")) { $("#mbLogPackager").removeClass("show");}
      newMBlendMan = {packageName:"",files:[]};
    }else{
      $("#mbLogPackager").addClass("show").html("the package name cannot be empty")
    }
  });

	$("body").on("click", "#hairSwatches span",function(el){
    
		$('#sp-gradients div:nth-child(1)').attr('style',"background:"+$(this).data('crtt')+", "+$('#bkgshades').val()+";");
		$('#sp-gradients div:nth-child(2)').attr('style',"background:"+$(this).data('cid')+", "+$('#bkgshades').val()+";");
		$('#hRootToTip').attr('style',"background:"+$(this).data('crtt').replace("linear-gradient(","linear-gradient( 90deg,")+", "+$('#bkgshades').val()+";");
		$('#hID').attr('style',"background:"+$(this).data('cid').replace("linear-gradient(","linear-gradient( 90deg,")+", "+$('#bkgshades').val()+";");
    
    let Actual_hair_Profile = hairDB.Profiles.filter(el => el.name==$(this).data('name'))
    if (Actual_hair_Profile?.length>0){
      $("#thacanvas").trigger("hairColorSwitch",{'root':Actual_hair_Profile[0].RootToTip,'id':Actual_hair_Profile[0].ID})
    }
		
	});

	$('#bkgshades').val(window.getComputedStyle(document.body).getPropertyValue('--eq-lay1'))
	$('#sp-gradients div').css('background-color',$('#bkgshades').val());
	$('#bkgshades').on('change',function(){
		$('#sp-gradients div').css('background-color',$('#bkgshades').val());
	});

	$("#legacyMatSector").click(function(ev){
		if ($("#legacyMatSector").prop('open')==false){
			thePIT.savePref({legacymaterial:true});
		}else{
			thePIT.savePref({legacymaterial:false});
		}
	});

/* Contestual menu on layers */
  const contextMenu = document.getElementById("layers-contextual");
  const layerscope = document.querySelector("#layeringsystem");

  //Right click
  $("#layeringsystem li").on("contextmenu",function(event){
    //default UI
    if ($(this).attr("disabled")!="disabled"){
        event.preventDefault();
        showContextMenu({x:event.clientX,y:event.clientY},Number($(this).text()))
    }
  });

$("#masksPanel li").click(function(){
  $("#masksPanel li.active").removeClass("active");
  $(this).addClass("active");
  $("#layeringsystem li").eq($(this).index()).click();
});

$("#resetShades span.choose").click(function(){
  let theshade = $(this).data("color");
  $("#slidemask").val(parseInt(theshade,16)).change();

  $("#maskoolor").data("color",theshade);
  $("#maskoolor").attr("data-color",theshade);
  $("#maskoolor").css("background-color","#"+theshade);
});

function opacityCheck(value){
  return PARAMS.opacityPreview ? value : 1.0;
}

$("#layerOpacity").on("input",function(ev){
    $("#thacanvas").trigger("changeOpacity", opacityCheck($(this).val()) );
});
//Change in layer displayer
	$("#matInput, #layerTile, #layerOpacity, #layerOffU, #layerOffV, #layerColor, #mbInput, #mbOffU, #mbOffV, #mbTile, #mbCont, #mbNorm, #layerNormal, #layerMetalOut, #layerRoughIn, #layerRoughOut").on("change",function(ev){
		if (
			($("#matInput").val() != $("#layeringsystem li.active").data("material")) ||
			(parseFloat($("#layerTile").val()) != parseFloat($("#layeringsystem li.active").data("mattile"))) ||
			(parseFloat($("#layerOpacity").val()) != parseFloat($("#layeringsystem li.active").data("opacity"))) ||
			(parseFloat($("#layerOffU").val()) != parseFloat($("#layeringsystem li.active").data("offsetu"))) ||
			(parseFloat($("#layerOffV").val()) != parseFloat($("#layeringsystem li.active").data("offsetv"))) ||
			($('#layerNormal').val() != String($("#layeringsystem li.active").data("normal"))) ||
			($('#layerMetalOut').val() != String($("#layeringsystem li.active").data("metalout"))) ||
			($('#layerRoughIn').val() != String($("#layeringsystem li.active").data("roughin"))) ||
			($('#layerRoughOut').val() != String($("#layeringsystem li.active").data("roughout"))) ||
			($('#layerColor').val() !=$("#layeringsystem li.active").data("color")) ||
			($("#mbInput").val() != $("#layeringsystem li.active").data("mblend")) ||
			(parseFloat($("#mbTile").val()) != parseFloat($("#layeringsystem li.active").data("mbtile"))) ||
			(parseFloat($("#mbCont").val()) != parseFloat($("#layeringsystem li.active").data("mbcontrast"))) ||
			(parseFloat($("#mbNorm").val()) != parseFloat($("#layeringsystem li.active").data("mbnormal"))) ||
			(parseFloat($("#mbOffU").val()) != parseFloat($("#layeringsystem li.active").data("mboffu"))) ||
			(parseFloat($("#mbOffV").val()) != parseFloat($("#layeringsystem li.active").data("mboffv")))
			){
			$("#layeringsystem li.active").addClass("notsync");
      if ((ev.target.id=="layerOffU") || (ev.target.id=="layerOffV")){
        callOnce(()=>{
          $("#thacanvas").trigger("texOffset",'ui');
        },400);
      }
		}else{
			$("#layeringsystem li.active").removeClass("notsync");
		}
	});

  $("#layers-contextual li").click(function(){
    const container = $("#layers-contextual")
    if ($(this).attr("disabled")!="disabled"){
      console.log(Number(container.attr("data-source")));

      switch ($(this).data("action")) {
        case 'cpall':
          dataContextual = {};
          dataContextual.labels = $("#layeringsystem li").eq(indexLayerContextual).attr("data-labels");
          dataContextual.mattile = $("#layeringsystem li").eq(indexLayerContextual).data("mattile");
          dataContextual.material = $("#layeringsystem li").eq(indexLayerContextual).data("material");
          dataContextual.color = $("#layeringsystem li").eq(indexLayerContextual).data("color");
          dataContextual.normal = $("#layeringsystem li").eq(indexLayerContextual).data("normal");
          dataContextual.roughin = $("#layeringsystem li").eq(indexLayerContextual).data("roughin");
          dataContextual.roughout = $("#layeringsystem li").eq(indexLayerContextual).data("roughout");
          dataContextual.metalout = $("#layeringsystem li").eq(indexLayerContextual).data("metalout");
          dataContextual.offsetu = $("#layeringsystem li").eq(indexLayerContextual).data("offsetu");
          dataContextual.offsetv = $("#layeringsystem li").eq(indexLayerContextual).data("offsetv");
          dataContextual.opacity = $("#layeringsystem li").eq(indexLayerContextual).data("opacity");
          //microblend data
          dataContextual.mblend = $("#layeringsystem li").eq(indexLayerContextual).data("mblend");
          dataContextual.mbtile = $("#layeringsystem li").eq(indexLayerContextual).data("mbtile");
          dataContextual.mbcontrast = $("#layeringsystem li").eq(indexLayerContextual).data("mbcontrast");
          dataContextual.mbnormal = $("#layeringsystem li").eq(indexLayerContextual).data("mbnormal");
          dataContextual.mboffu = $("#layeringsystem li").eq(indexLayerContextual).data("mboffu");
          dataContextual.mboffv = $("#layeringsystem li").eq(indexLayerContextual).data("mboffv");
          $("#layers-contextual li[data-action='pstall']").removeAttr("disabled");
          $("#layers-contextual li[data-action='pstmb']").removeAttr("disabled");
					$("#layers-contextual li[data-action='pstcol']").removeAttr("disabled");
          break;
        case 'pstall':
          $("#layeringsystem li").eq(indexLayerContextual).data("labels",dataContextual.labels);
          $("#layeringsystem li").eq(indexLayerContextual).data("mattile",dataContextual.mattile);
          $("#layeringsystem li").eq(indexLayerContextual).data("material",dataContextual.material);
          $("#layeringsystem li").eq(indexLayerContextual).data("color",dataContextual.color);
          $("#layeringsystem li").eq(indexLayerContextual).data("normal",dataContextual.normal);
          $("#layeringsystem li").eq(indexLayerContextual).data("roughin",dataContextual.roughin);
          $("#layeringsystem li").eq(indexLayerContextual).data("roughout",dataContextual.roughout);
          $("#layeringsystem li").eq(indexLayerContextual).data("metalout",dataContextual.metalout);
          $("#layeringsystem li").eq(indexLayerContextual).data("offsetu",dataContextual.offsetu);
          $("#layeringsystem li").eq(indexLayerContextual).data("offsetv",dataContextual.offsetv);
          $("#layeringsystem li").eq(indexLayerContextual).data("opacity",dataContextual.opacity);
          //microblend data
          $("#layeringsystem li").eq(indexLayerContextual).data("mblend",dataContextual.mblend);
          $("#layeringsystem li").eq(indexLayerContextual).data("mbtile",dataContextual.mbtile);
          $("#layeringsystem li").eq(indexLayerContextual).data("mbcontrast",dataContextual.mbcontrast);
          $("#layeringsystem li").eq(indexLayerContextual).data("mbnormal",dataContextual.mbnormal);
          $("#layeringsystem li").eq(indexLayerContextual).data("mboffu",dataContextual.mboffu);
          $("#layeringsystem li").eq(indexLayerContextual).data("mboffv",dataContextual.mboffv);
          //Setup the HTML just in case
          $('#layeringsystem li').eq(indexLayerContextual).attr({
            "data-mattile":dataContextual.mattile,
            "data-labels":dataContextual.labels,
            "data-material":dataContextual.material,
            "data-opacity":dataContextual.opacity,
            "data-color":dataContextual.color,
            "data-normal":dataContextual.normal,
            "data-roughin":dataContextual.roughin,
            "data-roughout":dataContextual.roughout,
            "data-metalout":dataContextual.metalout,
            "data-offsetU":dataContextual.offsetu,
            "data-offsetV":dataContextual.offsetv,
            "data-mblend":dataContextual.mblend,
            "data-mbtile":dataContextual.mbtile,
            "data-mbcontrast":dataContextual.mbcontrast,
            "data-mbnormal":dataContextual.mbnormal,
            "data-mboffu":dataContextual.mboffu,
            "data-mboffv":dataContextual.mboffv
          });
          $("#layeringsystem li").eq(indexLayerContextual).click();
          break;
        case 'pstmb':
          $("#layeringsystem li").eq(indexLayerContextual).data("mblend",dataContextual.mblend);
          $("#layeringsystem li").eq(indexLayerContextual).data("mbtile",dataContextual.mbtile);
          $("#layeringsystem li").eq(indexLayerContextual).data("mbcontrast",dataContextual.mbcontrast);
          $("#layeringsystem li").eq(indexLayerContextual).data("mbnormal",dataContextual.mbnormal);
          $("#layeringsystem li").eq(indexLayerContextual).data("mboffu",dataContextual.mboffu);
          $("#layeringsystem li").eq(indexLayerContextual).data("mboffv",dataContextual.mboffv);
          $('#layeringsystem li').eq(indexLayerContextual).attr({
            "data-mblend":dataContextual.mblend,
            "data-mbtile":dataContextual.mbtile,
            "data-mbcontrast":dataContextual.mbcontrast,
            "data-mbnormal":dataContextual.mbnormal,
            "data-mboffu":dataContextual.mboffu,
            "data-mboffv":dataContextual.mboffv
          });
          $("#layeringsystem li").eq(indexLayerContextual).click();
          break;
				case 'pstcol':
					$("#layeringsystem li").eq(indexLayerContextual).data("color",dataContextual.color);
					$('#layeringsystem li').eq(indexLayerContextual).attr({"data-color":dataContextual.color});
					$("#layeringsystem li").eq(indexLayerContextual).click();
					break;
        case 'swapsrc':
          layerSwapstart = indexLayerContextual
          $("#layers-contextual li[data-action='swapdest']").removeAttr("disabled");
          break;
        case 'swapdest':
          if (layerSwapstart!=indexLayerContextual){
            mLsetup.swap(layerSwapstart,indexLayerContextual)
            $("#layers-contextual li[data-action='swapdest']").attr("disabled",'disabled');
          }else{
            notifyMe(`You really won't swap the layer with itself, right ?!?!??!`, true);
          }
          break;
        case 'clean':
          mLsetup.reset(indexLayerContextual)
          //--- to Be resetted ---
          if ($("#layeringsystem li").eq(indexLayerContextual).click()){
        		$("#matInput").val("base\\surfaces\\materials\\special\\unused.mltemplate");//clean the material
        		//$("#layerOpacity").val("1.0").change();//zeroing the opacity
        		$("#layerColor").val("null_null");//color replace
        		$("#applytoMyLayer").click(); //trigger the application to layer
      			$("#layeringsystem li.active").click() //reselect the layer to updates the material
        	}
          break;
        case 'cleanall':
          vacuumCleaner();
          $("#layeringsystem li.active").click();
          break;
        case 'wipeall':
          vacuumCleaner(false);
          $("#layeringsystem li.active").click();
          break;
        case 'plug':
            if ($("#layeringsystem li[disabled]").length>0){
              $("#layeringsystem li[disabled]").eq(0).removeAttr('disabled');
            }
          break;
        default:
      }
      //console.log(dataContextual);
      $("#layers-contextual").removeClass("visible");
    }
  });

	//replace chars not matching the standard features
	$("#layerRandomCfg").keyup(function (event) {
		let stringa = $(this).val();
		stringa = stringa.replace(/^[,\-]+/,'').replace(/[a-zA-Z\s]+/g,'').replace(/[^0-9,\-\s]+/g,'').replace(/,{2,}/g,',').replace(/\-{2,}/g,'-');
		$(this).val(stringa);
	});

	/* Normalization layers numbers*/
  function normalizeUINumbers(){
    if ($("#layerTile").val() % 1 == 0){ $("#layerTile").val(Number($("#layerTile").val()).toFixed(1));    }
    if ($("#layerOpacity").val() % 1 == 0){ $("#layerOpacity").val(Number($("#layerOpacity").val()).toFixed(1)); }
    if ($("#layerOffU").val() % 1 == 0){ $("#layerOffU").val(Number($("#layerOffU").val()).toFixed(1)); }
    if ($("#layerOffV").val() % 1 == 0){ $("#layerOffV").val(Number($("#layerOffV").val()).toFixed(1)); }
    if ($("#mbTile").val() % 1 == 0){ $("#mbTile").val(Number($("#mbTile").val()).toFixed(1)); }
    if ($("#mbNorm").val() % 1 == 0){ $("#mbNorm").val(Number($("#mbNorm").val()).toFixed(1)); }
  }

  //const maskUVs = new fabric.Canvas('fabUVDis');


  const uvmSize = $("#maskPainter").attr('width');

	localStorage = window.localStorage;
	const license = localStorage.getItem('LicenseRead');
	const licenseWindow = document.getElementById('LicenseModal');
  const lastExportFormat = localStorage.getItem('ExportFormat');
  const lastModelOpened = localStorage.getItem('lastModelOpened');
  const lastLuminosity = localStorage.getItem('luminosity');

  MLSB.TreeD.lastModel = lastModelOpened ?? ''; //coalescing null values with empty string

  $("#modelTarget").val(MLSB.TreeD.lastModel);
  $("#materialTarget").val(MLSB.TreeD.lastModel.replace(/\.glb$/,".Material.json"));
  
  var openCloseMBlend = localStorage.getItem('customMicroblend_I');

  if (openCloseMBlend){
    $("#cu_mu_display").removeClass("d-none");
    $("#btn_dis_cBlend svg").removeClass("fa-eye").addClass("fa-eye-slash");
  }else{
    $("#cu_mu_display").addClass("d-none");
    $("#btn_dis_cBlend svg").removeClass("fa-eye-slash").addClass("fa-eye");
  }

  if (lastExportFormat!=null){
    $("select[name='exportVersion']").val(String(lastExportFormat));
  }else{
    $("select[name='exportVersion']").val(3);
  }

  if (lastLuminosity!=null){
    $("#colorLum").val(parseFloat(lastLuminosity));
    setTimeout(()=>{$("#colorLum").change()},1000);
  }

  /*
	const modelPlace = localStorage.getItem('MLibX');
	if (Number(modelPlace)>0){
		swapModelClass();
	}
  */
  updPanelCovers();
	//modal uncooking progress
	const unCookModal = new bootstrap.Modal(document.getElementById('unCookModal'));
	//license modal
	const licenseModal = new bootstrap.Modal(licenseWindow);
	//modal information windows for loaded models
	//const wGLBInfo = new bootstrap.Modal(document.getElementById('modalInfo'));
	//modal window used for aiming the microblends over the actual used layer
  $("#AimMBlend").click(function(){
    thePIT.openAim(
      {
        horizontal:parseFloat($("#mbOffU").val()),
        vertical:parseFloat($("#mbOffV").val()),
        tiles:parseFloat($("#mbTile").val()),
        microblend:$("#mb-preview").attr('src'),
        mask:document.getElementById("maskPainter").toDataURL()
      }
    );
  });

  $("#slidemask").on("input",function(){
		let hexacol
    hexacol = String(Number($(this).val()).toString(16)).padStart(2, '0').repeat(3);
		$("#maskoolor").data("color",hexacol);
		$("#maskoolor").attr("data-color",hexacol);
		$("#maskoolor").css("background-color","#"+hexacol);
  });

  $("#maskoolor").on("dblclick",function(){
    $("#slidemask").val(128).change();
    let middleColor ="808080"
    $("#maskoolor").data("color",middlecolor);
    $("#maskoolor").attr("data-color",middlecolor);
    $("#maskoolor").css("background-color","#"+middlecolor);
  });
  
	//Displays of the license
	licenseWindow.addEventListener('hidden.bs.modal', function (event) {
    localStorage.setItem('LicenseRead',Date.now());
    checkOnSettings()
  });

	if (license==null){ licenseModal.show();}else{checkOnSettings()}
  

	//activate/deactivate wireframe display
 $("#wireFrame").click(function(ev){
    PARAMS.wireframes = $(this).is(':checked');
    trigPARAMSchange();
    $("#thacanvas").trigger("theWire");
  });

  //activate and deactivate double layering

  $("#onlyOneSide").click(function(ev){
    PARAMS.oneside = $(this).is(':checked');
    trigPARAMSchange();
    $("#thacanvas").trigger("sided");
  });

	var TextureLoad = new Event('fire');

  //actions connected to the click onto the layers list
	$("#layeringsystem li").click(function(e){

		if (!$(this).attr("disabled")){

      MLSB.Editor.layerSelected = $(this).index();
      applyInEditor();

      //activate the new one only if isn't disabled
			$('#layeringsystem li').removeClass('active notsync');
      //sync with the mask paint editor
      $("#masksPanel li.active").removeClass("active");
      $("#masksPanel li").eq(MLSB.Editor.layerSelected).addClass("active");
			$(this).addClass('active');
			$("#maskLayer").attr("value",$(this).text());
      //if the model is already loaded it fires the event to load the masks
      //in the event if the layer selected is over the maximum layers
      //it load the 0 masks for security
      if ($("#modelTarget").attr('loaded')=='true'){
  			let fireTxLoad = document.getElementById('maskLayer');
  			fireTxLoad.dispatchEvent(TextureLoad);
      }

      //setup the chosen colors for the layer

      //Load the layers infor into the fields
      let materialByClick = String($(this).data("material")).replace(/^.*[\\\/]/, '').split('.')[0];
			semaphoreCLKmBlend=true;
			//Reset material Library 1.5.99
			$("#cagemLibrary > div").removeClass("active");
			$("#cagemLibrary > div[data-ref='"+materialByClick+"']").addClass("active");
			switchLegacyMat(materialByClick);
			//$("#materialChoser").attr('src','./images/material/'+materialByClick+'.jpg');
      drawMaterial(materialByClick); //draw the material in the canvas

			slideMaterials($("#cagemLibrary > div.active").index());

			$("#materialSummary").html(materialByClick);
      /* ColorChange before the switch */
      //if (MLSB.Materials[])
      if (MLSB.Materials[materialByClick]){
        if (!MLSB.Materials[materialByClick]?.colors.list[$(this).data("color")]){
          $(this).data("color",MLSB.Materials[materialByClick]?.colors.default);
        }
      }
      $("#layerColor").val($(this).data("color"));
			/*trigger the material change */
      $("#cagemLibrary > div[data-ref='"+materialByClick+"']").click();

      //Setup the inputs

      if ( (($(this).data("color")=="000000_null") || ($(this).data("color")=="ffffff_null")) && (!$("#BWAdd").is(":checked")) ){
        $( "#BWAdd" ).click();
      }

      //$("#layerColor").val($(this).data("color"));
      $("#matInput").val($(this).data("material"));
      $("#layerTile").val($(this).data("mattile")).change();
      $("#layerOpacity").val($(this).data("opacity")).change();
      $("#layerNormal").val(String($(this).data("normal")));
      $("#layerRoughIn").val(String($(this).data("roughin")));
      $("#layerRoughOut").val(String($(this).data("roughout")));
      $("#layerMetalIn").val(String($(this).data("metalin")));
      $("#layerMetalOut").val(String($(this).data("metalout")));
      $("#layerOffU").val($(this).data("offsetu"));
      $("#layerOffV").val($(this).data("offsetv"));
      //Microblend section
      $("#mbInput").val($(this).data("mblend")).change();
      $("#mbTile").val($(this).data("mbtile")).change();
      $("#mbCont").val($(this).data("mbcontrast")).change();
      $("#mbNorm").val($(this).data("mbnormal")).change();
      $("#mbOffU").val($(this).data("mboffu"));
      $("#mbOffV").val($(this).data("mboffv"));

			let  ricercacolore = $(this).data("color");
      $("#cagecolors span").removeClass("active");
			$("#cagecolors span[title='"+ricercacolore+"']").addClass("active").click();
			$("#mbInput").focusout(); //fires up the change of material blending preview
      //$("#mbSelect").trigger('change');
		}
	});

  $("span.choose").click(function(){
    $("span.choose.active").removeClass("active");
    $(this).addClass("active");
  });

  $('button[data-bs-toggle="tab"]').on('shown.bs.tab', function (e) {
    DataTable.tables({ visible: true, api: true }).columns.adjust();
  });

  function DTformatChild(d) {
    // `d` is the original data object for the row
    var maskString ='';
    var normString = '';
    /* if (((d.mask!=null)||(d.mask!==undefined)) && parseInt(d.mask) ){
      maskString = `<dt class="text-primary">mask:</dt><dd class="ps-4 text-break">${maskList[d.mask].mask.replace('{format}',textureformat)}</dd>`;
    } */
    if (((d.normal!=null)||(d.normal!==undefined)) && parseInt(d.normal)){
      normString = `<dt class="text-primary">normal:</dt><dd class="ps-4 text-break">${normList[d.normal].replace('{format}',textureformat)}</dd>`;
    }
    return (
        `<dl class="p-2 ps-4 bg-secondary">`+
        `<dt class="text-primary">File:</dt><dd class="ps-4">${d.file}</dd>` +
        `<dt class="text-primary">Tags:</dt><dd class="ps-4">${d.tags}</dd>` +
        `${maskString}${normString}` +
        '</dl>'
    );
  }

/**
 * tag list :
 * --- base | PL
 * * gang
 * * * kind of
 * * car
 * * bike
 *  player,
 *  man,
 *  women,
 *  big,
 *  fat,
 *  massive,
 *  child,
 *  arms,
 *  legs,
 *  head,
 *  torso,
 *  gloves,
 *  shoes,
 *  cyberware,
 *  item,
 *  animals,
 *  tattoo,
 *  npc,
 *  root,
 *  weapons,
 *  firearms,
 *  melee,
 *  explosives,
 *  vehicle,
 *  environment,
 *  mechanical
 */

  var CPModels = $('#DataModelsLibrary').DataTable({
    /* data:[], */
    data:MLSB.Models,
    /* ajax: {
      dataSrc:'models',
      url:'jsons/tablemodels.json'
    }, */
    buttons: [
      {
        extend: 'selected',
        text:'Export',
        className:'btn btn-sm btn-active my-1',
        action:function(dt){
          notifyMe(`Trigger the uncook of the file: ${MLSB.TreeD.lastModel} with materials`);
          $("#layeringsystem li[disabled]").removeAttr('disabled'); //re-enable all the layers
          thePIT.UnCookSingle(MLSB.TreeD.lastModel.replace(".glb",".mesh").replaceAll("\/","\\").replace("\\base\\","base\\").replaceAll("\\ep1\\","ep1\\"));
          taskProcessBar();
          CPModels.rows().deselect();
        }
      },
      {
        extend:'searchBuilder',
        className:'btn btn-sm btn-layer1 my-1',
        config: {
          columns: [3],
          preDefined: {
            criteria: [
                {
                  data: 'Tags',
                  condition:'contains'
                },
             ],logic: 'AND'
          }
        }
      },
      {
        name:`plus`,
        text:'<i class="fa-solid fa-plus"></i>',
        className:'btn btn-sm btn-layer1 my-1',
        action: function(e,dt,node,config){
          $("#manageModels input[name='modelsName']").val("");
          if (dt.row({selected:true}).data()?.tags.includes("custom")){
            $("#manageModels input[name='modelsName']").val(dt.row({selected:true}).data().file);
          }
          manageCustModels.showModal();
          $("#re-selectModel").focus();
        }
      },
      {
        name:`minus`,
        text:'<i class="fa-solid fa-minus"></i>',
        className:'btn btn-sm btn-danger my-1 removeCustomModel',
        enabled: false,
        action: function (e, dt, node, config) {
          let myrow = dt.row({selected:true}).data()
          if (myrow?.tags.includes("custom")){
            mlsbDB.get(`model_${CryptoJS.MD5(myrow.file)}`)
              .then((doc)=>{
                return mlsbDB.remove(doc);
              }).then((operation)=>{
                if (operation.ok){
                  dt.row({selected:true}).remove().draw();
                }
                CPModels.rows().deselect();
              }).catch((error)=>{
                if (
                  (error.hasOwnProperty(`status`)) &&
                  (error.hasOwnProperty(`name`)) &&
                  (error.hasOwnProperty(`message`))
                ){
                  notifyMe(`Status ${error.status}, ${error.name}:${error.message} from the DB`);
                }else{
                  notifyMe(error);
                }
              });
          }
        }
      },
      {
        name:`custom`,
        text:`Custom`,
        className:'btn btn-sm btn-layer2 my-1',
        action:function(e, dt, node, config){
          node.toggleClass("btn-success btn-layer2")
          if (node.hasClass('btn-success')){
            CPModels.column(3).search("custom").draw()
          }else{
            CPModels.column(3).search("").draw()
          }
        }
      }
    ],
    columns:[
      {
        className: 'dt-control',
        orderable: false,
        data: null,
        defaultContent: ''
      },
      {data:'name'},
      {data:'file',searchable:true},
      {
        data:'tags',
        render: function( data, type, row, meta ){
          var howmany = String(data).split(",");
          tagString = '';
          howmany.forEach((el,idx)=>{
            if (idx % 2){
              tagString +=`<span class="badge rounded-pill text-bg-info me-1">${el}</span>`;
            }else{
              tagString +=`<span class="badge rounded-pill text-bg-primary me-1">${el}</span>`;
            }
          })
          return type === 'display'? tagString : String(data).replaceAll(","," ");
        },
        searchable:true
      },
      /* {data:null}, */
      {
        data:'origin',
        defaultContent: 'vanilla',
        orderable: false,
      }
    ],
    columnDefs:[
      {target:[0,1,3],visible:true},
      {target:'_all',visible:false,searchable:false},
      {target:[3],searchBuilder:{defaultCondition:'contains'}}
      ],
    deferRender: true,
    dom:"<'row g-0'<'col-sm-12 col-md-7'Bf><'col-sm-12 col-md-5'il>>" +
    "<'row g-0'<'col-sm-12'tr>>" +
    "<'row g-0'<'col-sm-12 col-md-5'><'col-sm-12 col-md-7'>>",
    language: {
      info: `<i class="fa-solid fa-eye"></i> _START_ to _END_ of _TOTAL_`,
      infoFiltered: "(filtered from _MAX_)",
      search: "",
      searchBuilder: {
        button: 'tags filter',
      }
    },
    order: [[ 2, 'asc' ]],
    processing:true,
    rowGroup:{
      dataSrc: function(row){
        return row['origin']===undefined ? 'vanilla': row['origin'];
      },
      startRender: function(rows, group){
        if (group == 'custom'){
          $(rows.nodes()).addClass('bg-primary text-dark');
        }
      }
    },
    scrollCollapse: true,
    scroller: true,
    scrollY: (window.innerHeight-350),
    search:{
      regex: true,
      return:true
    },
    select: {
      style:'single',
      toggleable: true
    },
    initComplete: function(settings, json){
      let loadingwin = document.getElementById("Loading")
      /*
      PouchDB way of getting docs
      */
      mlsbDB.allDocs({
        startkey: 'model_',
        endkey:'model_\ufff0',
        include_docs: true,
      }).then(function(results){
        if (results.rows.length > 0){
          results.rows.forEach((row)=>{
            let record=row.doc
            CPModels.row.add({
              name:record.name,
              file:record.file,
              tags:record.tags,
              normal:null,
              origin:'custom'
            })
          })
          CPModels.draw(true);
        }
        notifyMe("Mesh linked :"+CPModels.data().length,false);
      }).catch((error)=>{
        notifyMe(error);
      }).finally(()=>{
        loadingwin.close();
        MLSB.initialized();
      });
      $(".dt-buttons button" ).removeClass("dt-button");
      
      setTimeout(()=>{
        CPModels.searchBuilder.container().find('button.dtsb-add.dtsb-button').eq(0).bind("click", function(ev){
          setTimeout(() => {
            let select = document.querySelectorAll('select.dtsb-data');
            let lastSelect = select[select.length-1];
            lastSelect.selectedIndex=1;
            lastSelect.dispatchEvent(new Event('change'));  
          }, 300);
        });
      },4000)
      /* CPModels.searchBuilder.container().getElementsByClassName('dtsb-add')[0].addEventListener("click", function(ev){
        let select =document.querySelector('dtsb-data')[-1];
        console.log(select);
        select.selectedIndex==0;
        select.dispatchEvent(new Event('change'));
      }); */
    }
  })
  .on('select', function(e, dt, type, indexes ) {
    var data = CPModels.row({selected:true}).data();
    MLSB.TreeD.lastModel = data.file;
    localStorage.setItem(`lastModelOpened`,data.file);
    $("#masksTemplate").val(data.mask!=null?maskList[data.mask].mask.replace('{format}',textureformat):'');
    $("#materialTarget").val(MLSB.TreeD.lastModel.replace(/\.glb/,'.Material.json'));
    $("#modelTarget").val(MLSB.TreeD.lastModel);
    $("#thacanvas").trigger("loadScene",[MLSB.TreeD.lastModel]); //start loading the scene
    
    CPModels.buttons( 'minus:name').enable(data.tags.includes("custom"));
    CPModels.buttons( 'plus:name').text(data.tags.includes("custom") ? `<i class="fa-solid fa-edit"></i>`:`<i class="fa-solid fa-plus"></i>` );
  }).on('deselect',function(e, dt, type, indexes){
    CPModels.buttons( 'plus:name').text(`<i class="fa-solid fa-plus"></i>`);
  });

  $('#btnMdlLoader').click(function(){
    $("#thacanvas").trigger("loadScene",[$("#modelTarget").val()]); //start loading the scene
  })

  CPModels.select.selector( 'td:not(:first-child)' ); //

  $('#DataModelsLibrary tbody').on('click', 'td.dt-control', function () {
    var tr = $(this).closest('tr');
    var row = CPModels.row(tr);
 
    if (row.child.isShown()) {
        // This row is already open - close it
        row.child.hide();
    }else {
        // Open this row
        row.child(DTformatChild(row.data())).show();
    }
  });

  //
  $('#DataModelsLibrary_filter input[type=search]').each(function () {
    $(this).attr("placeholder", "Search...");
  });


  //when the loading of the layer configuration setup a microblend
  //it activate the display onto the preview

	$("#mbInput").on('focusout',function(){
		$("#mbSelect option").removeAttr("selected");
		$("#mbSelect").val($("#mbInput").val()).trigger('updateMblend');
	});

	$("#mbInput").keyup(function (event) {
    if (event.which === 13) {
			$("#mbSelect option").removeAttr("selected");
			$("#mbSelect").val($("#mbInput").val()).trigger('updateMblend');
    }
	});

	$("#mbSelect").on('updateMblend',function(){
		test = $("#mbInput").val()
		if ($(`#mbSelect option[value="${test}"]`).length==0){
			$("#mb-preview").prop("src","./images/_nopreview.gif");
		}else{
			//if ($("#mbSelect option[value='"+$("#mbInput").val()+"']").attr("data-thumbnail")!== undefined){
  			$("#mb-preview").prop("src",$(`#mbSelect option[value="${test}"]`).attr("data-thumbnail")).on('error', function() { 	$("#mb-preview").prop("src","./images/_nopreview.gif")});
  		//}
		}
		$("#mbInput").change();
	})

	//load a new texture to display as microblends and fille the name in the microblend file name
	$("#mbSelect").change(function(event){
      var mblendPrevSize = Number(window.getComputedStyle(document.documentElement).getPropertyValue('--mblendSize').replace(/px/,''));
  		$("#mbInput").val($(this).val());
			$("#mbInput").change();

      if ($("#mbSelect option:selected").attr("data-thumbnail")!== undefined){
        let MBName = $(this).val().split('.')[0].split("\\").reverse()[0]

  			$("#mb-preview").prop("src",$("#mbSelect option:selected").attr("data-thumbnail")).on('error', function() { 	$("#mb-preview").prop("src","./images/_nopreview.gif"); console.log("rilevato errore");});

        $("#cagethemicroblends li, #cagetheCuMBlends li").removeClass("MBactive");

        if ($("#cagethemicroblends li[title='"+MBName+"']")){
          $("#cagethemicroblends li[title='"+MBName+"']").addClass("MBactive");
          document.getElementById("microdisplay").scrollLeft = ($(`#cagethemicroblends li[title='${MBName}']`).index() * (mblendPrevSize+2))
        }

        let customSelected = $("#cagetheCuMBlends li").filter(function(el) {
           return $(this).data('path') === $("#mbSelect").val();
        })

        if (customSelected.length>0){
          /*TODO Unify this portion that is executed in 2 part of the interface */
          customSelected.addClass("MBactive");
          let customMBDisplay = document.getElementById("cu_mu_display")
          customMBDisplay.scrollLeft = ($(`#cagetheCuMBlends li[data-path='${$(this).val().replaceAll("\\","\\\\")}']`).index() * (mblendPrevSize+2))
        }
  		}
	});

	//chage to a new microblend
	$("#bg-changer").change(function(){	$("#mb-preview").prop("style","background-color:"+$(this).val());	});
  //reset css fx on microblend
  $("#resetMB").click(function(){
		$("#mbInput").val("base\\surfaces\\microblends\\default.xbm").focusout();
    $("#cagethemicroblends li, #cagetheCuMBlends li").removeClass("MBactive");
    $("#cagethemicroblends li[data-bs-original-title='default']").addClass("MBactive");
    $("#microdisplay").scrollLeft($("#cagethemicroblends li[data-bs-original-title='default']").index()*($("#cagethemicroblends li[data-bs-original-title='default']").width()+2))
	});
  $("#cleanFX").click(function(){$("#mb-preview").removeClass('blend-lumi');});
  //apply luminosity on microblend preview
  $("#lumiFX").click(function(){$("#mb-preview").toggleClass("blend-lumi");});
  //apply invert on microblend preview
  //$("#invertFX").click(function(){$("#mb-preview").removeClass('blend-lumi').addClass("blend-invert");});
  //microblend flipping
	$("#mb-preview").click(function(){
	  $(this).toggleClass("flip");
	  $('i.fa-hand-point-down').toggleClass("fa-hand-point-up");
	});

  /* custom microblends behaviours*/
  $("#btn_dis_cBlend").click(function(){
    $("#btn_dis_cBlend svg").toggleClass("fa-eye fa-eye-slash");
    if ($("#btn_dis_cBlend svg").hasClass("fa-eye-slash")){
      $("#cu_mu_display").removeClass("d-none");
    }else{
      $("#cu_mu_display").addClass("d-none");
    }
    openCloseMBlend = !openCloseMBlend;
    localStorage.setItem("customMicroblend_I",openCloseMBlend);
  });
	//Material libraries and search
	var matToSearch=false;

  //every time the switch skin it's clicked, it reload automatically the mesh

	/* $("#legacyMatFinderCleared").click(function(){$("#legacyMatFinder").val("").keyup()}); */

	$("#matModFinderCleared").click(function(){$("#matModFinder").val("").keyup()})

  $("#legacyMatFinder").on("input",function () {
    var search = $(this).val();
		if (search==''){
			$("#materiaList li").removeClass('d-none');
		}else{

      $("#materiaList li").each(function(index){
        if (~$(this).data("path").indexOf(search)){
          $(this).removeClass('d-none');
        }else{
          $(this).addClass('d-none');
        }
      });
		}
	});

  //mousemove and mouseout event over layers
  $("#layeringsystem li").mousemove(function(e){
      mouseX = e.clientX;
      mouseY = e.clientY;
      $("#floatLayer").css({ "left": `${(mouseX + 30)}px`, "top": `${(mouseY + 10)}px`, "z-index": 1090 });
  });

  $("#layeringsystem li").mouseenter(function (e) {
    if (!MLSB.isReady()){return false;}
    if ((parseFloat($(this).data('opacity')) > 0) && ($(this).attr("disabled") == undefined)) {
      let materialPath = $(this).data('material');
      let materialName = materialPath.split("\\").reverse()[0].split(".")[0]
      let mblendPath = $(this).data('mblend');
      let mblendlName = mblendPath.split("\\").reverse()[0].split(".")[0]
      let colormaterial
      switch ($(this).data('color')) {
        case '000000_null':
          colormaterial = {v:[0,0,0]};
          break;
        case 'ffffff_null':
          colormaterial = {v:[255,255,255] };
          break;
        default:
          if ((MLSB.Materials[materialName]?.colors)!=undefined){
            colormaterial = MLSB.Materials[materialName].colors.list[$(this).data('color')]
          }
          break;
      }
      $("#currentMat").attr("src", `images/material/${materialName}.jpg`);
      //if the microblend is custom it has to build the attribute finding the right one

      if ((coreMblends.packages.core.filter(el => el.name==mblendlName).length==1) || (mblendlName=='default')) {
        $("#currentMblend").attr("src", `images/${mblendlName}.png`);
      }else{
        let dummyMblend = $("#cagetheCuMBlends").find($(`li[title='${mblendlName}']`));
        
        if (dummyMblend.length==1){
          let bg = $(dummyMblend).css('background-image');
          bg = bg.replace('url(','').replace(')','').replace(/\"/gi, "").replace("/thumbs","");
          $("#currentMblend").attr("src", bg);
        }
      }
      
      $("#floatLayer div.colDisplayer").attr("title", $(this).data('color'));
      $("#floatLayer div.colDisplayer").css("background-color", `#${tinycolor.fromRatio({ r: colormaterial[0], g: colormaterial[1], b: colormaterial[2] }).toHex()}`);
      //$("#floatLayer div.colDisplayer").css("background-color", `#${tinycolor.fromRatio({ r: colormaterial.v[0], g: colormaterial.v[1], b: colormaterial.v[2] }).toHex()}`);
      $("#floatLayer footer").html(`<strong>M:</strong> ${materialName}<br><strong>&micro;b:</strong> ${mblendlName}<br><strong>C:</strong> ${$(this).data('color')}`)
      $("#floatLayer").removeClass('d-none');
    }
  });


  $("#layeringsystem li").mouseout(function (e) {
    $("#floatLayer").addClass('d-none');
  });

	$("body").on("mousemove","#materiaList li",function(e){
      var nuPos = $(e.target).offset();
      mouseX = e.clientX;
      mouseY = e.clientY;
			$("#floatMat").css({"left":(nuPos.left - 132) + "px","top":(mouseY - 64)+"px","z-index":1090,"background":"url(images/material/"+$(this).data('ref')+".jpg) 0 0 no-repeat","background-size":" 128px,128px"});
			$("#floatMat").removeClass('d-none');
		}
	);

	$("#materiaList").mouseout(function(e){
		$("#floatMat").addClass('d-none');
	});

  function uiBuildMaterialColorCode(chosenMaterial){
    let cageColorHtml = '';
    Object.entries(chosenMaterial.colors.list).forEach(([key,value])=>{
      toodarkClass='';
      //check brightness
      let colorchecking = tinycolor.fromRatio({r:value[0],g:value[1],b:value[2]});
      if (!tinycolor.isReadable(colorchecking,"#3c454d")){
        toodarkClass='bg-light';
      }
      cageColorHtml+=`<span style="background-color:${colorchecking.toRgbString()};" data-oklab="${rgb2lab([value[0],value[1],value[2]])[0]}" data-lum="${colorchecking.getLuminance()}" data-order="${key}" title="${key}" alt="${key}" >&nbsp;</span>`;
    })

    let colorCode = $(cageColorHtml)

    if (!chosenMaterial.colors.list[$("#layerColor").val()]){
      colorCode.find(`span[title='${chosenMaterial.colors.default}']`).addClass("active")
    }else{
      colorCode.find(`span[title='${$("#layerColor").val()}']`).addClass("active")
    }
    colorCode.sort(sort_color)
    colorCode.appendTo("#cagecolors, #rc-ColorSelector > div");
    $(".colorSelector span").on("click",(ev)=>{
      $(".colorSelector span").removeClass("active");
      $(`.colorSelector span[title='${$("#layerColor").val()}']`).addClass("active");

      if (ev.target.parentNode.getAttribute("id")!=null){
        //cagecolors
      }else{

      }
      
    });
  }


  function uiBuildMaterialEditorList(list,template){
    if (typeof(list)!="object"){
      return '';
    }
    let listCode = '';
    for( const [key,value] of Object.entries(list)){
      listCode += template.replaceAll("KEY",`${key}`).replaceAll("VALUESTRING",`${value.toString()}`).replaceAll("VALUE",`${value}`)
    }
    return listCode
  }

  function uiSwitchMaterial(){
    var chosenMaterial = MLSB.getMaterial();
    if (chosenMaterial===undefined){
      console.log(
        `%c No material override entry loaded for:  ${MLSB.TreeD.lastMaterial} `,"color:blue;background-color: white;"
      );
      notifyMe("Material Inexistent in the DB, import it");
      return
    }
    //Trigger a new texture material Loading only if the material is changed
    if ($("#matInput").val()!=chosenMaterial.file){
      $("#thacanvas").trigger("renderMaterial",chosenMaterial); //trigger the loading of a new Material
      $(".multiplier").attr("data-mul",chosenMaterial.xTiles.toFixed(2));
    }
    $("#materialSummary").html(MLSB.TreeD.lastMaterial); //name of the material
    $("#matInput").val(chosenMaterial.file);  // path of the material
    $("#matInput").trigger("change"); //trigger the check on the level configuration change

    //reflect on UI the material swap
    switchLegacyMat(MLSB.TreeD.lastMaterial);
    drawMaterial(MLSB.TreeD.lastMaterial);
    //Reset fields values in the interface
    $("#Rough_out_values").html('');
    $("#Metal_Out_values").html('');  
    $("#Rough_In_values").html('');
    $("#Norm_Pow_values").html('');
    $("#cagecolors").html('');
    $("#rc-ColorSelector div").html("");
    
    if ($("#BWAdd").is(":checked")){
      //if there is not Black and white color, they will be added
      if (!chosenMaterial.colors.list.hasOwnProperty("000000_null")){
        chosenMaterial.colors.list['000000_null']=[0,0,0];
        chosenMaterial.colors.list['ffffff_null']=[255,255,255];
      }
    }

    uiBuildMaterialColorCode(chosenMaterial);

    $("#Rough_In_values").html(
      uiBuildMaterialEditorList(
        chosenMaterial.roughness.IN.list,
        `<option value="KEY">KEY (VALUESTRING)</option>`
        )
      )
    
    /* Object.entries(chosenMaterial.roughness.IN.list).forEach(([key,value])=>{
      $("#Rough_In_values").append(`<option value="${key}">${key} (${value.toString()})</option>`);
    }); */

    var reOrderbyLevels = chosenMaterial.roughness.OUT.list
    if (PARAMS.sortLevels){
      let sortedRoughByLevels = Object.entries(reOrderbyLevels).sort(orderLevelsRough)
      reOrderbyLevels = {}
      sortedRoughByLevels.forEach((rough)=>{
        reOrderbyLevels[`${rough[0]}`]=rough[1]
      })
    }

    $("#Rough_out_values").html(
      uiBuildMaterialEditorList(
        reOrderbyLevels,
        `<option value="KEY">KEY (VALUESTRING)</option>`
      )
    )

    /* if (PARAMS.sortLevels){
      let reOrderbyLevels = Object.entries(chosenMaterial.roughness.OUT.list);
      let orderedRoughByLevels = reOrderbyLevels.sort(orderLevelsRough)
      orderedRoughByLevels.forEach(([key,value])=>{
        $("#Rough_out_values").append(`<option value="${key}">${key} (${value.toString()})</option>`);
      })
    }else{
      //Roughness OUT
      Object.entries(chosenMaterial.roughness.OUT.list).forEach(([key,value])=>{
        $("#Rough_out_values").append(`<option value="${key}">${key} (${value.toString()})</option>`);
      });
    } */

    //Normal Strenght
    /* Object.entries(chosenMaterial.normal.list).forEach(([key,value])=>{
      $("#Norm_Pow_values").append(`<option value="${key}" data-force='${key}' >${key} (${String(value)})</option>`);
    }); */

    $("#Norm_Pow_values").html(
      uiBuildMaterialEditorList(
        chosenMaterial.normal.list,
        `<option value="KEY" data-force='KEY' >KEY (VALUESTRING)</option>`
        )
    )

    //Metal Out
    var reOrderbyLevels = chosenMaterial.metal.OUT.list
    if (PARAMS.sortLevels){
      let sortedMetalByLevels = Object.entries(reOrderbyLevels).sort(orderLevelsMetal)
      reOrderbyLevels = {}
      sortedMetalByLevels.forEach((rough)=>{
        reOrderbyLevels[`${rough[0]}`]=rough[1]
      })
    }

    $("#Metal_Out_values").html(
      uiBuildMaterialEditorList(
        reOrderbyLevels,
        `<option value="KEY">KEY (VALUESTRING)</option>`
      )
    )
    /* if (PARAMS.sortLevels){
      let metOrderbyLevels = Object.entries(chosenMaterial.metal.OUT.list);
      let orderedMetalByLevels = metOrderbyLevels.sort(orderLevelsMetal)
      orderedMetalByLevels.forEach(([key,value])=>{
        $("#Metal_Out_values").append(`<option value="${key}" >${key} (${value.toString()})</option>`);
      })
    }else{
      Object.entries(chosenMaterial.metal.OUT.list).forEach(([key,value])=>{
        $("#Metal_Out_values").append(`<option value="${key}" >${key} (${value})</option>`);
      });
    } */

    return

    $("#cagecolors span").sort(sort_color).appendTo("#cagecolors, #rc-ColorSelector > div");
    if (!chosenMaterial.colors.list[$("#layerColor").val()]){
      $("#cagecolors span[title='"+chosenMaterial.colors.default+"']").click();
    }
    let ricercacolore = $("#layerColor").val();
    
    $("#rc-ColorSelector > div span").on("click",function(){
      //TODO unify events on color select.
      $(`#cagecolors span[title='${$(this).attr("title")}']`).click();
    })
    
    if ($("#cagecolors span[title='"+ricercacolore+"']").length>0){
      $("#cagecolors span[title='"+ricercacolore+"']").addClass("active");
    }else{
      notifyMe(`The color ${ricercacolore} isn't present in the material ${materialName}`);
    }
    $("#colorLbFinder").keyup();
  }

  //Click on material to swap it
	$("body").on("click","#materiaList li, #cagemLibrary > div", function(event){
     let target = $( event.target );
     $("#materiaList li, #cagemLibrary > div").removeClass('active');
     $(this).addClass('active');
     
     if (target.is( "div" )){
       if ($(this).index()/4>1){
         slideMaterials($(this).index());
        }
      }
    const materialName = $(this).data('ref')
    MLSB.TreeD.lastMaterial = materialName
    uiSwitchMaterial();
	});

  $("#colorLbFinder").keyup(function () {
		if ($(this).val()==''){
			$("#cagecolors span").removeClass('d-none');
      $('#colorLbFinder').removeClass("filterAlert");
		}else{
			$("#cagecolors span:not([title*='"+$(this).val()+"'])").addClass('d-none');
			$("#cagecolors span[title*='"+$(this).val()+"']").removeClass('d-none');
      $('#colorLbFinder').addClass("filterAlert");
		}
  });

  $("#colorCleaner").click(function(){$("#colorLbFinder").val("").keyup()});

/*   $("#orderSet").click(function(ev){
    $("#cagecolors").attr("data-index","oklab")
    $("#cagecolors span").sort(sort_color).appendTo("#cagecolors");
    $("#rc-ColorSelector > div span").sort(sort_color).appendTo("#rc-ColorSelector > div");
  }) */

  $("#colororder").change(function(ev){
    if ($("#colororder").is(":checked")){
      $("#cagecolors").attr("data-index","lum")
    }else{
      $("#cagecolors").attr("data-index","order")
    }
    $("#cagecolors span").sort(sort_color).appendTo(".colorSelector");
    /* $("#rc-ColorSelector > div span").sort(sort_color).appendTo("#rc-ColorSelector > div"); */
  });

  function sort_color(a, b,attribute = $("#cagecolors").attr("data-index")){
    return ($(b).attr(`data-${attribute}`)) < ($(a).attr(`data-${attribute}`)) ? 1 : -1;    
  }
  
  //Color Luminosity
  $("#colorLum").on("change, input",function(ev){
    let illuminazione = $(this).val();
    $("#cagecolors").css("filter",`brightness(${illuminazione})`);

    if(!ev.bubble){
      localStorage.setItem("luminosity",illuminazione);
    }
  });
  
//filter materials by name and display badge links to select them
	$("#matModFinder").keyup(function () {
		if(matToSearch) { clearTimeout(matToSearch); }
		matToSearch = setTimeout(function () {
      var v = $('#matModFinder').val();
			if (v.length<=3){
				$('#matfindresults').html('');
			}else{
				let results = $("#cagemLibrary div[data-ref]").filter(function(){ return $(this).data('ref').match(v);});
				$('#matfindresults').html('');
				$(results).each(function( index ) {
					if (index % 2){
							$('#matfindresults').append('<a class="text-decoration-none badge layer-1 text-light" href="#" data-inx="'+$(this).index()+'">'+$(this).text()+'</a> ')
					}else{
						$('#matfindresults').append('<a class="text-decoration-none badge layer-8 text-light" href="#" data-inx="'+$(this).index()+'">'+$(this).text()+'</a> ')
					}
				});
			}
			//$('#matModFinder').find()

    }, 250);
	});


	/*click in the material selection window over a searched name. it will  select
	 the new material and move to the place where it is */
	$("body").on('click',"#matfindresults a.badge",function(){
		//console.log($(this).data('inx'));
		$("#cagemLibrary div").removeClass('active');
		$("#cagemLibrary div").eq($(this).data('inx')).click();
	})

	$("#layerOpacity").change(function(){
			if (Number($(this).val())==0){
				$("#layerOpacity").addClass('bg-attention');
			}else{
				$("#layerOpacity").removeClass('bg-attention');
			}
	});

	$("#materialModal").on('show.bs.modal',function(){
		//reset the last active material
		$("#cagemLibrary > div").removeClass("active");
		//data-ref the name of the material in use
		let materialtosearch = $("#materialSummary").text();
		let matindexchose = $("#cagemLibrary > div[data-ref='"+materialtosearch+"']").index();

		$("#cagemLibrary > div[data-ref='"+materialtosearch+"']").addClass("active");
		if (matindexchose/4>1){
			slideMaterials(matindexchose,200);
		}
	});

  $("#BWAdd").on("input",function(){
    if ($(this).is(":checked")){
      if (($('#cagecolors span[data-lum="0"]').length==0) && ($('#cagecolors span[data-lum="-1"]').length==0)){
        $("#cagecolors").append("<span style='background-color:black;' data-lum='0' data-order='0' title='000000_null'>&nbsp;</span>");
        $("#cagecolors").append("<span style='background-color:white;' data-lum='1' data-order='-1' title='ffffff_null'>&nbsp;</span>");

        $("#cagecolors").find('span').sort(function(a, b) {
          return +a.getAttribute('data-lum') - +b.getAttribute('data-lum');
        }).appendTo($("#cagecolors"));
      }
    }else{
      $("#cagecolors span[data-lum='0']").remove();
      $("#cagecolors span[data-lum='1']").remove();
    }
  });

  //Clicking outside the contextual menu
  $("body").on('click',function(event){
    if (contextMenu.classList.contains("visible")){
      if (event.target.offsetParent != contextMenu) {
        contextMenu.classList.remove("visible");
      }
    }
     const colorContextual = document.getElementById("rc-ColorSelector");
    //clicked outside the color selector and color selector visible
    if ((colorContextual!==undefined) && (colorContextual!==null)){
      if ((colorContextual.checkVisibility()) && ( !colorContextual.contains(event.target) )){
        console.log(colorContextual);
        $("#rc-ColorSelector").hide();
      }
    }
  });
  
  /*simulate the selection of the null_null color */
  $("#colorReset").click(function(){
    $("body #cagecolors span[title='null_null']").click();
  });
  $("#colorWkitExport").click(function(){
    var chosenMaterial = MLSB.getMaterial();
     if (chosenMaterial!=undefined){
      let materialcolor = chosenMaterial.colors.list;
      let materialList = {"colorScale":[]};
      for(const[name,colors] of Object.entries(materialcolor)){
        materialList.colorScale.push(
          {
            "$type": "Multilayer_LayerTemplateOverridesColor",
            "n": {
              "$type": "CName",
              "$storage": "string",
              "$value": name
            },
            "v": {"Elements": [colors[0],colors[1],colors[2]]}
          }
        )
      }
      console.log(JSON.stringify(materialList,null,2))
     }
  })

	$("body").on('click','#cagecolors span',function(){
    if (!MLSB.UI.substance){
      if ($("#layeringsystem li.active").length!=1) {
        //window.alert("first select a layer, then operate");
        alertMe("Select a Layer before trying to change colors");
      }
    }
    /* retarget the colors chosen*/

		$("#cagecolors span").removeClass('active');
		$(this).addClass('active');

		let colorchanger = $(this).attr("title");
    let colorSwatchValue = $(this).css("background-color")
    $("#thacanvas").trigger('changeColor', [colorSwatchValue] ); //will trigger the color change for the selected material
    $(".tint").prop('style','background-color: oklab(from '+colorSwatchValue+" l a b) !important;");
	  let choosed_color = tinycolor(colorSwatchValue);
    if ($(".cube.tint")){
      let dummyCol = choosed_color.toPercentageRgb()
      $(".cube.tint").attr("data-color",`red.${dummyCol.r}\r\ngreen.${dummyCol.g}\r\nblue.${dummyCol.b}\r\n`)
    }
	  $("#colorPntage").html(choosed_color.toPercentageRgbString());
    $("#layerColor").val(colorchanger).change();
    $("#colorManagament").html(colorchanger);
	});

  $("body").on("click","#cagethemicroblends li",function(ev){
    var mblendPrevSize = Number(window.getComputedStyle(document.documentElement).getPropertyValue('--mblendSize').replace(/px/,''));

    $("#cagethemicroblends li, #cagetheCuMBlends li").removeClass('MBactive');
    $(this).addClass("MBactive");
    let theoneselected = $(this).attr('title');
    document.getElementById("microdisplay").scrollLeft = ($(`#cagethemicroblends li[title='${theoneselected}']`).index() * (mblendPrevSize+2))
    $("#mbSelect option").removeAttr("selected")
    let mbZelected = $("#mbSelect option").filter(function() { return $(this).text() === theoneselected;})
    mbZelected.attr('selected', true);
    $("#mbInput").val($(`#cagethemicroblends li[title='${theoneselected}']`).data("path"));
    $("#mbInput").focusout();
  });

const scrollMBContainer = document.getElementById("microdisplay");
const scrollCustMBContainer = document.getElementById("cu_mu_display");

scrollMBContainer.addEventListener("wheel", (evt) => {
    evt.preventDefault();
    scrollMBContainer.scrollLeft += evt.deltaY;
});

scrollCustMBContainer.addEventListener("wheel", (evt) => {
    evt.preventDefault();
    scrollCustMBContainer.scrollLeft += evt.deltaY;
});

$("#layerRandomizer").click(function(){

    let max_blends = 5;
    let layblend;
		//get options
		var turnOnOff = $("#rndOnOff").prop('checked'); //can the randomized set opacity to e from 0 ?
		var rndMBlend = $("#rndMbWild").prop('checked');
		//get active layers to be randomized
		var layerSactive = $("#layeringsystem li:not([disabled])").length;
    var subjectlayer
		var layerfilter = $("#layerRandomCfg").val();
    var affectedByRand = [...Array(20).keys()];

		//check on random layer selections
		if (layerfilter!=""){
			//last cleanup, remove single and multiple , or - alone at the start or end of the string
			layerfilter = layerfilter.replace(/[2-9][0-9]{1}|\d{3,}/g,'19').replace(/[,\-]+$/,'');
      //retrieve the affected layers
      affectedByRand = syntheticRanges(layerfilter)
		}

    //filter disabled layers
    $("#layeringsystem li[disabled]").each(function( index, el ) {
      affectedByRand = affectedByRand.filter(idx => idx!=$(el).index());
    });

    if (!turnOnOff){
      subjectlayer = $("#layeringsystem li:not([disabled])").filter((el,ob) => {
        if (affectedByRand.includes(el) && (Number($(ob).data("opacity"))>0)){
          return true;
        }else{
          affectedByRand = affectedByRand.filter(idx => idx!=el);
        }
      });
    }else{
      subjectlayer = $("#layeringsystem li:not([disabled])").filter((el) => affectedByRand.includes(el));
    }

    if (!rndMBlend){max_blends=1;}
   //let materialA = Object.keys(ml_randomized);
    let numaterial = ml_randomized.length;
    //let material_colors = 0;
    let materialselect = "unused";
    //let materialrnd = "";

    let numerocicle = subjectlayer.length;
    let microblenda = $("#mbSelect option:not([disabled])");

    //choosing how to apply the microblends on the layers with restrictons layer
    if ((numerocicle > 3)){
      layblend = 1 + Math.floor(Math.random() * (numerocicle-4))
    }

    subjectlayer.each((idx,el)=>{
      let tLayer = new Layer();

      if((turnOnOff) && ($(el).index()>0)){
        if (Math.random() > 0.45){ tLayer.opacity = 0 }
      }else{
        tLayer.opacity = (parseFloat(Math.random()*0.99) + parseFloat(0.01)).toFixed(2);
      }


      tLayer.tiles = (Math.random() * 15).toFixed(2);
      tLayer.microblend.tiles = (Math.random() * 15).toFixed(2);
      tLayer.microblend.contrast = Math.random().toFixed(2)

      materialselect = ml_randomized[(Math.floor(Math.random() * (numaterial-1)))];

      if ((((rndMBlend) && (Math.random() > 0.6)) || ($(el).index()==layblend)) && ($(el).index()>0)  && (max_blends>0)){
        tLayer.microblend.file = microblenda[Math.floor(Math.random() * microblenda.length)].value
      }
      tLayer.material = MLSB.Materials[materialselect].file
      //tLayer.material = materialJson.filter(mat => mat.text == materialselect)[0].a_attr['data-val'];
      tLayer.color = MLSB.Materials[materialselect].colors.list[Math.floor(Math.random() * (MLSB.Materials[materialselect].colors.list.length - 1))]
      //tLayer.color = ml_randomized[materialselect].overrides.colorScale[Math.floor(Math.random() * (ml_randomized[materialselect].overrides.colorScale.length - 1))].n;

      $(el).data({
        "opacity":tLayer.opacity,
        "labels":"("+tLayer.color+") "+materialselect,
        "material":tLayer.material,
        "mattile":tLayer.tiles,
        "color":tLayer.color,
        "mbtile":tLayer.microblend.tiles,
        "mbcontrast":tLayer.microblend.contrast,
        "mbtile":tLayer.microblend.tiles,
        "mblend":tLayer.microblend.file,
      })

      $(el).attr({
        "data-opacity":tLayer.opacity,
        "data-labels":"("+tLayer.color+") "+materialselect,
        "data-material":tLayer.material,
        "data-mattile":tLayer.tiles,
        "data-color":tLayer.color,
        "data-mbtile":tLayer.microblend.tiles,
        "data-mbcontrast":tLayer.microblend.contrast,
        "data-mblend":tLayer.microblend.file,
      });
    })

    $("#layeringsystem li.active").click();
});

  //Clean the actual selected layer
  $("#clean-Layer").click(function(){
    //if a layer is active
  	if ($("#layeringsystem li.active").length>0){
  		$("#matInput").val("base\\surfaces\\materials\\special\\unused.mltemplate");//clean the material
  		$("#layerOpacity").val("0.0").change();//zeroing the opacity
  		$("#layerColor").val("null_null");//color replace
  		$("#applytoMyLayer").click(); //trigger the application to layer
			$("#layeringsystem li.active").click() //reselect the layer to updates the material
  	}
  });
	//Erase layers and put opacity at 0.0 4 all of them unless the 0 one
  $("#wash-layers").click(function(){
    $("#layerRandomCfg").keyup(); //fixes a possible layer selection
    vacuumCleaner(true,true);
    $("#layeringsystem li.active").click();
  });

  //Activate the first layer disabled
  $("#actlast-Layer").click(function(){
    if ($("#layeringsystem li[disabled]").length>0){
      $("#layeringsystem li[disabled]").eq(0).removeAttr('disabled');
    }
  });
  $("#actAll-Layer").click(function(){
    $("#layeringsystem li[disabled]").removeAttr('disabled');
  });
  

  //Erase layers but let opacity at 1.0
  $("#wipe-layer").click(function(){
    $("#layerRandomCfg").keyup(); //fixes a possible layer selection
    vacuumCleaner(false,true);
    $("#layeringsystem li.active").click();
  });

  //applying data to the structure of li
  $("#applytoMyLayer").click(function(){
    applyToLayer()
    return
    var tempLayer = new Layer();

    if ($("#layeringsystem li.active").length==1){
      //var layerIndex = $("#layeringsystem li.active").index();
      /* 
			$("#layeringsystem li.active").removeClass("notsync");
      normalizeUINumbers();
      let livelloeditato =$("#layeringsystem li.active");

      livelloeditato.attr("data-opacity",$("#layerOpacity").val());//to activate/deactivate Opacity in layers display
      livelloeditato.attr("data-labels","("+$("#layerColor").val()+") "+ String($("#matInput").val()).replace(/^.*[\\\/]/, '').split('.')[0]);
      livelloeditato.data("material",$("#matInput").val());
      livelloeditato.data("mattile",$("#layerTile").val());
      livelloeditato.data("opacity",$("#layerOpacity").val());
      livelloeditato.data("color",$("#layerColor").val());
      livelloeditato.data("normal",String($("#layerNormal").val()));
      livelloeditato.data("roughin",String($("#layerRoughIn").val()));
      livelloeditato.data("roughout",String($("#layerRoughOut").val()));
      livelloeditato.data("metalin",String($("#layerMetalIn").val()));
      livelloeditato.data("metalout",String($("#layerMetalOut").val()));
      livelloeditato.data("offsetu",$("#layerOffU").val());
      livelloeditato.data("offsetv",$("#layerOffV").val());
      livelloeditato.data("mblend",$("#mbInput").val());
      livelloeditato.data("mbtile",$("#mbTile").val());
      livelloeditato.data("mbcontrast",$("#mbCont").val());
      livelloeditato.data("mbnormal",$("#mbNorm").val());
      livelloeditato.data("mboffu",$("#mbOffU").val());
      livelloeditato.data("mboffv",$("#mbOffV").val());
      semaphoreCLKmBlend=true;

      //Last edits
      tempLayer.opacity = parseFloat($("#layerOpacity").val());
      tempLayer.material = $("#matInput").val();
      tempLayer.tiles = parseFloat($("#layerTile").val());
      tempLayer.color = $("#layerColor").val();
      tempLayer.normal = String($("#layerNormal").val());
      tempLayer.roughnessIn = String($("#layerRoughIn").val());
      tempLayer.roughnessOut = String($("#layerRoughOut").val());
      tempLayer.metalIn = String($("#layerMetalIn").val());
      tempLayer.metalOut = String($("#layerMetalOut").val());
      tempLayer.offsetU = parseFloat($("#layerOffU").val());
      tempLayer.offsetV = parseFloat($("#layerOffV").val());
      tempLayer.microblend.file = $("#mbInput").val();
      tempLayer.microblend.tiles = parseFloat($("#mbTile").val());
      tempLayer.microblend.contrast = parseFloat($("#mbCont").val());
      tempLayer.microblend.normal = parseFloat($("#mbNorm").val());
      tempLayer.microblend.offset.h = parseFloat($("#mbOffU").val());
      tempLayer.microblend.offset.v = parseFloat($("#mbOffV").val()); */

      //offset changes
      //mLsetup.Layers[layerIndex] = tempLayer;
      //let activeMLTab = getActiveMultilayerSetup();

      /* if (activeMLTab>0){ */
      //MLSB.updMlsetup(activeMLTab,mLsetup,layerIndex);
      /* } */

      //delete tempLayer;
    }else{
      notifyMe("NO level selected, please redo then layer Edit operation with a selected layer on");
    }
  });
/**
 * Import or replaceMaterials in the DB
 */
$("#materialHook").change(function(ev){
  var fr=new FileReader();
  fr.onload = function(){
    var materialFile = JSON.parse(fr.result);
    console.log(materialFile);
    if (materialFile.hasOwnProperty('Header')){
      if (materialFile.Header.hasOwnProperty('WKitJsonVersion')){
        notifyMe(`Multilayer Material file Version ${materialFile.Header.WKitJsonVersion}`,false);  
      }
    }else{
      notifyMe("No Header in the file");
    }
  }
  if ($("#materialHook")[0].files[0]){
    fr.readAsText($("#materialHook")[0].files[0]); //Read as a text file
  }
})
 /*------------------------------------------------------------------------------------
  Import Export of JSON
---------------------------------------------------------------------------------------*/
$("#importLink").click(function(ev){
    ev.preventDefault();
    $("#importTech").click();
});

//----File Auto Loader
$("#importTech").change(function(){
	var fr=new FileReader(); //new reading Object
	fr.onload=function(){
    mlSetupContent = fr.result;
    passTheMlsetup(fr.result);
  }

  if ($("#importTech")[0].files[0]){
    fr.readAsText($("#importTech")[0].files[0]); //Read as a text file
  }
  
});

$("#importFromWkit").click(function(){
  passTheMlsetup( $("#passaggio").val());
});

function passTheMlsetup(textContent=""){
  
  if (textContent!=""){

    $("#off_MLSetups div.offcanvas-body detail").fadeOut();
    var mls_content =" "
    try {
      mls_content = JSON.parse(textContent,mlsContRevive);
      mLsetup = new Mlsetup();
      mLsetup.import(mls_content);

      if (PARAMS.importSkip){
        $("#TheMagicIsHere").click();
      }else{
        let test = $([mLsetup.template("<details {open} style='color:rgba(255,255,255,calc({opacity} + 0.3 ));'><summary >{i} {material|short}</summary><div class='row g-0'><div class='col-md-3'><img src='./images/{microblend|short}.png' class='img-fluid float-end rounded-0 me-1' width='64' ><img width='64' src='./images/material/{material|short}.jpg' data-ref='{material}' class='img-fluid float-end rounded-0' ></div><div class='col-md-9'><div class='card-body p-0'><ul><li>Opacity {opacity}</li><li>Tiles {tiles}</li><li>colorScale {color}</li></ul></div></div></div></details>")].join("\n"));
        $(".mlpreviewBody").html(test)
        off_MLSetup.show();
        // focus on the exit button of the offcanvas
        $("#off_MLSetups button[data-bs-dismiss='offcanvas']").focus();
      }
    } catch (error) {
      notifyMe(error);
    }
  }
}

/*fix for mlsetup version .7*/
function mlsContRevive(key,value){
  if (typeof(value)=='object'){
    if (value.hasOwnProperty('$type')) {  
      switch (value['$storage']) {
        case 'string':
            return String(value['$value']);
            break;
        case 'uint64':
            return Number(value['$value']);
            break;
      }
    }
  }
  return value;
}

//Used to calculate the ranges as Documents printing notations
function syntheticRanges(text='', maxIndex = 20){
  var ranges = [];
  text = text.replaceAll(" ","");

  if (text==""){
    ranges = [...Array(maxIndex).keys()];
  }else{
    let taRanges = []; //temporary Array ranges
    taRanges = text.split(",")

    taRanges.forEach( el =>{
      let dummy = []
      if (el.includes("-") > 0){
        dummy = el.split("-").map(x=>parseInt(x))
        if (dummy[0] > dummy[1]){
          ranges.push([...range(Number(dummy[1]), Number(dummy[0])) ])
        }else{
          ranges.push([...range(Number(dummy[0]),Number(dummy[1]))])
        }
      }else{
        ranges.push(Number(el))
      }
    })
    ranges = [...new Set(ranges.flatMap(num => num))]
  }
  return ranges;
}
//Cleanep all the layers value
function vacuumCleaner(on = true, ranges = false){
  var c_opacity=1.0;

  var aRanges = [...Array(20).keys()];

  if (ranges) {
    $("#layerRandomCfg").val().replaceAll(" ","");
    aRanges = syntheticRanges($("#layerRandomCfg").val());
  }
  //Cleanup all layers value
  if(!on){ c_opacity = 0.0; }
  aRanges.forEach(id =>{
    if ($('#layeringsystem li').eq(id).attr("disabled")!="disabled"){
      $('#layeringsystem li').eq(id).data({
        mattile:'1.0',
        labels:'(null_null) unused',
        material:'base\\surfaces\\materials\\special\\unused.mltemplate',
        opacity:c_opacity,
        color:'null_null',
        normal:'null',
        roughin:'null',
        roughout:'null',
        metalin:'null',
        metalout:'null',
        offsetU:0.0,
        offsetV:0.0,
        mblend:'base\\surfaces\\microblends\\default.xbm',
        mbtile:1.0,
        mbcontrast:0.0,
        mbnormal:1.0,
        mboffu:0.0,
        mboffv:0.0
      });
      $('#layeringsystem li').eq(id).attr({
        "data-mattile":'1.0',
        "data-labels":'(null_null) unused',
        "data-material":'base\\surfaces\\materials\\special\\unused.mltemplate',
        "data-opacity":String(c_opacity),
        "data-color":'null_null',
        "data-normal":'null',
        "data-roughin":'null',
        "data-roughout":'null',
        "data-metalin":'null',
        "data-metalout":'null',
        "data-offsetU":'0.0',
        "data-offsetV":'0.0',
        "data-mblend":'base\\surfaces\\microblends\\default.xbm',
        "data-mbtile":'1.0',
        "data-mbcontrast":'0.0',
        "data-mbnormal":'1.0',
        "data-mboffu":'0.0',
        "data-mboffv":'0.0'
      });
    }
  })

  $('#layeringsystem li').eq(0).data({opacity:1.0});
  $('#layeringsystem li').eq(0).attr({"data-opacity":"1.0"});
}


function disableLayers(totalLayers){
  disabledLayers = 20 - mLsetup.Layers.length;
  $(`#layeringsystem li`).removeAttr('disabled');
  if (disabledLayers>0){
    $(`#layeringsystem li:nth-last-child(-n+${disabledLayers})`).attr('disabled','disabled');
  }
}

function UIMlsetup(){
  
}

//----Button to load
$("#TheMagicIsHere").click(function(){
    off_MLSetup.hide();
    //Layer Cleanup for disabled layers
    //disabledLayers = 20 - mLsetup.Layers.length;
    disableLayers(20 - mLsetup.Layers.length);
    //Convert mlsetup Layers to UI layers
    convLayersMlsetup(mLsetup);
    var nomefile  = $("#importTech").val()=="" ? $('#nametoexport').val() : $("#importTech").val().substring($("#importTech").val().lastIndexOf('\\')+1);
    //change the name on file imported
    document.title = document.title.split('[')[0]+" ["+nomefile+"]";

    console.log(`%c- Imported ${nomefile} -`,"background-color:green;color:yellow;");
    /* openMlsetup.push(mLsetup); */

    MLSB.addMlsetup(mLsetup);

    let UInomefile = nomefile.split("\\").reverse()[0];
    $("#MlSetupsList").trigger("addBlade",UInomefile);
    notifyMe(`Imported : ${nomefile}`,false);
    $('#nametoexport').val(nomefile);
    $("#importTech").val("");
    $("#layeringsystem li.active").click();
    //return
	});

$("select[name='exportVersion']").change(function(){
  localStorage.setItem("ExportFormat",$(this).val())
});

//3 export versions for Wkit
$(".xportJSON").click(function(){
  
  ver = Number($("select[name='exportVersion']").val());

  let nomefile =  mLsetup.getFile();

  //check if there is already a chosed Names
  if (nomefile==""){
    if (String($("#nametoexport").val()).trim()!==''){
      nomefile = String($("#nametoexport").val()).split('\\').reverse()[0].split('.')[0].replace(/\W/g, '').toLowerCase();
    }
  }
  
  if ($("#layeringsystem li").length > 0 ){
    var jsonDate = (new Date()).toJSON();
    var preamble, ratiovalue, ratioIVal, useNormal, closing, jsonbody = "";

    switch(ver){
      case 0:
          preamble ='{\r\n'
            +'  "Chunks": {\r\n'
            +'    "0": {\r\n'
            +'      "Type": "Multilayer_Setup",\r\n'
            +'      "ParentIndex": -1,\r\n'
            +'      "Properties": {\r\n'
            +'        "cookingPlatform": [\r\n'
            +'          "PLATFORM_PC"\r\n'
            +'        ],\r\n'
            +'        "layers": [\r\n';
          ratiovalue='\r\n';
          ratioIVal = $("#layerRatio").val();
          if ((!isNaN(ratioIVal)) && (typeof(ratioIVal)!==undefined) && (Number(ratioIVal)!=1)){
              ratiovalue = ',\r\n        "ratio": '+Number(ratioIVal)+'\r\n';
          }
          closing = '\r\n        ]'+ratiovalue+'      }\r\n    }\r\n  }\r\n}'; //file tail
          jsonbody = '';

          for (k=0;k<$("#layeringsystem li:not([disabled])").length;k++){
            jsonOpacity='';
            jsonOffsetU='';
            jsonOffsetV='';
            jsonMbOffU='';
            jsonMbOffV='';
            jsonMBTile='';
            jsonlayerRoughIn='            "roughLevelsIn": "null",\r\n';

            if (k!=0){
              //no Opacity
              //no offsetu no offsetv
              jsonOpacity='            "opacity": '+Number($("#layeringsystem li").eq(k).data('opacity')).toFixed(Number($("#layeringsystem li").eq(k).data('opacity')).countDecimals())+',\r\n';
            }
            if ($("#layeringsystem li").eq(k).data('opacity')==1){
              jsonOpacity='';
            }
            if ($("#layeringsystem li").eq(k).data('offsetu')>0) {
              jsonOffsetU='            "offsetU": '+Number($("#layeringsystem li").eq(k).data('offsetu')).toFixed(Number($("#layeringsystem li").eq(k).data('offsetu')).countDecimals())+',\r\n';
            }

            if ($("#layeringsystem li").eq(k).data('offsetv')>0) {
              jsonOffsetV='            "offsetV": '+Number($("#layeringsystem li").eq(k).data('offsetv')).toFixed(Number($("#layeringsystem li").eq(k).data('offsetv')).countDecimals())+',\r\n';
            }

            if ($("#layeringsystem li").eq(k).data('mboffu')>0) {
              jsonMbOffU='            "microblendOffsetU": '+Number($("#layeringsystem li").eq(k).data('mboffu')).toFixed(Number($("#layeringsystem li").eq(k).data('mboffu')).countDecimals())+',\r\n';
            }
            if ($("#layeringsystem li").eq(k).data('mboffv')>0) {
              jsonMbOffV='            "microblendOffsetV": '+Number($("#layeringsystem li").eq(k).data('mboffv')).toFixed(Number($("#layeringsystem li").eq(k).data('mboffv')).countDecimals())+',\r\n';
            }
            if ($("#layeringsystem li").eq(k).data('mblend').replace(/^.*[\\\/]/, '').split('.')[0]!="default"){
              if (Number($("#layeringsystem li").eq(k).data('mbtile')).toFixed(2)!=1.00){
                jsonMBTile='            "mbTile": '+Number($("#layeringsystem li").eq(k).data('mbtile')).toFixed(Number($("#layeringsystem li").eq(k).data('mbtile')).countDecimals())+',\r\n';
              }
            }
            if ($("#layeringsystem li").eq(k).data('roughin')!='null'){
              if(($("#layeringsystem li").eq(k).data('roughin')=='2e977a') || ($("#layeringsystem li").eq(k).data('roughin')=='48a1ae')){
                jsonlayerRoughIn='            "roughLevelsIn": "'+$("#layeringsystem li").eq(k).data('roughin')+'",\r\n'
              }
            }

              jsonbody += '          {\r\n            "matTile": '+Number($("#layeringsystem li").eq(k).data('mattile')).toFixed(2)+',\r\n'
                  +jsonMBTile
                  +'            "microblend": "'+$("#layeringsystem li").eq(k).data('mblend').replaceAll(/\\/g, '\\\\')+'",\r\n'
                  +'            "microblendContrast": '+Number($("#layeringsystem li").eq(k).data('mbcontrast')).toFixed(2)+',\r\n'
                  +'            "microblendNormalStrength": '+Number($("#layeringsystem li").eq(k).data('mbnormal')).toFixed(2)+',\r\n'
                  +jsonMbOffU+jsonMbOffV+jsonOpacity+jsonOffsetU+jsonOffsetV
                  +'            "material": "'+$("#layeringsystem li").eq(k).data('material').replaceAll(/\\/g, '\\\\')+'",\r\n'
                  +'            "colorScale": "'+$("#layeringsystem li").eq(k).data('color')+'",\r\n'
                  +'            "normalStrength": "'+$("#layeringsystem li").eq(k).data('normal')+'",\r\n'
                  +jsonlayerRoughIn
                  +'            "roughLevelsOut": "'+$("#layeringsystem li").eq(k).data('roughout')+'",\r\n'
                  +'            "metalLevelsIn": "null",\r\n'
                  +'            "metalLevelsOut": "'+$("#layeringsystem li").eq(k).data('metalout')+'"\r\n'
                  +'          },\r\n';

          }
        break;
      case 1:
        preamble ='{\r\n'
            +'  "Header": {\r\n'
            +'    "WolvenKitVersion": "8.5.0",\r\n'
            +'    "WKitJsonVersion": "0.0.1",\r\n'
            +'    "ExportedDateTime": "'+jsonDate+'",\r\n'
            +'    "DataType": "CR2W",\r\n'
            +'    "ArchiveFileName": ""\r\n'
            +'  },\r\n'
            +'  "Data": {\r\n'
            +'    "Version": 195,\r\n'
            +'    "BuildVersion": 0,\r\n'
            +'    "RootChunk": {\r\n'
            +'      "Type": "Multilayer_Setup",\r\n'
            +'      "Properties": {\r\n'
            +'        "cookingPlatform": "PLATFORM_PC",\r\n'
            +'        "layers": [\r\n';

        ratiovalue='\r\n';
        ratioIVal = $("#layerRatio").val();
        if ((!isNaN(ratioIVal)) && (typeof(ratioIVal)!==undefined)){
            ratiovalue = ',\r\n        "ratio": '+Number(ratioIVal)+',\r\n';
        }else{
            ratiovalue = ',\r\n        "ratio": 1,\r\n';
        }
        if ($('#useNormals').is(':checked')){
          useNormal = '        "useNormal": 1\r\n'
        }else{
          useNormal = '        "useNormal": 0\r\n'
        }
        closing = '\r\n        ]'+ratiovalue+useNormal+'      }\r\n    },\r\n    "EmbeddedFiles": []\r\n  }\r\n}'; //file tail
        jsonbody = '';
        for (k=0;k<$("#layeringsystem li:not([disabled])").length;k++){
          jsonOpacity='';
          if (k!=0){
        //no Opacity
        //no offsetu no offsetv
            jsonOpacity='              "opacity": '+Number($("#layeringsystem li").eq(k).data('opacity')).toFixed( Number($("#layeringsystem li").eq(k).data('opacity')).countDecimals())+',\r\n';
          }
          if ($("#layeringsystem li").eq(k).data('opacity')==1){ jsonOpacity=''; }
            jsonbody += '          {\r\n            "Type": "Multilayer_Layer",\r\n            "Properties": {\r\n'
              +'              "colorScale": "'+$("#layeringsystem li").eq(k).data('color')+'",\r\n'
              +'              "material": {\r\n'
              +'                "DepotPath": "'+$("#layeringsystem li").eq(k).data('material').replaceAll(/\\/g, '\\\\')+'",\r\n'
              +'                "Flags": "Default"\r\n'
              +'              },\r\n'
              +'              "matTile": '+Number($("#layeringsystem li").eq(k).data('mattile')).toFixed(2)+',\r\n'
              +'              "mbTile": '+Number($("#layeringsystem li").eq(k).data('mbtile')).toFixed(Number($("#layeringsystem li").eq(k).data('mbtile')).countDecimals())+',\r\n'
              +'              "metalLevelsIn": "null",\r\n'
              +'              "metalLevelsOut": "'+$("#layeringsystem li").eq(k).data('metalout')+'",\r\n'
              +'              "microblend": {\r\n'
              +'                "DepotPath": "'+$("#layeringsystem li").eq(k).data('mblend').replaceAll(/\\/g, '\\\\')+'",\r\n'
              +'                "Flags": "Default"\r\n'
              +'              },\r\n'
              +'              "microblendContrast": '+Number($("#layeringsystem li").eq(k).data('mbcontrast')).toFixed(2)+',\r\n'
              +'              "microblendNormalStrength": '+Number($("#layeringsystem li").eq(k).data('mbnormal')).toFixed(2)+',\r\n'
              +'              "microblendOffsetU": '+Number($("#layeringsystem li").eq(k).data('mboffu')).toFixed(Number($("#layeringsystem li").eq(k).data('mboffu')).countDecimals())+',\r\n'
              +'              "microblendOffsetV": '+Number($("#layeringsystem li").eq(k).data('mboffv')).toFixed(Number($("#layeringsystem li").eq(k).data('mboffv')).countDecimals())+',\r\n'
              +'              "normalStrength": "'+$("#layeringsystem li").eq(k).data('normal')+'",\r\n'
              +'              "offsetU": '+Number($("#layeringsystem li").eq(k).data('offsetu')).toFixed(Number($("#layeringsystem li").eq(k).data('offsetu')).countDecimals())+',\r\n'
              +'              "offsetV": '+Number($("#layeringsystem li").eq(k).data('offsetv')).toFixed(Number($("#layeringsystem li").eq(k).data('offsetv')).countDecimals())+',\r\n'
              +'              "opacity": '+Number($("#layeringsystem li").eq(k).data('opacity')).toFixed(Number($("#layeringsystem li").eq(k).data('opacity')).countDecimals())+',\r\n'
              +jsonOpacity
              +'              "overrides": 0,\r\n'
              +'              "roughLevelsIn": "null",\r\n'
              +'              "roughLevelsOut": "'+$("#layeringsystem li").eq(k).data('roughout')+'"\r\n'
              +'            }\r\n          },\r\n';
          }

        break;
      case 2:
        preamble ='{\r\n'
                      +'  "Header": {\r\n'
                      +'    "WolvenKitVersion": "8.7.0",\r\n'
                      +'    "WKitJsonVersion": "0.0.2",\r\n'
                      +'    "GameVersion": 1520,\r\n'
                      +'    "ExportedDateTime": "'+jsonDate+'",\r\n'
                      +'    "DataType": "CR2W",\r\n'
                      +'    "ArchiveFileName": ""\r\n'
                      +'  },\r\n'
                      +'  "Data": {\r\n'
                      +'    "Version": 195,\r\n'
                      +'    "BuildVersion": 0,\r\n'
                      +'    "RootChunk": {\r\n'
                      +'      "$type": "Multilayer_Setup",\r\n'
                      +'      "cookingPlatform": "PLATFORM_PC",\r\n'
                      +'      "layers": [\r\n';
        ratiovalue='\r\n';
    		ratioIVal = $("#layerRatio").val();
    		if ((!isNaN(ratioIVal)) && (typeof(ratioIVal)!==undefined)){
    				ratiovalue = ',\r\n      "ratio": '+Number(ratioIVal)+',\r\n';
    		}else{
    				ratiovalue = ',\r\n      "ratio": 1,\r\n';
    		}

    		if ($('#useNormals').is(':checked')){
    			useNormal = '      "useNormal": 1\r\n'
    		}else{
    			useNormal = '      "useNormal": 0\r\n'
    		}
        closing = '\r\n      ]'+ratiovalue+useNormal+'    },\r\n    "EmbeddedFiles": []\r\n  }\r\n}';
        jsonbody = '';

        //The Layers
        for (k=0;k<$("#layeringsystem li:not([disabled])").length;k++){
          jsonOpacity='';
          if (k!=0){
      			//no Opacity
      			//no offsetu no offsetv
      			jsonOpacity='          "opacity": '+Number($("#layeringsystem li").eq(k).data('opacity')).toFixed(Number($("#layeringsystem li").eq(k).data('opacity')).countDecimals())+',\r\n';
      		}
          if ($("#layeringsystem li").eq(k).data('opacity')==1){ jsonOpacity=''; }
          jsonbody += '        {\r\n          "$type": "Multilayer_Layer",\r\n'
    					+'          "colorScale": "'+$("#layeringsystem li").eq(k).data('color')+'",\r\n'
    					+'          "material": {\r\n'
    					+'            "DepotPath": "'+$("#layeringsystem li").eq(k).data('material').replaceAll(/\\/g, '\\\\')+'",\r\n'
    					+'            "Flags": "Default"\r\n'
    					+'          },\r\n'
    					+'          "matTile": '+Number($("#layeringsystem li").eq(k).data('mattile')).toFixed(2)+',\r\n'
    					+'          "mbTile": '+Number($("#layeringsystem li").eq(k).data('mbtile')).toFixed(Number($("#layeringsystem li").eq(k).data('mbtile')).countDecimals())+',\r\n'
    					+'          "metalLevelsIn": "null",\r\n'
    					+'          "metalLevelsOut": "'+$("#layeringsystem li").eq(k).data('metalout')+'",\r\n'
    					+'          "microblend": {\r\n'
    					+'            "DepotPath": "'+$("#layeringsystem li").eq(k).data('mblend').replaceAll(/\\/g, '\\\\')+'",\r\n'
    					+'            "Flags": "Default"\r\n'
    					+'          },\r\n'
    					+'          "microblendContrast": '+Number($("#layeringsystem li").eq(k).data('mbcontrast')).toFixed(2)+',\r\n'
    					+'          "microblendNormalStrength": '+Number($("#layeringsystem li").eq(k).data('mbnormal')).toFixed(2)+',\r\n'
    					+'          "microblendOffsetU": '+Number($("#layeringsystem li").eq(k).data('mboffu')).toFixed(Number($("#layeringsystem li").eq(k).data('mboffu')).countDecimals())+',\r\n'
    					+'          "microblendOffsetV": '+Number($("#layeringsystem li").eq(k).data('mboffv')).toFixed(Number($("#layeringsystem li").eq(k).data('mboffv')).countDecimals())+',\r\n'
    					+'          "normalStrength": "'+$("#layeringsystem li").eq(k).data('normal')+'",\r\n'
    					+'          "offsetU": '+Number($("#layeringsystem li").eq(k).data('offsetu')).toFixed(Number($("#layeringsystem li").eq(k).data('offsetu')).countDecimals())+',\r\n'
    					+'          "offsetV": '+Number($("#layeringsystem li").eq(k).data('offsetv')).toFixed(Number($("#layeringsystem li").eq(k).data('offsetv')).countDecimals())+',\r\n'
    					+jsonOpacity
    					+'          "overrides": 0,\r\n'
    					+'          "roughLevelsIn": "null",\r\n'
    					+'          "roughLevelsOut": "'+$("#layeringsystem li").eq(k).data('roughout')+'"\r\n'
    					+'        },\r\n';
        }

        break;
        case 3:
          preamble ='{\r\n'
          +'  "Header": {\r\n'
          +'    "WolvenKitVersion": "8.11.0",\r\n'
          +'    "WKitJsonVersion": "0.0.9",\r\n'
          +'    "GameVersion": 2200,\r\n'
          +'    "ExportedDateTime": "'+jsonDate+'",\r\n'
          +'    "DataType": "CR2W",\r\n'
          +'    "ArchiveFileName": ""\r\n'
          +'  },\r\n'
          +'  "Data": {\r\n'
          +'    "Version": 195,\r\n'
          +'    "BuildVersion": 0,\r\n'
          +'    "RootChunk": {\r\n'
          +'      "$type": "Multilayer_Setup",\r\n'
          +'      "cookingPlatform": "PLATFORM_PC",\r\n'
          +'      "layers": [\r\n';
          
          ratiovalue='\r\n';
    		  ratioIVal = $("#layerRatio").val();
          if ((!isNaN(ratioIVal)) && (typeof(ratioIVal)!==undefined)){
              ratiovalue = ',\r\n      "ratio": '+Number(ratioIVal)+',\r\n';
          }else{
              ratiovalue = ',\r\n      "ratio": 1,\r\n';
          }

          if ($('#useNormals').is(':checked')){
            useNormal = '      "useNormal": 1\r\n'
          }else{
            useNormal = '      "useNormal": 0\r\n'
          }
          closing = '\r\n      ]'+ratiovalue+useNormal+'    },\r\n    "EmbeddedFiles": []\r\n  }\r\n}';
          jsonbody = '';
          for (k=0;k<$("#layeringsystem li:not([disabled])").length;k++){
            jsonOpacity='';
            if (k!=0){
              //no Opacity
              //no offsetu no offsetv
              jsonOpacity='          "opacity": '+Number($("#layeringsystem li").eq(k).data('opacity')).toFixed(Number($("#layeringsystem li").eq(k).data('opacity')).countDecimals())+',\r\n';
            }
            if ($("#layeringsystem li").eq(k).data('opacity')==1){ jsonOpacity=''; }
            jsonbody += '        {\r\n          "$type": "Multilayer_Layer",\r\n'
                +'          "colorScale": {\r\n'
                +'            "$type": "CName",\r\n'
                +'            "$storage": "string",\r\n'
                +'            "$value": "'+$("#layeringsystem li").eq(k).data('color')+'"\r\n'
                +'          },\r\n'
                +'          "material": {\r\n'
                +'            "DepotPath": {\r\n'
                +'              "$type": "ResourcePath",\r\n'
                +'              "$storage": "string",\r\n'
                +'              "$value": "'+$("#layeringsystem li").eq(k).data('material').replaceAll(/\\/g, '\\\\')+'"\r\n'
                +'            },\r\n'
                +'            "Flags": "Default"\r\n'
                +'          },\r\n'
                +'          "matTile": '+Number($("#layeringsystem li").eq(k).data('mattile')).toFixed(2)+',\r\n'
                +'          "mbTile": '+Number($("#layeringsystem li").eq(k).data('mbtile')).toFixed(Number($("#layeringsystem li").eq(k).data('mbtile')).countDecimals())+',\r\n'
                +'          "metalLevelsIn": {\r\n'
                +'            "$type": "CName",\r\n'
                +'            "$storage": "string",\r\n'
                +'            "$value": "null"\r\n'
                +'          },\r\n'
                +'          "metalLevelsOut": {\r\n'
                +'            "$type": "CName",\r\n'
                +'            "$storage": "string",\r\n'
                +'            "$value": "'+$("#layeringsystem li").eq(k).data('metalout')+'"\r\n'
                +'          },\r\n'
                +'          "microblend": {\r\n'
                +'            "DepotPath": {\r\n'
                +'              "$type": "ResourcePath",\r\n'
                +'              "$storage": "string",\r\n'
                +'              "$value": "'+$("#layeringsystem li").eq(k).data('mblend').replaceAll(/\\/g, '\\\\')+'"\r\n'
                +'            },\r\n'
                +'            "Flags": "Default"\r\n'
                +'          },\r\n'
                +'          "microblendContrast": '+Number($("#layeringsystem li").eq(k).data('mbcontrast')).toFixed(2)+',\r\n'
                +'          "microblendNormalStrength": '+Number($("#layeringsystem li").eq(k).data('mbnormal')).toFixed(2)+',\r\n'
                +'          "microblendOffsetU": '+Number($("#layeringsystem li").eq(k).data('mboffu')).toFixed(Number($("#layeringsystem li").eq(k).data('mboffu')).countDecimals())+',\r\n'
                +'          "microblendOffsetV": '+Number($("#layeringsystem li").eq(k).data('mboffv')).toFixed(Number($("#layeringsystem li").eq(k).data('mboffv')).countDecimals())+',\r\n'
                +'          "normalStrength":{\r\n'
                +'            "$type": "CName",\r\n'
                +'            "$storage": "string",\r\n'
                +'            "$value": "'+$("#layeringsystem li").eq(k).data('normal')+'"\r\n'
                +'          },\r\n'
                +'          "offsetU": '+Number($("#layeringsystem li").eq(k).data('offsetu')).toFixed(Number($("#layeringsystem li").eq(k).data('offsetu')).countDecimals())+',\r\n'
                +'          "offsetV": '+Number($("#layeringsystem li").eq(k).data('offsetv')).toFixed(Number($("#layeringsystem li").eq(k).data('offsetv')).countDecimals())+',\r\n'
                +jsonOpacity
                +'          "overrides": {\r\n'
                +'            "$type": "CName",\r\n'
                +'            "$storage": "string",\r\n'
                +'            "$value": "None"\r\n'
                +'          },\r\n'
                +'          "roughLevelsIn": {\r\n'
                +'            "$type": "CName",\r\n'
                +'            "$storage": "string",\r\n'
                +'            "$value": "null"\r\n'
                +'          },\r\n'
                +'          "roughLevelsOut": {\r\n'
                +'            "$type": "CName",\r\n'
                +'            "$storage": "string",\r\n'
                +'            "$value": "'+$("#layeringsystem li").eq(k).data('roughout')+'"\r\n'
                +'          }\r\n'
                +'        },\r\n';
          }
          break;
    }

    jsonbody = jsonbody.slice(0,-3); //removes latest commas
    taskProcessBar();

    thePIT.Export({
      file:nomefile,
      content:preamble+jsonbody+closing,
      type:'mlsetup',
      compile: $("#checkCompile").is(":checked")
    });
  }
});

function taskProcessBar(active = true){
  onOffSwitch=!!active
  if (onOffSwitch){
    $("#pBar").addClass('progress p-0 border-0 rounded-0');
    $("#pBar").html(`<div class="progress-bar progress-bar-striped progress-bar-animated bg-danger" role="progressbar" aria-label="Danger striped example" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>`);
  }else{
    $("#pBar").removeClass('progress p-0 border-0 rounded-0');
    $("#pBar").html(``);
  }
}

$("#unCookModal .modal-body .form-check-input").click(function(){
	if ($(this).is(':checked')){
		$(this).next('span.badge').addClass('bg-warning text-dark').removeClass('bg-dark text-muted');
	}else{
		$(this).next('span.badge').addClass('bg-dark text-muted').removeClass('bg-warning text-dark');
	}
})

$("#arc_GA4, #arc_AP4, #arc_NC3, #arc_EN, #ep1_WE, #ep1_VE, #ep1_ME, #ep1_EN").change(function(){
	//console.log($(this))
	if ($(this).is(':checked')){
		$(this).next('span.badge').addClass('bg-warning text-dark').removeClass('bg-dark text-muted');
	}else{
		$(this).next('span.badge').addClass('bg-dark text-muted').removeClass('bg-warning text-dark');
	}
});

var uncookTimer

$("#triggerUncook").click(function(){
  $("#stopUncook").prop("disabled",false);
	$("#triggerUncook").prop("disabled",true);
	$("#uncookCog").removeClass('d-none');
  $("#triggerUncook").prepend('<i class="fa-solid fa-gear fa-spin"></i> ');
	let files = new Array()
	$('#uncookCheck > details > div > input.form-check-input').each(function(){
		/* files.push($(this).is(':checked')) */
    if ($(this).is(':checked')){
      files.push($(this).prop("id"))
    }
	})
	thePIT.UnCookMe(files);
  uncookTimer = setInterval(()=>{
    $("#uncookLogger div").html("");
  },60000);
});

$("#stopUncook").click(function(){
  $("#triggerUncook svg").remove();
  thePIT.stopUncook();
  clearInterval(uncookTimer);
});

$("#MycroMe").click(function(){
	$("#MycroMe").prop("disabled",true);
	$("#mycroCog").removeClass('d-none');
	$("#uncook_micro_opt01, #uncook_micro_opt02, #uncook_micro_opt03, #uncook_mresize, #uncook_mthumbs").attr("style","0%").html('')
	$("#microLogger div").html('');
	thePIT.microMe();
});

// masks selector modal
$("body").on("click","#customMaskSelector option",function(ev){
	$("#lblmaskselected").text($( this ).text().split("\/").reverse()[0])
	$("#lblmaskselected").removeClass("text-muted").addClass("text-white")
});

$("#masksCFinder").on('keyup',function(ev){
	if ($("#masksCFinder").val()!=''){
		$("#customMaskSelector option:contains('"+encodeURI($("#masksCFinder").val())+"')").removeClass('d-none');
		$("#customMaskSelector option").not(":contains('"+encodeURI($("#masksCFinder").val())+"')").addClass('d-none');
	}else{
		$("#customMaskSelector option").removeClass('d-none');
	}
});

$("#masksFinderClearer").click(function(){
	$("#masksCFinder").val("");
	$("#masksCFinder").keyup();
})

/* let the user choose a mlmask file */
$("#pickCustMask").click(function(){
  let getinfo = thePIT.RConfig('paths.depot')
  getinfo.then((uncook)=>{
    thePIT.PickMask(uncook);
  }).catch((error)=>{
    notifyMe(error);
  })
});
/* react to a mask change */
$("#lblmasktoAdd").bind("update",function(){
  console.log($(this).attr("value"));
})

$("#modelOpenPath, #masksOpenPath ,#NormOpenPath").click(function(){
  let percorso = $(this).parent().children("input[type='text']").val();
  if (percorso!=""){
    let getinfo = thePIT.RConfig('paths.depot')
    getinfo.then((uncook)=>{
      thePIT.Foldering(uncook+percorso.substring(0,percorso.lastIndexOf('\/')+1));
    }).catch((error)=>{
      notifyMe(error);
    })
  }
});

/* $("#modelCustomPath").click(function(){
  //Search for the model and the material file with an open folder
  thePIT.ThreeDAsset();
}); */

$(".copyinfo").click(function(ev){
  let theTarget = $(this).data("target");
  if ($(theTarget).val()!=''){
    navigator.clipboard.writeText($("#prefxunbundle").val()+$(theTarget).val().replaceAll(/\//g,'\\'));
  }
});

$(".shellOpen").click(function(ev){
  let pathCheck = $(this).parent().find("input").val();
  if (pathCheck.match(/^[A-Za-z]:(\\|\/)/)){
    thePIT.openOS(pathCheck);
  }else{
    if (! /^\\/.test(pathCheck)){
      thePIT.openOS(materialJSON.MaterialRepo+"\\"+pathCheck);
    }else{
      thePIT.openOS(materialJSON.MaterialRepo+pathCheck);
    }
  }
});

//Open the material File and import it in the Material Composer
$("#matCompose").click(function(ev){
  if ($("#materialTarget").val()!=""){
    const materialFile = $("#materialTarget").val().replaceAll(/\//g,'\\')
    let pathCheck = ''
    if (! /^\\/.test(materialFile)){
      pathCheck =  $("#prefxunbundle").val()+"\\"+$("#materialTarget").val()
    }else{
      pathCheck =  $("#prefxunbundle").val()+$("#materialTarget").val()
    }
    thePIT.Materialize(pathCheck);
  }
});

	var legacyMatOpen = thePIT.RConfig('legacymaterial')
	legacyMatOpen.then((isopen)=>{
		$('#legacyMatSector').attr('open',isopen);
	});

  const prepTheList = (obj, parent) =>{
    if (obj!==null && obj!==undefined){
      if (obj.hasOwnProperty("children")){
        obj.children.forEach((figlio)=>{
          prepTheList(figlio,obj)
        })
        /*
        for (i=0,k=obj.children.length;i<k;i++){
          prepTheList(obj.children[i],obj)
          console.log(FolderImport);
        }
        */
      }
      if (obj.type=="directory"){
        if (obj.relativePath==='.'){
          FolderImport.add({id:obj.hash,text:obj.name,parent:'folderScan'},'dirs');
        }else{
          FolderImport.add({id:obj.hash,text:obj.name,parent:parent.hash},'dirs');
        }
      }else{
        if (obj.name.match(/.+\.glb$/)){
          FolderImport.add({id:obj.hash,text:obj.name,type:'mesh',parent:parent.hash,path:obj.path},'models');
        }else if (obj.name.match(/.+\.(png|dds|xbm)$/)){
          FolderImport.add({id:obj.hash,text:obj.name,type:'texture',parent:parent.hash,path:obj.path},'textures');
        }else if (obj.name.match(/.+\.(mlmask)$/)){
          FolderImport.add({id:obj.hash,text:obj.name,type:'mask',parent:parent.hash,path:obj.path},'masks');
        }
      }
    }
  }

//Dialog section

const uncookfile = document.getElementById("uncookfile");
const unCooKonfirm = document.getElementById("unCooKonfirm");

uncookfile.addEventListener("close", (e) => {
  if (uncookfile.returnValue == "true") {
    notifyMe(`Trigger the uncook of the file: ${MLSB.TreeD.lastModel}`);
    thePIT.UnCookSingle(MLSB.TreeD.lastModel.replace(".glb",".mesh").replaceAll("\/","\\").replace("\\base\\","base\\").replaceAll("\\ep1\\","ep1\\"));
    taskProcessBar();
  }else{
    notifyMe("File uncook cancelled by the user")
  }
});

// Prevent the "confirm" button from the default behavior of submitting the form, and close the dialog with the `close()` method, which triggers the "close" event.
unCooKonfirm.addEventListener("click", (event) => {
  event.preventDefault(); // We don't want to submit this fake form
  uncookfile.close("true"); // Have to send the select box value here.
});

  $("#KofiSupportPage").click(function(){
    thePIT.ExtOpen({type:'url',param:'ko-fi'})
  })

  var flipMask = thePIT.RConfig('flipmasks')
                  .then((valore)=>{
                    if (valore){
                      $("#flipMask").prop("checked","checked");
                    }else{
                      $("#flipMask").prop("checked","");
                    }
                  }).catch((error)=>{
                    notifyMe(error);
                  });

  var flipNorm = thePIT.RConfig('flipnorm')
                  .then((valore)=>{
                    if (valore){
                      $("#flipNorm").prop("checked","checked");
                    }else{
                      $("#flipNorm").prop("checked","");
                    }
                  }).catch((error)=>{
                    notifyMe(error);
                  });
  
  $("#MBAFinder").on("input",function(e){
    
    if ($("#MBAFinder").val()!=""){

      var modelAppearances = $("#appeInfo div.card").find(".card-header");
      modelAppearances.each((index,element)=>{
        if ($(element).text().match($("#MBAFinder").val())){
          $(element).closest('div.col').show();
        }else{
          $(element).closest('div.col').hide();
        }
      });
    }else{
      $("#appeInfo div.col").show();
    }
  });

  $("body").on('click','#appearanceSwitcher .dropdown-menu li a',function(e){
    if ($(this).data("name")!==undefined){
      $("#appearanceSwitcher ul.dropdown-menu li a").removeClass('active');
      $(this).addClass('active');
      
      $(`#nav-appearance div.card`).removeClass('active');
      $(`#nav-appearance div.card button[data-appearance='${$(this).attr('data-name')}']`).closest('.card').addClass('active');
      $("#thacanvas").trigger('switchAppearance',
        {
          name: $(this).data("name"),
          index: $(this).parent().index()
        });
      /* Read the configuration of materials */
      let matCompile = materialJSON.Appearances[$(this).parent().index()].Materials
      

      $("#nav-material ul").html("");
      new Set(matCompile).values().forEach((el)=>{
        $("#nav-material ul").append(`<li>${el}</li>`);
      });
      
    }
  });

  $("#DialogForSettings").click(function(){
    thePIT.clickTheMenuVoice('preferences');
  });

  $(".copyMe").click(function(e){
    var copyBle = $(this).prev("input").val();
    console.log(copyBle);
    navigator.clipboard.writeText(copyBle);
  });

  $("body").bind("updateMBlends",function(){
    setTimeout(()=>{
      $("#cagethemicroblends li").each((idx,elem)=>{
        let styleToGet = $(elem).attr('style');
        $(elem).attr('style',`background-image:${styleToGet.split(':')[1].replace('.png',`.png?${(new Date()).getTime()}`)}`);
      });
    },10000);
  });

  //Open the modal to setup the path of a project
  $("#btnModPaths").click(function(ev){
    setupModPath.showModal();
  });

  $("#pickProjectMod").click(function(ev){
    $("dialog#setupModPath input").val("");
    thePIT.pickPrjPath();
  });
  
  $("#emptyNotyLog").click(function(){
    notifications = 0

    $("#NotificationCenter .offcanvas-body").html("");
    notifyMe("Log reset",false);
  })

  $("#copyNotyLog").click(function(){
    var test = $("#NotificationCenter .offcanvas-body").html().replaceAll(/<br>/g,'\n');
    let dummy = document.createElement("p");
    dummy.innerHTML = test
    navigator.clipboard.writeText("```\n"+dummy.innerText+"\n```");
  });

  $("body").on("click","#sbmeshEN li, #sbmeshEN li input,#sbmeshEN li label",function(ev){
    ev.stopPropagation();
    var nome, value
    switch ($(this)[0].nodeName) {
      case "LI":
        nome = $(this).text();
        var elm = $($(this).find('input')[0]);
        elm.prop("checked",!elm.is(':checked'));
         value = elm.is(":checked");
        $("#thacanvas").trigger("toggleMesh",[nome,value]);
        //targetVisible(nome,$($(this).find('input')[0]).is(":checked"));	
        break;
      case "INPUT":
        nome = $(this).parent().text();
         value = $(this).is(":checked");
        $("#thacanvas").trigger("toggleMesh",[nome,value]);
        //targetVisible(nome,value);	
        break;
      case "LABEL":
        nome = $(this).parent().text();
        var elm = $($(this).next('input')[0]);
        elm.prop("checked",!elm.is(':checked'));
         value = elm.is(":checked");
        $("#thacanvas").trigger("toggleMesh",[nome,value]);
        //targetVisible(nome,value);	
        break;
      default:
        break;
    }
    //targetVisible(nome,$(this).find("input").is(":checked"));
  });

  $(".controLayers li").click(function(ev){
    ev.preventDefault();
    if (($(this).attr("disabled")==undefined) || ($(this).attr("disabled")==null )){
      $("#thacanvas").trigger("switchLayer",$(this).index());
    }
  })

  $("#flipMask").change(function(ev){
    ev.preventDefault();
    $("#thacanvas").trigger("flipMask");
  });
  $("#flipNorm").change(function(ev){
    ev.preventDefault();
    $("#thacanvas").trigger("flipNorm");
  });

  $("#UVGen").click(function(ev){
    ev.preventDefault();
    $("#thacanvas").trigger("UVDisplay");
  });

  $("#UVSave").click(function(ev){
    ev.preventDefault();
    $("#thacanvas").trigger("UVExport");
  });

  function adaptTexturePlayer(){
    let domReference = $("#nav-tabMLSB");
    let dummy = domReference.height() <= domReference.width() ? domReference.height(): domReference.width();
    
    maxTexturePlayer = (Math.floor((dummy-25)/canvasIncrements) * canvasIncrements);
    if (($("#texturePlayer").attr('width')!=maxTexturePlayer) && ($("#texturePlayer").attr('height')!=maxTexturePlayer)){
      $("#texturePlayer").attr({width:maxTexturePlayer,height:maxTexturePlayer});
      $("body #listTextures canvas.border-active").trigger('click');
    }
  }

  $("#texturePlayer").on("dblclick",function(ev){
    ev.preventDefault();
    //texture export on DblClick
    let a = document.createElement('a');
    let texturePlayercanvas = document.getElementById('texturePlayer');
		var texturecontent = texturePlayercanvas.toDataURL('image/png');
		a.href = texturecontent;
    a.download = `texture_export_${ new Date().valueOf()}.png`;
    a.click();
  });

  //resize the Window
  $(`button[data-bs-toggle="tab"]`).on("shown.bs.tab",function(ev){
    if ($(this).attr("data-bs-target")=='#textureGroup'){
      adaptTexturePlayer()
    }
  })

  $("body").on('click','#listTextures canvas',function(ev){
    ev.preventDefault();
    adaptTexturePlayer();
    $("#listTextures canvas").removeClass("border-active");
    $(this).addClass("border-active");
    $("#thacanvas").trigger('playTexture',$(this).attr("id"));
  }).on('click','#Mlswitcher input',function(ev){
    $("#thacanvas").trigger("switchMlayer");
  }).on('click','#MlSetupsList span',function(ev){
    ev.preventDefault();
    //TODO Switch setup
    $("#MlSetupsList").trigger("switchBlade",$(ev.target).index());
   /*  console.log(openMlsetup[$(this).index() - 1]) */
  }).on('click',"#MlSetupsList > span > .btn-close[data-bs-dismiss='badge']",function(ev){
    ev.preventDefault();
    //remove the mlsetup from the list
    //let indexSetup = ($(this).parent().index() - 1);
    let indexSetup = getActiveMultilayerSetup();
    /* openMlsetup.splice(indexSetup,1); */
    
    mlsetup = MLSB.getMlsetup(indexSetup);

    MLSB.delMlsetup(indexSetup);
    //TODO close the file and delete the mlsetup entity
    $(this).parent().remove();
    //Change of blade
    $("#MlSetupsList").trigger("switchBlade",0);
  });

  $("#MlSetupsList").on("addBlade",function(ev,name){
    if (name!=''){
      $("#MlSetupsList").append(`<span class="badge active">${name.split(".json")[0]}<button type="button" class="ms-2 btn-close" data-bs-dismiss="badge" aria-label="Close"></button></span>`);
      
      $("#MlSetupsList").trigger("switchBlade", ($("#MlSetupsList span").length -1) );
    }
  }).on("switchBlade",function(ev,index){
    //change of focus
    $("body #MlSetupsList > span").removeClass("active");
    $("body #MlSetupsList > span").eq(index).addClass("active")
    mLsetup = MLSB.getMlsetup(index);
    convLayersMlsetup(mLsetup);
  });

  $("#re-selectModel").click(async function(ev){
    ev.preventDefault();
    let getAFile = await thePIT.chooseAFile($("#manageModels input[name='modelsName']").val(),"glb").then((result)=>{
      thePIT.RConfig('paths.depot')
        .then((conf)=>{
          let _custModelName = result.replace(conf,'').replaceAll(`\\`,`/`);
          $("#manageModels input[name='modelsName']").val(_custModelName);
        }).catch((error)=>{
          notifyMe(error);
        })
    }).catch((error)=>{
      notifyMe(error);
    })
  });

  $("form[name='manageModels']").on("submit",function(ev){
    ev.preventDefault();
    var formModelData = new FormData(document.querySelector(`form[name='manageModels']`));
    //here we need to compare if the model already exists formModelData.get('modelsName')
    var unsureNewModel = formModelData.get('modelsName');

    console.log(
      CPModels.row((idx, data) => data['file'] === unsureNewModel).length
    )

    if (unsureNewModel==''){
      notifyMe("Nothing to add");
    }

    var selectedRow = CPModels.row((idx, data) => data['file'] === unsureNewModel);

    if (selectedRow.length==1){
      
      if (CPModels.row(selectedRow[0]).data().tags.includes("custom")){
        notifyMe("Edit mode activated",false);
      }else{
        notifyMe("Model already present");
      }

      manageCustModels.close();
      $(`form[name='manageModels']`)[0].reset();
      
      CPModels.row(selectedRow[0]).select();
      CPModels.row(selectedRow[0]).scrollTo(false);

    }else if (selectedRow.length==0){
      manageCustModels.close();
      $(`form[name='manageModels']`)[0].reset();

      var sureNewModel = {
        file:unsureNewModel,
        name:unsureNewModel.split('/').reverse()[0].split('.')[0]
      }
      var newline = CPModels.row.add({
        name:sureNewModel.name,
        file:sureNewModel.file,
        tags:['custom'],
        normal:null,
        origin:'custom'
      }).draw();
      
      CPModels.row(newline[0]).select();
      CPModels.row(newline[0]).scrollTo(false);

      mlsbDB.put({
        _id:`model_${CryptoJS.MD5(sureNewModel.file)}`,
        file:sureNewModel.file,
        name:sureNewModel.name,
        tags:['custom'],
        ts:Date.now()
      }).then(function (response) {
        // handle response
        console.log(response);
        notifyMe("File saved in the database", false);
      }).catch(function (err) {
        notifyMe(err);
      });
    }else{
      notifyMe("Error, too many model with the same path");
    }

  });

  $(window).resize(function(){
    updPanelCovers(); //on resize will update the position of the interface to cover
    $("#DataModelsLibrary").DataTable().draw();
    adaptTexturePlayer();
    let tblsize = window.innerHeight-350
    if ((window.innerHeight-350)<50){
      tblsize = 50;
    }
    //adapt model table size to the window
    $("#DataModelsLibrary_wrapper .dataTables_scrollBody").css("max-height",`${tblsize}px`);
    $("#DataModelsLibrary_wrapper .dataTables_scrollBody").css("min-height",`${tblsize}px`);
	});

  $("#thacanvas").trigger("changeBg");

  //management of question form
  $("#winConfirm form").on("submit",function(ev){
    ev.preventDefault();
    if (ev.originalEvent?.submitter?.value=="yes"){
      var actionRequested = ev.originalEvent.submitter.dataset.action
      console.log(actionRequested);
      switch (actionRequested) {
        case 'getmblend':
          thePIT.restoreMicro();
          break;
        case 'uncook':
          notifyMe(`Trigger the uncook of the file: ${MLSB.TreeD.lastModel}`);
          thePIT.UnCookSingle(MLSB.TreeD.lastModel.replace(".glb",".mesh").replaceAll("\/","\\").replace("\\base\\","base\\").replaceAll("\\ep1\\","ep1\\"));
          taskProcessBar();
          break;
        default:
          notifyMe(`You requested the action : ${actionRequested}`,false);
          break;
      }
    }
    document.getElementById("winConfirm").close();
  })

  //right click on colors to display the list if the material is loaded
  $("body")
    .on("contextmenu","div.cube",function(ev){
    /**
     * the div with id #rc-ColorSelector will contains the colors
     */
    $("#rc-ColorSelector").show();
  }).on('alert',function(ev){
    /**
    Get a data Object with
      message,
      title,
      seconds - optional
    */
    const alert = ev.detail
    alertMe(alert.message,alert.title,alert?.seconds!==undefined ? alert.seconds:null);
  }).on('processBar',function(ev){  taskProcessBar(); })

  $(window)
  .on('substanceLayer',function(ev){
    //In case i Need something
    const action = ev.detail?.action
    const index = ev.detail?.layer
    const details = ev.detail?.details
    switch (action){
      case 'switchLayer':
        MLSB.Editor.layerSelected=index;
        //Loading the layer in the Editor
        applyInEditor()
        $("#thacanvas").trigger("switchLayer");
        break
      case 'contextMenu':
        const mousePosition = details?.position
        showContextMenu(mousePosition,index);
        break;
      default:
        console.log(ev.detail);
    }
  })
  .on('setQuestion',function(ev){
    let options = ev.detail;
    console.log(options);
    setQuestion(options.message,options.action);
  })
  .on('limitLayers',function(ev,index){
  //limit the number of active layers in the interface
    ev.preventDefault();
    if (MLSB.UI.substance){
      const sbUI =document.querySelector("substance-layer")
      sbUI.dispatchEvent(new CustomEvent("disable",{detail:{layers:index}}))
    }
    
    $(`.controLayers li`).removeAttr("disabled");
    if (index > 0){
      $(`.controLayers`).each((idx,elm)=>{
        $(elm).find(`li:gt(${index-1})`).attr("disabled","disabled")
        if (index < MLSB.Editor.layerSelected){
          $(`.controLayers li`).removeClass("active")
        }
      })
    }else{
      $(`.controLayers`).each((idx,elm)=>{
        $(elm).find(`li:gt(0)`).attr("disabled","disabled")
        $(`.controLayers li`).removeClass("active")
      })
    }
    
    const sbUI = document.querySelector("substance-layer");
    sbUI.dispatchEvent(new CustomEvent("disable",{detail:{layers:index}}));
}).on('fetchMaterialsComplete',function(ev){
  var matListText = materialTemplate(`<li class='p-1 fs-80' data-ref='materialName' data-path='materialPath'>materialNameNoUScore</li>`);
  matListText.then((result)=>{
    console.log(`Material List build (${performance.now()} milliseconds)` )
        $("#materiaList").append(result);

        ml_randomized.push(...Object.keys(MLSB.Materials)
          .filter((key) => !key.match(/^(concrete|ebony|wood|asphalt|cliff|ceramic|grass|brick|terrain|mud|soil|rock|gravel|sand|factory|wallpaper|window|plaster|unused)\w+/g)))
          //.reduce((cur,key) => { return Object.assign(cur,{[key]:MLSB.Materials[key]}) },{} );
    }).catch((error)=>{notifyMe(error)});
      
      var matGallery = materialTemplate(`<div style="background:url('images/material/materialName.jpg') no-repeat;background-size:100% auto;" data-ref='materialName' data-path='materialPath'>materialNameNoUScore</div>`);

  matGallery.then((result)=>{
    $("#cagemLibrary").append(result);
  }).catch((error)=>{
    notifyMe(error)
  });
}).on('uiUpdMeshes',function(ev){
  //update the interface after the model has been loaded
  $("#withbones svg:nth-child(1) path").attr("fill",(MLSB.TreeD.model.bones ? 'red':'currentColor'));

}).on('uiResetMeshes',function(ev){
  //remove all the meshes ref in the UI
  $("#sbmeshEN > ul, #unChecksMesh").html("");

}).on('uiPushMeshes',function(ev,datas={}){
  if ( (datas.hasOwnProperty("name") ) && (datas.hasOwnProperty("material") ) ){
    try {
      document.getElementById("tweakContainer").dispatchEvent(new CustomEvent("addMeshes",{detail:datas.name}));
    } catch (error) {
      notifyMe("Isn't possible to add meshes controller")
    }
    /* $("#tweakContainer").trigger('addMeshes',datas.name); */

    $("#sbmeshEN > ul").append(
      `<li class="form-check" data-material="${datas.material}">
        <label for="${datas.name}" class="form-check-label">${datas.name}</label>
        <input name="${datas.name}" type="checkbox" class="form-check-input" checked >
      </li>`);
    /* <input type="checkbox" class="btn-check" id="uvchk_${datas.name}" checked >
											 <label class="btn btn-sm btn-outline-secondary mb-2" for="uvchk_${datas.name}" autocomplete='off' title="${child.userData.materialNames[0]}" >${datas.name}</label> */
    $("#unChecksMesh").append(`<input type="checkbox" class="btn-check" id="uvchk_${datas.name}" checked >
      <label class="btn btn-sm btn-outline-secondary mb-2 d-block" for="uvchk_${datas.name}" autocomplete='off' title="${datas.material}" >${datas.name}</label>`);
  }
}).on('uiswitchMlmaterial',function(ev,index){
  $(`#Mlswitcher div:nth-child(${index}) input[type='radio']`).prop("checked",true);
  $(`#mLayerOperator li:nth-child(${index})`).addClass("active");
}).on('uiResetAppearance',function(ev){
  $("#appeInfo").html("");
  $("#appearanceSwitcher ul").html("");

}).on('uiLoadMaterial',function(ev){
  $("#Mlswitcher").html(ev.detail?.mlSwitch);
  $("#mLayerOperator").html(ev.detail?.multilayerMaskMenu);

  if ($("#Mlswitcher div:nth-child(1) input[type='radio']")) {
    $("#mLayerOperator li:nth-child(1)").addClass("active");
    $("#Mlswitcher div:nth-child(1) input[type='radio']").prop("checked",true);
  }

  $("#appeInfo").html(ev.detail?.appeInfo);
  $("#appearanceSwitcher ul").html(ev.detail.appeSwitch);

}).on('uicleanMlmaterial',function(ev){
  $("#Mlswitcher").html("");
  $("#mLayerOperator").html("");
  
}).on('uiPushMlmaterial',function(ev,material){
  var idx = materialJSON.findIndex(material);
  if (idx >=0){
    if (entry = materialJSON.find(material)){
      if ([
        "engine\\materials\\multilayered.mt",
        "base\\materials\\vehicle_destr_blendshape.mt",
        "base\\fx\\_shaders\\sandevistan_multilayer.mt"
        ].includes(entry.MaterialTemplate)){

        var uiMultilayerSwitch = materialJSON.codeMaterial(idx,`<div class="form-check"><label for="mlt_$_MATERIALID" class="form-check-label" >$_MATERIALNAME</label><input class="form-check-input" type="radio" id="mlt_$_MATERIALID" name="multilayerSel" data-material="$_MATERIALFULLNAME" value="$_MATERIALID"></div>`);

        var multilayerMaskMenu = materialJSON.codeMaterial(idx,`<li><a class="dropdown-item" href="#" data-multilayer="${idx}" >$_MATERIALFULLNAME</a></li>`);

        $("#Mlswitcher").append(uiMultilayerSwitch);
        $("#mLayerOperator").append(multilayerMaskMenu);
      }
    }
  }

}).on('uiMBselect',function(ev,source){
  /* function to display, select and reset
  * every UI controller about microblends file selection.
  
  */
}).on('uiMaterialSelect',function(ev,source){
  var keyName = null;
  for(const [name,material] of Object.entries(MLSB.Materials)){
    if (material.file==source){
      keyName = name
    }
  }
  uiSetMaterial(keyName,MLSB.Materials[keyName]);
})

});
