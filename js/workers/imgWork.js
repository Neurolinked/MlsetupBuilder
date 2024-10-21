const RGBAchannels = "RGBA";
onmessage = function(event){
  //Hi, I'm Grunt the image weightlifter
  var command, datas
  /* datas order by index
   * 0 - imageDatas
   * 1 - width
   * 2 - height
   * 3 - fileNAME
   * 4 - _materialName
  */
  [command, ...datas] = event.data;

  var recalcChannels = 4;
  if (datas[0].length!=(datas[1]*datas[2]*4)){
    recalcChannels = calcChannels(datas[0].length,datas[1],datas[2]);
  }

  switch (command){
    case 'alphaApply':
      var workerResult = textAlphaFix(datas[0],datas[1],datas[2],datas[3]);
      break;
    case 'blurApply':
      var workerResult = textBlurApply(datas[0],datas[1],datas[2],datas[3],datas[4],recalcChannels,datas[5]);
      break;
    case 'roughnessSwap':
      var workerResult = roughnessFix(datas[0],datas[1],datas[2],datas[3],datas[4]);
      break;
    case 'gradientApply':
      var workerResult = gradientApply(datas[0],datas[1],datas[2],datas[3],datas[4],recalcChannels)
      break;
    case 'normalFix':
    default:
      var workerResult = nMapFix(datas[0],datas[1],datas[2],datas[3],datas[4],recalcChannels);
      break;
  }
}
/**
 * Thanking
 * Trys Mudford 
 * https://www.trysmudford.com/blog/linear-interpolation-functions/
 */
const lerp = (x, y, a) => x * (1 - a) + y * a;
const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));
const invlerp = (x, y, a) => clamp((a - x) / (y - x));
const range = (x1, y1, x2, y2, a) => lerp(x2, y2, invlerp(x1, y1, a));

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

function calcChannels(blocksize,width,height){
  return (blocksize/(width*height))
}

/* This function will write the blue channel of the image as full blue, to trasform
the red green normal maps to sull rgb */
function nMapFix(normaldatas,width,height,fileNAME,material,channels){
  //Took the arraybuffer color change the clue channel
  var red,green,blueVal,blue,alpha;
  var newTextureData = new Uint8Array(width*height*4);

  switch (channels) {
    case 2:
      var kcounter = 0;
      for (let i = 0, l = normaldatas.length; i < l; i += 2) {
        // Modify pixel data
        red = (normaldatas[i]/255) * 2 - 1;
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
        red = (normaldatas[i]/255) * 2 - 1;
        green = -1 * (((normaldatas[i + 1])/255)* 2 - 1);
        blueVal = Math.sqrt(1 - Math.pow(red,2) - Math.pow(green,2)); //recalculated floating point
        blue = parseInt((( blueVal + 1 ) / 2 ) * 255)
        //blue = 255 // old concept, not recalculated
        newTextureData[i]=normaldatas[i];
        newTextureData[i+1]=normaldatas[i+1];
        newTextureData[i+2]= blue;
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

function textBlurApply(texturedatas,width,height,fileNAME,material,channelsTarget,pixels=2){
  const offScreenMe = new OffscreenCanvas(width, height);
  const gl = offScreenMe.getContext("2d");
  const offScreenBlur = new OffscreenCanvas(width,height);
  const glBlur =offScreenBlur.getContext("2d");

  var newTextureData = new Uint8Array(width*height*4);

  for (let i = 0, l = textureDatas.length; i < l; i += channelsTarget) {
    newTextureData[i]=texturedatas[i]
    newTextureData[i+1]=texturedatas[i]
    newTextureData[i+2]=texturedatas[i]
    newTextureData[i+3]=texturedatas[i]
  }
  gl.putImageData(newTextureData,0,0,0,0,width,height);

  glBlur.filter = `blur(${pixels}px)`;
  glBlur.drawImage(gl);

  var blurredTextureData = glBlur.getImageData(0,0,width,height);
  self.postMessage(['blurApply',blurredTextureData,width,height,fileNAME,material]);
  
}

function gradientApply(textureDatas,width,height,fileNAME,material,channels,gradientSteps){
  //
  var red,green,blue,alpha,position, calcPosition;
  var newTextureData = new Uint8Array(width*height*4);
  var kcounter = 0;

  for (let i = 0, l = textureDatas.length; i < l; i += channels) {
    position = red/255
    calcPosition = gradientSteps.findIndex((element) => element.pos > position)

    newTextureData[kcounter]= lerp(gradientSteps[calcposition-1].red,gradientSteps[calcposition].red,position) ;
    newTextureData[kcounter+1]=lerp(gradientSteps[calcposition-1].green,gradientSteps[calcposition].green,position);
    newTextureData[kcounter+2]=lerp(gradientSteps[calcposition-1].blue,gradientSteps[calcposition].blue,position);
    newTextureData[kcounter+3]=255;
    kcounter+=4;
  }

  //self.postMessage(['hairProfile',newTextureData,width,height,fileNAME,material]);
}

function fromRGBatoG(textureDatas,width,height,channelsInput=1){
  if ((channelsInput>=1) && (channelsInput<=4)){
    let realChannels = calcChannels(textureDatas.length,width,height)
    if (channelsInput < realChannels){
      var newTextureDatas = new Uint8Array(width*height);
      var k = 0
      for (let i = 0, l = textureDatas.length; i < l; i += channels) {
        newTextureDatas[k] = textureDatas[i];
        k++;
      }
      self.postMessage(['interface',`Convert image from ${RGBAchannels.substring(channelsInput-1,1)} channel to grayscale`]);
      return newTextureDatas
    }else{
      return textureDatas
    }
  }else{
    return textureDatas
  }
}