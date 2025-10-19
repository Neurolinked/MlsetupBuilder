class SubstanceLayer extends HTMLElement {
    length = 20;
    selected = null;
    
    constructor(length){
        super();
        this._internals = this.attachInternals();
    }

    get active(){
        return this._internals.states.has("active");
    }
    set active(flag){
        if (flag){
            this._internals.states.add("active");
        }else{
            this._internals.states.delete("active");
        }
    }

    //enable the first element disabled
    enable(all=false){
        if (all==true){
            const layers =this.shadowRoot.querySelectorAll(`div.wrapper[disabled]`);
            layers.forEach(element => {
                if (element!=null){
                element.removeAttribute("disabled");
                }
            });
        }else{
            const layer =this.shadowRoot.querySelector(`div.wrapper[disabled]`);
            if (layer!=null){
                layer.removeAttribute("disabled");
            }
        }
    }

    //get the number of masks and disable the layer after that number
    disable(masks){
        masks = parseInt(masks)<=0 ? 1 :masks;
        this.enable(true);
        const noi = this.shadowRoot.querySelectorAll(`div.wrapper:nth-child(n + ${masks + 1})`);
        noi.forEach(element=>{
            element.setAttribute("disabled","");
        })
    }

    getIndexBySelector(selector){
        const child = this.shadowRoot.querySelector(`div.wrapper.${selector}`);
        if (child==undefined){
            return 0;
        }
        return this.getIndex(child);
    }

    getSelectedIndex(){ return this.getIndexBySelector("selected"); }

    getActiveIndex(){ return this.getIndexBySelector("active"); }

    getIndex(child=null){
        if (child!=null){
            const parent = child.parentNode
            var index = Array.prototype.indexOf.call(parent.children, child);
            return index
        }
        return null;
    }

    setMask(index,imageData){
        console.log(imagedata);
    }
    /**
     * 
     * @param {Number} index 
     * @param {Object} mblend the whole mblend object
     */
    setMblend(index,mblend){
        const file = mblend.split(".xbm")[0];
        const layer = parseInt(index);
        if ((layer>=0) && (layer<20)){
            const affectedlayer = this.shadowRoot.querySelector(`.wrapper:nth-child(${layer+1}) img.microblend`)
            
            affectedlayer.src = `./images/${file}.png`
            affectedlayer.title = `${file}`
        }
    }


    setMaterial(index,material="unused"){
        const layer = parseInt(index);
        if ((layer>=0) && (layer<20)){
            const affectedlayer = this.shadowRoot.querySelector(`.wrapper:nth-child(${layer+1}) img.material`)
            
            affectedlayer.src = `./images/material/${material}.jpg`
            affectedlayer.title = `${material}`
        }
    }
    
    setColor(index,color=[.5,.5,.5]){
        if (color.length!=3){
            return false;
        }
        const layer = parseInt(index);
        if ((layer>=0) && (layer<20)){
            const affectedColorSwatch = this.shadowRoot.querySelector(`.wrapper:nth-child(${index+1}) span.colorswatch`)
            affectedColorSwatch.setAttribute("style",`background-color:rgb(${Math.floor(255*color[0])} ${Math.floor(255*color[1])} ${Math.floor(255*color[2])})`)
            affectedColorSwatch.innerText = `R:${Math.floor(color[0]*100)}%\n G:${Math.floor(color[1]*100)}%\nB:${Math.floor(color[2]*100)}%`;
        }
    }
    
    setOpacity(index,opacity=1.0){
        const layer = parseInt(index);
        opacity = (parseFloat(opacity)>0.0) && (parseFloat(opacity)<=1.0) ? parseFloat(opacity) : 1;
        if ((layer>=0) && (layer<20)){
            const affectedOpacity = this.shadowRoot.querySelector(`.wrapper:nth-child(${layer+1}) progress`)
            affectedOpacity.value=opacity;
        }
    }
    
    reset(){
        const enclosure = this.shadowRoot.querySelector("section")
        
        if ((enclosure==null) || (enclosure==undefined)){
            return false;
        }
        enclosure.childNodes.forEach((element,index) => {
            if (String(element.classList).includes("wrapper")){
                this.setMaterial(index,"unused");
                this.setOpacity(index,1.0);
                this.setColor(index);
            }
        })
    }

    /**
     * 
     * @param {string} type command to be executed in the window like 'switchLayer' or 'contextMenu'
     * @param {number} index number of the layer to operate to
     * @param {object} details additional details
     * @returns 
     */
    _trigger(type,index,details=undefined){
        window.dispatchEvent(new CustomEvent("substanceLayer",{detail:{action:type,layer:index,details:details}}));
    }

    connectedMoveCallback(){
        this.enclosure.remove();
    }

    connectedCallback() {
        // Create a shadow root
        const shadow = this.shadowRoot || this.attachShadow({mode:"open"});
        const enclosure = document.createElement("section")
        enclosure.setAttribute("class","enclosure");

        //the wrapper
        const wrapper = document.createElement("div");
        wrapper.setAttribute("class", "wrapper");

        //concept datas
        const footer = document.createElement("ul");
        footer.setAttribute("class","show")

        const indicator = document.createElement("span");
        indicator.setAttribute("class", "indicator");
        indicator.textContent = Array.prototype.indexOf.call(this.children,this);
        
        const maskImg = document.createElement("img");
        maskImg.setAttribute("class", "mask");
        
        const materialImg = document.createElement("img");
        materialImg.setAttribute("class", "material");
        materialImg.setAttribute("title","unused")
        materialImg.src="./images/material/unused.jpg";

        const microblendImg = document.createElement("img");
        microblendImg.setAttribute("class","microblend");
        microblendImg.setAttribute("title","default");
        microblendImg.src="./images/default.png";

        const colorSq = document.createElement("span");
        colorSq.setAttribute("class","colorswatch");
        colorSq.setAttribute("style","background-color:rgb(128 128 128);");
        colorSq.innerText = `R:50%\n G:50%\nB:50%`;
        //this.setColor(colorSq);

        const filler = document.createElement("div");
        filler.innerHTML = "&nbsp;";

        const opacityMeter = document.createElement("span");
        opacityMeter.setAttribute("class","opacityMeter");
        //opacityMeter.appendChild(filler.cloneNode(true));

        const progress = document.createElement("progress");
        progress.setAttribute("value",1);
        progress.setAttribute("max",1);

        opacityMeter.appendChild(progress);

        const style = document.createElement("style");
        style.textContent = `
            .enclosure{
                background-color:var(--layer-2);
                max-height:40vh;
                overflow-y: auto;

                &::-webkit-scrollbar {width:10px;background-color:black;}
                &::-webkit-scrollbar-thumb{background: var(--eq-lay3);border:1px solid var(--bs-danger);background-color: rgba(220,53,69,0.5);}
            }
            :host(:state(active)){
                & .enclosure{
                    .wrapper{
                        
                    }
                }
            }
            .wrapper {
                --layersize:64px;
                position: relative;
                background-color: var(--bs-layer3);
                margin: 3px 0;
                margin-right:3px;
                border: 1px solid var(--bs-secondary);
                display:grid;
                grid-template-columns: 3ch var(--layersize) var(--layersize) var(--layersize) var(--layersize) 1fr 2ch;

                &[disabled]{
                    opacity:20%;
                }

                & > .indicator{
                    background-color:var(--bs-secondary);
                    font-size:.85rem;
                    text-align:center;
                    line-height:var(--layersize);
                }

                & > .colorswatch,
                & > img {
                    aspect-ratio:1/1;
                    height:var(--layersize);
                    border:none;
                    &.microblend{
                        background-color:black;
                    }
                }

                & > .colorswatch{
                    font-size:.75rem;
                    padding-left:.2rem;
                    text-shadow: 0 1px 3px black;
                }
                
                & > .opacityMeter{
                    --myborder:3px;

                    background-color:black;
                    height:calc(100% - calc(2 * var(--myborder)));
                    padding:var(--myborder);
                    position:relative;

/*                     & > div{
                        background-color:white;
                        width:100%;
                        height:100%;
                    } */
                        
                    & > progress{
                        -webkit-appearance: none;
                        --height:64px;
                        transform:rotate(-90deg);
                        block-size:1rem;
                        transform-origin: left;
                        left:1ch;
                        width:var(--height);
                        height:2ch;
                        top:calc(var(--height) - 1ch);
                        position:absolute;
                    }
                    & ::-webkit-progress-bar {
                        background-color: black;
                    }
                    & ::-webkit-progress-value {
                        background-color: RGBA(var(--bs-warning-rgb));
                    }
                }

                & > ul{
                    display:none;
                    &.show{
                    display:block;
                    }
                }

                &.active{
                    background-color:var(--bs-secondary);
                    border-color:red;

                    & > .indicator{
                        background-color:var(--bs-active);
                    }
                }

                &.selected{
                    background-color:var(--bs-primary-border-subtle);         
                }
            }
            `;
        //Events
        //creating HTML
/*         this.addEventListener("material",(e)=>{
            console.log(e);
        }) */

        enclosure.addEventListener("click",(e)=>{
            e.preventDefault
            var key = e.code; // Detecting keyCode
            //Shift key multiselect ?
            const shift = e.shiftKey ? e.shiftKey : ((key === 16) ? true : false);
            const layerDOM = e.target.closest(".wrapper");
            if (layerDOM.hasAttribute("disabled")){
                return;
            }
            enclosure.childNodes.forEach(element => {
                element.classList.remove("selected")
                if (element==layerDOM){
                    element.classList.add("active")
                }else{
                    element.classList.remove("active")
                }
            });
            
            this.reset();
            this._trigger("switchLayer",this.getActiveIndex())
        });
        
        //Context menu contextual menu
        enclosure.addEventListener("contextmenu",(e)=>{
            e.preventDefault();
            const layerDOM = e.target.closest(".wrapper");
            if (layerDOM.hasAttribute("disabled")){
                return;
            }
            enclosure.childNodes.forEach(element => {
                if (element==layerDOM){
                    element.classList.add("selected");
                    this._trigger("contextMenu",this.getSelectedIndex(),{position:{x:e.clientX,y:e.clientY}})
                    console.log(this.getSelectedIndex())
                    console.log(e.clientX,e.clientY);
                }else{
                    element.classList.remove("selected");
                }
            })
        })

        this.addEventListener("material",(e)=>{
            this.setMaterial(e.detail.layer, e.detail.material);
        })

        this.addEventListener("opacity",(e)=>{
            this.setOpacity(e.detail.layer, e.detail.opacity);
        })
        this.addEventListener("setMblend",(e)=>{
            this.setMblend(e.detail.layer,e.detail.mblend);
        })
        this.addEventListener("color",(e)=>{
            this.setColor(e.detail.layer, e.detail.color);
        })
        this.addEventListener("reset",(e)=>{
            this.reset();
        })
        this.addEventListener("disable",(e)=>{
            this.disable(e.detail.layers);
        })
        this.addEventListener("enable",(e)=>{
            this.enable();
        })
        
        if (!(shadow.hasChildNodes())){
            shadow.appendChild(style);
            shadow.appendChild(enclosure);
            wrapper.appendChild(indicator);
            wrapper.appendChild(maskImg);
            wrapper.appendChild(materialImg);
            wrapper.appendChild(microblendImg);
            wrapper.appendChild(colorSq);
            wrapper.appendChild(filler);
            wrapper.appendChild(opacityMeter);
    
            for(var i=0;i<this.length;i++){
                indicator.textContent = i;
                enclosure.appendChild(wrapper.cloneNode(true));
            }
            enclosure.childNodes[0].classList.add("active")
        }
    }
}