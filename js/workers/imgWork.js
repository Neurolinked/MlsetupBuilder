onmessage = (event) => {
  //Hi, I'm Grunt the image weightlifter
  if (event.hasOwnProperty('command')){
    console.log(event.command);
  }else{
    const workerResult = nMapFix(event.data)
  }
}

/* This function will write the blue channel of the image as full blue, to trasform
the red green normal maps to sull rgb */
function nMapFix(normaldatas){
  //Took the arraybuffer color change the clue channel
  for (let i = 0, l=normaldatas.data.length; i < l; i += 4) {
   // Modify pixel data
   normaldatas.data[i + 2] = 255;  // B value
  }
  self.postMessage(normaldatas)
}

function textAlphaFix(texturedatas, alphaValue=255){
  for (let i = 0, l=texturedatas.data.length; i < l; i += 4) {
    // Modify pixel data
    texturedatas.data[i + 3] = alphaValue;  // Alpha value
   }
   self.postMessage(texturedatas)
}
