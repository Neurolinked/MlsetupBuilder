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

var materialJSON = new MaterialBuffer();