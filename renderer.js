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

const MLSB = new MLSBEditor;

const PARAMS = {
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
	p_light1_pow:5,
	p_light2_pow:5,
	p_light3_pow:5,
	p_light4_pow:5,
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

function alertMe(message="",title="Advice"){
	$("#alertMessages > header").html(title);
	$("#alertMessages > p").html(message);
	alertMessages.showModal();
}

//generic Canvas Cleaning function
function clearCanvas(target,fillStyle='', squareSize = 0){
	let t_canvas = target.getContext('2d');
	t_canvas.clearRect(0,0,squareSize,squareSize)
	if (fillStyle!=''){
		t_canvas.fillStyle = fillStyle;
		t_canvas.fillRect(0,0,squareSize,squareSize)
	}
}