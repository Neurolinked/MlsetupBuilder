/**
 * MLSB Software Class
 * Reference to JSDoc to document the code https://jsdoc.app/tags-property.html
 * @class
 * @property {object} Editor - object that contains property on the UI/UX part of MLSB
 * @property {number} Editor.layerSelected - get or set the selected mask layer
 * @property {object} Editor.Clone - information container manage cloning
 * @property {object} Editor.Clone.layerProperty - Class Layer information to clone to
 * @property {object} Materials - content of the material DB
 * @property {object} TreeD - object that contains property about the 3d environment
 * @property {string} TreeD.lastModel - path of the latest model file requested to be loaded
 * @property {string} TreeD.appearance - the appearance the editor is working on
 * @property {object} TreeD.model - the glb scene model loader from Threejs
 */
class MLSBEditor {
    Editor = {
        layerSelected : 0,
        Clone : {
            layerProperty: new Layer()
        }
    }

    TreeD = {
        lastMaterial : `unused`,
        lastModel : ``,
        appearance : ``,
        model : {}
    }

    Materials = {}
    /**
     * Reset the params to the default state
     */
    reset(){
        this.Editor.layerSelected = 0;
        this.TreeD.model = {};
    }
    getMaterial(){
        let searchedMaterial = this.Materials[this.TreeD.lastMaterial] ? this.Materials[this.TreeD.lastMaterial] : false 
            return searchedMaterial;
    }
}