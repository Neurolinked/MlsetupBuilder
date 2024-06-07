onmessage = function(event){
  //Hi, I'm Grunt the image weightlifter
  var command, datas
  [command, ...datas] = event.data;
  switch (command){
    case 'alphaApply':
      var workerResult = textAlphaFix(datas[0],datas[1],datas[2],datas[3]);
      break;
    case 'roughnessSwap':
      var workerResult = roughnessFix(datas[0],datas[1],datas[2],datas[3],datas[4]);
      break;
    case 'normalFix':
    default:
      var recalcChannels = 4;
      if (datas[0].length!=(datas[1]*datas[2]*4)){
        recalcChannels = datas[0].length/(datas[1]*datas[2]);
      }
      var workerResult = nMapFix(datas[0],datas[1],datas[2],datas[3],datas[4],recalcChannels);
      break;
  }
}

function clamp( value, min, max ) {
	return Math.max( min, Math.min( max, value ) );
}

function levelling(data,lvl1=0,lvl2=1){
  if (lvl1 > lvl2){
    //Swap values
    [lvl1, lvl2] = [lvl2, lvl1];
  }
  lvl1= lvl1<0?0:lvl1;
  lvl2= lvl2>1?1:lvl2;

  levelBlack = lvl1 * 255;
  levelWhite = lvl2 * 255;

  data = data < levelBlack ? 0 : data;
  data = data > levelWhite ? levelWhite : data;
  data = 255 * ( (data - levelBlack) /(levelWhite - levelBlack));
  return parseInt(data);
}

/* This function will write the blue channel of the image as full blue, to trasform
the red green normal maps to sull rgb */
function nMapFix(normaldatas,width,height,fileNAME,material,channels){
  console.log(normaldatas);
  //Took the arraybuffer color change the clue channel
  var red,green,blueVal,blue,alpha;
  var newTextureData = new Uint8Array(width*height*4);

  switch (channels) {
    case 2:
      var kcounter = 0;
      for (let i = 0, l = normaldatas.length; i < l; i += 2) {
        // Modify pixel data
        red = (normaldatas[i]/255)* 2 - 1;
        green = -1 * (((normaldatas[i + 1])/255)* 2 - 1);
        blueVal = Math.sqrt(1 - Math.pow(red,2) - Math.pow(green,2)); //recalculated floating point
        blue = parseInt((( blueVal + 1 ) / 2 ) * 255)
        //blue = 255 // old concept, not recalculated

        newTextureData[kcounter]=normaldatas[i];
        newTextureData[kcounter+1]=normaldatas[i+1];
        newTextureData[kcounter+2]=blue;
        newTextureData[kcounter+3]=255;
        kcounter+=4;
      }    
      self.postMessage(['interface','rebuilding 2 channel normal map']);
      break;
    default:
      for (let i = 0, l = normaldatas.length; i < l; i += 4) {
        // Modify pixel data
        red = (normaldatas[i]/255)* 2 - 1;
        green = -1 * (((normaldatas[i + 1])/255)* 2 - 1);
        blueVal = Math.sqrt(1 - Math.pow(red,2) - Math.pow(green,2)); //recalculated floating point
        blue = parseInt((( blueVal + 1 ) / 2 ) * 255)
        //blue = 255 // old concept, not recalculated
        newTextureData[i]=normaldatas[i];
        newTextureData[i+1]=normaldatas[i+1];
        newTextureData[i+2]=blue;
        newTextureData[i+3]=normaldatas[i+3];
      }
      self.postMessage(['interface','rebuilding blue channel normal map']);
      break;
  }


  self.postMessage(['paint',newTextureData,width,height,fileNAME,material])
}

function roughnessFix(roughnessdatas,width,height,fileNAME,material){
  //Took the arraybuffer color change the clue channel
  var red,green,blue,alpha;
  for (let i = 0, l = roughnessdatas.length; i < l; i += 4) {
    // Modify pixel data
    red = roughnessdatas[i];
    green = roughnessdatas[i+1];
    blue = roughnessdatas[i+2];
    //roughnessdatas[i]=green;
    roughnessdatas[i+1] = red;
  }
  self.postMessage(['interface','swapping red/green roughness map channels']);
  self.postMessage(['rough',roughnessdatas,width,height,fileNAME,material]);
}

function textAlphaFix(texturedatas,width,height,fileNAME,alphaValue=1){
  if ((0<= alphaValue <=255) && (alphaValue.isInteger())) {
    //greyscale int value from 0 to 255
  }else if  (0 <= alphaValue <= 1){
    //grayscale value from 0 to 1
    //for opacity
    alphaValue *=255; //get the right persentage
  }else{
    self.postMessage(['log',`Received an alpha value of ${alphaValue} going to 255` ]);
    alphaValue = 255
  }

  for (let i = 0, l=texturedatas.length; i < l; i += 4) {
    // Modify pixel data
    texturedatas.data[i + 3] = alphaValue;  // Alpha value
   }
   self.postMessage(['alphaFix',texturedatas,width,height,fileNAME]);
}
