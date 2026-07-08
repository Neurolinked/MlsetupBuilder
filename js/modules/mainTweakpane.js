import {Pane} from '../../public/tweakpane/tweakpane.min.js';
import * as EssentialsPlugin from '../../public/tweakpane/tweakpane-plugin-essentials.min.js';

function TW_notify(message){
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

let defPromise = thePIT.RConfig('editorCfg');
var tw_Defaults = {}

const submeshInfo = 1;
const submeshToggle = 0;
const tw_EDSave = 0;
const tw_EDRestore = 1;

export const panel = new Pane({
    container: document.getElementById('tweakContainer'),
    title: '3D viewport tweaks',
    expanded: false
  });
panel.registerPlugin(EssentialsPlugin);

const TDtabManager = panel.addTab({
    pages: [
        {title: 'Viewport'},
        {title: 'Model'},
        {title: 'Editor'},
      ]
});

const PARAMdef = structuredClone(PARAMS);
TDtabManager.pages[0].addBinding(PARAMS, 'bkgColors',{label:'Background color',view:'color'}).on('change',(ev)=>{
  $("#thacanvas").trigger("changeBg");
});
TDtabManager.pages[0].addBinding(PARAMS, 'cameraNear',{min:0.01,max:20,label:'Camera Near'}).on('change',(ev)=>{
  $("#thacanvas").trigger("updCamera");
});
TDtabManager.pages[0].addBinding(PARAMS, 'cameraFar',{min:400,max:20000,label:'Camera Far'}).on('change',(ev)=>{
  $("#thacanvas").trigger("updCamera");
});
TDtabManager.pages[0].addBinding(PARAMS, 'rotation',{label:'3D view auto-rotation'});
TDtabManager.pages[0].addBinding(PARAMS, 'speed',{min:0,max:20,label:'Rotation speed'})
TDtabManager.pages[0].addBinding(PARAMS, 'wireframes',{label:'Display wireframes'}).on('change',(ev)=>{
  $("#thacanvas").trigger("theWire");
});

TDtabManager.pages[0].addBinding(PARAMS, 'switchTransparency',{label:'Transparent vs MaskAlpha'}).on('change',(ev)=>{
  $("#thacanvas").trigger('switchAlpha');
});
TDtabManager.pages[0].addBinding(PARAMS, 'maskChannel',{min:0.0,max:1.0, step:0.01, label:'Mask layer opacity\n(only 3d viewport)'}).on('change',(ev)=>{
  $("#thacanvas").trigger('maskAlpha');
});

TDtabManager.pages[0].addBinding(PARAMS, 'oneside',{label:'One side rendering'}).on('change',(ev)=>{
  $("#thacanvas").trigger('sided');
});
TDtabManager.pages[0].addBinding(PARAMS,'opacityPreview',{label:'Layer opacity in VP'}).on('change',(ev)=>{
  //change just the value
   $("#layerOpacity").trigger("input");
})

const tweakReset = TDtabManager.pages[0].addButton({
  title: 'Reset to Default',
}).on('click', (ev) => {

PARAMS.cameraNear = PARAMdef.cameraNear
PARAMS.cameraFar = PARAMdef.cameraFar
PARAMS.speed = PARAMdef.speed
PARAMS.maskChannel = PARAMdef.maskChannel
PARAMS.opacityPreview = false
TDtabManager.refresh();

});

const lightpane = TDtabManager.pages[0].addFolder({
  title:'Lights',
  expanded:false
});


const plight1 = lightpane.addFolder({title:'Point light 1'})
  plight1.addBinding(PARAMS,'p_light1_pow',{label:'Power',min:0.1,max:200}).on('change', (ev) => {$("#thacanvas").trigger('newlights',1);});
  plight1.addBinding(PARAMS,'p_light1_col',{label:'Color',view:'color'}).on('change', (ev) => {$("#thacanvas").trigger('newlights',1);});
  plight1.addBinding(PARAMS,'l1_pos',{label:'Position',x:{min:-10,max:10},y:{min:-10,max:10},y:{min:-10,max:10}}).on('change', (ev) => {$("#thacanvas").trigger('lightpos',1);});

const plight2 = lightpane.addFolder({title:'Point light 2'})
  plight2.addBinding(PARAMS,'p_light2_pow',{label:'Power',min:0.1,max:200}).on('change', (ev) => {$("#thacanvas").trigger('newlights',2);});
  plight2.addBinding(PARAMS,'p_light2_col',{label:'Color',view:'color'}).on('change', (ev) => {$("#thacanvas").trigger('newlights',2);});
  plight2.addBinding(PARAMS,'l2_pos',{label:'Position',x:{min:-10,max:10},y:{min:-10,max:10},y:{min:-10,max:10}}).on('change', (ev) => {$("#thacanvas").trigger('lightpos',2);});

const plight3 = lightpane.addFolder({title:'Point light 3'})
  plight3.addBinding(PARAMS,'p_light3_pow',{label:'Power',min:0.1,max:200}).on('change', (ev) => {$("#thacanvas").trigger('newlights',3);});
  plight3.addBinding(PARAMS,'p_light3_col',{label:'Color',view:'color'}).on('change', (ev) => {$("#thacanvas").trigger('newlights',3);});
  plight3.addBinding(PARAMS,'l3_pos',{label:'Position',x:{min:-10,max:10},y:{min:-10,max:10},y:{min:-10,max:10}}).on('change', (ev) => {$("#thacanvas").trigger('lightpos',3);});


const plight4 = lightpane.addFolder({title:'Point light 4'})
  plight4.addBinding(PARAMS,'p_light4_pow',{label:'Power',min:0.1,max:200}).on('change', (ev) => { $("#thacanvas").trigger('newlights',4);});
  plight4.addBinding(PARAMS,'p_light4_col',{label:'Color',view:'color'}).on('change', (ev) => {$("#thacanvas").trigger('newlights',4);});
  plight4.addBinding(PARAMS,'l4_pos',{label:'Position',x:{min:-10,max:10},y:{min:-10,max:10},y:{min:-10,max:10}}).on('change', (ev) => {$("#thacanvas").trigger('lightpos',4);});

const fogpane = TDtabManager.pages[0].addFolder({
    title: 'Fog',
    expanded: false,
  });
  fogpane.addBinding(PARAMS,'fogcolor',{view: 'color',label:'Color'}).on('change', (ev) => {$("#thacanvas").trigger('fogNew');});
  fogpane.addBinding(PARAMS, 'fognear',{min:0,max:100,label:'Near'}).on('change', (ev) => {$("#thacanvas").trigger('fogNew');});
  fogpane.addBinding(PARAMS, 'fogfar',{min:0,max:1000,label:'Far'}).on('change', (ev) => {$("#thacanvas").trigger('fogNew');});



const smeshtab =  TDtabManager.pages[1]

const EDLayer = TDtabManager.pages[2].addFolder({
  title:'Layer'
});
EDLayer.addBinding(PARAMS,'EDLayerMaxTiles',{min:0.01,max:1000,step:0.01,label:'Max Tiles'}).on('change', (ev) => {
  //Change the values in the interface
  $("#layerTile, [data-control='#layerTile']").prop('max',PARAMS.EDLayerMaxTiles).trigger('change');
});


const EDMblend = TDtabManager.pages[2].addFolder({
  title:'Microblends'
});
EDMblend.addBinding(PARAMS,'EDMblendMaxTiles',{min:0.01,max:1000,step:0.01,label:'Max Tiles'}).on('change', (ev) => {
  //Change the values in the interface
  $("#mbTile, [data-control='#mbTile']").prop('max',PARAMS.EDMblendMaxTiles).trigger('change');
});
EDMblend.addBinding(PARAMS,'EDMaxContrast',{min:0.01,max:5,step:0.01,label:'Max Contrast'}).on('change', (ev) => {
  //Change the values in the interface
  $("#mbCont, [data-control='#mbCont']").prop('max',PARAMS.EDMaxContrast).trigger('change');
});
EDMblend.addBinding(PARAMS,'EDMaxNormal',{min:0.01,max:20,step:0.01,label:'Max Normals'}).on('change', (ev) => {
  //Change the values in the interface
  $("#mbNorm, [data-control='#mbNorm']").prop('max',PARAMS.EDMaxNormal).trigger('change');
});

//Randomizer config
const EDRandomize = TDtabManager.pages[2].addFolder({
  title:'Randomizer'
});

EDRandomize.addBinding(PARAMS,'randTurnOnOff',{label:'Turn On & Off layers'})
EDRandomize.addBinding(PARAMS,'randUBlend',{label:'Wild randomize µBlends'})

const EDAdvSetup = TDtabManager.pages[2].addFolder({
  title:'Advanced Setup'
});
EDAdvSetup.addBinding(PARAMS,'ForceZeroOpacity',{label:'Force Layer 0 opacity to 1'}).on('change', (ev) => {
  //Change the values in the interface
});
EDAdvSetup.addBinding(PARAMS,'mbBackColor',{label:"µB background color"}).on('change',(ev)=>{
  $(window).trigger("changeMBBackground");
});
EDAdvSetup.addBinding(PARAMS,'maskBlur',{label:'Blur texture masks',min:0,max:100,step:1}).on('change',(ev) => {$("#thacanvas").trigger('blurMask',[PARAMS.maskBlur]);});
EDAdvSetup.addBinding(PARAMS, 'importSkip',{label:'Skip Import Preview'}).on('change',(ev)=>{});
EDAdvSetup.addBinding(PARAMS, 'sortLevels',{label:'Sort Rough-Metal'}).on('change',(ev)=>{});
EDAdvSetup.addBinding(PARAMS, 'modelDebug',{label:'Model debug'}).on('change',(ev)=>{});
EDAdvSetup.addBinding(PARAMS, 'textureDebug',{label:'Texture debug'}).on('change',(ev)=>{});
EDAdvSetup.addBinding(PARAMS, 'forceMaterialHighlight',{label:'Material highlight'}).on('change',(ev)=>{
  $("#thacanvas").trigger('matHighlight',[PARAMS.forceMaterialHighlight]);
});
EDAdvSetup.addBlade({view: 'separator'});
EDAdvSetup.addBinding(PARAMS, 'showImgOffSet',{label:'Export render with offsets data'}).on('change',(ev)=>{});
EDAdvSetup.addBinding(PARAMS, 'normalMerger',{label:'Use Normal Merger'}).on('change',(ev)=>{});

TDtabManager.pages[2].addBlade({
  view: 'buttongrid',
  size: [2, 1],
  cells: (x, y) => ({
  title: [
    ['Save', 'Reset to Default'],
  ][y][x],
  }),
}).on('click', (ev) => {
  if (ev.index[0]==tw_EDSave){

    let saved = thePIT.savePref({
      editorCfg:{
        layer:{
          tiles:{
            value:PARAMS.EDLayerMaxTiles
          }
        },
        mblend:{
          tiles:{
            value: PARAMS.EDMblendMaxTiles
          },
          contrast:{
            value:PARAMS.EDMaxContrast
          },
          normal:{
            value:PARAMS.EDMaxNormal
          }
        },
        skipImport:PARAMS.importSkip,
        switchTransparency:PARAMS.switchTransparency,
        sortLevels:PARAMS.sortLevels
      }
    });

    saved.then(()=>{
      TW_notify("Editor preferences saved");
    }).catch((error)=>notifyMe(error));

  }else if (ev.index[0]==tw_EDRestore){
    PARAMS.EDLayerMaxTiles = Number(tw_Defaults?.layer?.tiles?.default!==undefined ? tw_Defaults.layer.tiles.default:150.00);
    PARAMS.EDMblendMaxTiles = Number(tw_Defaults?.mblend?.tiles?.default!==undefined ? tw_Defaults.mblend.tiles.default:150.00);
    PARAMS.EDMaxContrast = Number(tw_Defaults?.mblend?.contrast?.default!==undefined ? tw_Defaults.mblend.contrast.default:1.0);
    PARAMS.EDMaxNormal = Number(tw_Defaults?.mblend?.normal?.default!==undefined ? tw_Defaults.mblend.normal.default:2.0);
    TDtabManager.pages[2].refresh();
  }
});


defPromise.then((valuesDEF)=>{
    tw_Defaults = valuesDEF;
    PARAMS.EDLayerMaxTiles = Number(valuesDEF?.layer?.tiles?.value!==undefined ? valuesDEF.layer.tiles.value:150.00);
    PARAMS.EDMblendMaxTiles = Number(valuesDEF?.mblend?.tiles?.value!==undefined ? valuesDEF.mblend.tiles.value:150.00);
    PARAMS.EDMaxContrast = Number(valuesDEF?.mblend?.contrast?.value!==undefined ? valuesDEF.mblend.contrast.value:1.0);
    PARAMS.EDMaxNormal = Number(valuesDEF?.mblend?.normal?.value!==undefined ? valuesDEF.mblend.normal.value:2.0);

    TDtabManager.pages[2].refresh();
}).catch((error)=>{
  console.error(error);
});

tweakCleanMeshes()
threeD_Viewport()

function threeD_Viewport(){
  TDtabManager.pages[0].disabled = !PARAMS.threeDUI;
  TDtabManager.pages[1].disabled = !PARAMS.threeDUI;
  panel.refresh();
}

function tweakCleanMeshes(){
  //model submeshes
  if (smeshtab.children.length>0){
    smeshtab.children.forEach(element => {
      element.dispose();
    });
  }
}
function tweakAddMeshes(name){
  smeshtab.addBinding(PARAMS.listSubmeshes,`${name}`).on('change',(ev) => {
    $("#thacanvas").trigger('toggleMesh',[name,ev.value]);
  });
}

document.getElementById('tweakContainer')
  .addEventListener('cleanMeshes',function(ev){
    tweakCleanMeshes()
})
document.getElementById('tweakContainer')
  .addEventListener('addMeshes',function(ev){
    tweakAddMeshes(ev.detail);
    panel.refresh();
})
document.getElementById('tweakContainer')
  .addEventListener('threedPresence',function(ev){
    threeD_Viewport();
})
document.getElementById('tweakContainer')
  .addEventListener('changedUI',function(ev){
    panel.refresh();
})

const LayerParams = {
  opacity: 1.0,
  tiles: 1.0,
  offset: {x:0,y:0},
  override:"",
  material:"base\\surfaces\\materials\\special\\unused.mltemplate",
  normal:true,
  ratio:1.0,
  utiles:1.0,
  ucontrast:1.0,
  unormal:1.0,
  uoffset: {x:0,y:0},
}
/**
 * Panel for parameters Editor
 */

//Set a delay for the material to be loaded and then create the UI
export const tweakEditor = new Pane({
    container: document.getElementById('layer_settings'),
    title: 'Parameters Editor',
    expanded: true
  });
tweakEditor.registerPlugin(EssentialsPlugin);

const tabs = tweakEditor.addTab({
  pages: [
    {title: 'x Layer'},
    {title: 'Global'},
  ],
});

const layerEditor = tabs.pages[0];

layerEditor.addBinding(LayerParams,'tiles',{min:0.001, max:150.0});
layerEditor.addBinding(LayerParams,'opacity',{min:0.0, max:1.0});
layerEditor.addBinding(LayerParams,'offset',{x:{min:-5.0, max:5.0},y:{min:-5.0, max:5.0}});
layerEditor.addBinding(LayerParams,'override');
layerEditor.addBinding(LayerParams,'material',{label:"Material file"});

const materiaLlist = layerEditor.addBlade({
  view: 'list',
  label: 'Material',
  options: [],
  value: 'base\\surfaces\\materials\\special\\unused.mltemplate',
}).on('change',(ev)=>{
  LayerParams.material = ev.value
  tweakEditor.refresh();
});


//material Loading

function TPlistMaterialLoading(){
  var myNewOptions=[]
  for (const [key, value] of Object.entries(MLSB.Materials)) {
    myNewOptions.push({text:key,value:value.file});
  }
  return myNewOptions
}

setTimeout(()=>{
  materiaLlist.options = TPlistMaterialLoading()
},2000);


layerEditor.addBlade({
  view: 'separator',
});

const lBlends = layerEditor.addFolder({
  title:"µblends"
})

lBlends.addBinding(LayerParams,'utiles',{min:0.001, max:150.0});
lBlends.addBinding(LayerParams,'ucontrast',{min:0.0, max:1.0});
lBlends.addBinding(LayerParams,'unormal',{min:0.0, max:2.0});
lBlends.addBinding(LayerParams,'uoffset',{x:{min:-5.0, max:5.0},y:{min:-5.0, max:5.0}});
const btn = lBlends.addButton({
  title: 'µblends Aim'
});

const lGlobal = tabs.pages[1]

lGlobal.addBinding(LayerParams,'normal')
lGlobal.addBinding(LayerParams,'ratio')
