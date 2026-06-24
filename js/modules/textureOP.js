/**
 * Load an image from a given URL
 * @param {ArrayBuffer} textureData dataview of the image datas
 * @param {Number} width size in pixel of the image width
 * @param {Number} height size in pixel of the image height
 * @returns {Uint8Array} RGBA channels ArrayBuffer of the texture
 */
function rebuildText(textureData, width, height){
	var defSize = (width*height)*4;
	var imageData = new Uint8Array(defSize);
	var k=0;
	for (let i = 0; i < defSize; i += 4) {
		// Modify pixel data
		imageData[i] = textureData[k];  // R value
		imageData[i + 1] = textureData[k]    // G value
		imageData[i + 2] = textureData[k]  // B value
		imageData[i + 3] = 255;  // A value
		k++;
	}
	return imageData;
}

//Texture binary data operations
//String to bufferArray
function str2ab(str) {
	try {
		var buf = new ArrayBuffer(str.length); // 2 bytes for each char
		var bufView = new Uint8Array(buf);
		for (var i=0, strLen=str.length; i < strLen; i++) {
			bufView[i] = str.charCodeAt(i);
		}
	} catch (error) {
		notifyMe(error.message)
		return false;
	}
	return buf;
}

function isDDS(binaryHeader){
	return ((binaryHeader[0]==0x44) && (binaryHeader[1]==0x44) && (binaryHeader[2]==0x53))
}
function isPNG(binaryHeader){
	return ((binaryHeader[0]==0x89) && (binaryHeader[1]==0x50) && (binaryHeader[2]==0x4e) && (binaryHeader[3]==0x47)	&& (binaryHeader[4]==0x0d) && (binaryHeader[5]==0x0a) && (binaryHeader[6]==0x1a) && (binaryHeader[7]==0x0a))
}

function getImageInfo(binaryData){
	var bufferData = str2ab(binaryData);
	if (!bufferData){
		console.log('Error,in the buffer Data');
		return false;
	}
	const headerData = new Uint8Array( bufferData, 0, 8 ); //get the two dimensions data bytes
	//DDS Case
	if (isDDS(headerData)){
		const spaceData = new Uint32Array( bufferData, 0, 5 ); //get the two dimensions data bytes
		let headSize = spaceData[1];
		let height = spaceData[3];
		let width = spaceData[4];
		let bytes = 8;
		//let size = height * width * channels;
		const dx10Data = new Uint32Array( bufferData, 128, 4 ); //get the type of DDS
		var channels = 4;
		var DXGIformat = 'DXGI_FORMAT_R8G8B8A8_UNORM_SRGB'; //RGBA sRGB

		switch (dx10Data[0]){
			case 11:
				//DXGI_FORMAT_R16G16B16A16_UNORM RGBA 16bit
				DXGIformat = 'DXGI_FORMAT_R16G16B16A16_UNORM'
				bytes=16;
				break;
			case 29:
			case 28:
				break;
			case 49:
				//DXGI_FORMAT_R8G8_UNORM = 49
				DXGIformat = 'DXGI_FORMAT_R8G8_UNORM'
				channels = 2;
				break
			case 61:
				//DXGI_FORMAT_R8_UNORM = 61 RedChannel or Luminance
				DXGIformat = 'DXGI_FORMAT_R8_UNORM'
				channels = 1;
				break;
			default:
				console.error(`Unknown value ${dx10Data[0]}`);
				break;
		}

		return {
			width:width,
			height:height,
			format:'DDS',
			size:(height * width * channels),
			bytes:bytes,
			channels:channels,
			DXGIformat:DXGIformat
		}

	}else if (isPNG(headerData)){
		//PNG case
		var chunkslenght, chunkstype
		var pngWidth, pngHeight;
		var pngBit, pngColorType, pngCompression, pngInterlaced, pngFilter;

		pngWidth=pngHeight=0;
		var imgByteLenght = bufferData.byteLength
		var filePointer = 8; /*after the header */
		
		

		//Search for the chunks with the Size of the texture
		while ((pngWidth==0) && (pngHeight==0) && (filePointer<imgByteLenght)) {
			chunkslenght = parseInt(new DataView(bufferData,filePointer,4).getInt32(),16); //from hexa I'll take the size of the chunks
			chunkstype = new Uint8Array(bufferData,filePointer+4,4);
			filePointer+=8;
			if ( (chunkstype[0]==0x49)
				&&(chunkstype[1]==0x48)
				&&(chunkstype[2]==0x44)
				&&(chunkstype[3]==0x52) ){
				//IHDR Chunk
				//go for the read of the length
				pngWidth=parseInt(new DataView(bufferData,filePointer,4).getUint32());
				pngHeight=parseInt(new DataView(bufferData,filePointer+4,4).getUint32());
				pngBit= parseInt(new DataView(bufferData,filePointer+8,1).getUint8());
				pngColorType = parseInt(new DataView(bufferData,filePointer+9,1).getUint8());
				pngCompression = parseInt(new DataView(bufferData,filePointer+10,1).getUint8());
				pngFilter = parseInt(new DataView(bufferData,filePointer+11,1).getUint8());
				pngInterlaced = parseInt(new DataView(bufferData,filePointer+12,1).getUint8());
			}
			filePointer+=chunkslenght+4; //last 4 byte are for the checksum
			//console.warn = parseInt(new DataView(bufferData,filePointer,4).getInt32(),16);
		}
		var pngchannels=3;
		let textureMessage = ''
		switch (pngColorType) {
			case 0:
				textureMessage=`Grayscale sample`;
				pngchannels=1;
				break;
			case 2:
				textureMessage=`RGB triple`;
				break;
			case 3:
				textureMessage=`PLTE palette index`;
				pngchannels=0;
				break;
			case 4:
				textureMessage=`grayscale sample, followed by an alpha sample`;
				pngchannels=2;
				break;
			case 6:
				textureMessage=`R,G,B triple, followed by an alpha sample`;
				break;
			default:
				notifyMe("This is an unknown PNG format !!");
				pngchannels=-1;
				break;
		}

		if (PARAMS.textureDebug){console.log(textureMessage)}

		return {
			width:pngWidth,
			height:pngHeight,
			format:'PNG',
			colorType:pngColorType,
			bytes:pngBit,
			compress:pngCompression,
			filter:pngFilter,
			Ilaced:pngInterlaced,
			channels:pngchannels
		}
	}else{
		console.warn(`${binaryData.slice(0,4)} format`)
		return {width:0,height:0,format:'Unknown'};
	}
}

async function ddsResolve(binarydata, info){
	return new Promise((resolve,reject)=>{
		var bufferData = str2ab(binarydata);
		try {

			var imageDatas = ''
			switch (info.bytes) {
				case 16:
					imageDatas = new Uint16Array( bufferData, 148, info.size );
					break;
			
				default:
					imageDatas = new Uint8Array( bufferData, 148, info.size );
					break;
			}

			
			if (info.DXGIformat == 'DXGI_FORMAT_R8_UNORM'){
				imageDatas = rebuildText(imageDatas,info.width,info.height);
				info.channels = 4;
			}

			resolve(imageDatas)
		} catch (error) {
			notifyMe(`ddsResolve : ${error}`)
			reject(false)
		}
	})
}

/**
 * Load an image from a given URL
 * @param {String} dataURI The URL of the image resource
 * @param {Object} info contains the datas of the encoding of the image
 * @returns {Promise<Image>} The loaded image
 */
async function pngResolve(dataURI,textureObj){
	return new Promise((resolve, reject)=>{
		var info = textureObj.info
		let offcanvas = new OffscreenCanvas(info.width,info.height);
		let gl = offcanvas.getContext("2d");
		var img = new Image(info.width,info.height);
		try {
			img.addEventListener('load', () => {
				gl.drawImage(img,0,0,info.width,info.height); // Or at whatever offset you like
				var imageData = gl.getImageData(0, 0, info.width,info.height)
				if ((textureObj.maptype=='normal') || (textureObj.maptype=='normaldetail')){
					var gammaCorrection = 2.2 //2.2;
					for (var i = 0; i < imageData.data.length; i += 4) {
						imageData.data[i] = 255 * Math.pow((imageData.data[i] / 255), gammaCorrection);
						imageData.data[i+1] = 255 * Math.pow((imageData.data[i+1] / 255), gammaCorrection);
						imageData.data[i+2] = 255 * Math.pow((imageData.data[i+2] / 255), gammaCorrection);
					}
				}
				resolve(imageData.data);
			});
			img.src = dataURI;
		} catch (error) {
			reject(`pngResolve ${error}`);
		}
	});
}

/**
 * 
 * @param {string} relativepath Relative path of the .mlmask file
 */
async function mapDotMlMasks(maskfile){
	return new Promise((resolve,reject)=>{
		const mlmaskObject = {
			layers:1,
		}
		const maxMasksPR = thePIT.mapMasks(maskfile); //check the numbers of masks layers in the subfolder
		maxMasksPR.then((layerCount)=>{
			mlmaskObject.layers = (!isNaN(layerCount)) ? layerCount :  0;
		}).then(()=>{
			//here i need to build the whole list of files
					
		}).catch((error)=>{
			notifyMe(error);
			mlmaskObject.layers = 0;
		}).finally(()=>{
			resolve(mlmaskObject);
		});
	})
}