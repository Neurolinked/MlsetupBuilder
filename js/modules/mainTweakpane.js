import {Pane} from '../../public/tweakpane/tweakpane.min.js';
import * as EssentialsPlugin from '../../public/tweakpane/tweakpane-plugin-essentials.min.js';

const PARAMS = {
	rotation: false,
	speed: 6.0,
  wireframes: false,
  oneside:false,
  lightPower: 0.0,
  maskChannel: 0.0,
  fogcolor:'#9b9d3f',
  fognear:10,
  fogfar:105
};

const submeshInfo = 1;
const submeshToggle = 0;

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
      ]
});

TDtabManager.pages[0].addBinding(PARAMS, 'rotation',{label:'3D view auto-rotation'});
TDtabManager.pages[0].addBinding(PARAMS, 'speed',{min:0,max:20,label:'Rotation speed'})
TDtabManager.pages[0].addBinding(PARAMS, 'wireframes',{label:'Display wireframes'});
TDtabManager.pages[0].addBinding(PARAMS, 'lightPower',{min:0.5,max:10.0, label:'Light Power'});
TDtabManager.pages[0].addBinding(PARAMS, 'maskChannel',{min:0.0,max:1.0, step:0.01, label:'Mask opacity filter'});
TDtabManager.pages[0].addBinding(PARAMS, 'oneside',{label:'One side rendering'});

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