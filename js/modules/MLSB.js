/**
 * MLSB Software Class
 * Reference to JSDoc to document the code https://jsdoc.app/tags-property.html
 * @class
 * @property {object} Editor - object that contains property on the UI/UX part of MLSB
 * @property {number} Editor.activeMlsetup - get or set the selected mask layer
 * @property {number} Editor.layerSelected - get or set the selected mask layer
 * @property {object} Editor.Clone - information container manage cloning
 * @property {object} Materials - content of the material DB
 * @property {array} MlSetups - array of the current loaded mlsetups
 * @property {object} TreeD - object that contains property about the 3d environment
 * @property {string} TreeD.lastModel - path of the latest model file requested to be loaded
 * @property {string} TreeD.appearance - the appearance the editor is working on
 * @property {object} TreeD.model - the glb scene model loader from Threejs
 * @property {bool} Key.shiftPress - check on software keypressed for behaviours
 * @property {object} UI - contains all the UI configuration for the Editor
 * @property {bool} UI.ready - active when the layer system is ready
 * @property {substance} UI.substance - track the presence of Substance Layer in the UI
 */
class MLSBEditor {
    Editor = {
        activeMlsetup : 0,
        layerSelected : 0,
        Clone : new Layer()
    }

    TreeD = {
        lastMaterial : `unused`,
        lastModel : ``,
        appearance : ``,
        model : {
            bones:false
        }
    }

    Key={
        shiftPress : false
    }

    UI = {
        ready:false,
        substance:false
    }

    Materials = {}
    /**
     * contains objects with file path and package property
     */
    Microblends = [];

    MlSetups = []
    Models = []

    /** @constructs */
	constructor(){
		this.MlSetups[0] = new Mlsetup;
	}
    /**
     * Reset the params to the default state
     */
    initialized(){
        this.UI.ready = true
    }
    isReady(){
        return this.UI.ready;
    }
    reset(){
        this.Editor.layerSelected = 0;
        this.TreeD.model = {bones:false};
    }
    getMaterial(){
        let searchedMaterial = this.Materials[this.TreeD.lastMaterial] ? this.Materials[this.TreeD.lastMaterial] : false 
            return searchedMaterial;
    }

    getMaterialTexturesPath(materialName=this.TreeD.lastMaterial){
        var textureList = [];
        var materialObj = this.Materials[materialName]
        for (const[key,value] of Object.entries(materialObj)){
            console.log(typeof(value),key);
            if (typeof(value)=='object'){
                if (value.hasOwnProperty("texture")){
                    textureList.push({type:key, path:value.texture})
                }
            }
        }
        return textureList;
    }

    getMlsetup(index){
        return this.MlSetups[index];
    }

    getMllayer(index){
        if (this.MlSetups[index]?.Layers.length > index ){
            return this.MlSetups[index].Layers[this.Editor.layerSelected]
        }
        return false;
    }

    addMlsetup(mlsetup){
        try{
            if (mlsetup instanceof Mlsetup){
                this.MlSetups.push(mlsetup);
                return true;
            }else{
                throw new Error(`Not a valid mlseutp object`);
            }
        }catch(error){
            console.log(error);
        }
        return false;
    }

    delMlsetup(index,clear=false){
        try{
            this.MlSetups.splice(index,(clear==false ? 1: Infinity ))
            return true
        }catch(error){
            console.log(`Removing mlsetup from mlsetup manager: ${error}`);
        }
        return false
    }

    updMLLayer(mlsetupIndex,layerIndex,layer){
        try {
            if ((0 <= mlsetupIndex) && (mlsetupIndex < this.MlSetups.length)){
                if (this.MlSetups[mlsetupIndex].Layers[layerIndex] instanceof Layer){
                    this.MlSetups[mlsetupIndex].Layers[layerIndex] = layer;
                    return true;
                }else{
                    throw new Error(`layer,${layerindex} is not a layer object`);        
                }
            }else{
                throw new Error(`Out of actual loaded mlsetups (${this.MlSetups.length})`);
            }
        }catch(error){
            console.error(error);
            return false;
        }
    }

    updMlsetup(index,mlsetup,layerIndex){
        try {
            if (mlsetup instanceof Mlsetup){
                if ((0 <= index) && (index < this.MlSetups.length)){
                    if (this.MlSetups[index].Layers[layerIndex] instanceof Layer){
                        this.MlSetups[index].Layers[layerIndex] = mlsetup.Layers[layerIndex];
                        return true;
                    }else{
                        throw new Error(`layer,${layerindex} is not a layer object`);        
                    }
                }else{
                    throw new Error(`Out of actual loaded mlsetups (${this.MlSetups.length})`);    
                }
            }else{
                throw new Error(`Not a mlsetup object`);
            }
        } catch (error) {
            console.log(`Removing mlsetup from mlsetup manager: ${index},${layerIndex}, ${error}`);
            console.log(mlsetup)
        }
        return false;
    }

    /**
     * 
     * @param {string} microblendPath the complete file path
     * @returns the Microblend path found
     */
    getMBlends(microblendPath){
        return this.Microblends.filter((el)=>el.path==microblendPath);
    }
    //singular search
    getMBlend(microblendPath){
        return this.Microblends.filter((el)=>el.path==microblendPath)[0];
    }
    /**
     * 
     * @param {Object} microblendObject 
     * @param {string} microblendObject.path 
     * @param {string} microblendObject.package //default value = core
     * @returns 
     */
    putMBlend(microblendObject){
        if ((!(microblendObject.hasOwnProperty("path"))) && 
        (!(microblendObject.hasOwnProperty("package")))){
            return false
        }
        if ((this.getMBlends(microblendObject.path)).length==0 ){
            this.Microblends.push(microblendObject);
        }
        return true
    }
}