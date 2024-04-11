onmessage = function(event){
  //Hi, I'm Grunt the image weightlifter

  if (event.hasOwnProperty('command')){
    console.log(event.command);
  }else{
    const workerResult = nMapFix(event.data[0],event.data[1],event.data[2])
  }
}

/* This function will write the blue channel of the image as full blue, to trasform
the red green normal maps to sull rgb */
function nMapFix(normaldatas,width,height){
  //Took the arraybuffer color change the clue channel

  for (let i = 0, l = normaldatas.length; i < l; i += 4) {
   // Modify pixel data
   normaldatas[i + 2] = 255;
  }
  self.postMessage([normaldatas,width,height])
}

function textAlphaFix(texturedatas, alphaValue=255){
  for (let i = 0, l=texturedatas.data.length; i < l; i += 4) {
    // Modify pixel data
    texturedatas.data[i + 3] = alphaValue;  // Alpha value
   }
   self.postMessage(texturedatas)
}
