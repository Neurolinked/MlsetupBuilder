import {Pane} from '../public/tweakpane/tweakpane.min.js';
import * as EssentialsPlugin from '../public/tweakpane/tweakpane-plugin-essentials.min.js';


const confirmButton = 0;
const resetButton = 1;

const PARAMS = {
	Horizontal: 0.0,
	Vertical: 0.0,
  	Tiles: 1.0,
  	Chained: false,
	offset: {x: 0.0, y: 0.0},
};
const panel = new Pane({
  container: document.getElementById('tweakMe'),
});
panel.registerPlugin(EssentialsPlugin);

$(function(){
	var shiftSpeedup=false;

	function reworkMBlend(Tiles,U,V){
		microblendRatio = Tiles
		microblendRatioVal = (1/microblendRatio) * 1024
		$("#theAimerOverlay").css("background-size",microblendRatioVal+"px")
		$("#theAimerOverlay").css("background-position","bottom "+((1024 - microblendRatioVal) +(microblendRatioVal * V))+"px left "+(-(U * microblendRatioVal))+"px")
	}

	thePIT.Reload();
	
	var microblendRatio = parseFloat($("#AimMTile").val())
	var microblendRatioVal = (1/microblendRatio) * 1024

	//this need to change and get directly values
	//without relying on Interface fields
	
	var defaults = {
		size : $("#AimMTile").val(),
		horizontal : $("#AimU").val(),
		vertical : $("#AimV").val()
	}
	/*
	panel.addBinding(PARAMS, 'Horizontal',{min:-10, max:10,step:0.01}).on('change', (ev) => {
		reworkMBlend(PARAMS.Tiles,PARAMS.Horizontal,PARAMS.Vertical);
	});
	panel.addBinding(PARAMS, 'Vertical',{min:-10, max:10,step:0.01}).on('change', (ev) => {
		reworkMBlend(PARAMS.Tiles,PARAMS.Horizontal,PARAMS.Vertical);
	});*/
	panel.addBinding(PARAMS,'offset',{x:{min:-10,max:10},y:{min:-10,max:10},picker: 'inline', expanded: true,label:'U/V Offset'}).on('change',(ev)=>{
		reworkMBlend(PARAMS.Tiles,PARAMS.offset.x,PARAMS.offset.y);
	})
	panel.addBinding(PARAMS, 'Tiles',{min:0.05, max:200.0,step:0.01}).on('change', (ev) => {
		reworkMBlend(PARAMS.Tiles,PARAMS.offset.x,PARAMS.offset.y);
	});
	panel.addBinding(PARAMS, 'Chained',{ label: 'Link to layer' });
	panel.addBlade({
		view: 'separator',
	});
	panel.addBlade({
		view: 'buttongrid',
		size: [2, 1],
		cells: (x, y) => ({
		title: [
			['Confirm', 'Reset'],
		][y][x],
		}),
	}).on('click', (ev) => {
		if (ev.index[0]==resetButton){
			//reset
			/*
			PARAMS.Horizontal = parseFloat(defaults.horizontal);
			PARAMS.Vertical = parseFloat(defaults.vertical);*/
			PARAMS.Tiles = parseFloat(defaults.size);
			PARAMS.offset ={x:PARAMS.Horizontal,y:PARAMS.Vertical}
			panel.refresh();
		}else if (ev.index[0]==confirmButton){
			//confirm
			thePIT.Done({
				H: (Math.round((PARAMS.offset.x + Number.EPSILON) * 100) / 100),
				V: (Math.round((PARAMS.offset.y + Number.EPSILON) * 100) / 100),
				S: (Math.round((PARAMS.Tiles + Number.EPSILON) * 100) / 100),
				Link: PARAMS.Chained
			});
		}
	});

	$("#theAimerOverlay").on('setDefaults',function(){
		defaults.size = $("#AimMTile").val()
		defaults.horizontal = $("#AimU").val()
		defaults.vertical = $("#AimV").val()

		PARAMS.Horizontal = parseFloat(defaults.horizontal);
		PARAMS.Vertical = parseFloat(defaults.vertical);
		PARAMS.offset.x = parseFloat(defaults.horizontal);
		PARAMS.offset.y = parseFloat(defaults.vertical);
		PARAMS.Tiles = parseFloat(defaults.size);
		panel.refresh();
	})

});


