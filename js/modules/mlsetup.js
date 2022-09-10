class Layer {
	tiles = 1.0
	material = 'base\\surfaces\\materials\\special\\unused.mltemplate'
	opacity = 1.0
	color = 'null_null'
	normal = 'null'
	roughnessIn = 'null'
	roughnessOut = 'null'
	metalIn = 'null'
	metalOut = 'null'
	offsetU = 0.0
	offsetV = 0.0
	microblend = {
			file : 'base\\surfaces\\microblends\\default.xbm',
			tiles : 1,
			contrast : 0.0,
			normal : 1.0,
			offset : { h:0.0, v:0.0}
	}
}

class Mlsetup {
	version = [0,0,3]
	ratio = 1.0
	normal = true

	constructor(){
		this.Layers = []
		for (let i=0;i<20;i++){
			this.Layers.push(new Layer())
		}
	}

	reset(layer=0){
		this.Layers[layer] = new Layer()
	}

	swap(idSource , idDest){
		if (Number(idSource) && Number(idDest)){
			if (idSource!=idDest){
				let s = this.Layers[idSource]
				let d = this.Layers[idDest]
				this.Layers[idDest] = s
				this.Layers[idSource] = d
				return true
			}
			return false
		}else{
			return false
		}
	}
}
