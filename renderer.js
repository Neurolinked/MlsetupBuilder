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
