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

const PARAMS = {
	rotation: false,
	speed: 6.0,
  wireframes: false,
  oneside:false,
  lightPower: 0.0,
  maskChannel: 0.0,
  fogcolor:'#9b9d3f',
  fognear:10,
  fogfar:105,
  EDLayerMaxTiles:150,
  EDMblendMaxTiles:150,
  EDMaxContrast:1,
  EDMaxNormal:2,
  ForceZeroOpacity:true,
  A_light_pow:2,
  A_light_color:0x606060,
  p_light1_pow:0.5,
  p_light2_pow:0.5,
  p_light3_pow:0.5,
  p_light4_pow:0.5,
  p_light1_col:0x75cb04,
  p_light2_col:0xf5f503,
  p_light3_col:0x6078F5,
  p_light4_col:0x6078F5,
  l1_pos:{x:5,y:0,z:5},
  l2_pos:{x:-5,y:0,z:-5},
  l3_pos:{x:0,y:0.5,z:-3},
  l4_pos:{x:0,y:3,z:3},
};

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



TDtabManager.pages[0].addBinding(PARAMS, 'rotation',{label:'3D view auto-rotation'});
TDtabManager.pages[0].addBinding(PARAMS, 'speed',{min:0,max:20,label:'Rotation speed'})
TDtabManager.pages[0].addBinding(PARAMS, 'wireframes',{label:'Display wireframes'});
TDtabManager.pages[0].addBinding(PARAMS, 'lightPower',{min:0.5,max:10.0, label:'Light Power'});
TDtabManager.pages[0].addBinding(PARAMS, 'maskChannel',{min:0.0,max:1.0, step:0.01, label:'Mask opacity filter'});
TDtabManager.pages[0].addBinding(PARAMS, 'oneside',{label:'One side rendering'});

const lightpane = TDtabManager.pages[0].addFolder({
  title:'Lights',
  expanded:false
});

const alight = lightpane.addFolder({
  title:'Ambient'
})
alight.addBinding(PARAMS,'A_light_pow',{label:'Power',min:0.1,max:5});
alight.addBinding(PARAMS,'A_light_color',{label:'Color',view:'color'});
const plight1 = lightpane.addFolder({
  title:'Point light 1'
})
plight1.addBinding(PARAMS,'p_light1_pow',{label:'Power',min:0.1,max:5});
plight1.addBinding(PARAMS,'p_light1_col',{label:'Color',view:'color'});
plight1.addBinding(PARAMS,'l1_pos',{label:'Position',x:{min:-10,max:10},y:{min:-10,max:10},y:{min:-10,max:10}});

const plight2 = lightpane.addFolder({
  title:'Point light 2'
})
plight2.addBinding(PARAMS,'p_light2_pow',{label:'Power',min:0.1,max:5});
plight2.addBinding(PARAMS,'p_light2_col',{label:'Color',view:'color'});
plight2.addBinding(PARAMS,'l2_pos',{label:'Position',x:{min:-10,max:10},y:{min:-10,max:10},y:{min:-10,max:10}});
const plight3 = lightpane.addFolder({
  title:'Point light 3'
})
plight3.addBinding(PARAMS,'p_light3_pow',{label:'Power',min:0.1,max:5});
plight3.addBinding(PARAMS,'p_light3_col',{label:'Color',view:'color'});
plight3.addBinding(PARAMS,'l3_pos',{label:'Position',x:{min:-10,max:10},y:{min:-10,max:10},y:{min:-10,max:10}});
const plight4 = lightpane.addFolder({
  title:'Point light 4'
})
plight4.addBinding(PARAMS,'p_light4_pow',{label:'Power',min:0.1,max:5});
plight4.addBinding(PARAMS,'p_light4_col',{label:'Color',view:'color'});
plight4.addBinding(PARAMS,'l4_pos',{label:'Position',x:{min:-10,max:10},y:{min:-10,max:10},y:{min:-10,max:10}});

const fogpane = TDtabManager.pages[0].addFolder({
    title: 'Fog',
    expanded: false,
  });
fogpane.addBinding(PARAMS,'fogcolor',{view: 'color',label:'Color'});
fogpane.addBinding(PARAMS, 'fognear',{min:0,max:100,label:'Near'});
fogpane.addBinding(PARAMS, 'fogfar',{min:0,max:1000,step:1,label:'Far'});

const tweakReset = TDtabManager.pages[0].addButton({
    title: 'Reset to Default',
});

const smeshtab =  TDtabManager.pages[1].addTab({
    pages: [
        {title: 'Toggle'},
        {title: 'Info'},
      ]
});
const EDLayer = TDtabManager.pages[2].addFolder({
  title:'Layer'
});
EDLayer.addBinding(PARAMS,'EDLayerMaxTiles',{min:0.01,max:1000,step:0.01,label:'Max Tiles'}).on('change', (ev) => {
  //Change the values in the interface
  $("#layerTile, [data-control='#layerTile']").prop('max',PARAMS.EDLayerMaxTiles).trigger('change');
});

const EDMblend = TDtabManager.pages[2].addFolder({
  title:'microblends'
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

const EDAdvSetup = TDtabManager.pages[2].addFolder({
  title:'Advanced Setup'
});
EDAdvSetup.addBinding(PARAMS,'ForceZeroOpacity',{label:'Force Layer 0 opacity to 1'}).on('change', (ev) => {
  //Change the values in the interface
});

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
        }
      }
    });

    saved.then(()=>{
      TW_notify("Editor preferences saved");
    }).catch(error=>notifyMe(error));

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
  console.log(valuesDEF);
    PARAMS.EDLayerMaxTiles = Number(valuesDEF?.layer?.tiles?.value!==undefined ? valuesDEF.layer.tiles.value:150.00);
    PARAMS.EDMblendMaxTiles = Number(valuesDEF?.mblend?.tiles?.value!==undefined ? valuesDEF.mblend.tiles.value:150.00);
    PARAMS.EDMaxContrast = Number(valuesDEF?.mblend?.contrast?.value!==undefined ? valuesDEF.mblend.contrast.value:1.0);
    PARAMS.EDMaxNormal = Number(valuesDEF?.mblend?.normal?.value!==undefined ? valuesDEF.mblend.normal.value:2.0);

    TDtabManager.pages[2].refresh();
}).catch((error)=>{
  console.error(error);
});
