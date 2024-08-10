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

	const alertMessages = document.getElementById("alertMessages");
})



const canvasIncrements = 128;
const MLSB = new MLSBEditor;
var closeModal

const PARAMS = {
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
	  $("#notyCounter span").text(notifications);
	}else{
	  $("#NotificationCenter .offcanvas-body").prepend('[ '+Data.toLocaleString('en-GB', { timeZone: 'UTC' })+' ] ' + message+"<br>");
	}
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

/* 	let domMe = document.getElementById(target);
	let t_canvas = domMe.getContext('2d');
	var width,height

	if ((domMe.getAttribute('width')==undefined) && (domMe.getAttribute('height')==undefined)){
		width=height=128
	}else{
		//FIX : need to read the Zoom level
		width=domMe.getAttribute('width')
		height=domMe.getAttribute('height')
	}

	t_canvas.clearRect(0,0,width,height)
	if (fillStyle!=''){
		t_canvas.fillStyle = fillStyle;
		t_canvas.fillRect(0,0,width,height)
	} */
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
