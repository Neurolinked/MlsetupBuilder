document.addEventListener('DOMContentLoaded', () => {
    thePIT.Versione()
		//reading preferences storage file config.json

	var dummy = thePIT.RConfig('paths.depot')

	dummy.then( valore =>{
			var unbundlepath = document.querySelector("#prefxunbundle")
			var preferenzecaricate = document.querySelector("#prefloaded")
			unbundlepath.value = valore
			preferenzecaricate.checked = true
		}
	)

	fetch('./jsons/materialDB.json')
		.then(response=>response.json())
		.then(data=>{
			MLSB.Materials = data;
			Object.freeze(MLSB.Materials);
			notifyMe(`Material Database Loaded ${Object.keys(MLSB.Materials).length} vanilla materials`,false);
			$(window).trigger("fetchMaterialsComplete");
		}).catch(error=>notifyMe(error))
	const alertMessages = document.getElementById("alertMessages");
	window.manageCustModels = document.getElementById("manageModels");
})
const canvasIncrements = 128;
const MLSB = new MLSBEditor;

var closeModal

const PARAMS = {
	importSkip: false,
	obFoldercheck: false, //obsessive mask folder check
	maskBlur: 0,
	cameraNear : 0.01,
	cameraFar : 2000,
	rotation: false,
	speed: 6.0,
	wireframes: false,
	oneside:false,
	maskChannel: 0.0,
	fogcolor:0x9b9d3f,
	fognear:10,
	fogfar:105,
	EDLayerMaxTiles:150,
	EDMblendMaxTiles:150,
	EDMaxContrast:1,
	EDMaxNormal:2,
	ForceZeroOpacity:true,
	A_light_pow:0,
	A_light_color:0x606060,
	p_light1_pow:30,
	p_light2_pow:30,
	p_light3_pow:20,
	p_light4_pow:30,
	p_light1_col:0xffffff,
	p_light2_col:0xffffff,
	p_light3_col:0xffffff,
	p_light4_col:0xffffff,
	l1_pos:{x:3,y:0,z:3},
	l2_pos:{x:-3,y:0,z:-3},
	l3_pos:{x:0,y:0.5,z:-3},
	l4_pos:{x:0,y:3,z:3},
};

var skip = thePIT.RConfig('editorCfg.skipImport')
	skip.then((result)=>{
		PARAMS.importSkip = result;
	}).catch((error)=>{
		notifyMe(error);
	});

var hairDB = {}
var materialJSON = new MaterialBuffer();
/**
 * Write a message in the UI log space
 * @param {String} message Text message to be sent
 * @param {Boolean} warning default true, it will be displayed in the log as a warning message
 */
function notifyMe(message, warning = true){
	let Data = new Date(Date.now());
	if (warning){
	  $("#NotificationCenter .offcanvas-body").prepend('<span class="text-error">[ '+Data.toLocaleString('en-GB', { timeZone: 'UTC' })+' ] ' + message+"</span><br>");
	  notifications++
	}else{
		$("#NotificationCenter .offcanvas-body").prepend('[ '+Data.toLocaleString('en-GB', { timeZone: 'UTC' })+' ] ' + message+"<br>");
	}
	$("#notyCounter span").text(notifications==0 ? "":notifications);
	$("#foot-message").text(`${message}`);
  }


function alertMe(message="",title="Advice",seconds=null){
	$("#alertMessages > header").html(title);
	$("#alertMessages > p").html(message);
	alertMessages.showModal();

	if ((seconds!=null) && (parseInt(seconds)>200)){
		seconds = parseInt(seconds);
		closeModal = setTimeout(function(ev){
			alertMessages.close();
		},seconds);
	}
}

//generic Canvas Cleaning function
function clearCanvas(target,fillStyle=''){
	let domMe = document.getElementById(target);
	let t_canvas = domMe.getContext('2d');
	t_canvas.reset();
}

function clearTexturePanel(){
    $("#listTextures").html("");
}

function pushTexturetoPanel(filename, width, height){
	if (!document.getElementById(filename)){
		if (width == height){
			$("#listTextures").append(`<canvas width="128" height="128" title="${filename}" id="${filename}"></canvas>`);
		}else{
			if(width > height){
	
				$("#listTextures").append(`<canvas width="128" height="${128/(width/height)}" title="${filename}" id="${filename}"></canvas>`);
			}else{
				$("#listTextures").append(`<canvas width="${128/(height/width)}" height="128" title="${filename}" id="${filename}"></canvas>`);
			}
		}
	}
}
