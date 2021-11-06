import {
	CompressedTextureLoader,
	RGBAFormat,
	RGBA_S3TC_DXT3_Format,
	RGBA_S3TC_DXT5_Format,
	RGB_ETC1_Format,
	RGB_S3TC_DXT1_Format,
	LuminanceFormat
} from '../../../build/three.module.js';

class DDSLoader extends CompressedTextureLoader {

	constructor( manager ) {

		super( manager );

	}

	parse( buffer, loadMipmaps ) {

		const dds = { mipmaps: [], width: 0, height: 0, format: null, mipmapCount: 1 };

		// Adapted from @toji's DDS utils
		// https://github.com/toji/webgl-texture-utils/blob/master/texture-util/dds.js

		// All values and structures referenced from:
		// http://msdn.microsoft.com/en-us/library/bb943991.aspx/

		const DDS_MAGIC = 0x20534444;

		const DDSD_CAPS = 0x1;
		const DDSD_HEIGHT = 0x2;
		const DDSD_WIDTH = 0x4;
		const DDSD_PITCH = 0x8;
		const DDSD_PIXELFORMAT = 0x1000;
		const DDSD_MIPMAPCOUNT = 0x20000;
		const DDSD_LINEARSIZE = 0x80000;
		const DDSD_DEPTH = 0x800000;

		const DDSCAPS_COMPLEX = 0x8;
		const DDSCAPS_MIPMAP = 0x400000;
		const DDSCAPS_TEXTURE = 0x1000;

		const DDSCAPS2_CUBEMAP = 0x200;
		const DDSCAPS2_CUBEMAP_POSITIVEX = 0x400;
		const DDSCAPS2_CUBEMAP_NEGATIVEX = 0x800;
		const DDSCAPS2_CUBEMAP_POSITIVEY = 0x1000;
		const DDSCAPS2_CUBEMAP_NEGATIVEY = 0x2000;
		const DDSCAPS2_CUBEMAP_POSITIVEZ = 0x4000;
		const DDSCAPS2_CUBEMAP_NEGATIVEZ = 0x8000;
		// let DDSCAPS2_VOLUME = 0x200000;

		const DDPF_ALPHAPIXELS = 0x1;
		const DDPF_ALPHA = 0x2;
		const DDPF_FOURCC = 0x4;
		const DDPF_RGB = 0x40;
		const DDPF_YUV = 0x200;
		const DDPF_LUMINANCE = 0x20000;


		function fourCCToInt32( value ) {
			return value.charCodeAt( 0 ) +
				( value.charCodeAt( 1 ) << 8 ) +
				( value.charCodeAt( 2 ) << 16 ) +
				( value.charCodeAt( 3 ) << 24 );
		}

		function int32ToFourCC( value ) {
			return String.fromCharCode(
				value & 0xff,
				( value >> 8 ) & 0xff,
				( value >> 16 ) & 0xff,
				( value >> 24 ) & 0xff
			);
		}

		function loadARGBMip( buffer, dataOffset, width, height ) {

			const dataLength = width * height * 4;
			const srcBuffer = new Uint8Array( buffer, dataOffset, dataLength );
			const byteArray = new Uint8Array( dataLength );
			let dst = 0;
			let src = 0;
			for ( let y = 0; y < height; y ++ ) {

				for ( let x = 0; x < width; x ++ ) {

					const b = srcBuffer[ src ]; src ++;
					const g = srcBuffer[ src ]; src ++;
					const r = srcBuffer[ src ]; src ++;
					const a = srcBuffer[ src ]; src ++;
					byteArray[ dst ] = r; dst ++;	//r
					byteArray[ dst ] = g; dst ++;	//g
					byteArray[ dst ] = b; dst ++;	//b
					byteArray[ dst ] = a; dst ++;	//a

				}

			}

			return byteArray;

		}

		function loadLuminanceMip(buffer, dataOffset, width, height ) {
			const dataLength = width * height ;
			const srcBuffer = new Uint8Array( buffer, dataOffset, dataLength );
			const byteArray = new Uint8Array( dataLength );
			let dst = 0;
			let src = 0;
			for ( let y = 0; y < height; y ++ ) {
				for ( let x = 0; x < width; x ++ ) {
					const l = srcBuffer[ src ]; src ++;
					byteArray[ dst ] = l; dst ++;	//r
				}
			}
			return byteArray;
		}

		function byteDX10Format(){
			//DX10 Format https://docs.microsoft.com/en-us/windows/win32/api/dxgiformat/ne-dxgiformat-dxgi_format
			const DXGI_FORMAT = {
			  D10_UNKNOWN : 0,
			  D10_R32G32B32A32_TYPELESS : 1,
			  D10_R32G32B32A32_FLOAT : 2,
			  D10_R32G32B32A32_UINT : 3,
			  D10_R32G32B32A32_SINT : 4,
			  D10_R32G32B32_TYPELESS : 5,
			  D10_R32G32B32_FLOAT : 6,
			  D10_R32G32B32_UINT:7,
			  D10_R32G32B32_SINT:8,
			  D10_R16G16B16A16_TYPELESS:9,
			  D10_R16G16B16A16_FLOAT:10,
			  D10_R16G16B16A16_UNORM:11,
			  D10_R16G16B16A16_UINT:12,
			  D10_R16G16B16A16_SNORM:13,
			  D10_R16G16B16A16_SINT:14,
			  D10_R32G32_TYPELESS:15,
			  D10_R32G32_FLOAT:16,
			  D10_R32G32_UINT:17,
			  D10_R32G32_SINT:18,
			  D10_R32G8X24_TYPELESS:19,
			  D10_D32_FLOAT_S8X24_UINT:20,
			  D10_R32_FLOAT_X8X24_TYPELESS:21,
			  D10_X32_TYPELESS_G8X24_UINT:22,
			  D10_R10G10B10A2_TYPELESS:23,
			  D10_R10G10B10A2_UNORM:24,
			  D10_R10G10B10A2_UINT:25,
			  D10_R11G11B10_FLOAT:26,
			  D10_R8G8B8A8_TYPELESS:27,
			  D10_R8G8B8A8_UNORM:28,
			  D10_R8G8B8A8_UNORM_SRGB:29,
			  D10_R8G8B8A8_UINT:30,
			  D10_R8G8B8A8_SNORM:31,
			  D10_R8G8B8A8_SINT:32,
			  D10_R16G16_TYPELESS:33,
			  D10_R16G16_FLOAT:34,
			  D10_R16G16_UNORM:35,
			  D10_R16G16_UINT:36,
			  D10_R16G16_SNORM:37,
			  D10_R16G16_SINT:38,
			  D10_R32_TYPELESS:39,
			  D10_D32_FLOAT:40,
			  D10_R32_FLOAT:41,
			  D10_R32_UINT:42,
			  D10_R32_SINT:43,
			  D10_R24G8_TYPELESS:44,
			  D10_D24_UNORM_S8_UINT:45,
			  D10_R24_UNORM_X8_TYPELESS:46,
			  D10_X24_TYPELESS_G8_UINT:47,
			  D10_R8G8_TYPELESS:48,
			  D10_R8G8_UNORM:49,
			  D10_R8G8_UINT:50,
			  D10_R8G8_SNORM:51,
			  D10_R8G8_SINT:52,
			  D10_R16_TYPELESS:53,
			  D10_R16_FLOAT:54,
			  D10_D16_UNORM:55,
			  D10_R16_UNORM:56,
			  D10_R16_UINT:57,
			  D10_R16_SNORM:58,
			  D10_R16_SINT:59,
			  D10_R8_TYPELESS:60,
			  D10_R8_UNORM:61,
			  D10_R8_UINT:62,
			  D10_R8_SNORM:63,
			  D10_R8_SINT:64,
			  D10_A8_UNORM:65,
			  D10_R1_UNORM:66,
			  D10_R9G9B9E5_SHAREDEXP:67,
			  D10_R8G8_B8G8_UNORM:68,
			  D10_G8R8_G8B8_UNORM:69,
			  D10_BC1_TYPELESS:70,
			  D10_BC1_UNORM:71,
			  D10_BC1_UNORM_SRGB:72,
			  D10_BC2_TYPELESS:73,
			  D10_BC2_UNORM:74,
			  D10_BC2_UNORM_SRGB:75,
			  D10_BC3_TYPELESS:76,
			  D10_BC3_UNORM:77,
			  D10_BC3_UNORM_SRGB:78,
			  D10_BC4_TYPELESS:78,
			  D10_BC4_UNORM:80,
			  D10_BC4_SNORM:81,
			  D10_BC5_TYPELESS:82,
			  D10_BC5_UNORM:83,
			  D10_BC5_SNORM:84,
			  D10_B5G6R5_UNORM:85,
			  D10_B5G5R5A1_UNORM:86,
			  D10_B8G8R8A8_UNORM:87,
			  D10_B8G8R8X8_UNORM:88,
			  D10_R10G10B10_XR_BIAS_A2_UNORM:89,
			  D10_B8G8R8A8_TYPELESS:90,
			  D10_B8G8R8A8_UNORM_SRGB:91,
			  D10_B8G8R8X8_TYPELESS:92,
			  D10_B8G8R8X8_UNORM_SRGB:93,
			  D10_BC6H_TYPELESS:94,
			  D10_BC6H_UF16:95,
			  D10_BC6H_SF16:96,
			  D10_BC7_TYPELESS:97,
			  D10_BC7_UNORM:98,
			  D10_BC7_UNORM_SRGB:99,
			  D10_AYUV:100,
			  D10_Y410:101,
			  D10_Y416:102,
			  D10_NV12:103,
			  D10_P010:104,
			  D10_P016:105,
			  D10_420_OPAQUE:106,
			  D10_YUY2:107,
			  D10_Y210:108,
			  D10_Y216:109,
			  D10_NV11:110,
			  D10_AI44:111,
			  D10_IA44:112,
			  D10_P8:113,
			  D10_A8P8:114,
			  D10_B4G4R4A4_UNORM:115,
			  D10_P208:116,
			  D10_V208:117,
			  D10_V408:118,
			  D10_SAMPLER_FEEDBACK_MIN_MIP_OPAQUE:119,
			  D10_SAMPLER_FEEDBACK_MIP_REGION_USED_OPAQUE:120,
			  D10_FORCE_UINT:121
			};


			//DX10 header indicator
			let off_format = 0;
			let off_resourceDimension = 1;
			let off_misc = 2;
			let arraySize = 3;
			let miscFlags2 = 4;

			const headerDX10 = new Int32Array(buffer,128,5);

			switch ( headerDX10[off_format] ) {
			 case DXGI_FORMAT.D10_UNKNOWN:
				 return false;
				 break;
			 case DXGI_FORMAT.D10_BC7_UNORM:
				 return 8;
				 break;
			}
		}

		const FOURCC_DXT1 = fourCCToInt32( 'DXT1' );
		const FOURCC_DXT3 = fourCCToInt32( 'DXT3' );
		const FOURCC_DXT5 = fourCCToInt32( 'DXT5' );
		const FOURCC_DX10 = fourCCToInt32( 'DX10' );
		const FOURCC_ETC1 = fourCCToInt32( 'ETC1' );

		const headerLengthInt = 31; // The header length in 32 bit ints
		const headerDX10LengthInt = 20;
		// Offsets into the header array

		const off_magic = 0;

		const off_size = 1;
		const off_flags = 2;
		const off_height = 3;
		const off_width = 4;

		const off_mipmapCount = 7;

		const off_pfFlags = 20;
		const off_pfFourCC = 21;
		const off_RGBBitCount = 22;
		const off_RBitMask = 23;
		const off_GBitMask = 24;
		const off_BBitMask = 25;
		const off_ABitMask = 26;

 		const off_caps = 27;
		const off_caps2 = 28;
		const off_caps3 = 29;
		const off_caps4 = 30;

		// Parse header

		const header = new Int32Array( buffer, 0, headerLengthInt );

		if ( header[ off_magic ] !== DDS_MAGIC ) {

			console.error( 'THREE.DDSLoader.parse: Invalid magic number in DDS header.' );
			return dds;

		}
		if ( ! header[ off_pfFlags ] & DDPF_FOURCC ) {
			console.error( 'THREE.DDSLoader.parse: Unsupported format, must contain a FourCC code.' );
			return dds;
		}
		/*
		if ( header[off_pfFlags] & DDPF_LUMINANCE){
			console.log('found Luminance map');
		}
		*/

		let blockBytes;

		const fourCC = header[ off_pfFourCC ];

		let isRGBAUncompressed = false;

		switch ( fourCC ) {

			case FOURCC_DXT1:

				blockBytes = 8;
				dds.format = RGB_S3TC_DXT1_Format;
				break;

			case FOURCC_DXT3:

				blockBytes = 16;
				dds.format = RGBA_S3TC_DXT3_Format;
				break;

			case FOURCC_DXT5:
				blockBytes = 16;
				dds.format = RGBA_S3TC_DXT5_Format;
				break;

			case FOURCC_DX10:
				blockBytes = byteDX10Format();
				dds.format = RGB_S3TC_DXT1_Format;
				isRGBAUncompressed = false;
				//initialize DX10 header information
				break;

			case FOURCC_ETC1:
				blockBytes = 8;
				dds.format = RGB_ETC1_Format;
				break;

			default:

				if ( header[ off_RGBBitCount ] === 32
					&& header[ off_RBitMask ] & 0xff0000
					&& header[ off_GBitMask ] & 0xff00
					&& header[ off_BBitMask ] & 0xff
					&& header[ off_ABitMask ] & 0xff000000 ) {

					isRGBAUncompressed = true;
					blockBytes = 64;
					dds.format = RGBAFormat;

				} else if ( header[ off_RGBBitCount ] === 8
					&& header[off_pfFlags] & DDPF_LUMINANCE) {
						loadMipmaps=false;
						isRGBAUncompressed = false;
						blockBytes = 8;
						dds.format = LuminanceFormat;
						//return dds;
				} else {

					console.error( 'THREE.DDSLoader.parse: Unsupported FourCC code ', int32ToFourCC( fourCC ) );
					return dds;

				}

		}

		dds.mipmapCount = 1;

		if ( header[ off_flags ] & DDSD_MIPMAPCOUNT && loadMipmaps !== false ) {

			dds.mipmapCount = Math.max( 1, header[ off_mipmapCount ] );

		}

		const caps2 = header[ off_caps2 ];
		dds.isCubemap = caps2 & DDSCAPS2_CUBEMAP ? true : false;
		if ( dds.isCubemap && (
			! ( caps2 & DDSCAPS2_CUBEMAP_POSITIVEX ) ||
			! ( caps2 & DDSCAPS2_CUBEMAP_NEGATIVEX ) ||
			! ( caps2 & DDSCAPS2_CUBEMAP_POSITIVEY ) ||
			! ( caps2 & DDSCAPS2_CUBEMAP_NEGATIVEY ) ||
			! ( caps2 & DDSCAPS2_CUBEMAP_POSITIVEZ ) ||
			! ( caps2 & DDSCAPS2_CUBEMAP_NEGATIVEZ )
		) ) {

			console.error( 'THREE.DDSLoader.parse: Incomplete cubemap faces' );
			return dds;

		}

		dds.width = header[ off_width ];
		dds.height = header[ off_height ];

		let dataOffset; //dataOffset declaration

		if (fourCC!==FOURCC_DX10){
			dataOffset = header[ off_size ] + 4;
		}else{
			dataOffset = header[ off_size ] + 24; // 5 bytes used by DX10 Type header
		}

		// Extract mipmaps buffers

		const faces = dds.isCubemap ? 6 : 1;

		for ( let face = 0; face < faces; face ++ ) {

			let width = dds.width;
			let height = dds.height;

			for ( let i = 0; i < dds.mipmapCount; i ++ ) {

				let byteArray, dataLength;

					if ( isRGBAUncompressed ) {
						byteArray = loadARGBMip( buffer, dataOffset, width, height );
						dataLength = byteArray.length;
					} else {
						if (dds.format===LuminanceFormat){
							dataLength = width * height;
						}else{
							dataLength = Math.max( 4, width ) / 4 * Math.max( 4, height ) / 4 * blockBytes;
						}
						byteArray = new Uint8Array( buffer, dataOffset, dataLength );
					}

				const mipmap = { 'data': byteArray, 'width': width, 'height': height };
				dds.mipmaps.push( mipmap );

				dataOffset += dataLength;

				width = Math.max( width >> 1, 1 );
				height = Math.max( height >> 1, 1 );
			}
		}

		return dds;

	}

}

export { DDSLoader };
